import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type UIOverride = {
  editor_id: string;
  section: string | null;
  styles: Record<string, string>;
  text_content: string | null;
};

// PUBLIC read — used by every visitor to apply saved overrides.
export const getAllOverrides = createServerFn({ method: "GET" }).handler(
  async (): Promise<UIOverride[]> => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          storage: undefined,
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
    const { data, error } = await supabase
      .from("ui_overrides")
      .select("editor_id, section, styles, text_content");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      editor_id: r.editor_id,
      section: r.section,
      styles: (r.styles ?? {}) as Record<string, string>,
      text_content: r.text_content,
    }));
  },
);

async function assertAdmin(context: {
  supabase: ReturnType<typeof createClient<Database>>;
  userId: string;
}) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Forbidden");
}

export const upsertOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const d = data as {
      editor_id?: unknown;
      section?: unknown;
      styles?: unknown;
      text_content?: unknown;
    };
    const editor_id = typeof d.editor_id === "string" ? d.editor_id.trim() : "";
    if (!editor_id) throw new Error("editor_id missing");
    const section =
      typeof d.section === "string" && d.section.length ? d.section : null;
    const styles =
      d.styles && typeof d.styles === "object"
        ? (d.styles as Record<string, string>)
        : {};
    const text_content =
      typeof d.text_content === "string" ? d.text_content : null;
    return { editor_id, section, styles, text_content };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("ui_overrides").upsert(
      {
        editor_id: data.editor_id,
        section: data.section,
        styles: data.styles,
        text_content: data.text_content,
        updated_by: context.userId,
      },
      { onConflict: "editor_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const d = data as { editor_id?: unknown };
    const editor_id = typeof d.editor_id === "string" ? d.editor_id.trim() : "";
    if (!editor_id) throw new Error("editor_id missing");
    return { editor_id };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("ui_overrides")
      .delete()
      .eq("editor_id", data.editor_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAllOverrides = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("ui_overrides")
      .delete()
      .not("editor_id", "is", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { is_admin: !!data };
  });
