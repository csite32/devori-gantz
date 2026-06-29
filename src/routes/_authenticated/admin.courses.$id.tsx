import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteLesson,
  getAdminCourse,
} from "@/lib/admin.functions";
import {
  AdminPageHeader,
  Card,
  DangerButton,
  GhostButton,
  PrimaryButton,
} from "@/components/admin/ui";
import { CourseForm } from "@/components/admin/CourseForm";

export const Route = createFileRoute("/_authenticated/admin/courses/$id")({
  component: EditCourse,
});

function EditCourse() {
  const { id } = useParams({ from: "/_authenticated/admin/courses/$id" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchFn = useServerFn(getAdminCourse);
  const delLessonFn = useServerFn(deleteLesson);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "course", id],
    queryFn: () => fetchFn({ data: { id } }),
  });

  const removeLesson = useMutation({
    mutationFn: async (lessonId: string) => {
      if (!confirm("למחוק את השיעור?")) throw new Error("cancelled");
      return delLessonFn({ data: { id: lessonId } });
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: ["admin", "course", id] }),
  });

  if (isLoading) return <p>טוען…</p>;
  if (error || !data)
    return <p className="text-brand-accent-alert">שגיאה בטעינת הקורס.</p>;

  return (
    <>
      <AdminPageHeader
        eyebrow="עריכת קורס"
        title={data.title}
        actions={
          <Link to="/admin/courses">
            <GhostButton type="button">חזרה לרשימה</GhostButton>
          </Link>
        }
      />
      <CourseForm
        initial={{
          id: data.id,
          title: data.title,
          slug: data.slug,
          description: data.description,
          cover_url: data.cover_url,
          is_published: data.is_published,
          sort_order: data.sort_order,
        }}
        onSaved={() => qc.invalidateQueries({ queryKey: ["admin", "course", id] })}
      />

      <div className="mt-10">
        <div className="flex items-end justify-between mb-4">
          <h2
            className="text-2xl text-brand-primary-dark"
            style={{ fontFamily: "var(--font-bateran)" }}
          >
            שיעורי הקורס
          </h2>
          <PrimaryButton
            onClick={() =>
              navigate({
                to: "/admin/courses/$id/lessons/new",
                params: { id },
              })
            }
          >
            + שיעור חדש
          </PrimaryButton>
        </div>
        <Card>
          {data.lessons.length === 0 ? (
            <p className="text-brand-primary-dark/70">אין שיעורים עדיין.</p>
          ) : (
            <ul className="divide-y divide-brand-accent-soft/50">
              {data.lessons.map((l) => (
                <li
                  key={l.id}
                  className="py-3 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-brand-primary-dark">
                      <span className="text-brand-primary/70 text-xs ml-2">
                        #{l.sort_order}
                      </span>
                      {l.title}
                    </p>
                    {l.vimeo_url && (
                      <p
                        className="text-xs text-brand-primary-dark/55 truncate"
                        dir="ltr"
                      >
                        {l.vimeo_url}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to="/admin/courses/$id/lessons/$lessonId"
                      params={{ id, lessonId: l.id }}
                    >
                      <GhostButton type="button">עריכה</GhostButton>
                    </Link>
                    <DangerButton onClick={() => removeLesson.mutate(l.id)}>
                      מחיקה
                    </DangerButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
