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
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    if (!v.cover_url) {
      setCoverPreview(null);
      return;
    }
    // If it's a full URL keep as-is, else sign storage path.
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
      const res = await save({ data: v });
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
        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="כותרת">
            <input
              required
              value={v.title}
              onChange={(e) => setV({ ...v, title: e.target.value })}
              className={inputClass}
            />
          </FormField>
          <FormField label="Slug" hint="אותיות אנגליות, ספרות ומקפים בלבד">
            <input
              required
              dir="ltr"
              value={v.slug}
              onChange={(e) => setV({ ...v, slug: e.target.value })}
              className={inputClass}
            />
          </FormField>
        </div>

        <FormField label="תיאור">
          <textarea
            rows={4}
            value={v.description ?? ""}
            onChange={(e) => setV({ ...v, description: e.target.value })}
            className={inputClass}
          />
        </FormField>

        <div className="grid gap-5 md:grid-cols-[auto_1fr] items-start">
          <div>
            <div className="w-40 h-28 rounded-xl border border-brand-accent-soft/60 bg-brand-background-light/60 overflow-hidden flex items-center justify-center">
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="תמונת כריכה"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-brand-primary-dark/50 text-xs">
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
                {uploading ? "מעלה…" : "העלאת כריכה"}
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
              <label className="inline-flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  checked={v.is_published}
                  onChange={(e) =>
                    setV({ ...v, is_published: e.target.checked })
                  }
                  className="h-4 w-4 accent-[rgb(158,36,43)]"
                />
                <span className="text-sm">פורסם — מופיע לתלמידות</span>
              </label>
            </FormField>
          </div>
        </div>

        {err && <p className="text-sm text-brand-accent-alert">{err}</p>}

        <div className="flex gap-2">
          <PrimaryButton type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "שומר…" : "שמירה"}
          </PrimaryButton>
        </div>
      </form>
    </Card>
  );
}
