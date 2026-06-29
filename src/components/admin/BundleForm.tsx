import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  FormField,
  PrimaryButton,
  inputClass,
} from "@/components/admin/ui";
import { upsertBundle, setBundleCourses } from "@/lib/admin.functions";

export function BundleForm({
  initial,
  allCourses = [],
  selectedCourseIds,
  onSaved,
}: {
  initial: {
    id?: string;
    title: string;
    slug: string;
    description: string | null;
  };
  allCourses?: { id: string; title: string }[];
  selectedCourseIds?: string[];
  onSaved: (id: string) => void;
}) {
  const qc = useQueryClient();
  const save = useServerFn(upsertBundle);
  const setBC = useServerFn(setBundleCourses);
  const [v, setV] = useState(initial);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(selectedCourseIds ?? []),
  );
  const [err, setErr] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await save({ data: v });
      if (allCourses.length) {
        await setBC({
          data: { bundle_id: res.id, course_ids: Array.from(selected) },
        });
      }
      return res.id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["admin", "bundles"] });
      qc.invalidateQueries({ queryKey: ["admin", "bundle", id] });
      onSaved(id);
    },
    onError: (e: Error) => setErr(e.message),
  });

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
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
          <FormField label="Slug">
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
            rows={3}
            value={v.description ?? ""}
            onChange={(e) => setV({ ...v, description: e.target.value })}
            className={inputClass}
          />
        </FormField>

        {allCourses.length > 0 && (
          <FormField label="קורסים בחבילה">
            <div className="grid gap-2 sm:grid-cols-2 max-h-72 overflow-y-auto rounded-xl border border-brand-accent-soft/60 p-3">
              {allCourses.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 text-sm text-brand-primary-dark cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggle(c.id)}
                    className="h-4 w-4 accent-[rgb(158,36,43)]"
                  />
                  {c.title}
                </label>
              ))}
            </div>
          </FormField>
        )}

        {err && <p className="text-sm text-brand-accent-alert">{err}</p>}
        <PrimaryButton type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "שומר…" : "שמירה"}
        </PrimaryButton>
      </form>
    </Card>
  );
}
