import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Admin-only server functions. EVERY handler verifies that the caller has
 * the `admin` role via has_role(). RLS on the underlying tables already
 * enforces this — these guards just produce clearer 403s and avoid leaking
 * RLS errors to the UI.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error("Failed to verify role");
  if (!data) throw new Error("Forbidden");
}

// ──────────────────────────────────────────────────────────────
// Role / identity
// ──────────────────────────────────────────────────────────────

export const requireAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    return { ok: true as const, userId: context.userId };
  });

// ──────────────────────────────────────────────────────────────
// Courses
// ──────────────────────────────────────────────────────────────

export type AdminCourseRow = {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  sort_order: number;
  updated_at: string;
  lessons_count: number;
};

export const listAdminCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminCourseRow[]> => {
    await assertAdmin(context);
    const { data: courses, error } = await context.supabase
      .from("courses")
      .select("id, title, slug, is_published, sort_order, updated_at")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    const ids = (courses ?? []).map((c) => c.id);
    const counts = new Map<string, number>();
    if (ids.length) {
      const { data: lessons } = await context.supabase
        .from("lessons")
        .select("course_id")
        .in("course_id", ids);
      for (const l of lessons ?? [])
        counts.set(l.course_id, (counts.get(l.course_id) ?? 0) + 1);
    }
    return (courses ?? []).map((c) => ({
      ...c,
      lessons_count: counts.get(c.id) ?? 0,
    }));
  });

export type AdminCourseDetail = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  is_published: boolean;
  sort_order: number;
  updated_at: string;
  lessons: {
    id: string;
    title: string;
    description: string | null;
    vimeo_url: string | null;
    sort_order: number;
  }[];
};

export const getAdminCourse = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<AdminCourseDetail> => {
    await assertAdmin(context);
    const { data: course, error } = await context.supabase
      .from("courses")
      .select("id, title, slug, description, cover_url, is_published, sort_order, updated_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!course) throw new Error("Course not found");
    const { data: lessons } = await context.supabase
      .from("lessons")
      .select("id, title, description, vimeo_url, sort_order")
      .eq("course_id", data.id)
      .order("sort_order", { ascending: true });
    return { ...course, lessons: lessons ?? [] };
  });


const courseInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/i, "slug חייב להכיל אותיות אנגליות, ספרות ומקפים בלבד"),
  description: z.string().trim().max(5000).nullable().optional(),
  cover_url: z.string().trim().max(500).nullable().optional(),
  is_published: z.boolean(),
  sort_order: z.number().int().min(0).max(9999),
});

export const upsertCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => courseInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("courses")
        .update({
          title: data.title,
          slug: data.slug,
          description: data.description ?? null,
          cover_url: data.cover_url ?? null,
          is_published: data.is_published,
          sort_order: data.sort_order,
        })
        .eq("id", data.id)
        .select("id")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return { id: row?.id ?? data.id };
    }
    const { data: row, error } = await context.supabase
      .from("courses")
      .insert({
        title: data.title,
        slug: data.slug,
        description: data.description ?? null,
        cover_url: data.cover_url ?? null,
        is_published: data.is_published,
        sort_order: data.sort_order,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    // Block if there are lessons or access rows.
    const [{ count: lessons }, { count: access }] = await Promise.all([
      context.supabase
        .from("lessons")
        .select("id", { count: "exact", head: true })
        .eq("course_id", data.id),
      context.supabase
        .from("course_access")
        .select("id", { count: "exact", head: true })
        .eq("course_id", data.id),
    ]);
    if ((lessons ?? 0) > 0)
      throw new Error("לא ניתן למחוק קורס שיש בו שיעורים");
    if ((access ?? 0) > 0)
      throw new Error("לא ניתן למחוק קורס שיש לו הרשאות פתוחות");
    const { error } = await context.supabase
      .from("courses")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getCoverSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ path: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: signed, error } = await context.supabase.storage
      .from("course-covers")
      .createSignedUrl(data.path, 60 * 60);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

// ──────────────────────────────────────────────────────────────
// Lessons
// ──────────────────────────────────────────────────────────────

const lessonInput = z.object({
  id: z.string().uuid().optional(),
  course_id: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).nullable().optional(),
  vimeo_url: z.string().trim().max(500).nullable().optional(),
  sort_order: z.number().int().min(0).max(9999),
});

