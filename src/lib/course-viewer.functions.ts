import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ViewerLesson = {
  id: string;
  title: string;
  description: string | null;
  vimeo_url: string | null;
  sort_order: number;
  completed: boolean;
};

export type ViewerCourse = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null; // signed URL (https) or null
  lessons: ViewerLesson[];
  is_admin: boolean;
};

export type ViewerResult =
  | { status: "ok"; course: ViewerCourse }
  | { status: "forbidden" }
  | { status: "not_found" };

/**
 * Fetch a course + its lessons for the viewer. Enforces access:
 *  - admin can view any course (for QA)
 *  - otherwise the user must have a row in course_access
 */
export const getCourseForViewer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ slug: z.string().trim().min(1).max(160) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<ViewerResult> => {
    const { supabase, userId } = context;

    const { data: adminRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = !!adminRow;

    // Try to load via the user's own supabase client first (respects RLS).
    // If RLS hides the course (not published / no access), fall back to admin
    // client only when the caller IS an admin.
    let course = await supabase
      .from("courses")
      .select("id, slug, title, description, cover_url")
      .eq("slug", data.slug)
      .maybeSingle()
      .then((r) => r.data);

    if (!course && isAdmin) {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const { data: c } = await supabaseAdmin
        .from("courses")
        .select("id, slug, title, description, cover_url")
        .eq("slug", data.slug)
        .maybeSingle();
      course = c ?? null;
    }

    if (!course) return { status: "not_found" };

    // Access check (admins skip).
    if (!isAdmin) {
      const { data: access } = await supabase
        .from("course_access")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", course.id)
        .maybeSingle();
      if (!access) return { status: "forbidden" };
    }

    // Lessons. Use admin client for admins so unpublished/empty access still works.
    const lessonsClient = isAdmin
      ? (await import("@/integrations/supabase/client.server")).supabaseAdmin
      : supabase;
    const { data: lessons } = await lessonsClient
      .from("lessons")
      .select("id, title, description, vimeo_url, sort_order")
      .eq("course_id", course.id)
      .order("sort_order", { ascending: true });

    const lessonIds = (lessons ?? []).map((l) => l.id);
    let completedSet = new Set<string>();
    if (lessonIds.length > 0) {
      const { data: prog } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .in("lesson_id", lessonIds);
      completedSet = new Set((prog ?? []).map((p) => p.lesson_id));
    }

    // Sign cover URL if it looks like a storage path.
    let signedCover: string | null = null;
    if (course.cover_url) {
      if (/^https?:\/\//i.test(course.cover_url)) {
        signedCover = course.cover_url;
      } else {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { data: signed } = await supabaseAdmin.storage
          .from("course-covers")
          .createSignedUrl(course.cover_url, 60 * 60);
        signedCover = signed?.signedUrl ?? null;
      }
    }

    return {
      status: "ok",
      course: {
        id: course.id,
        slug: course.slug,
        title: course.title,
        description: course.description,
        cover_url: signedCover,
        is_admin: isAdmin,
        lessons: (lessons ?? []).map((l) => ({
          ...l,
          completed: completedSet.has(l.id),
        })),
      },
    };
  });

/**
 * Toggle completion for a lesson the caller has access to.
 * RLS on lesson_progress already scopes writes to auth.uid(), and the
 * access check here avoids letting users mark progress on courses they
 * have no access to.
 */
export const toggleLessonProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        lesson_id: z.string().uuid(),
        completed: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Load lesson → course_id, then check access (admin bypass).
    const { data: lesson, error: lessonErr } = await supabase
      .from("lessons")
      .select("id, course_id")
      .eq("id", data.lesson_id)
      .maybeSingle();
    if (lessonErr) throw new Error(lessonErr.message);
    if (!lesson) throw new Error("Lesson not found");

    const { data: adminRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRow) {
      const { data: access } = await supabase
        .from("course_access")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", lesson.course_id)
        .maybeSingle();
      if (!access) throw new Error("Forbidden");
    }

    if (data.completed) {
      const { error } = await supabase
        .from("lesson_progress")
        .upsert(
          { lesson_id: data.lesson_id, user_id: userId },
          { onConflict: "lesson_id,user_id" },
        );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("lesson_progress")
        .delete()
        .eq("lesson_id", data.lesson_id)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
    }
    return { ok: true, completed: data.completed };
  });
