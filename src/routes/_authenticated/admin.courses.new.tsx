import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/ui";
import { CourseForm } from "@/components/admin/CourseForm";

export const Route = createFileRoute("/_authenticated/admin/courses/new")({
  component: NewCourse,
});

function NewCourse() {
  const navigate = useNavigate();
  return (
    <>
      <AdminPageHeader eyebrow="קורסים" title="קורס חדש" />
      <CourseForm
        initial={{
          title: "",
          slug: "",
          description: "",
          cover_url: null,
          is_published: false,
          sort_order: 0,
        }}
        onSaved={(id) => navigate({ to: "/admin/courses/$id", params: { id } })}
      />
    </>
  );
}
