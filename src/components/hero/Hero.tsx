import logoAsset from "@/assets/hero/logo.png.asset.json";
import userIconAsset from "@/assets/hero/user.svg.asset.json";
import arrowAsset from "@/assets/hero/arrow.svg.asset.json";
import videoAsset from "@/assets/hero/hero-video.mp4.asset.json";

const BADGE_TEXT = "40 שנות ניסיון מקצועי – עכשיו גם בדיגיטל • 40 שנות ניסיון מקצועי – עכשיו גם בדיגיטל • ";

export function Hero() {
  return (
    <section
      dir="rtl"
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: "rgba(255, 238, 218, 1)", minHeight: "100vh" }}
    >
      {/* Left colored area (accent soft) */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 hidden md:block"
        style={{ width: "30%", backgroundColor: "rgba(229, 197, 177, 1)" }}
      />

      {/* Right decorative vertical strip */}
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 hidden md:block"
        style={{ width: "70px", backgroundColor: "rgba(208, 164, 145, 0.56)" }}
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 pt-8 md:px-16 md:pr-[110px]">
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
            className="h-12 w-auto md:h-16"
          />
        </header>

        {/* Main row */}
        <div className="flex flex-1 flex-col md:flex-row-reverse">
          {/* Right text area */}
          <div className="flex flex-1 flex-col justify-center px-6 py-10 md:px-16 md:pr-[110px]">
            <h1
              className="text-right leading-[1.05]"
              style={{
                fontFamily: "var(--font-atletico)",
                color: "rgba(82, 16, 20, 1)",
              }}
            >
              <span className="block text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl">
                קורסי התספורות
              </span>
              <span className="block text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl">
                הדיגיטליים
              </span>
              <span className="mt-2 block text-3xl font-normal sm:text-4xl md:text-5xl lg:text-6xl">
                של דבורי גנץ-אדלר
              </span>
            </h1>

            <p
              className="mt-8 max-w-md text-right text-base leading-relaxed md:text-lg"
              style={{
                fontFamily: "var(--font-discovery)",
                color: "rgba(82, 16, 20, 1)",
              }}
            >
              ידע, ניסיון וטכניקות מקצועיות שנצברו במשך עשרות שנים – זמינים עבורך
              בקורסים דיגיטליים מקצועיים, לצפייה מכל מקום ובכל זמן.
            </p>
          </div>

          {/* Left video area */}
          <div className="relative flex w-full items-center justify-center md:w-[45%]">
            <div className="relative h-[300px] w-[80%] md:h-[70%] md:w-[75%]">
              <video
                src={videoAsset.url}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover shadow-xl"
              />
            </div>

            {/* Rotating badge */}
            <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 lg:bottom-14 lg:left-auto lg:right-auto lg:-translate-x-[140%]">
              <RotatingBadge />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RotatingBadge() {
  const size = 140;
  const radius = 58;
  const innerRadius = 50;

  return (
    <div
      className="relative grid place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        border: "0.7px solid rgba(255, 20, 20, 1)",
        backgroundColor: "rgba(255, 238, 218, 1)",
      }}
    >
      <div
        className="absolute rounded-full"
        style={{
          inset: 8,
          border: "0.7px solid rgba(255, 20, 20, 1)",
        }}
      />

      {/* Rotating SVG text */}
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 h-full w-full"
        style={{ animation: "hero-badge-spin 25s linear infinite" }}
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
            fontSize: "9px",
            letterSpacing: "1px",
            fill: "rgba(158, 36, 43, 1)",
          }}
        >
          <textPath href="#hero-badge-circle" startOffset="0">
            {BADGE_TEXT}
          </textPath>
        </text>
      </svg>

      {/* Center arrow */}
      <img
        src={arrowAsset.url}
        alt=""
        className="relative z-10"
        style={{ width: 22, height: 26 }}
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
