import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BrandLogoBar } from "@/components/brand/BrandLogoBar";
import {
  getCourseForViewer,
  toggleLessonProgress,
  type ViewerLesson,
  type ViewerResult,
} from "@/lib/course-viewer.functions";

export const Route = createFileRoute("/_authenticated/courses/$slug")({
  head: () => ({
    meta: [
      { title: "צפייה בקורס | דבורי גנץ" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: CourseViewerPage,
});

function CourseViewerPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const fetchCourse = useServerFn(getCourseForViewer);
  const { data, isLoading, error } = useQuery<ViewerResult>({
    queryKey: ["viewer-course", slug],
    queryFn: () => fetchCourse({ data: { slug } }),
  });

  // On forbidden / not_found redirect to the dashboard with a hint.
  useEffect(() => {
    if (!data) return;
    if (data.status === "forbidden") {
      navigate({
        to: "/dashboard",
        search: { msg: "no-access" } as never,
        replace: true,
      });
    } else if (data.status === "not_found") {
      navigate({
        to: "/dashboard",
        search: { msg: "not-found" } as never,
        replace: true,
      });
    }
  }, [data, navigate]);

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

      <BrandLogoBar variant="transparent" />

      <div className="relative mx-auto max-w-6xl px-4 py-8 md:px-12 md:py-12">
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-base md:text-lg text-brand-primary hover:text-brand-primary-dark transition"
          >
            <span>חזרה לאזור האישי</span>
            <span aria-hidden>←</span>
          </Link>
        </div>

        {isLoading && (
          <p className="text-center text-brand-primary-dark/70 mt-16">
            טוען את הקורס…
          </p>
        )}
        {error && (
          <p className="text-center text-brand-accent-alert mt-16">
            אירעה שגיאה בטעינת הקורס.
          </p>
        )}

        {data && data.status === "ok" && (
          <CourseView course={data.course} slug={slug} />
        )}
      </div>
    </main>
  );
}

function CourseView({
  course,
  slug,
}: {
  course: Extract<ViewerResult, { status: "ok" }>["course"];
  slug: string;
}) {
  const lessons = course.lessons;
  const [activeId, setActiveId] = useState<string | null>(
    lessons[0]?.id ?? null,
  );
  useEffect(() => {
    if (!activeId && lessons[0]) setActiveId(lessons[0].id);
  }, [lessons, activeId]);
  const active = useMemo(
    () => lessons.find((l) => l.id === activeId) ?? lessons[0] ?? null,
    [lessons, activeId],
  );

  return (
    <article className="space-y-8">
      <header
        className="relative overflow-hidden rounded-[28px] border border-brand-accent-soft/60 bg-brand-white/90 backdrop-blur p-6 md:p-10"
        style={{ boxShadow: "0 30px 60px -40px rgba(82,16,20,0.35)" }}
      >
        <div className="grid gap-6 md:grid-cols-[1fr_auto] items-center">
          <div>
            {course.is_admin && (
              <span className="inline-block mb-3 rounded-full bg-brand-primary/10 text-brand-primary text-sm px-3 py-1">
                תצוגת מנהל
              </span>
            )}
            <h1
              className="text-3xl md:text-5xl text-brand-primary-dark leading-tight"
              style={{ fontFamily: "var(--font-bateran)" }}
            >
              {course.title}
            </h1>
            {course.description && (
              <p className="mt-4 text-brand-primary-dark/80 leading-relaxed text-base md:text-lg whitespace-pre-line">
                {course.description}
              </p>
            )}
          </div>
          {course.cover_url && (
            <div className="w-full md:w-56 aspect-[4/3] rounded-2xl overflow-hidden border border-brand-accent-soft/60">
              <img
                src={course.cover_url}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </header>

      {lessons.length === 0 ? (
        <div
          className="rounded-[24px] border border-brand-accent-soft/60 bg-brand-white/90 p-10 text-center"
          style={{ boxShadow: "0 25px 50px -35px rgba(82,16,20,0.3)" }}
        >
          <p
            className="text-xl md:text-2xl text-brand-primary-dark"
            style={{ fontFamily: "var(--font-bateran)" }}
          >
            עדיין לא נוספו שיעורים לקורס זה.
          </p>
        </div>
      ) : lessons.length === 1 && active ? (
        <LessonPanel lesson={active} courseSlug={slug} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr] items-start">
          <LessonList
            lessons={lessons}
            activeId={active?.id ?? null}
            onSelect={(id) => setActiveId(id)}
          />
          {active && <LessonPanel lesson={active} courseSlug={slug} />}
        </div>
      )}
    </article>
  );
}

function LessonList({
  lessons,
  activeId,
  onSelect,
}: {
  lessons: ViewerLesson[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <aside
      className="rounded-[24px] border border-brand-accent-soft/60 bg-brand-white/90 backdrop-blur p-4"
      style={{ boxShadow: "0 25px 50px -35px rgba(82,16,20,0.3)" }}
    >
      <p
        className="px-3 pb-2 pt-1 text-sm tracking-[0.3em] uppercase text-brand-primary/80"
        style={{ fontFamily: "var(--font-discovery)" }}
      >
        שיעורי הקורס
      </p>
      <ol className="space-y-1.5">
        {lessons.map((l, idx) => {
          const isActive = l.id === activeId;
          return (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => onSelect(l.id)}
                className={
                  "w-full text-right rounded-xl px-3 py-3 flex items-center gap-3 transition " +
                  (isActive
                    ? "bg-brand-primary text-brand-white"
                    : "hover:bg-brand-background-light text-brand-primary-dark")
                }
              >
                <span
                  className={
                    "shrink-0 w-7 h-7 rounded-full grid place-items-center text-sm " +
                    (isActive
                      ? "bg-brand-white/20 text-brand-white"
                      : "bg-brand-accent-soft/40 text-brand-primary-dark")
                  }
                >
                  {idx + 1}
                </span>
                <span className="flex-1 truncate text-base md:text-lg">
                  {l.title}
                </span>
                {l.completed && (
                  <span
                    aria-label="הושלם"
                    className={
                      "shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full " +
                      (isActive
                        ? "bg-brand-white text-brand-primary"
                        : "bg-brand-primary text-brand-white")
                    }
                  >
                    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

function LessonPanel({
  lesson,
  courseSlug,
}: {
  lesson: ViewerLesson;
  courseSlug: string;
}) {
  const qc = useQueryClient();
  const toggle = useServerFn(toggleLessonProgress);
  const mutation = useMutation({
    mutationFn: (next: boolean) =>
      toggle({ data: { lesson_id: lesson.id, completed: next } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["viewer-course", courseSlug] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const embedUrl = toVimeoEmbed(lesson.vimeo_url);

  return (
    <section
      className="rounded-[24px] border border-brand-accent-soft/60 bg-brand-white/95 overflow-hidden"
      style={{ boxShadow: "0 30px 60px -40px rgba(82,16,20,0.35)" }}
    >
      <div className="bg-brand-primary-dark">
        {embedUrl ? (
          <div className="relative w-full aspect-video">
            <iframe
              src={embedUrl}
              title={lesson.title}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="w-full aspect-video grid place-items-center text-brand-white/80 text-lg">
            לא צורף לשיעור זה סרטון.
          </div>
        )}
      </div>
      <div className="p-6 md:p-8">
        <h2
          className="text-2xl md:text-3xl text-brand-primary-dark"
          style={{ fontFamily: "var(--font-bateran)" }}
        >
          {lesson.title}
        </h2>
        {lesson.description && (
          <p className="mt-3 text-brand-primary-dark/80 leading-relaxed text-base md:text-lg whitespace-pre-line">
            {lesson.description}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {lesson.completed ? (
            <button
              type="button"
              onClick={() => mutation.mutate(false)}
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 rounded-full border border-brand-primary/40 px-5 py-2.5 text-base text-brand-primary hover:bg-brand-primary hover:text-brand-white transition disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              הושלם · לחצי לביטול
            </button>
          ) : (
            <button
              type="button"
              onClick={() => mutation.mutate(true)}
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-2.5 text-base text-brand-white shadow-md hover:bg-brand-primary-dark transition disabled:opacity-60"
            >
              {mutation.isPending ? "שומר…" : "סמני כהושלם"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/** Build a Vimeo embed URL from any common Vimeo URL form. */
function toVimeoEmbed(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.includes("player.vimeo.com/video/")) return trimmed;
  const m = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([\w\d]+))?/);
  if (!m) return null;
  const id = m[1];
  const hash = m[2];
  return hash
    ? `https://player.vimeo.com/video/${id}?h=${hash}`
    : `https://player.vimeo.com/video/${id}`;
}
