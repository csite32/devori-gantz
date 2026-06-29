import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  FormField,
  GhostButton,
  PrimaryButton,
  inputClass,
} from "@/components/admin/ui";
import { getCoverSignedUrl, upsertCourse } from "@/lib/admin.functions";
import { slugify } from "@/lib/slug";

export type CourseFormValues = {
  id?: string;
  title: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  is_published: boolean;
  sort_order: number;
};

export function CourseForm({
  initial,
  onSaved,
}: {
  initial: CourseFormValues;
  onSaved: (id: string) => void;
}) {
  const qc = useQueryClient();
  const save = useServerFn(upsertCourse);
  const signUrl = useServerFn(getCoverSignedUrl);

  const [v, setV] = useState<CourseFormValues>(initial);
  // Track whether the admin edited the slug manually. If not, auto-derive
  // from the title (handles Hebrew via a transliteration helper).
  const [slugTouched, setSlugTouched] = useState<boolean>(
    Boolean(initial.id && initial.slug),
  );
  const [showSlug, setShowSlug] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setV(initial);
    setSlugTouched(Boolean(initial.id && initial.slug));
    setErr(null);
  }, [
    initial.id,
    initial.title,
    initial.slug,
    initial.description,
    initial.cover_url,
    initial.is_published,
    initial.sort_order,
  ]);

  useEffect(() => {
    let active = true;
    if (!v.cover_url) {
      setCoverPreview(null);
      return;
    }
    if (/^https?:\/\//i.test(v.cover_url)) {
      setCoverPreview(v.cover_url);
      return;
    }
    signUrl({ data: { path: v.cover_url } })
      .then((r) => {
        if (active) setCoverPreview(r.url);
      })
      .catch(() => active && setCoverPreview(null));
    return () => {
      active = false;
    };
  }, [v.cover_url, signUrl]);

  const mutation = useMutation({
    mutationFn: async () => {
      const finalSlug = v.slug.trim() || slugify(v.title);
      const payload: {
        id?: string;
        title: string;
        slug: string;
        description?: string | null;
        cover_url?: string | null;
        is_published: boolean;
        sort_order: number;
      } = {
        id: v.id,
        title: v.title,
        slug: finalSlug,
        is_published: v.is_published,
        sort_order: v.sort_order,
      };

      if (!v.id || v.description !== initial.description) {
        payload.description = v.description;
      }

      if (!v.id || v.cover_url !== initial.cover_url) {
        payload.cover_url = v.cover_url;
      }

      const res = await save({ data: payload });
      return res.id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
      onSaved(id);
    },
    onError: (e: Error) => setErr(e.message),
  });

  async function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr("יש לבחור קובץ תמונה.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErr("עד 5MB.");
      return;
    }
    setUploading(true);
    setErr(null);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("course-covers")
      .upload(path, file, { upsert: true, contentType: file.type });
    setUploading(false);
    if (upErr) {
      setErr("העלאת התמונה נכשלה.");
      return;
    }
    setV((s) => ({ ...s, cover_url: path }));
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setErr(null);
          mutation.mutate();
        }}
        className="space-y-5"
      >
        <FormField label="כותרת הקורס">
          <input
            required
            value={v.title}
            onChange={(e) => {
              const title = e.target.value;
              setV((s) => ({
                ...s,
                title,
                slug: slugTouched ? s.slug : slugify(title),
              }));
            }}
            className={inputClass}
          />
        </FormField>

        <FormField label="תיאור">
          <textarea
            rows={4}
            value={v.description ?? ""}
            onChange={(e) => setV({ ...v, description: e.target.value })}
            className={inputClass}
          />
        </FormField>

        <div>
          <button
            type="button"
            onClick={() => setShowSlug((s) => !s)}
            className="text-lg text-brand-primary-dark/70 hover:text-brand-primary cursor-pointer"
          >
            {showSlug ? "הסתרת הגדרות מתקדמות" : "הגדרות מתקדמות (Slug)"}
          </button>
          {showSlug && (
            <div className="mt-3">
              <FormField
                label="Slug (אופציונלי)"
                hint="נוצר אוטומטית מהכותרת. ניתן לערוך — אותיות אנגליות, ספרות ומקפים בלבד."
              >
                <input
                  dir="ltr"
                  value={v.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setV({ ...v, slug: e.target.value });
                  }}
                  className={inputClass}
                />
              </FormField>
            </div>
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-[auto_1fr] items-start">
          <div>
            <div className="w-44 h-32 rounded-xl border border-brand-accent-soft/60 bg-brand-background-light/60 overflow-hidden flex items-center justify-center">
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="תמונת הקורס"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-brand-primary-dark/50 text-lg">
                  אין תמונה
                </span>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <PrimaryButton
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "מעלה…" : "העלאת תמונה"}
              </PrimaryButton>
              {v.cover_url && (
                <GhostButton
                  type="button"
                  onClick={() => setV({ ...v, cover_url: null })}
                >
                  הסר
                </GhostButton>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCover}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="סדר תצוגה">
              <input
                type="number"
                min={0}
                value={v.sort_order}
                onChange={(e) =>
                  setV({ ...v, sort_order: Number(e.target.value) })
                }
                className={inputClass}
              />
            </FormField>
            <FormField label="פרסום">
              <label className="inline-flex items-center gap-2 mt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={v.is_published}
                  onChange={(e) =>
                    setV({ ...v, is_published: e.target.checked })
                  }
                  className="h-4 w-4 accent-[rgb(158,36,43)] cursor-pointer"
                />
                <span className="text-lg md:text-xl">פורסם — מופיע לתלמידות</span>
              </label>
            </FormField>
          </div>
        </div>

        {err && <p className="text-lg text-brand-accent-alert">{err}</p>}

        <div className="flex gap-2">
          <PrimaryButton type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "שומר…" : "שמירה"}
          </PrimaryButton>
        </div>
      </form>
    </Card>
  );
}
