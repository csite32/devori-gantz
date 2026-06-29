// Server-only helper. Safe to import from other *.server.ts files and from
// server-fn / server-route handler bodies (via `await import(...)`).
// Do NOT import this from components, route modules, or *.functions.ts at
// module scope — it pulls in the service-role client.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type CreateUserInput = {
  email: string;
  full_name?: string;
  password?: string;
};

export type CreateUserResult = {
  user_id: string;
  email: string;
  created: boolean; // false if the user already existed
};

/**
 * Creates an auth user (email pre-confirmed) and ensures a matching row in
 * public.profiles. Idempotent on email: if a user with that email already
 * exists, returns the existing id and still upserts the profile row.
 *
 * This is the single source of truth for "create a new app user" and must
 * be reused by every future flow that provisions users (admin UI, payment
 * webhooks, etc.) so no auth.users row is ever left without a profile.
 */
export async function createUserWithProfileInternal(
  input: CreateUserInput,
): Promise<CreateUserResult> {
  const email = input.email.trim().toLowerCase();
  const full_name = input.full_name?.trim() || null;

  // 1. Create auth user
  const { data: created, error: createErr } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: full_name ? { full_name } : undefined,
    });

  let userId: string | undefined = created?.user?.id;
  let didCreate = true;

  if (createErr) {
    // If the user already exists, look them up instead of failing.
    const msg = (createErr.message || "").toLowerCase();
    const alreadyExists =
      msg.includes("already registered") ||
      msg.includes("already exists") ||
      msg.includes("duplicate");

    if (!alreadyExists) {
      throw new Error(`Failed to create user: ${createErr.message}`);
    }

    const existing = await findUserIdByEmail(email);
    if (!existing) {
      throw new Error("User exists but could not be located");
    }
    userId = existing;
    didCreate = false;
  }

  if (!userId) {
    throw new Error("User creation returned no id");
  }

  // 2. Ensure profile row exists (idempotent)
  const { error: profileErr } = await supabaseAdmin
    .from("profiles")
    .upsert(
      { id: userId, full_name },
      { onConflict: "id", ignoreDuplicates: false },
    );
  if (profileErr) {
    throw new Error(`Failed to upsert profile: ${profileErr.message}`);
  }

  return { user_id: userId, email, created: didCreate };
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  // Page through users — fine for early-stage user counts.
  let page = 1;
  const perPage = 200;
  // Safety cap
  for (let i = 0; i < 50; i++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const match = data.users.find(
      (u) => (u.email ?? "").toLowerCase() === email,
    );
    if (match) return match.id;
    if (data.users.length < perPage) return null;
    page += 1;
  }
  return null;
}

/**
 * Invites a user by email (sends Supabase invite email so they can set their
 * own password), ensures a profile row, and optionally grants the admin role.
 * Idempotent on email — if the user already exists, only profile/role are synced.
 */
export async function inviteUserWithRoleInternal(input: {
  email: string;
  full_name?: string;
  makeAdmin: boolean;
  redirectTo?: string;
}): Promise<{ user_id: string; email: string; invited: boolean }> {
  const email = input.email.trim().toLowerCase();
  const full_name = input.full_name?.trim() || null;

  let userId: string | undefined;
  let invited = true;

  const { data: invite, error: invErr } =
    await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: input.redirectTo,
      data: full_name ? { full_name } : undefined,
    });

  if (invErr) {
    const msg = (invErr.message || "").toLowerCase();
    const exists =
      msg.includes("already") ||
      msg.includes("registered") ||
      msg.includes("exists") ||
      msg.includes("duplicate");
    if (!exists) {
      throw new Error(`Failed to invite user: ${invErr.message}`);
    }
    const existing = await findUserIdByEmail(email);
    if (!existing) throw new Error("User exists but could not be located");
    userId = existing;
    invited = false;
  } else {
    userId = invite.user?.id;
  }

  if (!userId) throw new Error("Invite returned no user id");

  // Ensure profile row
  const { error: profileErr } = await supabaseAdmin
    .from("profiles")
    .upsert(
      { id: userId, full_name },
      { onConflict: "id", ignoreDuplicates: false },
    );
  if (profileErr) {
    throw new Error(`Failed to upsert profile: ${profileErr.message}`);
  }

  // Grant admin role if requested
  if (input.makeAdmin) {
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: userId, role: "admin" },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );
    if (roleErr) {
      throw new Error(`Failed to grant admin role: ${roleErr.message}`);
    }
  }

export async function sendPasswordResetInternal(input: {
  user_id: string;
  redirectTo?: string;
}): Promise<{ ok: true; email: string }> {
  const { data: u, error: ge } = await supabaseAdmin.auth.admin.getUserById(
    input.user_id,
  );
  if (ge || !u?.user?.email) throw new Error("המשתמש לא נמצא");
  const email = u.user.email;
  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo: input.redirectTo,
  });
  if (error) throw new Error(`שליחת איפוס סיסמה נכשלה: ${error.message}`);
  return { ok: true, email };
}

export async function deleteUserCompletelyInternal(input: {
  user_id: string;
}): Promise<{ ok: true }> {
  // Clean up related rows first (FKs to auth.users normally cascade, but
  // we also remove app-level rows defensively to avoid orphans).
  await supabaseAdmin
    .from("course_access")
    .delete()
    .eq("user_id", input.user_id);
  await supabaseAdmin
    .from("user_roles")
    .delete()
    .eq("user_id", input.user_id);
  await supabaseAdmin
    .from("lesson_progress")
    .delete()
    .eq("user_id", input.user_id);
  await supabaseAdmin
    .from("purchases")
    .delete()
    .eq("user_id", input.user_id);
  await supabaseAdmin.from("profiles").delete().eq("id", input.user_id);

  const { error } = await supabaseAdmin.auth.admin.deleteUser(input.user_id);
  if (error) throw new Error(`מחיקת המשתמש נכשלה: ${error.message}`);
  return { ok: true };
}

  return { user_id: userId, email, invited };
}
