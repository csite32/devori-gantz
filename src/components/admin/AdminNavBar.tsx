import { Link } from "@tanstack/react-router";

type Item = { to: string; label: string; exact?: boolean };
const items: Item[] = [
  { to: "/admin", label: "ראשי", exact: true },
  { to: "/admin/courses", label: "קורסים" },
  { to: "/admin/bundles", label: "חבילות" },
  { to: "/admin/users", label: "משתמשים" },
];

export function AdminNavBar() {
  return (
    <nav
      dir="rtl"
      className="w-full border-b border-brand-accent-soft/40 bg-brand-white/70 backdrop-blur"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-12 py-3 flex items-center gap-2 md:gap-3 overflow-x-auto">
        <span
          className="hidden md:inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-brand-primary/80 pl-3 ml-2 border-l border-brand-accent-soft/60"
          style={{ fontFamily: "var(--font-discovery)" }}
        >
          ניהול
        </span>
        {items.map((it) => (
          <Link
            key={it.to}
            to={it.to}
            activeOptions={it.exact ? { exact: true } : undefined}
            activeProps={{
              className:
                "rounded-full bg-brand-primary text-brand-white px-4 py-2 text-sm shadow-sm",
            }}
            inactiveProps={{
              className:
                "rounded-full text-brand-primary-dark hover:bg-brand-background-light px-4 py-2 text-sm transition",
            }}
          >
            {it.label}
          </Link>
        ))}
        <div className="ms-auto">
          <Link
            to="/dashboard"
            className="text-sm text-brand-primary-dark/70 hover:text-brand-primary transition"
          >
            לאזור האישי →
          </Link>
        </div>
      </div>
    </nav>
  );
}
