import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/logo_d.png.asset.json";

/**
 * Lightweight brand bar used on all internal screens (auth, dashboard, etc.).
 * It only shows the site logo, links back to the home page, and intentionally
 * does NOT replicate the homepage Header — that one stays untouched.
 */
export function BrandLogoBar({
  variant = "light",
}: {
  variant?: "light" | "transparent";
}) {
  return (
    <div
      className={
        variant === "light"
          ? "w-full bg-brand-background-light/80 backdrop-blur border-b border-brand-accent-soft/40"
          : "w-full"
      }
    >
      <div className="mx-auto max-w-6xl px-4 md:px-12 py-3 flex items-center justify-center sm:justify-start">
        <Link
          to="/"
          aria-label="חזרה לעמוד הבית"
          className="inline-flex items-center transition hover:opacity-90"
        >
          <img
            src={logoAsset.url}
            alt="דבורי גנץ"
            className="h-12 md:h-16 w-auto object-contain"
          />
        </Link>
      </div>
    </div>
  );
}
