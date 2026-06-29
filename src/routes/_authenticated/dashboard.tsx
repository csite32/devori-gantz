import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogoBar } from "@/components/brand/BrandLogoBar";
import {
  getDashboard,
  updateAvatarPath,
  updateProfileName,
  type DashboardData,
} from "@/lib/dashboard.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "האזור האישי | דבורי גנץ" },
      { name: "description", content: "הקורסים שלך ופרטי החשבון." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const fetchDashboard = useServerFn(getDashboard);
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => fetchDashboard(),
  });

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
      {/* decorative side strip — echoes the home hero */}
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

      <div className="relative">
        <BrandLogoBar variant="transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 md:px-12 md:py-14">
        <DashboardHeader />

        {isLoading && (
          <p className="mt-16 text-center text-brand-primary-dark/70">
            טוען את האזור האישי…
          </p>
        )}
        {error && (
          <p className="mt-16 text-center text-brand-accent-alert">
            אירעה שגיאה בטעינת הנתונים. נסי לרענן את העמוד.
          </p>
        )}
        {data && (
          <div className="mt-8 md:mt-12 space-y-10 md:space-y-14">
            <ProfileCard profile={data.profile} />
            <CoursesSection courses={data.courses} />
          </div>
        )}
      </div>
    </main>
  );
}

function DashboardHeader() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const router = useRouter();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await router.invalidate();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p
          className="text-xs md:text-sm tracking-[0.3em] text-brand-primary/70 uppercase"
          style={{ fontFamily: "var(--font-discovery)" }}
        >
          Devori Gantz
        </p>
        <h1
          className="mt-2 truncate text-3xl md:text-5xl text-brand-primary-dark leading-tight"
          style={{ fontFamily: "var(--font-bateran)" }}
        >
          האזור האישי שלי
        </h1>
        <div
          aria-hidden
          className="mt-3 h-[2px] w-24 rounded-full"
          style={{
            background:
              "linear-gradient(to left, rgba(158,36,43,0.9), rgba(158,36,43,0))",
          }}
        />
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          onClick={() => navigate({ to: "/" })}
          className="rounded-full border border-brand-primary-dark/15 bg-brand-white/60 backdrop-blur px-4 py-2 text-sm text-brand-primary-dark hover:bg-brand-white transition"
        >
          לעמוד הבית
        </button>
        <button
          onClick={handleSignOut}
          className="rounded-full border border-brand-primary/40 px-4 py-2 text-sm text-brand-primary hover:bg-brand-primary hover:text-brand-white transition"
        >
          התנתקות
        </button>
      </div>
    </header>
  );
}

