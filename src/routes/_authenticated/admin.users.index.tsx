import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listAdminUsers } from "@/lib/admin.functions";
import {
  AdminPageHeader,
  Card,
  GhostButton,
  inputClass,
} from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/users/")({
  component: UsersList,
});

function UsersList() {
  const fn = useServerFn(listAdminUsers);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", search],
    queryFn: () => fn({ data: { search } }),
  });

  return (
    <>
      <AdminPageHeader eyebrow="ניהול" title="משתמשים" />
      <Card>
        <div className="mb-4">
          <input
            placeholder="חיפוש לפי אימייל או שם…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClass}
          />
        </div>
        {isLoading ? (
          <p>טוען…</p>
        ) : !data || data.length === 0 ? (
          <p className="text-brand-primary-dark/70">לא נמצאו משתמשים.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="text-xs uppercase tracking-wider text-brand-primary/70">
                <tr>
                  <th className="py-2 pr-2">אימייל</th>
                  <th className="py-2">שם</th>
                  <th className="py-2">תפקיד</th>
                  <th className="py-2">קורסים</th>
                  <th className="py-2">נרשם</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-accent-soft/50">
                {data.map((u) => (
                  <tr key={u.user_id} className="text-brand-primary-dark">
                    <td className="py-3 pr-2" dir="ltr">
                      {u.email ?? "—"}
                    </td>
                    <td className="py-3">{u.full_name ?? "—"}</td>
                    <td className="py-3">
                      {u.is_admin ? (
                        <span className="rounded-full bg-brand-primary/10 text-brand-primary px-2 py-0.5 text-xs">
                          מנהל
                        </span>
                      ) : (
                        <span className="text-brand-primary-dark/60 text-xs">
                          משתמש
                        </span>
                      )}
                    </td>
                    <td className="py-3">{u.access_count}</td>
                    <td className="py-3 text-xs text-brand-primary-dark/60">
                      {new Date(u.created_at).toLocaleDateString("he-IL")}
                    </td>
                    <td className="py-3">
                      <Link
                        to="/admin/users/$id"
                        params={{ id: u.user_id }}
                      >
                        <GhostButton type="button">פתיחה</GhostButton>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
