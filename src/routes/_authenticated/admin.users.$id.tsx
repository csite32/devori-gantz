import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getAdminUser,
  grantCourseAccess,
  revokeCourseAccess,
  setUserAdminRole,
} from "@/lib/admin.functions";
import {
  AdminPageHeader,
  Card,
  DangerButton,
  GhostButton,
  PrimaryButton,
  inputClass,
} from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/users/$id")({
  component: UserDetail,
});

function UserDetail() {
  const { id } = useParams({ from: "/_authenticated/admin/users/$id" });
  const qc = useQueryClient();
  const fetchFn = useServerFn(getAdminUser);
  const grantC = useServerFn(grantCourseAccess);
  const revokeC = useServerFn(revokeCourseAccess);
  const setRole = useServerFn(setUserAdminRole);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "user", id],
    queryFn: () => fetchFn({ data: { user_id: id } }),
  });
  const [courseSel, setCourseSel] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const refresh = () =>
    qc.invalidateQueries({ queryKey: ["admin", "user", id] });

  const addCourse = useMutation({
    mutationFn: () =>
      grantC({ data: { user_id: id, course_id: courseSel } }),
    onSuccess: () => {
      setCourseSel("");
      refresh();
    },
    onError: (e: Error) => setErr(e.message),
  });
  const revoke = useMutation({
    mutationFn: (accessId: string) =>
      revokeC({ data: { access_id: accessId } }),
    onSuccess: refresh,
    onError: (e: Error) => setErr(e.message),
  });
  const toggleAdmin = useMutation({
    mutationFn: (is_admin: boolean) =>
      setRole({ data: { user_id: id, is_admin } }),
    onSuccess: refresh,
    onError: (e: Error) => setErr(e.message),
  });

  if (isLoading) return <p className="text-base">טוען…</p>;
  if (!data) return <p className="text-brand-accent-alert">לא נמצא.</p>;

  return (
    <>
      <AdminPageHeader
        eyebrow="פרופיל משתמש"
        title={data.full_name || data.email || "—"}
        actions={
          <Link to="/admin/users">
            <GhostButton type="button">חזרה לרשימה</GhostButton>
          </Link>
        }
      />
      {err && (
        <p className="mb-4 text-sm text-brand-accent-alert">{err}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3
            className="text-xl text-brand-primary-dark mb-3"
            style={{ fontFamily: "var(--font-bateran)" }}
          >
            פרטים
          </h3>
          <dl className="text-sm text-brand-primary-dark space-y-2">
            <Row k="אימייל" v={data.email ?? "—"} ltr />
            <Row k="שם מלא" v={data.full_name ?? "—"} />
            <Row k="תפקיד" v={data.is_admin ? "מנהל" : "משתמש"} />
          </dl>
          <div className="mt-4">
            {data.is_admin ? (
              <DangerButton onClick={() => toggleAdmin.mutate(false)}>
                הסרת הרשאת מנהל
              </DangerButton>
            ) : (
              <PrimaryButton onClick={() => toggleAdmin.mutate(true)}>
                הפיכה למנהל
              </PrimaryButton>
            )}
          </div>
        </Card>

        <Card>
          <h3
            className="text-xl text-brand-primary-dark mb-3"
            style={{ fontFamily: "var(--font-bateran)" }}
          >
            פתיחת הרשאות
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">קורס בודד</label>
              <div className="flex gap-2">
                <select
                  value={courseSel}
                  onChange={(e) => setCourseSel(e.target.value)}
                  className={inputClass}
                >
                  <option value="">בחרי קורס…</option>
                  {data.all_courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <PrimaryButton
                  type="button"
                  disabled={!courseSel || addCourse.isPending}
                  onClick={() => addCourse.mutate()}
                >
                  פתיחה
                </PrimaryButton>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">חבילה</label>
              <div className="flex gap-2">
                <select
                  value={bundleSel}
                  onChange={(e) => setBundleSel(e.target.value)}
                  className={inputClass}
                >
                  <option value="">בחרי חבילה…</option>
                  {data.all_bundles.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
                <PrimaryButton
                  type="button"
                  disabled={!bundleSel || addBundle.isPending}
                  onClick={() => addBundle.mutate()}
                >
                  פתיחה
                </PrimaryButton>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <h3
            className="text-xl text-brand-primary-dark mb-3"
            style={{ fontFamily: "var(--font-bateran)" }}
          >
            הרשאות פתוחות ({data.access.length})
          </h3>
          {data.access.length === 0 ? (
            <p className="text-brand-primary-dark/70">אין הרשאות עדיין.</p>
          ) : (
            <ul className="divide-y divide-brand-accent-soft/50">
              {data.access.map((a) => (
                <li
                  key={a.id}
                  className="py-3 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-brand-primary-dark">{a.course_title}</p>
                    <p className="text-xs text-brand-primary-dark/60">
                      מקור: {sourceLabel(a.source)} ·{" "}
                      {new Date(a.granted_at).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                  {a.source === "manual" && (
                    <DangerButton onClick={() => revoke.mutate(a.id)}>
                      הסרה
                    </DangerButton>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function Row({ k, v, ltr }: { k: string; v: string; ltr?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-brand-primary-dark/60">{k}</dt>
      <dd dir={ltr ? "ltr" : undefined}>{v}</dd>
    </div>
  );
}

function sourceLabel(s: "purchase" | "manual" | "bundle") {
  return s === "manual" ? "ידני" : s === "purchase" ? "רכישה" : "חבילה";
}
