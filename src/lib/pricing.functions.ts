import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PricingRow = {
  key: string;
  label: string;
  value: string;
  value_type: "number" | "text";
};

export type HomepagePricing = {
  butterfly_course_price: string;
  shaggy_bob_course_price: string;
  lob_chic_course_price: string;
  bundle_price_text: string;
};

const DEFAULTS: HomepagePricing = {
  butterfly_course_price: "580",
  shaggy_bob_course_price: "580",
  lob_chic_course_price: "580",
  bundle_price_text: "1,500 ₪ במקום 1,740 ₪",
};

export const getHomepagePricing = createServerFn({ method: "GET" }).handler(
  async (): Promise<HomepagePricing> => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await supabase
      .from("homepage_pricing")
      .select("key, value");
    if (error) return DEFAULTS;
    const map: Record<string, string> = {};
    for (const r of data ?? []) map[r.key] = r.value;
    return {
      butterfly_course_price: map.butterfly_course_price ?? DEFAULTS.butterfly_course_price,
      shaggy_bob_course_price: map.shaggy_bob_course_price ?? DEFAULTS.shaggy_bob_course_price,
      lob_chic_course_price: map.lob_chic_course_price ?? DEFAULTS.lob_chic_course_price,
      bundle_price_text: map.bundle_price_text ?? DEFAULTS.bundle_price_text,
    };
  },
);

export const listAdminHomepagePricing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PricingRow[]> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("homepage_pricing")
      .select("key, label, value, value_type")
      .order("key", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as PricingRow[];
  });

const updateInput = z.object({
  items: z
    .array(
      z.object({
        key: z.string().min(1).max(80),
        value: z.string().trim().min(1).max(200),
      }),
    )
    .min(1)
    .max(20),
});

export const updateHomepagePricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    // Validate numeric fields against stored value_type
    const { data: rows, error: readErr } = await context.supabase
      .from("homepage_pricing")
      .select("key, value_type");
    if (readErr) throw new Error(readErr.message);
    const typeMap = new Map<string, string>();
    for (const r of rows ?? []) typeMap.set(r.key, r.value_type);

    for (const it of data.items) {
      const t = typeMap.get(it.key);
      if (!t) throw new Error(`מפתח לא מוכר: ${it.key}`);
      if (t === "number" && !/^\d+(\.\d+)?$/.test(it.value)) {
        throw new Error("מחיר קורס חייב להיות מספר חיובי");
      }
    }

    for (const it of data.items) {
      const { error } = await context.supabase
        .from("homepage_pricing")
        .update({ value: it.value })
        .eq("key", it.key);
      if (error) throw new Error(error.message);
    }
    return { ok: true as const };
  });
