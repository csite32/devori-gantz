import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Server-side helpers for admin-driven user management:
 *  - adminCreateUser: create a user with optional password (used internally
 *    and by future automated flows).
 *  - adminInviteUser: create a user (or reuse existing one), set their role,
 *    and send a password-setup invitation email.
 */

const createSchema = z.object({
  email: z.string().email(),
  full_name: z.string().trim().min(1).max(120).optional(),
  password: z.string().min(8).max(72).optional(),
});

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data, context }) => {
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

const inviteSchema = z.object({
  email: z.string().email(),
  full_name: z.string().trim().min(1).max(120).optional(),
  role: z.enum(["student", "admin"]).default("student"),
  redirect_to: z.string().url().optional(),
});

export const adminInviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inviteSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc(
      "has_role",
      { _user_id: context.userId, _role: "admin" },
    );
    if (roleErr) throw new Error("Failed to verify caller role");
    if (!isAdmin) throw new Error("Forbidden");

    const { inviteUserWithRoleInternal } = await import(
      "./admin-users.server"
    );
    return inviteUserWithRoleInternal({
      email: data.email,
      full_name: data.full_name,
      makeAdmin: data.role === "admin",
      redirectTo: data.redirect_to,
    });
  });
