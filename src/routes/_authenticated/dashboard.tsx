import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
      className="min-h-screen bg-brand-background-light px-4 py-10 md:px-12"
      style={{ fontFamily: "var(--font-discovery)" }}
    >
      <div className="mx-auto max-w-5xl">
        <DashboardHeader />

        {isLoading && (
          <p className="mt-10 text-center text-brand-primary-dark/70">
            טוען את האזור האישי…
          </p>
        )}
        {error && (
          <p className="mt-10 text-center text-brand-accent-alert">
            אירעה שגיאה בטעינת הנתונים. נסי לרענן את העמוד.
          </p>
        )}
        {data && (
          <>
            <ProfileCard profile={data.profile} />
            <CoursesSection courses={data.courses} />
          </>
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
    <div className="flex items-center justify-between mb-8">
      <h1
        className="text-3xl md:text-4xl text-brand-primary-dark"
        style={{ fontFamily: "var(--font-bateran)" }}
      >
        האזור האישי שלי
      </h1>
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate({ to: "/" })}
          className="text-sm text-brand-primary-dark/70 hover:text-brand-primary"
        >
          לעמוד הבית
        </button>
        <button
          onClick={handleSignOut}
          className="rounded-lg border border-brand-primary px-4 py-1.5 text-sm text-brand-primary hover:bg-brand-primary hover:text-brand-white transition"
        >
          התנתקות
        </button>
      </div>
    </div>
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

  // Resolve signed URL for the private avatar
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
      setMsg("השם עודכן.");
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

  return (
    <section className="rounded-2xl bg-brand-white border border-brand-accent-soft/40 p-6 md:p-8 shadow-sm">
      <h2
        className="text-xl md:text-2xl text-brand-primary-dark mb-6"
        style={{ fontFamily: "var(--font-bateran)" }}
      >
        פרטי משתמש
      </h2>

      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div className="flex flex-col items-center gap-3">
          <div className="w-28 h-28 rounded-full bg-brand-accent-soft/30 overflow-hidden flex items-center justify-center border-2 border-brand-accent-soft">
            {avatarUrl ? (
              <img src={avatarUrl} alt="תמונת פרופיל" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl text-brand-primary-dark/40">
                {(profile.full_name || profile.email || "?").slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-sm text-brand-primary hover:text-brand-primary-dark underline-offset-4 hover:underline disabled:opacity-50"
          >
            {uploading ? "מעלה…" : avatarUrl ? "החלפת תמונה" : "העלאת תמונה"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        <div className="flex-1 w-full space-y-4">
          <div>
            <label className="block text-sm text-brand-primary-dark/70 mb-1">
              שם מלא
            </label>
            {editing ? (
              <div className="flex gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 rounded-lg border border-brand-accent-soft bg-brand-white px-3 py-2 text-brand-primary-dark outline-none focus:border-brand-primary"
                />
                <button
                  onClick={() => nameMutation.mutate(name)}
                  disabled={nameMutation.isPending}
                  className="rounded-lg bg-brand-primary px-4 py-2 text-sm text-brand-white hover:bg-brand-primary-dark disabled:opacity-60"
                >
                  שמירה
                </button>
                <button
                  onClick={() => {
                    setName(profile.full_name ?? "");
                    setEditing(false);
                    setErr(null);
                  }}
                  className="rounded-lg border border-brand-accent-soft px-3 py-2 text-sm text-brand-primary-dark"
                >
                  ביטול
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <span className="text-brand-primary-dark">
                  {profile.full_name || "—"}
                </span>
                <button
                  onClick={() => setEditing(true)}
                  className="text-sm text-brand-primary hover:text-brand-primary-dark underline-offset-4 hover:underline"
                >
                  עריכה
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-brand-primary-dark/70 mb-1">
              אימייל
            </label>
            <span dir="ltr" className="block text-brand-primary-dark">
              {profile.email || "—"}
            </span>
          </div>

          {msg && <p className="text-sm text-brand-primary">{msg}</p>}
          {err && <p className="text-sm text-brand-accent-alert">{err}</p>}
        </div>
      </div>
    </section>
  );
}

function CoursesSection({ courses }: { courses: DashboardData["courses"] }) {
  return (
    <section className="mt-10">
      <h2
        className="text-xl md:text-2xl text-brand-primary-dark mb-4"
        style={{ fontFamily: "var(--font-bateran)" }}
      >
        הקורסים שלי
      </h2>

      {courses.length === 0 ? (
        <div className="rounded-2xl bg-brand-white border border-brand-accent-soft/40 p-8 text-center text-brand-primary-dark/80">
          עדיין לא נפתחו עבורך קורסים.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c.course_id} course={c} />
          ))}
        </div>
      )}
    </section>
  );
}

function CourseCard({ course }: { course: DashboardData["courses"][number] }) {
  return (
    <article className="rounded-2xl bg-brand-white border border-brand-accent-soft/40 overflow-hidden flex flex-col shadow-sm">
      <div className="aspect-[4/3] bg-brand-accent-soft/30">
        {course.cover_url ? (
          <img
            src={course.cover_url}
            alt={course.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : null}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3
          className="text-lg text-brand-primary-dark"
          style={{ fontFamily: "var(--font-bateran)" }}
        >
          {course.title}
        </h3>
        {course.description && (
          <p className="mt-2 text-sm text-brand-primary-dark/75 line-clamp-3">
            {course.description}
          </p>
        )}

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-brand-primary-dark/70 mb-1">
            <span>התקדמות</span>
            <span>{course.progress_pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-brand-accent-soft/40 overflow-hidden">
            <div
              className="h-full bg-brand-primary transition-all"
              style={{ width: `${course.progress_pct}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          className="mt-5 w-full rounded-lg bg-brand-primary px-4 py-2 text-brand-white text-sm hover:bg-brand-primary-dark transition"
          // The course player route is built in a later phase.
          onClick={() => {
            window.alert("עמוד הקורס יושק בקרוב.");
          }}
        >
          כניסה לקורס
        </button>
      </div>
    </article>
  );
}
