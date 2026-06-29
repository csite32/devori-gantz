import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listAdminUsers } from "@/lib/admin.functions";
import {
  adminDeleteUser,
  adminInviteUser,
  adminSendPasswordReset,
} from "@/lib/admin-users.functions";
import {
  AdminPageHeader,
  Card,
  DangerButton,
  GhostButton,
  PrimaryButton,
  FormField,
  inputClass,
} from "@/components/admin/ui";


export const Route = createFileRoute("/_authenticated/admin/users/")({
  component: UsersList,
});

function UsersList() {
  const qc = useQueryClient();
  const fn = useServerFn(listAdminUsers);
  const inviteFn = useServerFn(adminInviteUser);
  const resetFn = useServerFn(adminSendPasswordReset);
  const deleteFn = useServerFn(adminDeleteUser);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", search],
    queryFn: () => fn({ data: { search } }),
  });
  const { data: meId } = useQuery({
    queryKey: ["auth", "me", "id"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null,
    staleTime: Infinity,
  });


  const [form, setForm] = useState({
    email: "",
    full_name: "",
    role: "student" as "student" | "admin",
  });
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );

  const invite = useMutation({
    mutationFn: () =>
      inviteFn({
        data: {
          email: form.email.trim(),
          full_name: form.full_name.trim() || undefined,
          role: form.role,
          redirect_to:
            typeof window !== "undefined"
              ? `${window.location.origin}/reset-password`
              : undefined,
        },
      }),
    onSuccess: (r) => {
      setMsg({
        kind: "ok",
        text: r.invited
          ? "ההזמנה נשלחה לאימייל להגדרת סיסמה."
          : "המשתמש כבר קיים — הפרטים והתפקיד עודכנו.",
      });
      setForm({ email: "", full_name: "", role: "student" });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => setMsg({ kind: "err", text: e.message }),
  });

  const [rowMsg, setRowMsg] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);

  const sendReset = useMutation({
    mutationFn: (user_id: string) =>
      resetFn({
        data: {
          user_id,
          redirect_to:
            typeof window !== "undefined"
              ? `${window.location.origin}/reset-password`
              : undefined,
        },
      }),
    onSuccess: (r) =>
      setRowMsg({ kind: "ok", text: `נשלח מייל איפוס סיסמה אל ${r.email}` }),
    onError: (e: Error) => setRowMsg({ kind: "err", text: e.message }),
  });

  const deleteUser = useMutation({
    mutationFn: (user_id: string) => deleteFn({ data: { user_id } }),
    onSuccess: () => {
      setRowMsg({ kind: "ok", text: "המשתמש נמחק." });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => setRowMsg({ kind: "err", text: e.message }),
  });


  return (
    <>
      <AdminPageHeader
        eyebrow="ניהול"
        title="משתמשים"
        actions={
          <PrimaryButton
            type="button"
            onClick={() => {
              setMsg(null);
              setShowNew((s) => !s);
            }}
          >
            {showNew ? "סגירה" : "+ משתמש חדש"}
          </PrimaryButton>
        }
      />

      {showNew && (
        <div className="mb-6">
          <Card>
            <h3
              className="text-4xl text-brand-primary-dark mb-5"
              style={{ fontFamily: "var(--font-bateran)" }}
            >
              יצירת משתמשת חדשה
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setMsg(null);
                invite.mutate();
              }}
              className="space-y-5"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <FormField label="שם מלא">
                  <input
                    value={form.full_name}
                    onChange={(e) =>
                      setForm({ ...form, full_name: e.target.value })
                    }
                    className={inputClass}
                    placeholder="לדוגמה: רינה כהן"
                  />
                </FormField>
                <FormField label="אימייל">
                  <input
                    required
                    type="email"
                    dir="ltr"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className={inputClass}
                  />
                </FormField>
              </div>
              <FormField
                label="סוג משתמש"
                hint="ברירת המחדל: תלמידה."
              >
                <div className="flex gap-3 mt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="student"
                      checked={form.role === "student"}
                      onChange={() => setForm({ ...form, role: "student" })}
                      className="accent-[rgb(158,36,43)] cursor-pointer"
                    />
                    <span className="text-lg md:text-xl">תלמידה</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={form.role === "admin"}
                      onChange={() => setForm({ ...form, role: "admin" })}
                      className="accent-[rgb(158,36,43)] cursor-pointer"
                    />
                    <span className="text-lg md:text-xl">מנהל</span>
                  </label>
                </div>
              </FormField>
              <p className="text-lg text-brand-primary-dark/70">
                למשתמשת תישלח הזמנה במייל להגדרת סיסמה.
              </p>
              {msg && (
                <p
                  className={
                    "text-lg " +
                    (msg.kind === "ok"
                      ? "text-brand-primary"
                      : "text-brand-accent-alert")
                  }
                >
                  {msg.text}
                </p>
              )}
              <div className="flex gap-2">
                <PrimaryButton type="submit" disabled={invite.isPending}>
                  {invite.isPending ? "שולח…" : "שליחת הזמנה"}
                </PrimaryButton>
                <GhostButton type="button" onClick={() => setShowNew(false)}>
                  ביטול
                </GhostButton>
              </div>
            </form>
          </Card>
        </div>
      )}

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
          <p className="text-lg md:text-xl">טוען…</p>
        ) : !data || data.length === 0 ? (
          <p className="text-brand-primary-dark/70 text-lg md:text-xl">
            לא נמצאו משתמשים.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-lg md:text-xl">
              <thead className="text-base md:text-lg uppercase tracking-wider text-brand-primary/70">
                <tr>
                  <th className="py-3 pr-2">אימייל</th>
                  <th className="py-3">שם</th>
                  <th className="py-3">תפקיד</th>
                  <th className="py-3">קורסים</th>
                  <th className="py-3">נרשם</th>
                  <th className="py-3"></th>
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
                        <span className="rounded-full bg-brand-primary/10 text-brand-primary px-3 py-1 text-base md:text-lg">
                          מנהל
                        </span>
                      ) : (
                        <span className="text-brand-primary-dark/60 text-base md:text-lg">
                          תלמידה
                        </span>
                      )}
                    </td>
                    <td className="py-3">{u.access_count}</td>
                    <td className="py-3 text-base md:text-lg text-brand-primary-dark/60">
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
