import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminBundle } from "@/lib/admin.functions";
import { AdminPageHeader, GhostButton } from "@/components/admin/ui";
import { BundleForm } from "@/components/admin/BundleForm";

export const Route = createFileRoute("/_authenticated/admin/bundles/$id")({
  component: EditBundle,
});

function EditBundle() {
  const { id } = useParams({ from: "/_authenticated/admin/bundles/$id" });
  const qc = useQueryClient();
  const fetchFn = useServerFn(getAdminBundle);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "bundle", id],
    queryFn: () => fetchFn({ data: { id } }),
  });

  if (isLoading) return <p>טוען…</p>;
  if (!data) return <p className="text-brand-accent-alert">לא נמצא.</p>;

  return (
    <>
      <AdminPageHeader
        eyebrow="עריכת חבילה"
        title={data.title}
        actions={
          <Link to="/admin/bundles">
            <GhostButton type="button">חזרה לרשימה</GhostButton>
          </Link>
        }
      />
      <BundleForm
        initial={{
          id: data.id,
          title: data.title,
          slug: data.slug,
          description: data.description,
        }}
        allCourses={data.all_courses.map((c) => ({ id: c.id, title: c.title }))}
        selectedCourseIds={data.course_ids}
        onSaved={() => qc.invalidateQueries({ queryKey: ["admin", "bundle", id] })}
      />
    </>
  );
}
