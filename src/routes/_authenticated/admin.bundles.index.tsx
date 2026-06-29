import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteBundle, listAdminBundles } from "@/lib/admin.functions";
import {
  AdminPageHeader,
  Card,
  DangerButton,
  GhostButton,
  PrimaryButton,
} from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/bundles/")({
  component: BundlesList,
});

function BundlesList() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const listFn = useServerFn(listAdminBundles);
  const delFn = useServerFn(deleteBundle);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "bundles"],
    queryFn: () => listFn(),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!confirm("למחוק את החבילה? (לא ימחק קורסים)"))
        throw new Error("cancelled");
      return delFn({ data: { id } });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "bundles"] }),
  });

  return (
    <>
      <AdminPageHeader
        eyebrow="ניהול"
        title="חבילות"
        actions={
          <PrimaryButton onClick={() => navigate({ to: "/admin/bundles/new" })}>
            + חבילה חדשה
          </PrimaryButton>
        }
      />
      <Card>
        {isLoading ? (
          <p>טוען…</p>
        ) : !data || data.length === 0 ? (
          <p className="text-brand-primary-dark/70">אין חבילות עדיין.</p>
        ) : (
          <ul className="divide-y divide-brand-accent-soft/50">
            {data.map((b) => (
              <li
                key={b.id}
                className="py-3 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <Link
                    to="/admin/bundles/$id"
                    params={{ id: b.id }}
                    className="text-brand-primary-dark hover:text-brand-primary"
                  >
                    {b.title}
                  </Link>
                  <p className="text-xs text-brand-primary-dark/60" dir="ltr">
                    {b.slug} · {b.courses_count} קורסים
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to="/admin/bundles/$id" params={{ id: b.id }}>
                    <GhostButton type="button">עריכה</GhostButton>
                  </Link>
                  <DangerButton onClick={() => remove.mutate(b.id)}>
                    מחיקה
                  </DangerButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
