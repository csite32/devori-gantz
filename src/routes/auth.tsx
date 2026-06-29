import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogoBar } from "@/components/brand/BrandLogoBar";
import { applyRememberMe } from "@/lib/remember-me";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "התחברות | דבורי גנץ" },
      { name: "description", content: "כניסה לאזור האישי באתר הקורסים של דבורי גנץ." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active && data.user) navigate({ to: "/dashboard" });
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      setError("האימייל או הסיסמה שגויים, או שאין למשתמש הרשאה לאתר.");
      return;
    }
    applyRememberMe(remember);
    navigate({ to: "/dashboard" });
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError("יש להזין כתובת אימייל.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError("לא הצלחנו לשלוח קישור לאיפוס. נסי שוב בעוד רגע.");
      return;
    }
    setInfo("אם הכתובת רשומה במערכת, נשלח אליה מייל עם קישור לאיפוס הסיסמה.");
  }

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 80% at 100% 0%, rgba(229,197,177,0.55) 0%, rgba(255,238,218,1) 55%, rgba(255,238,218,1) 100%)",
        fontFamily: "var(--font-discovery)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 h-full hidden md:block"
        style={{ width: 35, background: "rgba(208,164,145,0.56)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-32 h-[480px] w-[480px] rounded-full blur-3xl opacity-40"
        style={{ background: "rgba(158,36,43,0.18)" }}
      />

      <BrandLogoBar variant="transparent" />

      <div className="relative mx-auto flex max-w-6xl items-center justify-center px-4 py-8 md:py-16">
        <div
          className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-brand-accent-soft/60 bg-brand-white/95 backdrop-blur p-7 md:p-10"
          style={{ boxShadow: "0 30px 60px -40px rgba(82,16,20,0.45)" }}
        >
          <div
            aria-hidden
            className="absolute -top-20 -left-20 h-56 w-56 rounded-full opacity-60"
            style={{
              background:
                "radial-gradient(circle, rgba(229,197,177,0.65), transparent 70%)",
            }}
          />

          <div className="relative">
            <div className="flex items-center gap-3 justify-center">
              <span aria-hidden className="h-[1px] w-10 bg-brand-primary/40" />
              <p
                className="text-xs tracking-[0.3em] uppercase text-brand-primary/80"
                style={{ fontFamily: "var(--font-discovery)" }}
              >
                Devori Gantz
              </p>
              <span aria-hidden className="h-[1px] w-10 bg-brand-primary/40" />
            </div>

            <h1
              className="mt-4 text-center text-3xl md:text-4xl text-brand-primary-dark leading-tight"
              style={{ fontFamily: "var(--font-bateran)" }}
            >
              {mode === "login" ? "כניסה לאזור האישי" : "שחזור סיסמה"}
            </h1>
            <p
              className="mt-3 text-center text-sm md:text-base text-brand-primary-dark/70"
              style={{ fontFamily: "var(--font-discovery)" }}
            >
              {mode === "login"
                ? "הזיני את כתובת האימייל והסיסמה שקיבלת לאחר הרכישה."
                : "נשלח אלייך קישור לאיפוס הסיסמה לכתובת האימייל שלך."}
            </p>

            <form
              onSubmit={mode === "login" ? handleLogin : handleForgot}
              className="mt-7 space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm md:text-base font-medium text-brand-primary-dark mb-2"
                  style={{ fontFamily: "var(--font-discovery)" }}
                >
                  אימייל
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-brand-accent-soft bg-brand-white px-4 py-3 text-brand-primary-dark outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition"
                />
              </div>

              {mode === "login" && (
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm md:text-base font-medium text-brand-primary-dark mb-2"
                    style={{ fontFamily: "var(--font-discovery)" }}
                  >
                    סיסמה
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-brand-accent-soft bg-brand-white px-4 py-3 text-brand-primary-dark outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition"
                  />
                </div>
              )}

              {mode === "login" && (
                <div className="flex items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-brand-accent-soft text-brand-primary focus:ring-brand-primary/30 accent-brand-primary"
                    />
                    <span
                      className="text-sm text-brand-primary-dark/85"
                      style={{ fontFamily: "var(--font-discovery)" }}
                    >
                      זכור אותי
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setError(null);
                      setInfo(null);
                    }}
                    className="text-sm text-brand-primary hover:text-brand-primary-dark underline-offset-4 hover:underline"
                    style={{ fontFamily: "var(--font-discovery)" }}
                  >
                    שכחת סיסמה?
                  </button>
                </div>
              )}

              {error && (
                <p
                  className="text-sm text-brand-accent-alert text-center"
                  role="alert"
                >
                  {error}
                </p>
              )}
              {info && (
                <p className="text-sm text-brand-primary-dark/80 text-center">
                  {info}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-brand-primary px-5 py-3 text-brand-white text-base shadow-md transition hover:bg-brand-primary-dark disabled:opacity-60"
                style={{ fontFamily: "var(--font-discovery)" }}
              >
                {loading
                  ? "רגע אחד..."
                  : mode === "login"
                    ? "כניסה"
                    : "שליחת קישור לאיפוס"}
              </button>
            </form>

            {mode === "forgot" && (
              <div className="mt-6 text-center text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setInfo(null);
                  }}
                  className="text-brand-primary hover:text-brand-primary-dark underline-offset-4 hover:underline"
                >
                  חזרה למסך ההתחברות
                </button>
              </div>
            )}

            <p
              className="mt-8 text-center text-xs text-brand-primary-dark/60"
              style={{ fontFamily: "var(--font-discovery)" }}
            >
              אין הרשמה עצמית באתר. חשבון נפתח לאחר רכישת קורס.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
