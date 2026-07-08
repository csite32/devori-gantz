import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  listAdminHomepagePricing,
  updateHomepagePricing,
  type PricingRow,
} from "@/lib/pricing.functions";
import {
  AdminPageHeader,
  Card,
  FormField,
  PrimaryButton,
  inputClass,
} from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/pricing")({
  component: PricingPage,
});

function PricingPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAdminHomepagePricing);
  const saveFn = useServerFn(updateHomepagePricing);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "homepage_pricing"],
    queryFn: () => listFn(),
  });

  const [values, setValues] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (data) {
      const m: Record<string, string> = {};
      for (const r of data) m[r.key] = r.value;
      setValues(m);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const items = (data ?? []).map((r) => ({
        key: r.key,
        value: (values[r.key] ?? "").trim(),
      }));
      for (const it of items) {
        if (!it.value) throw new Error("כל השדות חייבים להיות מלאים");
      }
      return saveFn({ data: { items } });
    },
    onSuccess: () => {
      setMsg({ kind: "ok", text: "המחירים נשמרו בהצלחה" });
      qc.invalidateQueries({ queryKey: ["admin", "homepage_pricing"] });
      qc.invalidateQueries({ queryKey: ["homepage-pricing"] });
    },
    onError: (e: Error) => {
      setMsg({ kind: "err", text: e.message || "אירעה שגיאה בעת שמירת המחירים" });
    },
  });

  return (
    <>
      <AdminPageHeader eyebrow="ניהול" title="מחירי עמוד הבית" />
      <Card>
        {isLoading || !data ? (
          <p className="text-lg text-brand-primary-dark/70">טוען…</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setMsg(null);
              save.mutate();
            }}
            className="grid gap-5"
          >
            {data.map((row: PricingRow) => (
              <FormField
                key={row.key}
                label={row.label}
                hint={row.value_type === "number" ? "מספר בלבד (למשל 580)" : "טקסט חופשי (למשל: 1,500 ₪ במקום 1,740 ₪)"}
              >
                <input
                  className={inputClass}
                  type={row.value_type === "number" ? "number" : "text"}
                  inputMode={row.value_type === "number" ? "decimal" : undefined}
                  min={row.value_type === "number" ? 0 : undefined}
                  step={row.value_type === "number" ? "1" : undefined}
                  value={values[row.key] ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [row.key]: e.target.value }))
                  }
                  dir={row.value_type === "number" ? "ltr" : "rtl"}
                />
              </FormField>
            ))}

            {msg && (
              <p
                className={
                  "text-lg " +
                  (msg.kind === "ok"
                    ? "text-brand-primary"
                    : "text-brand-accent-alert")
                }
              >
                {msg.text}
              </p>
            )}

            <div>
              <PrimaryButton type="submit" disabled={save.isPending}>
                {save.isPending ? "שומר…" : "שמירה"}
              </PrimaryButton>
            </div>
          </form>
        )}
      </Card>
    </>
  );
}
