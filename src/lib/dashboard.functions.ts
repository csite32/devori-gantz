import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DashboardCourse = {
  course_id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  total_lessons: number;
  completed_lessons: number;
  progress_pct: number; // 0..100
};

export type DashboardData = {
  profile: {
    id: string;
    full_name: string | null;
    avatar_path: string | null;
    email: string | null;
  };
  courses: DashboardCourse[];
  is_admin: boolean;
};

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DashboardData> => {
    const { supabase, userId, claims } = context;

    // Profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    // Courses the user has access to (RLS on course_access scopes to user)
    const { data: access, error: accessErr } = await supabase
      .from("course_access")
      .select("course_id, courses:course_id(id, slug, title, description, cover_url, sort_order)")
      .eq("user_id", userId);
    if (accessErr) throw new Error(accessErr.message);

    const courseRows = (access ?? [])
      .map((row) => row.courses)
      .filter((c): c is NonNullable<typeof c> => Boolean(c));

    const courseIds = courseRows.map((c) => c.id);

    // Lesson counts per course
    const lessonByCourse: Record<string, string[]> = {};
    if (courseIds.length > 0) {
      const { data: lessons, error: lessonsErr } = await supabase
        .from("lessons")
        .select("id, course_id")
        .in("course_id", courseIds);
      if (lessonsErr) throw new Error(lessonsErr.message);
      for (const l of lessons ?? []) {
        (lessonByCourse[l.course_id] ??= []).push(l.id);
      }
    }

    // Completed lessons for the user
    const allLessonIds = Object.values(lessonByCourse).flat();
    const completedByCourse: Record<string, number> = {};
    if (allLessonIds.length > 0) {
      const { data: prog, error: progErr } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .in("lesson_id", allLessonIds);
      if (progErr) throw new Error(progErr.message);
      const completedSet = new Set((prog ?? []).map((p) => p.lesson_id));
      for (const [courseId, ids] of Object.entries(lessonByCourse)) {
        completedByCourse[courseId] = ids.filter((id) => completedSet.has(id)).length;
      }
    }

    // Sign cover storage paths for display in the dashboard.
    // course-covers is a private bucket — we need a short-lived signed URL.
    let signCover: (path: string | null) => Promise<string | null> = async () =>
      null;
    if (courseRows.some((c) => c.cover_url && !/^https?:\/\//i.test(c.cover_url))) {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      signCover = async (path) => {
        if (!path) return null;
        if (/^https?:\/\//i.test(path)) return path;
        const { data } = await supabaseAdmin.storage
          .from("course-covers")
          .createSignedUrl(path, 60 * 60);
        return data?.signedUrl ?? null;
      };
    } else {
      signCover = async (path) => (path && /^https?:\/\//i.test(path) ? path : null);
    }

    const courses: DashboardCourse[] = await Promise.all(
      courseRows
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map(async (c) => {
          const total = lessonByCourse[c.id]?.length ?? 0;
          const completed = completedByCourse[c.id] ?? 0;
          const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
          return {
            course_id: c.id,
            slug: c.slug,
            title: c.title,
            description: c.description,
            cover_url: await signCover(c.cover_url),
            total_lessons: total,
            completed_lessons: completed,
            progress_pct: pct,
          };
        }),
    );

    const email =
      (claims as { email?: string } | null)?.email ?? null;

    const { data: adminRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    return {
      profile: {
        id: userId,
        full_name: profile?.full_name ?? null,
        avatar_path: profile?.avatar_url ?? null,
        email,
      },
      courses,
      is_admin: !!adminRow,
    };
  });

export const updateProfileName = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const d = data as { full_name?: unknown };
    const name = typeof d?.full_name === "string" ? d.full_name.trim() : "";
    if (name.length < 1 || name.length > 120) {
      throw new Error("שם לא תקין");
    }
    return { full_name: name };
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .upsert(
        { id: context.userId, full_name: data.full_name },
        { onConflict: "id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true, full_name: data.full_name };
  });

export const updateAvatarPath = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const d = data as { path?: unknown };
    const path = typeof d?.path === "string" ? d.path : "";
    if (!path) throw new Error("נתיב חסר");
    return { path };
  })
  .handler(async ({ data, context }) => {
    // Defensive: ensure the path lives under the caller's folder.
    if (!data.path.startsWith(`${context.userId}/`)) {
      throw new Error("Forbidden");
    }
    const { error } = await context.supabase
      .from("profiles")
      .upsert(
        { id: context.userId, avatar_url: data.path },
        { onConflict: "id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true, path: data.path };
  });