function ProfileCard({ profile }: { profile: DashboardData["profile"] }) {
  const queryClient = useQueryClient();
  const saveName = useServerFn(updateProfileName);
  const saveAvatar = useServerFn(updateAvatarPath);

  const [name, setName] = useState(profile.full_name ?? "");
  const [editing, setEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    if (!profile.avatar_path) {
      setAvatarUrl(null);
      return;
    }
    supabase.storage
      .from("avatars")
      .createSignedUrl(profile.avatar_path, 60 * 60)
      .then(({ data }) => {
        if (active) setAvatarUrl(data?.signedUrl ?? null);
      });
    return () => {
      active = false;
    };
  }, [profile.avatar_path]);

  const nameMutation = useMutation({
    mutationFn: (full_name: string) => saveName({ data: { full_name } }),
    onSuccess: () => {
      setEditing(false);
      setMsg("השם עודכן בהצלחה.");
      setErr(null);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => setErr("לא הצלחנו לעדכן את השם."),
  });

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setMsg(null);

    if (!file.type.startsWith("image/")) {
      setErr("יש לבחור קובץ תמונה.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErr("גודל התמונה חייב להיות עד 5MB.");
      return;
    }

    setUploading(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${profile.id}/avatar-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setUploading(false);
      setErr("העלאת התמונה נכשלה.");
      return;
    }
    try {
      await saveAvatar({ data: { path } });
      setMsg("תמונת הפרופיל עודכנה.");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch {
      setErr("התמונה הועלתה אך לא נשמרה לפרופיל.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const initial = (profile.full_name || profile.email || "?")
    .slice(0, 1)
    .toUpperCase();

  return (
    <section
      className="relative overflow-hidden rounded-[28px] border border-brand-accent-soft/60 bg-brand-white/90 backdrop-blur p-6 md:p-10"
      style={{ boxShadow: "0 30px 60px -40px rgba(82,16,20,0.35)" }}
    >
      <div
        aria-hidden
        className="absolute -top-24 -left-24 h-64 w-64 rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(circle, rgba(229,197,177,0.65), transparent 70%)",
        }}
      />

      <div className="relative">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="h-[1px] w-10 bg-brand-primary/40"
          />
          <p
            className="text-xs tracking-[0.3em] uppercase text-brand-primary/80"
            style={{ fontFamily: "var(--font-discovery)" }}
          >
            הפרופיל שלי
          </p>
        </div>
        <h2
          className="mt-3 text-2xl md:text-3xl text-brand-primary-dark"
          style={{ fontFamily: "var(--font-bateran)" }}
        >
          פרטי משתמש
        </h2>

        <div className="mt-8 grid gap-8 md:grid-cols-[auto_1fr] md:gap-12 items-start">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-2 rounded-full"
                style={{
                  background:
                    "conic-gradient(from 220deg, rgba(158,36,43,0.55), rgba(229,197,177,0.6), rgba(158,36,43,0.55))",
                  filter: "blur(2px)",
                  opacity: 0.55,
                }}
              />
              <div
                className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-brand-background-light flex items-center justify-center"
                style={{
                  border: "3px solid rgba(255,238,218,1)",
                  boxShadow:
                    "0 0 0 1px rgba(158,36,43,0.25), 0 18px 30px -18px rgba(82,16,20,0.45)",
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="תמונת פרופיל"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span
                    className="text-5xl text-brand-primary"
                    style={{ fontFamily: "var(--font-bateran)" }}
                  >
                    {initial}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-2 text-sm text-brand-white shadow-md hover:bg-brand-primary-dark transition disabled:opacity-60"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {uploading
                ? "מעלה…"
                : avatarUrl
                  ? "החלפת תמונה"
                  : "העלאת תמונה"}
            </button>
            <p className="text-xs text-brand-primary-dark/55">
              עד 5MB · JPG / PNG
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Fields */}
          <div className="w-full space-y-6">
            <Field label="שם מלא">
              {editing ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 rounded-xl border border-brand-accent-soft bg-brand-white px-4 py-2.5 text-brand-primary-dark outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => nameMutation.mutate(name)}
                      disabled={nameMutation.isPending}
                      className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm text-brand-white hover:bg-brand-primary-dark disabled:opacity-60 transition"
                    >
                      שמירה
                    </button>
                    <button
                      onClick={() => {
                        setName(profile.full_name ?? "");
                        setEditing(false);
                        setErr(null);
                      }}
                      className="rounded-xl border border-brand-accent-soft px-4 py-2.5 text-sm text-brand-primary-dark hover:bg-brand-background-light transition"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              ) : (
                <ValueRow
                  value={profile.full_name || "—"}
                  onAction={() => setEditing(true)}
                  actionLabel="עריכה"
                />
              )}
            </Field>

            <Field label="כתובת אימייל">
              <ValueRow value={profile.email || "—"} ltr />
            </Field>

            {msg && (
              <p className="text-sm text-brand-primary flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block w-1.5 h-1.5 rounded-full bg-brand-primary"
                />
                {msg}
              </p>
            )}
            {err && (
              <p className="text-sm text-brand-accent-alert">{err}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="block text-sm md:text-base font-medium text-brand-primary-dark mb-2"
        style={{ fontFamily: "var(--font-discovery)", letterSpacing: "0.02em" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function ValueRow({
  value,
  onAction,
  actionLabel,
  ltr = false,
}: {
  value: string;
  onAction?: () => void;
  actionLabel?: string;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-accent-soft/60 bg-brand-background-light/40 px-4 py-3">
      <span
        dir={ltr ? "ltr" : undefined}
        className="truncate text-brand-primary-dark text-base md:text-lg"
        style={{ fontFamily: "var(--font-discovery)" }}
      >
        {value}
      </span>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-brand-primary/30 px-3 py-1 text-xs text-brand-primary hover:bg-brand-primary hover:text-brand-white transition"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
          </svg>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function CoursesSection({ courses }: { courses: DashboardData["courses"] }) {
  return (
    <section>
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <span aria-hidden className="h-[1px] w-10 bg-brand-primary/40" />
            <p
              className="text-xs tracking-[0.3em] uppercase text-brand-primary/80"
              style={{ fontFamily: "var(--font-discovery)" }}
            >
              הלמידה שלי
            </p>
          </div>
          <h2
            className="mt-3 text-2xl md:text-3xl text-brand-primary-dark"
            style={{ fontFamily: "var(--font-bateran)" }}
          >
            הקורסים שלי
          </h2>
        </div>
        {courses.length > 0 && (
          <span className="text-sm text-brand-primary-dark/60">
            {courses.length} קורסים
          </span>
        )}
      </div>

      {courses.length === 0 ? (
        <EmptyCoursesCard />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c.course_id} course={c} />
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyCoursesCard() {
  return (
    <div
      className="relative overflow-hidden rounded-[28px] border border-brand-accent-soft/60 bg-brand-white/90 backdrop-blur p-10 md:p-14 text-center"
      style={{ boxShadow: "0 30px 60px -40px rgba(82,16,20,0.25)" }}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-40 opacity-50"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, rgba(229,197,177,0.55), transparent 70%)",
        }}
      />
      <div className="relative mx-auto flex flex-col items-center gap-5">
        <div
          className="grid place-items-center w-20 h-20 rounded-full"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,238,218,1), rgba(229,197,177,0.7))",
            border: "1px solid rgba(158,36,43,0.18)",
          }}
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="w-9 h-9 text-brand-primary"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <h3
          className="text-2xl md:text-3xl text-brand-primary-dark"
          style={{ fontFamily: "var(--font-bateran)" }}
        >
          עדיין לא נפתחו עבורך קורסים
        </h3>
        <p className="max-w-md text-brand-primary-dark/70 leading-relaxed">
          לאחר רכישת קורס מעמוד הבית, ההרשאה תיפתח עבורך אוטומטית
          וכל הקורסים שלך יופיעו כאן.
        </p>
        <a
          href="/"
          className="mt-2 inline-flex items-center gap-2 rounded-full bg-brand-primary px-6 py-2.5 text-sm text-brand-white shadow-md hover:bg-brand-primary-dark transition"
        >
          לצפייה בקורסים
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </a>
      </div>
    </div>
  );
}

function CourseCard({ course }: { course: DashboardData["courses"][number] }) {
  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-[24px] border border-brand-accent-soft/60 bg-brand-white/95 transition hover:-translate-y-0.5"
      style={{ boxShadow: "0 25px 50px -35px rgba(82,16,20,0.4)" }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-accent-soft/30">
        {course.cover_url ? (
          <img
            src={course.cover_url}
            alt={course.title}
            className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background:
                "linear-gradient(135deg, rgba(229,197,177,0.6), rgba(255,238,218,1))",
            }}
          />
        )}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-20"
          style={{
            background:
              "linear-gradient(to top, rgba(82,16,20,0.45), transparent)",
          }}
        />
        <span
          className="absolute top-3 right-3 rounded-full bg-brand-white/90 backdrop-blur px-3 py-1 text-[11px] text-brand-primary-dark"
          style={{ fontFamily: "var(--font-discovery)" }}
        >
          {course.total_lessons} שיעורים
        </span>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <h3
          className="text-xl text-brand-primary-dark leading-snug"
          style={{ fontFamily: "var(--font-bateran)" }}
        >
          {course.title}
        </h3>
        {course.description && (
          <p className="mt-2 text-sm text-brand-primary-dark/70 line-clamp-3 leading-relaxed">
            {course.description}
          </p>
        )}

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-brand-primary-dark/70 mb-1.5">
            <span>התקדמות</span>
            <span className="text-brand-primary font-medium">
              {course.progress_pct}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-brand-accent-soft/40 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${course.progress_pct}%`,
                background:
                  "linear-gradient(to left, rgba(158,36,43,1), rgba(82,16,20,1))",
              }}
            />
          </div>
        </div>

        <button
          type="button"
          className="mt-6 inline-flex items-center justify-center gap-2 w-full rounded-full bg-brand-primary px-4 py-2.5 text-brand-white text-sm hover:bg-brand-primary-dark transition shadow-md"
          onClick={() => {
            window.alert("עמוד הקורס יושק בקרוב.");
          }}
        >
          כניסה לקורס
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
      </div>
    </article>
  );
}
