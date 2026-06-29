import { Link } from "@tanstack/react-router";

type Item = { to: string; label: string; exact?: boolean };
const items: Item[] = [
  { to: "/admin", label: "ראשי", exact: true },
  { to: "/admin/courses", label: "קורסים" },
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
          className="hidden md:inline-flex items-center gap-2 text-lg tracking-[0.3em] uppercase text-brand-primary/80 pl-3 ml-2 border-l border-brand-accent-soft/60"
          style={{ fontFamily: "var(--font-discovery)" }}
        >
          ניהול
        </span>
        {items.map((it) => (
          <Link
            key={it.to}
            to={it.to as "/admin"}
            activeOptions={it.exact ? { exact: true } : undefined}
            activeProps={{
              className:
                "rounded-full bg-brand-primary text-brand-white px-6 py-3 text-lg md:text-xl shadow-sm cursor-pointer",
            }}
            inactiveProps={{
              className:
                "rounded-full text-brand-primary-dark hover:bg-brand-background-light px-6 py-3 text-lg md:text-xl transition cursor-pointer",
            }}
          >
            {it.label}
          </Link>
        ))}
        <div className="ms-auto">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-lg md:text-xl text-brand-primary-dark/70 hover:text-brand-primary transition cursor-pointer"
          >
            <span>לאזור האישי</span>
            <span aria-hidden="true">←</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
