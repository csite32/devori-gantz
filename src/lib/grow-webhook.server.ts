/**
 * Grow webhook business logic.
 *
 * Called from `src/routes/api/public/webhooks/grow.ts` AFTER the raw request
 * has already been logged to `grow_webhook_logs` with `processing_result = 'logged_only'`.
 * This module is responsible for updating that log row with the final
 * `processing_result` (and optional `processing_error`) and for all downstream
 * side effects: user provisioning, invite email, atomic access grant + purchase.
 *
 * Design rules:
 *   - Never throw out of `processGrowWebhook`. All error paths update the log
 *     and return so the HTTP handler can return 200.
 *   - `purchases` is written ONLY on a fully-successful path, inside a single
 *     Postgres transaction (via the `grant_grow_purchase` RPC) together with
 *     `course_access`. Failure rolls back both.
 *   - Auth admin (invite/user lookup) is inherently outside the DB transaction;
 *     the whole pipeline is idempotent by `(provider_id, provider_txn_id)` so a
 *     retry re-runs safely.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { verifyGrowWebhook } from "./grow/verifier.server";

export type ProcessingResult =
  | "processed_paid"
  | "duplicate_transaction"
  | "unknown_product"
  | "missing_email"
  | "invalid_webhook_key"
  | "processing_error";

export interface ProcessInput {
  logId: string;
  parsedJson: unknown;
  rawBody: string;
  headers: Record<string, string>;
}

export interface ProcessOutcome {
  status: ProcessingResult;
  error?: string;
}

const GROW_PROVIDER_NAME = "grow";

/** Minimal shape guard so we can read fields without trusting TS blindly. */
function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function finalize(
  logId: string,
  status: ProcessingResult,
  error?: string,
): Promise<ProcessOutcome> {
  const { error: updErr } = await supabaseAdmin
    .from("grow_webhook_logs")
    .update({ processing_result: status, processing_error: error ?? null })
    .eq("id", logId);
  if (updErr) {
    // Log-only; we still return the intended outcome so the HTTP layer is unaffected.
    console.error("[grow-webhook] failed to update log", updErr);
  }
  return error ? { status, error } : { status };
}

