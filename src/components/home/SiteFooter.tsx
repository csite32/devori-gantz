import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer
      className="w-full bg-brand-accent-soft py-5 text-center rtl"
      dir="rtl"
    >
      <div
        className="mx-auto px-6 md:px-[24px]"
        style={{ maxWidth: 1300 }}
      >
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-2 md:gap-0">
          <p
            className="m-0 text-brand-primary-dark text-base md:text-[22px]"
            style={{ fontFamily: 'Discovery FS, sans-serif', fontWeight: 400 }}
          >
            © כל הזכויות שמורות 2026
          </p>
          <a
            href="http://www.c-site.co.il/"
            target="_blank"
            rel="noopener noreferrer"
            className="m-0 text-brand-primary-dark text-base md:text-[22px] no-underline hover:text-brand-primary-dark"
            style={{ fontFamily: 'Discovery FS, sans-serif', fontWeight: 400 }}
          >
            פיתוח: חיה פוגל Csite
          </a>
          <Link
            to="/accessibility"
            className="m-0 text-brand-primary-dark text-base md:text-[22px] no-underline hover:text-brand-primary-dark"
            style={{ fontFamily: 'Discovery FS, sans-serif', fontWeight: 400 }}
          >
            הצהרת נגישות
          </Link>
        </div>
      </div>
    </footer>
  );
}
