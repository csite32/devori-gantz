import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader, GhostButton } from "@/components/admin/ui";
import { LessonForm } from "@/components/admin/LessonForm";
import { getAdminLesson } from "@/lib/admin.functions";

export const Route = createFileRoute(
  "/_authenticated/admin/courses/$id/lessons/$lessonId",
)({
  component: EditLesson,
});

function EditLesson() {
  const { id, lessonId } = useParams({
    from: "/_authenticated/admin/courses/$id/lessons/$lessonId",
  });
  const navigate = useNavigate();
  const fetchFn = useServerFn(getAdminLesson);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "lesson", lessonId],
    queryFn: () => fetchFn({ data: { id: lessonId } }),
  });

  if (isLoading) return <p>טוען…</p>;
  if (!data) return <p className="text-brand-accent-alert">השיעור לא נמצא.</p>;

  return (
    <>
      <AdminPageHeader
        eyebrow="עריכת שיעור"
        title={data.title}
        actions={
          <Link to="/admin/courses/$id" params={{ id }}>
            <GhostButton type="button">חזרה לקורס</GhostButton>
          </Link>
        }
      />
      <LessonForm
        initial={{
          id: data.id,
          course_id: data.course_id,
          title: data.title,
          description: data.description,
          vimeo_url: data.vimeo_url,
          sort_order: data.sort_order,
        }}
        onSaved={() => navigate({ to: "/admin/courses/$id", params: { id } })}
      />
    </>
  );
}
