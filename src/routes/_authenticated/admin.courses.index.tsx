import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteCourse,
  listAdminCourses,
  upsertCourse,
} from "@/lib/admin.functions";
import {
  AdminPageHeader,
  Card,
  DangerButton,
  GhostButton,
  PrimaryButton,
} from "@/components/admin/ui";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/courses/")({
  component: CoursesList,
});

function CoursesList() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const listFn = useServerFn(listAdminCourses);
  const updateFn = useServerFn(upsertCourse);
  const delFn = useServerFn(deleteCourse);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "courses"],
    queryFn: () => listFn(),
  });

  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const togglePublish = useMutation({
    mutationFn: async (c: NonNullable<typeof data>[number]) => {
      setBusyId(c.id);
      return updateFn({
        data: {
          id: c.id,
          title: c.title,
          slug: c.slug,
          is_published: !c.is_published,
          sort_order: c.sort_order,
        },
      });
    },
    onSettled: () => {
      setBusyId(null);
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
    },
    onError: (e: Error) => setErr(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!confirm("למחוק את הקורס?")) throw new Error("cancelled");
      setBusyId(id);
      return delFn({ data: { id } });
    },
    onSettled: () => {
      setBusyId(null);
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
    },
    onError: (e: Error) => {
      if (e.message !== "cancelled") setErr(e.message);
    },
  });

  return (
    <>
      <AdminPageHeader
        eyebrow="ניהול"
        title="קורסים"
        actions={
          <PrimaryButton onClick={() => navigate({ to: "/admin/courses/new" })}>
            + קורס חדש
          </PrimaryButton>
        }
      />
      {err && (
          <p className="mb-4 text-lg text-brand-accent-alert">{err}</p>
      )}
      <Card>
        {isLoading ? (
          <p className="text-lg md:text-xl text-brand-primary-dark/70">טוען…</p>
        ) : !data || data.length === 0 ? (
          <p className="text-lg md:text-xl text-brand-primary-dark/70">אין קורסים עדיין.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-lg md:text-xl">
              <thead className="text-base md:text-lg uppercase tracking-wider text-brand-primary/70">
                <tr>
                  <th className="py-2 pr-2">כותרת</th>
                  <th className="py-2">slug</th>
                  <th className="py-2">סדר</th>
                  <th className="py-2">שיעורים</th>
                  <th className="py-2">סטטוס</th>
                  <th className="py-2">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-accent-soft/50">
                {data.map((c) => (
                  <tr key={c.id} className="text-brand-primary-dark">
                    <td className="py-3 pr-2">
                      <Link
                        to="/admin/courses/$id"
                        params={{ id: c.id }}
                        className="hover:text-brand-primary"
                      >
                        {c.title}
                      </Link>
                    </td>
                    <td className="py-3" dir="ltr">{c.slug}</td>
                    <td className="py-3">{c.sort_order}</td>
                    <td className="py-3">{c.lessons_count}</td>
                    <td className="py-3">
                      <span
                        className={
                          "inline-block rounded-full px-3 py-1 text-base " +
                          (c.is_published
                            ? "bg-brand-primary/10 text-brand-primary"
                            : "bg-brand-accent-soft/40 text-brand-primary-dark/70")
                        }
                      >
                        {c.is_published ? "פורסם" : "טיוטה"}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <GhostButton
                          onClick={() => togglePublish.mutate(c)}
                          disabled={busyId === c.id}
                        >
                          {c.is_published ? "הסתר" : "פרסם"}
                        </GhostButton>
                        <Link to="/admin/courses/$id" params={{ id: c.id }}>
                          <GhostButton type="button">עריכה</GhostButton>
                        </Link>
                        <DangerButton
                          onClick={() => remove.mutate(c.id)}
                          disabled={busyId === c.id}
                        >
                          מחיקה
                        </DangerButton>
                      </div>
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