export const upsertLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => lessonInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.id) {
      const { error } = await context.supabase
        .from("lessons")
        .update({
          title: data.title,
          description: data.description ?? null,
          vimeo_url: data.vimeo_url ?? null,
          sort_order: data.sort_order,
        })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("lessons")
      .insert({
        course_id: data.course_id,
        title: data.title,
        description: data.description ?? null,
        vimeo_url: data.vimeo_url ?? null,
        sort_order: data.sort_order,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const getAdminLesson = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: lesson, error } = await context.supabase
      .from("lessons")
      .select("id, course_id, title, description, vimeo_url, sort_order")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!lesson) throw new Error("Lesson not found");
    return lesson;
  });

export const deleteLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("lessons")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────
// Bundles
// ──────────────────────────────────────────────────────────────

export type AdminBundleRow = {
  id: string;
  title: string;
  slug: string;
  courses_count: number;
};

export const listAdminBundles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminBundleRow[]> => {
    await assertAdmin(context);
    const { data: bundles, error } = await context.supabase
      .from("bundles")
      .select("id, title, slug")
      .order("title", { ascending: true });
    if (error) throw new Error(error.message);
    const ids = (bundles ?? []).map((b) => b.id);
    const counts = new Map<string, number>();
    if (ids.length) {
      const { data: bc } = await context.supabase
        .from("bundle_courses")
        .select("bundle_id")
        .in("bundle_id", ids);
      for (const r of bc ?? [])
        counts.set(r.bundle_id, (counts.get(r.bundle_id) ?? 0) + 1);
    }
    return (bundles ?? []).map((b) => ({
      ...b,
      courses_count: counts.get(b.id) ?? 0,
    }));
  });

export const getAdminBundle = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: bundle, error } = await context.supabase
      .from("bundles")
      .select("id, title, slug, description")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!bundle) throw new Error("Bundle not found");
    const { data: bc } = await context.supabase
      .from("bundle_courses")
      .select("course_id")
      .eq("bundle_id", data.id);
    const { data: allCourses } = await context.supabase
      .from("courses")
      .select("id, title, slug, is_published")
      .order("sort_order", { ascending: true });
    return {
      ...bundle,
      course_ids: (bc ?? []).map((r) => r.course_id),
      all_courses: allCourses ?? [],
    };
  });

const bundleInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/i),
  description: z.string().trim().max(5000).nullable().optional(),
});

