import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogoBar } from "@/components/brand/BrandLogoBar";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "איפוס סיסמה | דבורי גנץ" },
      { name: "description", content: "איפוס סיסמה לאזור האישי באתר הקורסים." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [recoverySession, setRecoverySession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Supabase delivers the recovery token in the URL hash and fires
  // PASSWORD_RECOVERY once it parses it. We wait for that event before
  // allowing a password change so the user is not silently logged in to
  // their account without resetting the password.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoverySession(true);
        setReady(true);
      }
    });

    // Also handle the case where the page is opened with an already-active
    // recovery session (e.g. after a soft refresh).
    supabase.auth.getSession().then(({ data }) => {
      // Hash contains type=recovery on first land.
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      if (hash.includes("type=recovery") || data.session) {
        setRecoverySession(Boolean(data.session) || hash.includes("type=recovery"));
      }
      setReady(true);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("הסיסמה חייבת לכלול לפחות 8 תווים.");
      return;
    }
    if (password !== confirm) {
      setError("הסיסמאות אינן תואמות.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError("לא הצלחנו לעדכן את הסיסמה. ייתכן שהקישור פג תוקף.");
      return;
    }
    setDone(true);
    // Sign out so the next entry is a clean login.
    await supabase.auth.signOut();
    setTimeout(() => navigate({ to: "/auth" }), 1500);
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
      <BrandLogoBar variant="transparent" />
      <div className="relative mx-auto flex max-w-6xl items-center justify-center px-4 py-8 md:py-16">
        <div
          className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-brand-accent-soft/60 bg-brand-white/95 backdrop-blur p-7 md:p-10"
          style={{ boxShadow: "0 30px 60px -40px rgba(82,16,20,0.45)" }}
        >
        <h1
          className="text-3xl text-brand-primary-dark text-center mb-2"
          style={{ fontFamily: "var(--font-bateran)" }}
        >
          איפוס סיסמה
        </h1>
        <p
          className="text-center text-brand-primary-dark/70 mb-6 text-sm"
          style={{ fontFamily: "var(--font-discovery)" }}
        >
          בחרי סיסמה חדשה לאזור האישי שלך.
        </p>

        {!ready ? (
          <p className="text-center text-brand-primary-dark/70 text-sm">
            טוען...
          </p>
        ) : !recoverySession ? (
          <p className="text-center text-sm text-brand-accent-alert">
            הקישור אינו תקף או שפג תוקפו. יש לבקש קישור איפוס חדש ממסך
            ההתחברות.
          </p>
        ) : done ? (
          <p className="text-center text-sm text-brand-primary-dark">
            הסיסמה עודכנה בהצלחה. מעבירים אותך למסך ההתחברות...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm text-brand-primary-dark mb-1"
                style={{ fontFamily: "var(--font-discovery)" }}
              >
                סיסמה חדשה
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-brand-accent-soft bg-brand-white px-3 py-2 text-brand-primary-dark outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>

            <div>
              <label
                htmlFor="confirm"
                className="block text-sm text-brand-primary-dark mb-1"
                style={{ fontFamily: "var(--font-discovery)" }}
              >
                אישור סיסמה
              </label>
              <input
                id="confirm"
                type="password"
                required
                autoComplete="new-password"
                dir="ltr"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-brand-accent-soft bg-brand-white px-3 py-2 text-brand-primary-dark outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>

            {error && (
              <p className="text-sm text-brand-accent-alert" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-brand-white font-medium transition hover:bg-brand-primary-dark disabled:opacity-60"
              style={{ fontFamily: "var(--font-discovery)" }}
            >
              {loading ? "מעדכן..." : "עדכון סיסמה"}
            </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
