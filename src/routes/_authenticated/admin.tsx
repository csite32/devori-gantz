import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { BrandLogoBar } from "@/components/brand/BrandLogoBar";
import { AdminNavBar } from "@/components/admin/AdminNavBar";
import { requireAdmin } from "@/lib/admin.functions";

// Layout for /admin/*. The parent _authenticated route (ssr:false) already
// guarantees the user is signed in. Here we additionally verify role=admin.
export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "אזור ניהול | דבורי גנץ" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  beforeLoad: async () => {
    try {
      await requireAdmin();
    } catch {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <main
      dir="rtl"
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(120% 80% at 100% 0%, rgba(229,197,177,0.45) 0%, rgba(255,238,218,1) 55%, rgba(255,238,218,1) 100%)",
        fontFamily: "var(--font-discovery)",
      }}
    >
      <BrandLogoBar variant="transparent" />
      <AdminNavBar />
      <div className="mx-auto max-w-6xl px-4 md:px-12 py-8 md:py-12">
        <Outlet />
      </div>
    </main>
  );
}