export const upsertBundle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => bundleInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.id) {
      const { error } = await context.supabase
        .from("bundles")
        .update({
          title: data.title,
          slug: data.slug,
          description: data.description ?? null,
        })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("bundles")
      .insert({
        title: data.title,
        slug: data.slug,
        description: data.description ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteBundle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await context.supabase
      .from("bundle_courses")
      .delete()
      .eq("bundle_id", data.id);
    const { error } = await context.supabase
      .from("bundles")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setBundleCourses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        bundle_id: z.string().uuid(),
        course_ids: z.array(z.string().uuid()),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await context.supabase
      .from("bundle_courses")
      .delete()
      .eq("bundle_id", data.bundle_id);
    if (data.course_ids.length > 0) {
      const rows = data.course_ids.map((cid) => ({
        bundle_id: data.bundle_id,
        course_id: cid,
      }));
      const { error } = await context.supabase
        .from("bundle_courses")
        .insert(rows);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────
// Users / access / roles
// ──────────────────────────────────────────────────────────────

export const listAdminUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ search: z.string().max(120).optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { listAuthUsersWithProfiles } = await import("./admin.server");
    return listAuthUsersWithProfiles(data.search ?? "");
  });

export type AdminUserDetail = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  is_admin: boolean;
  access: {
    id: string;
    course_id: string;
    course_title: string;
    source: "purchase" | "manual" | "bundle";
    granted_at: string;
  }[];
  all_courses: { id: string; title: string }[];
  all_bundles: { id: string; title: string }[];
};

export const getAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ user_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }): Promise<AdminUserDetail> => {
    await assertAdmin(context);
    const { getAuthUserEmail } = await import("./admin.server");
    const [profile, role, access, courses, bundles, email] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("full_name")
        .eq("id", data.user_id)
        .maybeSingle(),
      context.supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user_id)
        .eq("role", "admin")
        .maybeSingle(),
      context.supabase
        .from("course_access")
        .select(
          "id, course_id, source, granted_at, courses:course_id(title)",
        )
        .eq("user_id", data.user_id),
      context.supabase
        .from("courses")
        .select("id, title")
        .order("sort_order", { ascending: true }),
      context.supabase
        .from("bundles")
        .select("id, title")
        .order("title", { ascending: true }),
      getAuthUserEmail(data.user_id),
    ]);
    return {
      user_id: data.user_id,
      email,
      full_name: profile.data?.full_name ?? null,
      is_admin: !!role.data,
      access: (access.data ?? []).map((a) => ({
        id: a.id,
        course_id: a.course_id,
        course_title:
          (a.courses as { title?: string } | null)?.title ?? "—",
        source: a.source,
        granted_at: a.granted_at,
      })),
      all_courses: courses.data ?? [],
      all_bundles: bundles.data ?? [],
    };
  });

export const grantCourseAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        course_id: z.string().uuid(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    // Prevent duplicate manual grant if any access already exists.
    const { data: existing } = await context.supabase
      .from("course_access")
      .select("id")
      .eq("user_id", data.user_id)
      .eq("course_id", data.course_id)
      .maybeSingle();
    if (existing) return { ok: true, already: true };
    const { error } = await context.supabase.from("course_access").insert({
      user_id: data.user_id,
      course_id: data.course_id,
      source: "manual",
      granted_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const revokeCourseAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ access_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    // Only allow removing manual grants (don't touch purchase/bundle).
    const { data: row } = await context.supabase
      .from("course_access")
      .select("source")
      .eq("id", data.access_id)
      .maybeSingle();
    if (!row) throw new Error("הרשאה לא נמצאה");
    if (row.source !== "manual")
      throw new Error("ניתן להסיר רק הרשאות שניתנו ידנית");
    const { error } = await context.supabase
      .from("course_access")
      .delete()
      .eq("id", data.access_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const grantBundleAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        bundle_id: z.string().uuid(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: bc, error } = await context.supabase
      .from("bundle_courses")
      .select("course_id")
      .eq("bundle_id", data.bundle_id);
    if (error) throw new Error(error.message);
    if (!bc || bc.length === 0) throw new Error("בחבילה אין קורסים");
    const { data: existing } = await context.supabase
      .from("course_access")
      .select("course_id")
      .eq("user_id", data.user_id)
      .in(
        "course_id",
        bc.map((r) => r.course_id),
      );
    const have = new Set((existing ?? []).map((e) => e.course_id));
    const rows = bc
      .filter((r) => !have.has(r.course_id))
      .map((r) => ({
        user_id: data.user_id,
        course_id: r.course_id,
        source: "bundle" as const,
        granted_by: context.userId,
      }));
    if (rows.length > 0) {
      const { error: insErr } = await context.supabase
        .from("course_access")
        .insert(rows);
      if (insErr) throw new Error(insErr.message);
    }
    return { ok: true, added: rows.length };
  });

export const setUserAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        is_admin: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.user_id === context.userId && !data.is_admin) {
      throw new Error("לא ניתן להסיר לעצמך את הרשאת המנהל");
    }
    if (data.is_admin) {
      const { data: existing } = await context.supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", data.user_id)
        .eq("role", "admin")
        .maybeSingle();
      if (existing) return { ok: true };
      const { error } = await context.supabase.from("user_roles").insert({
        user_id: data.user_id,
        role: "admin",
      });
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await context.supabase
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id)
      .eq("role", "admin");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
