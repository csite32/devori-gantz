import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/ui";
import { BundleForm } from "@/components/admin/BundleForm";

export const Route = createFileRoute("/_authenticated/admin/bundles/new")({
  component: NewBundle,
});

function NewBundle() {
  const navigate = useNavigate();
  return (
    <>
      <AdminPageHeader eyebrow="חבילות" title="חבילה חדשה" />
      <BundleForm
        initial={{ title: "", slug: "", description: "" }}
        onSaved={(id) => navigate({ to: "/admin/bundles/$id", params: { id } })}
      />
    </>
  );
}
