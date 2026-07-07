import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogoBar } from "@/components/brand/BrandLogoBar";

export const Route = createFileRoute("/payment-success")({
  head: () => ({
    meta: [
      { title: "התשלום התקבל בהצלחה | דבורי גנץ" },
      {
        name: "description",
        content: "תודה על הרכישה. הגישה לקורס מוכנה עבורך.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: PaymentSuccessPage,
});

function PaymentSuccessPage() {
  return (
    <main
      dir="rtl"
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 80% at 100% 0%, rgba(229,197,177,0.55) 0%, rgba(255,238,218,1) 55%, rgba(255,238,218,1) 100%)",
        fontFamily: "var(--font-discovery)",
      }}
    >
      {/* Decorative accents — echo the dashboard palette */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 h-full hidden md:block"
        style={{ width: 35, background: "rgba(208,164,145,0.56)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full blur-3xl opacity-40"
        style={{ background: "rgba(158,36,43,0.18)" }}
      />

      <BrandLogoBar variant="light" />

      <div className="relative flex flex-1 items-center justify-center px-4 py-10 md:py-16">
        <div
          className="relative overflow-hidden rounded-[28px] border border-brand-accent-soft/60 bg-brand-white/90 backdrop-blur px-6 py-10 md:px-14 md:py-14 text-center"
          style={{ boxShadow: "0 30px 60px -40px rgba(82,16,20,0.35)" }}
        >
          {/* Soft radial glow behind the icon */}
          <div
            aria-hidden
            className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full opacity-60"
            style={{
              background:
                "radial-gradient(circle, rgba(158,36,43,0.18), transparent 70%)",
            }}
          />

          <div className="relative">
            {/* Success badge */}
            <div className="mx-auto mb-8 md:mb-10 flex h-24 w-24 md:h-32 md:w-32 items-center justify-center rounded-full bg-brand-primary/10">
              <div
                className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-brand-primary"
                style={{
                  boxShadow:
                    "0 0 0 6px rgba(158,36,43,0.12), 0 18px 30px -12px rgba(82,16,20,0.45)",
                }}
              >
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="h-9 w-9 md:h-11 md:w-11 text-brand-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            <p
              className="text-xs md:text-sm tracking-[0.3em] text-brand-primary/80 uppercase"
              style={{ fontFamily: "var(--font-discovery)" }}
            >
              Devori Gantz
            </p>

            <h1
              className="mt-3 text-3xl md:text-4xl text-brand-primary-dark leading-tight"
              style={{ fontFamily: "var(--font-bateran)" }}
            >
              התשלום התקבל בהצלחה
              <span
                aria-hidden
                className="align-middle text-[1.1em]"
                style={{
                  fontFamily:
                    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
                }}
              >
                !
              </span>
            </h1>

            <div
              aria-hidden
              className="mx-auto mt-4 h-[2px] w-24 rounded-full"
              style={{
                background:
                  "linear-gradient(to left, rgba(158,36,43,0.9), rgba(158,36,43,0))",
              }}
            />

            <div
              className="mt-8 md:mt-10 space-y-4 text-base md:text-lg text-brand-primary-dark/85"
              style={{
                fontFamily: "var(--font-discovery)",
                lineHeight: 1.65,
              }}
            >
              <p>תודה על הרכישה.</p>
              <p>אנחנו מכינים עבורך את הגישה לקורס.</p>
              <p>
                אם זו הרכישה הראשונה שלך, בתוך מספר רגעים יישלח אלייך מייל
                להגדרת סיסמה וכניסה לאזור האישי.
              </p>
              <p>
                אם כבר יש לך חשבון באתר, ניתן להתחבר כבר עכשיו והקורס החדש
                יתווסף אוטומטית לאזור האישי בתוך זמן קצר.
              </p>
            </div>

            <div className="mt-10 md:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/dashboard"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-brand-primary px-8 py-3 text-base md:text-lg text-brand-white shadow-md hover:bg-brand-primary-dark transition"
                style={{ fontFamily: "var(--font-discovery)" }}
              >
                כניסה לאזור האישי
              </Link>
              <Link
                to="/"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-brand-primary/30 px-8 py-3 text-base md:text-lg text-brand-primary-dark hover:bg-brand-primary hover:text-brand-white hover:border-brand-primary transition"
                style={{ fontFamily: "var(--font-discovery)" }}
              >
                חזרה לעמוד הבית
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
