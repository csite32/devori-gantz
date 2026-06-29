import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // If already signed in, redirect away (placeholder: home until protected
  // area exists). When the personal area lands, change to its route.
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active && data.user) navigate({ to: "/" });
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
    navigate({ to: "/" });
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
    setInfo(
      "אם הכתובת רשומה במערכת, נשלח אליה מייל עם קישור לאיפוס הסיסמה.",
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen flex items-center justify-center bg-brand-background-light px-4 py-12"
    >
      <div className="w-full max-w-md rounded-2xl bg-brand-white shadow-xl border border-brand-accent-soft/40 p-8">
        <h1
          className="text-3xl text-brand-primary-dark text-center mb-2"
          style={{ fontFamily: "var(--font-bateran)" }}
        >
          {mode === "login" ? "כניסה לאזור האישי" : "שחזור סיסמה"}
        </h1>
        <p
          className="text-center text-brand-primary-dark/70 mb-6 text-sm"
          style={{ fontFamily: "var(--font-discovery)" }}
        >
          {mode === "login"
            ? "הזיני את כתובת האימייל והסיסמה שקיבלת לאחר הרכישה."
            : "נשלח אלייך קישור לאיפוס הסיסמה לכתובת האימייל שלך."}
        </p>

        <form
          onSubmit={mode === "login" ? handleLogin : handleForgot}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm text-brand-primary-dark mb-1"
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
              className="w-full rounded-lg border border-brand-accent-soft bg-brand-white px-3 py-2 text-brand-primary-dark outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          {mode === "login" && (
            <div>
              <label
                htmlFor="password"
                className="block text-sm text-brand-primary-dark mb-1"
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
                className="w-full rounded-lg border border-brand-accent-soft bg-brand-white px-3 py-2 text-brand-primary-dark outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-brand-accent-alert" role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className="text-sm text-brand-primary-dark/80">{info}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-brand-white font-medium transition hover:bg-brand-primary-dark disabled:opacity-60"
            style={{ fontFamily: "var(--font-discovery)" }}
          >
            {loading
              ? "רגע אחד..."
              : mode === "login"
                ? "כניסה"
                : "שליחת קישור לאיפוס"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          {mode === "login" ? (
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                setError(null);
                setInfo(null);
              }}
              className="text-brand-primary hover:text-brand-primary-dark underline-offset-4 hover:underline"
            >
              שכחת סיסמה?
            </button>
          ) : (
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
          )}
        </div>

        <p
          className="mt-8 text-center text-xs text-brand-primary-dark/60"
          style={{ fontFamily: "var(--font-discovery)" }}
        >
          אין הרשמה עצמית באתר. חשבון נפתח לאחר רכישת קורס.
        </p>
      </div>
    </main>
  );
}
