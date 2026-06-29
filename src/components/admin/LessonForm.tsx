import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  FormField,
  PrimaryButton,
  inputClass,
} from "@/components/admin/ui";
import { upsertLesson } from "@/lib/admin.functions";

export type LessonValues = {
  id?: string;
  course_id: string;
  title: string;
  description: string | null;
  vimeo_url: string | null;
  sort_order: number;
};

export function LessonForm({
  initial,
  onSaved,
}: {
  initial: LessonValues;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const save = useServerFn(upsertLesson);
  const [v, setV] = useState<LessonValues>(initial);
  const [err, setErr] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () => save({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["admin", "course", v.course_id],
      });
      onSaved();
    },
    onError: (e: Error) => setErr(e.message),
  });

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
        <FormField label="כותרת השיעור">
          <input
            required
            value={v.title}
            onChange={(e) => setV({ ...v, title: e.target.value })}
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
        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            label="קישור Vimeo"
            hint="כתובת מלאה של הסרטון ב-Vimeo"
          >
            <input
              dir="ltr"
              value={v.vimeo_url ?? ""}
              onChange={(e) => setV({ ...v, vimeo_url: e.target.value })}
              className={inputClass}
            />
          </FormField>
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
        </div>
        {err && <p className="text-lg text-brand-accent-alert">{err}</p>}
        <PrimaryButton type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "שומר…" : "שמירה"}
        </PrimaryButton>
      </form>
    </Card>
  );
}
