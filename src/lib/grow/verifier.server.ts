/**
 * Grow webhook verification.
 *
 * Grow currently ships only a shared `webhookKey` field inside the JSON body —
 * no signature header, no HMAC. This module isolates that fact so the rest of
 * the pipeline stays clean: to switch to HMAC / a signature header later,
 * change only `verifyGrowWebhook` and its inputs.
 */

import { timingSafeEqual } from "node:crypto";

export type VerificationResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "invalid_webhook_key"; message: string };

/** Constant-time string compare that never throws on length mismatch. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export interface GrowVerificationInput {
  /** The value of `webhookKey` extracted from the parsed JSON body. */
  payloadWebhookKey: unknown;
  /** Raw body / headers reserved for a future HMAC scheme. */
  rawBody?: string;
  headers?: Record<string, string>;
}

export function verifyGrowWebhook(input: GrowVerificationInput): VerificationResult {
  const expected = process.env.GROW_WEBHOOK_KEY;
  if (!expected || expected.length === 0) {
    return {
      ok: false,
      reason: "not_configured",
      message: "GROW_WEBHOOK_KEY is not set in the server environment",
    };
  }

  const provided = input.payloadWebhookKey;
  if (typeof provided !== "string" || provided.length === 0) {
    return {
      ok: false,
      reason: "invalid_webhook_key",
      message: "webhookKey missing from payload",
    };
  }

  if (!safeEqual(provided, expected)) {
    return {
      ok: false,
      reason: "invalid_webhook_key",
      message: "webhookKey does not match GROW_WEBHOOK_KEY",
    };
  }

  return { ok: true };
}
