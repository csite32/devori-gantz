import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { AdminPageHeader, GhostButton } from "@/components/admin/ui";
import { LessonForm } from "@/components/admin/LessonForm";

export const Route = createFileRoute(
  "/_authenticated/admin/courses/$id/lessons/new",
)({
  component: NewLesson,
});

function NewLesson() {
  const { id } = useParams({
    from: "/_authenticated/admin/courses/$id/lessons/new",
  });
  const navigate = useNavigate();
  return (
    <>
      <AdminPageHeader
        eyebrow="שיעור חדש"
        title="הוספת שיעור"
        actions={
          <Link to="/admin/courses/$id" params={{ id }}>
            <GhostButton type="button">חזרה לקורס</GhostButton>
          </Link>
        }
      />
      <LessonForm
        initial={{
          course_id: id,
          title: "",
          description: "",
          vimeo_url: "",
          sort_order: 0,
        }}
        onSaved={() => navigate({ to: "/admin/courses/$id", params: { id } })}
      />
    </>
  );
}
