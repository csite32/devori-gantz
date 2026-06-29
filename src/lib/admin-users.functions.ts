import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Server-side helper for creating a new app user.
 *
 * Used by:
 *   - admin area (manual user creation) — once built.
 *   - future payment webhook (post-purchase user provisioning) — once built.
 *
 * Behavior:
 *   1. Verifies the caller is an authenticated admin (via has_role).
 *   2. Creates the auth user with the Supabase Admin API (email confirmed).
 *   3. Inserts a matching row in public.profiles (since there is no
 *      on_auth_user_created trigger in this project).
 *   4. Returns the new user_id.
 *
 * NOTE: Webhook flows that run without an authenticated caller must NOT
 *       reuse this server-fn directly — they should call the same internal
 *       helper (createUserWithProfileInternal) from a verified webhook route.
 */

const inputSchema = z.object({
  email: z.string().email(),
  full_name: z.string().trim().min(1).max(120).optional(),
  password: z.string().min(8).max(72).optional(),
});

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    // Authorize: only admins
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc(
      "has_role",
      { _user_id: context.userId, _role: "admin" },
    );
    if (roleErr) throw new Error("Failed to verify caller role");
    if (!isAdmin) throw new Error("Forbidden");

    const { createUserWithProfileInternal } = await import(
      "./admin-users.server"
    );
    return createUserWithProfileInternal(data);
  });
