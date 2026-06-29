// Server-only admin helpers (service-role). Only import from other *.server.ts
// files or via dynamic `await import(...)` inside server-fn handlers AFTER
// authorizing the caller as admin.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AdminUserListRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  is_admin: boolean;
  access_count: number;
};

export async function listAuthUsersWithProfiles(
  search: string,
): Promise<AdminUserListRow[]> {
  // Page through users (early-stage list).
  const allUsers: { id: string; email: string | null; created_at: string }[] = [];
  let page = 1;
  const perPage = 200;
  for (let i = 0; i < 25; i++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    for (const u of data.users) {
      allUsers.push({
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at,
      });
    }
    if (data.users.length < perPage) break;
    page += 1;
  }

  const userIds = allUsers.map((u) => u.id);
  const [{ data: profiles }, { data: roles }, { data: access }] =
    await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name").in("id", userIds),
      supabaseAdmin
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds),
      supabaseAdmin
        .from("course_access")
        .select("user_id")
        .in("user_id", userIds),
    ]);

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  const adminSet = new Set(
    (roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id),
  );
  const accessCount = new Map<string, number>();
  for (const a of access ?? []) {
    accessCount.set(a.user_id, (accessCount.get(a.user_id) ?? 0) + 1);
  }

  const term = search.trim().toLowerCase();
  return allUsers
    .map((u) => ({
      user_id: u.id,
      email: u.email,
      full_name: nameById.get(u.id) ?? null,
      created_at: u.created_at,
      is_admin: adminSet.has(u.id),
      access_count: accessCount.get(u.id) ?? 0,
    }))
    .filter((r) => {
      if (!term) return true;
      return (
        (r.email ?? "").toLowerCase().includes(term) ||
        (r.full_name ?? "").toLowerCase().includes(term)
      );
    })
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function getAuthUserEmail(userId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error) return null;
  return data.user?.email ?? null;
}