export async function processGrowWebhook(input: ProcessInput): Promise<ProcessOutcome> {
  try {
    // -----------------------------------------------------------------------
    // 1) Payload must be a JSON object
    // -----------------------------------------------------------------------
    const payload = asRecord(input.parsedJson);
    if (!payload) {
      return finalize(
        input.logId,
        "processing_error",
        "payload is not a JSON object",
      );
    }

    // -----------------------------------------------------------------------
    // 2) Verify webhookKey (modular — swap for HMAC later without touching below)
    // -----------------------------------------------------------------------
    const verification = verifyGrowWebhook({
      payloadWebhookKey: payload.webhookKey,
      rawBody: input.rawBody,
      headers: input.headers,
    });
    if (!verification.ok) {
      if (verification.reason === "not_configured") {
        return finalize(input.logId, "processing_error", verification.message);
      }
      return finalize(input.logId, "invalid_webhook_key", verification.message);
    }

    // -----------------------------------------------------------------------
    // 3) Lookup product by paymentDesc
    // -----------------------------------------------------------------------
    const paymentDesc = asString(payload.paymentDesc)?.trim() ?? "";
    if (!paymentDesc) {
      return finalize(input.logId, "unknown_product", "paymentDesc missing");
    }

    const { data: product, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("id, kind, course_id, bundle_id")
      .eq("code", paymentDesc)
      .maybeSingle();

    if (prodErr) {
      return finalize(
        input.logId,
        "processing_error",
        `product lookup failed: ${prodErr.message}`,
      );
    }
    if (!product) {
      return finalize(
        input.logId,
        "unknown_product",
        `no product with code "${paymentDesc}"`,
      );
    }

    // -----------------------------------------------------------------------
    // 4) Validate email
    // -----------------------------------------------------------------------
    const rawEmail = asString(payload.payerEmail)?.trim().toLowerCase() ?? "";
    if (!rawEmail || !EMAIL_RE.test(rawEmail)) {
      return finalize(input.logId, "missing_email", "payerEmail missing or invalid");
    }
    const email = rawEmail;

    // -----------------------------------------------------------------------
    // 5) transactionCode is required for idempotency
    // -----------------------------------------------------------------------
    const transactionCode = asString(payload.transactionCode)?.trim() ?? "";
    if (!transactionCode) {
      return finalize(
        input.logId,
        "processing_error",
        "transactionCode missing from payload",
      );
    }

    // -----------------------------------------------------------------------
    // 6) Resolve Grow provider row
    // -----------------------------------------------------------------------
    const { data: provider, error: provErr } = await supabaseAdmin
      .from("payment_providers")
      .select("id")
      .eq("name", GROW_PROVIDER_NAME)
      .maybeSingle();

    if (provErr || !provider) {
      return finalize(
        input.logId,
        "processing_error",
        `payment provider "${GROW_PROVIDER_NAME}" not found`,
      );
    }

    // -----------------------------------------------------------------------
    // 7) Early duplicate check (UNIQUE constraint is the real guard)
    // -----------------------------------------------------------------------
    const { data: existing, error: dupErr } = await supabaseAdmin
      .from("purchases")
      .select("id")
      .eq("provider_id", provider.id)
      .eq("provider_txn_id", transactionCode)
      .maybeSingle();

    if (dupErr) {
      return finalize(
        input.logId,
        "processing_error",
        `duplicate check failed: ${dupErr.message}`,
      );
    }
    if (existing) {
      return finalize(input.logId, "duplicate_transaction");
    }

    // -----------------------------------------------------------------------
    // 8) Find or invite user (auth is outside the DB transaction on purpose)
    // -----------------------------------------------------------------------
    const fullName = asString(payload.fullName)?.trim() ?? null;

    const userResult = await findOrInviteUser({ email, fullName });
    if (!userResult.ok) {
      return finalize(input.logId, "processing_error", userResult.error);
    }
    const userId = userResult.userId;

    // -----------------------------------------------------------------------
    // 9) Upsert profile (only fill full_name when it is empty)
    // -----------------------------------------------------------------------
    const profileErr = await upsertProfile(userId, fullName);
    if (profileErr) {
      return finalize(input.logId, "processing_error", profileErr);
    }

    // -----------------------------------------------------------------------
    // 10) Ensure the 'user' role
    // -----------------------------------------------------------------------
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: userId, role: "user" },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );
    if (roleErr) {
      return finalize(
        input.logId,
        "processing_error",
        `role upsert failed: ${roleErr.message}`,
      );
    }

    // -----------------------------------------------------------------------
    // 11) Atomic access grant + purchase insert
    // -----------------------------------------------------------------------
    const { error: rpcErr } = await supabaseAdmin.rpc("grant_grow_purchase", {
      p_user_id: userId,
      p_product_id: product.id,
      p_provider_id: provider.id,
      p_provider_txn_id: transactionCode,
      p_buyer_email: email,
      p_raw_payload: payload as never,
    });
    if (rpcErr) {
      return finalize(
        input.logId,
        "processing_error",
        `grant_grow_purchase failed: ${rpcErr.message}`,
      );
    }

    return finalize(input.logId, "processed_paid");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return finalize(input.logId, "processing_error", message);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function findUserIdByEmail(email: string): Promise<string | null> {
  const perPage = 200;
  const maxPages = 20;
  for (let page = 1; page <= maxPages; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (hit) return hit.id;
    if (data.users.length < perPage) return null;
  }
  return null;
}

async function findOrInviteUser(input: {
  email: string;
  fullName: string | null;
}): Promise<{ ok: true; userId: string; invited: boolean } | { ok: false; error: string }> {
  try {
    const { data: invite, error: invErr } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(input.email, {
        data: input.fullName ? { full_name: input.fullName } : undefined,
      });

    if (invErr) {
      const msg = (invErr.message || "").toLowerCase();
      const exists =
        msg.includes("already") ||
        msg.includes("registered") ||
        msg.includes("exists") ||
        msg.includes("duplicate");
      if (!exists) {
        return { ok: false, error: `invite failed: ${invErr.message}` };
      }
      const existingId = await findUserIdByEmail(input.email);
      if (!existingId) {
        return { ok: false, error: "user exists but could not be located" };
      }
      return { ok: true, userId: existingId, invited: false };
    }

    const id = invite.user?.id;
    if (!id) return { ok: false, error: "invite returned no user id" };
    return { ok: true, userId: id, invited: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

/** Upsert profile row, filling full_name ONLY when it is currently empty. */
async function upsertProfile(
  userId: string,
  fullName: string | null,
): Promise<string | null> {
  const { data: existing, error: readErr } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (readErr) return `profile lookup failed: ${readErr.message}`;

  if (!existing) {
    const { error } = await supabaseAdmin
      .from("profiles")
      .insert({ id: userId, full_name: fullName });
    if (error) return `profile insert failed: ${error.message}`;
    return null;
  }

  // Only fill full_name when the current row has none.
  const shouldFill =
    fullName && (!existing.full_name || existing.full_name.trim() === "");
  if (shouldFill) {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", userId);
    if (error) return `profile update failed: ${error.message}`;
  }
  return null;
}
