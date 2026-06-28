import logoAsset from "@/assets/hero/logo.png.asset.json";
import userIconAsset from "@/assets/hero/user.svg.asset.json";
import arrowAsset from "@/assets/hero/arrow.svg.asset.json";
import videoAsset from "@/assets/hero/hero-video.mp4.asset.json";

const BADGE_TEXT =
  "40 שנות ניסיון מקצועי – עכשיו גם בדיגיטל • 40 שנות ניסיון מקצועי – עכשיו גם בדיגיטל • ";

export function Hero() {
  return (
    <section
      dir="rtl"
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: "rgba(255, 238, 218, 1)",
        minHeight: "100vh",
      }}
    >
      {/* Right decorative vertical strip */}
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 z-20 hidden md:block"
        style={{
          width: "70px",
          backgroundColor: "rgba(208, 164, 145, 0.56)",
        }}
      />

      {/* Left video column - full height */}
      <div className="absolute inset-y-0 left-0 z-0 hidden md:block md:w-[42%]">
        <video
          src={videoAsset.url}
          autoPlay
          muted
          loop
          playsInline
          className="block h-full w-full"
          style={{ objectFit: "cover" }}
        />
      </div>

      {/* Content layer */}
      <div className="relative z-10 flex min-h-screen flex-col md:pr-[70px]">
        {/* Header: logo right, user left (force LTR order regardless of RTL) */}
        <header
          dir="ltr"
          className="flex items-center justify-between px-6 pt-8 md:px-16"
        >
          <button
            type="button"
            aria-label="התחברות"
            className="shrink-0 transition-opacity hover:opacity-70"
          >
            <img src={userIconAsset.url} alt="" className="h-10 w-10 md:h-12 md:w-12" />
          </button>
          <img
            src={logoAsset.url}
            alt="דבורי גנץ"
            className="h-14 w-auto md:h-20"
          />
        </header>

        {/* Right-aligned text block (sits to the right of the video) */}
        <div className="flex flex-1 flex-col justify-center px-6 py-10 md:px-16 md:max-w-[58%] md:ml-auto">
          <h1
            className="text-right"
            style={{
              fontFamily: "var(--font-atletico)",
              color: "rgba(158, 36, 43, 1)",
              lineHeight: 1.02,
            }}
          >
            <span
              className="block"
              style={{ fontWeight: 700, fontSize: "clamp(48px, 8vw, 117px)" }}
            >
              קורסי התספורות
            </span>
            <span
              className="block"
              style={{ fontWeight: 700, fontSize: "clamp(48px, 8vw, 117px)" }}
            >
              הדיגיטליים
            </span>
            <span
              className="block"
              style={{ fontWeight: 400, fontSize: "clamp(40px, 7vw, 100px)" }}
            >
              של דבורי גנץ-אדלר
            </span>
          </h1>

          <p
            className="mt-8 max-w-[640px] text-right"
            style={{
              fontFamily: "var(--font-discovery)",
              color: "rgba(82, 16, 20, 1)",
              fontSize: "clamp(18px, 2.4vw, 35px)",
              lineHeight: 1.35,
            }}
          >
            ידע, ניסיון וטכניקות מקצועיות שנצברו במשך עשרות שנים – זמינים עבורך
            בקורסים דיגיטליים מקצועיים, לצפייה מכל מקום ובכל זמן.
          </p>
        </div>
      </div>

      {/* Rotating badge - bottom left, over video area */}
      <div className="absolute bottom-8 left-8 z-20 md:bottom-12 md:left-12">
        <RotatingBadge />
      </div>

      {/* Mobile video fallback */}
      <div className="relative z-10 block w-full md:hidden">
        <video
          src={videoAsset.url}
          autoPlay
          muted
          loop
          playsInline
          className="block h-[320px] w-full"
          style={{ objectFit: "cover" }}
        />
      </div>
    </section>
  );
}

function RotatingBadge() {
  const size = 170;
  const radius = 72;

  return (
    <div
      className="relative grid place-items-center rounded-full"
      style={{ width: size, height: size }}
    >
      {/* Outer ring with rotating text */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: "0.7px solid rgba(255, 20, 20, 1)",
          animation: "hero-badge-spin 25s linear infinite",
        }}
      >
        {/* Inner ring */}
        <div
          className="absolute rounded-full"
          style={{
            inset: 14,
            border: "0.7px solid rgba(255, 20, 20, 1)",
          }}
        />
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <path
              id="hero-badge-circle"
              d={`M ${size / 2}, ${size / 2} m -${radius}, 0 a ${radius},${radius} 0 1,1 ${radius * 2},0 a ${radius},${radius} 0 1,1 -${radius * 2},0`}
            />
          </defs>
          <text
            style={{
              fontFamily: "var(--font-discovery)",
              fontSize: "11px",
              letterSpacing: "0.5px",
              fill: "rgba(158, 36, 43, 1)",
            }}
          >
            <textPath href="#hero-badge-circle" startOffset="0">
              {BADGE_TEXT}
            </textPath>
          </text>
        </svg>
      </div>

      {/* Center arrow (not rotating) */}
      <img
        src={arrowAsset.url}
        alt=""
        className="relative z-10"
        style={{ width: 28, height: 32 }}
      />

      <style>{`
        @keyframes hero-badge-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
