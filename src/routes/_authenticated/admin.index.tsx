import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listAdminCourses } from "@/lib/admin.functions";
import { AdminPageHeader, Card } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const coursesFn = useServerFn(listAdminCourses);
  const courses = useQuery({ queryKey: ["admin", "courses"], queryFn: () => coursesFn() });

  const totalCourses = courses.data?.length ?? 0;
  const published = courses.data?.filter((c) => c.is_published).length ?? 0;
  const totalLessons =
    courses.data?.reduce((s, c) => s + c.lessons_count, 0) ?? 0;

  return (
    <>
      <AdminPageHeader eyebrow="Devori Gantz · Admin" title="לוח ניהול" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="קורסים" value={totalCourses} />
        <Stat label="קורסים מפורסמים" value={published} />
        <Stat label="שיעורים" value={totalLessons} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <QuickLink to="/admin/courses" title="ניהול קורסים" desc="יצירה, עריכה, פרסום ושינוי סדר." />
        <QuickLink to="/admin/users" title="ניהול משתמשים" desc="צפייה, יצירת משתמשת חדשה והרשאות לקורסים." />
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="text-center">
      <p
        className="text-sm tracking-[0.3em] uppercase text-brand-primary/70"
        style={{ fontFamily: "var(--font-discovery)" }}
      >
        {label}
      </p>
      <p
        className="mt-3 text-5xl text-brand-primary-dark"
        style={{ fontFamily: "var(--font-bateran)" }}
      >
        {value}
      </p>
    </Card>
  );
}

function QuickLink({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="block rounded-2xl border border-brand-accent-soft/60 bg-brand-white/80 p-6 hover:bg-brand-white hover:border-brand-primary/40 transition cursor-pointer"
    >
      <h3
        className="text-2xl text-brand-primary-dark"
        style={{ fontFamily: "var(--font-bateran)" }}
      >
        {title}
      </h3>
      <p className="mt-2 text-base text-brand-primary-dark/70">{desc}</p>
      <span className="mt-3 inline-block text-base text-brand-primary">פתיחה ←</span>
    </Link>
  );
}
