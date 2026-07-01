import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  upsertOverride,
  deleteOverride,
  deleteAllOverrides,
  type UIOverride,
} from "@/lib/ui-overrides.functions";
import { useOverrides } from "./OverridesProvider";

/**
 * Visual editor overlay.
 * - Loads only in dev (import.meta.env.DEV).
 * - Extra runtime gate: only mounts UI when signed-in user has admin role.
 * - Admin check runs client-side via the hardened `has_role` RPC (self-query,
 *   allowed by the security-definer function).
 */
export function VisualEditor() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    async function verify() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (active) setIsAdmin(false);
        return;
      }
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userData.user.id,
        _role: "admin",
      });
      if (error) {
        console.warn("[visual-editor] has_role failed", error);
        if (active) setIsAdmin(false);
        return;
      }
      if (active) setIsAdmin(!!data);
    }
    verify();
    const { data: sub } = supabase.auth.onAuthStateChange((e) => {
      if (e === "SIGNED_IN" || e === "SIGNED_OUT" || e === "USER_UPDATED") {
        verify();
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!isAdmin) return null;
  return <EditorPanel />;
}


function EditorPanel() {
  const { overrides, setLocalOverride, refresh, elements } = useOverrides();
  const upsert = useServerFn(upsertOverride);
  const del = useServerFn(deleteOverride);
  const delAll = useServerFn(deleteAllOverrides);

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"list" | "edit">("list");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(),
  );

  // Scan the DOM continuously so the list always reflects the current route.
  // Re-runs when the pathname changes (route transition may swap the tree
  // before/after our observer fires).
  const [domElements, setDomElements] = useState<
    { id: string; section: string | null; label: string | null }[]
  >([]);

  useEffect(() => {
    let raf = 0;
    const scan = () => {
      const nodes = document.querySelectorAll<HTMLElement>("[data-editor-id]");
      const list: { id: string; section: string | null; label: string | null }[] =
        [];
      const seen = new Set<string>();
      nodes.forEach((n) => {
        const id = n.getAttribute("data-editor-id");
        if (!id || seen.has(id)) return;
        seen.add(id);
        list.push({
          id,
          section: n.getAttribute("data-editor-section"),
          label:
            n.getAttribute("data-editor-label") ??
            ((n.textContent ?? "").trim().slice(0, 40) ||
              n.tagName.toLowerCase()),
        });
      });
      setDomElements(list);
    };
    // Debounce via rAF; MutationObserver can fire many times per tick
    const trigger = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(scan);
    };
    trigger();
    const obs = new MutationObserver(trigger);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  // Clear selection when the route changes — the element no longer exists.
  useEffect(() => {
    setSelectedId(null);
    setTab("list");
  }, [pathname]);


  const allElements = useMemo(() => {
    const map = new Map<
      string,
      { id: string; section: string | null; label: string | null }
    >();
    for (const el of elements) map.set(el.id, el);
    for (const el of domElements) map.set(el.id, el);
    return Array.from(map.values());
  }, [elements, domElements]);

  const grouped = useMemo(() => {
    const g: Record<string, typeof allElements> = {};
    for (const el of allElements) {
      const key = el.section || "כללי";
      (g[key] ??= []).push(el);
    }
    return g;
  }, [allElements]);

  // Highlight selected element with an outline
  useEffect(() => {
    if (!selectedId) return;
    const node = document.querySelector<HTMLElement>(
      `[data-editor-id="${cssEscape(selectedId)}"]`,
    );
    if (!node) return;
    const prev = node.style.outline;
    const prevOffset = node.style.outlineOffset;
    node.style.outline = "2px dashed #9e242b";
    node.style.outlineOffset = "3px";
    node.scrollIntoView({ block: "center", behavior: "smooth" });
    return () => {
      node.style.outline = prev;
      node.style.outlineOffset = prevOffset;
    };
  }, [selectedId]);

  // Click-to-select on the page (when editor is open)
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Ignore clicks inside the editor panel itself
      if (target.closest("[data-editor-panel]")) return;
      const match = target.closest<HTMLElement>("[data-editor-id]");
      if (!match) return;
      e.preventDefault();
      e.stopPropagation();
      const id = match.getAttribute("data-editor-id");
      if (id) {
        setSelectedId(id);
        setTab("edit");
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [open]);

  const selected = selectedId
    ? allElements.find((e) => e.id === selectedId) ?? null
    : null;
  const currentOverride: UIOverride | null = selectedId
    ? overrides[selectedId] ?? null
    : null;

  const currentStyles = currentOverride?.styles ?? {};
  const currentText = currentOverride?.text_content ?? "";

  const updateStyle = async (key: string, value: string) => {
    if (!selectedId || !selected) return;
    const nextStyles = { ...currentStyles };
    if (value === "" || value == null) delete nextStyles[key];
    else nextStyles[key] = value;
    const next: UIOverride = {
      editor_id: selectedId,
      section: selected.section,
      styles: nextStyles,
      text_content: currentOverride?.text_content ?? null,
    };
    setLocalOverride(selectedId, next);
    try {
      await upsert({ data: next });
    } catch (e) {
      console.error(e);
    }
  };

  const updateText = async (value: string) => {
    if (!selectedId || !selected) return;
    const next: UIOverride = {
      editor_id: selectedId,
      section: selected.section,
      styles: currentStyles,
      text_content: value || null,
    };
    setLocalOverride(selectedId, next);
    try {
      await upsert({ data: next });
    } catch (e) {
      console.error(e);
    }
  };

  const resetElement = async () => {
    if (!selectedId) return;
    setLocalOverride(selectedId, null);
    try {
      await del({ data: { editor_id: selectedId } });
    } catch (e) {
      console.error(e);
    }
  };

  const resetAll = async () => {
    if (!confirm("לאפס את כל השינויים באתר?")) return;
    try {
      await delAll();
      await refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSection = (s: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  return (
    <>
      {/* Floating trigger */}
      <button
        data-editor-panel
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          bottom: 20,
          left: 20,
          zIndex: 2147483000,
          background: "#9e242b",
          color: "white",
          border: "none",
          borderRadius: 999,
          width: 52,
          height: 52,
          fontSize: 22,
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          fontFamily: "system-ui, sans-serif",
        }}
        title={open ? "סגור עורך" : "פתח עורך ויזואלי"}
      >
        {open ? "×" : "✎"}
      </button>

      {open && (
        <div
          data-editor-panel
          dir="rtl"
          style={{
            position: "fixed",
            top: 12,
            right: 12,
            bottom: 12,
            width: 340,
            zIndex: 2147482999,
            background: "white",
            color: "#111",
            borderRadius: 14,
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: 13,
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid #eee",
              background: "#faf6f5",
            }}
          >
            <div
              style={{ fontWeight: 700, fontSize: 14, color: "#521014" }}
            >
              עורך ויזואלי
            </div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
              שינויים נשמרים אוטומטית לכל המבקרים
            </div>
          </div>

          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #eee",
              background: "#fff",
            }}
          >
            <TabBtn active={tab === "list"} onClick={() => setTab("list")}>
              אלמנטים ({allElements.length})
            </TabBtn>
            <TabBtn
              active={tab === "edit"}
              onClick={() => setTab("edit")}
              disabled={!selectedId}
            >
              עריכה
            </TabBtn>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
            {tab === "list" && (
              <div>
                {Object.keys(grouped).length === 0 && (
                  <div
                    style={{
                      color: "#888",
                      padding: 16,
                      textAlign: "center",
                      background: "#faf6f5",
                      borderRadius: 8,
                      lineHeight: 1.6,
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "#521014" }}>
                      עדיין לא סומנו אלמנטים לעריכה
                    </div>
                    <div style={{ fontSize: 11, marginTop: 6 }}>
                      בעמוד הזה ({pathname}) אין אלמנטים עם
                      <br />
                      <code style={{ direction: "ltr" }}>data-editor-id</code>
                    </div>
                  </div>
                )}
                {Object.entries(grouped).map(([section, items]) => {
                  const collapsed = collapsedSections.has(section);
                  return (
                    <div key={section} style={{ marginBottom: 6 }}>
                      <button
                        onClick={() => toggleSection(section)}
                        style={{
                          width: "100%",
                          textAlign: "right",
                          background: "#f4ecea",
                          border: "none",
                          padding: "6px 10px",
                          borderRadius: 6,
                          fontWeight: 600,
                          color: "#521014",
                          cursor: "pointer",
                        }}
                      >
                        {collapsed ? "▸" : "▾"} {section} ({items.length})
                      </button>
                      {!collapsed && (
                        <div style={{ marginTop: 4 }}>
                          {items.map((el) => (
                            <button
                              key={el.id}
                              onClick={() => {
                                setSelectedId(el.id);
                                setTab("edit");
                              }}
                              style={{
                                display: "block",
                                width: "100%",
                                textAlign: "right",
                                background:
                                  selectedId === el.id ? "#9e242b" : "white",
                                color:
                                  selectedId === el.id ? "white" : "#333",
                                border: "1px solid #eee",
                                borderRadius: 6,
                                padding: "6px 10px",
                                marginTop: 3,
                                cursor: "pointer",
                                fontSize: 12,
                              }}
                              title={el.id}
                            >
                              <div style={{ fontWeight: 600 }}>
                                {el.label || el.id}
                              </div>
                              <div
                                style={{
                                  fontSize: 10,
                                  opacity: 0.7,
                                  direction: "ltr",
                                  textAlign: "left",
                                }}
                              >
                                {el.id}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={resetAll}
                  style={{
                    marginTop: 14,
                    width: "100%",
                    background: "#fff",
                    color: "#9e242b",
                    border: "1px solid #9e242b",
                    borderRadius: 6,
                    padding: "8px 10px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  אפס את כל השינויים באתר
                </button>
              </div>
            )}

            {tab === "edit" && selected && (
              <EditPanel
                key={selected.id}
                selected={selected}
                styles={currentStyles}
                text={currentText}
                updateStyle={updateStyle}
                updateText={updateText}
                resetElement={resetElement}
              />
            )}
            {tab === "edit" && !selected && (
              <div style={{ color: "#888", padding: 12 }}>
                בחרי אלמנט מהרשימה או לחצי על אלמנט בעמוד.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function TabBtn({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        padding: "10px 8px",
        background: active ? "white" : "#f7f7f7",
        border: "none",
        borderBottom: active ? "2px solid #9e242b" : "2px solid transparent",
        color: disabled ? "#bbb" : active ? "#521014" : "#666",
        fontWeight: active ? 700 : 500,
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: 12,
      }}
    >
      {children}
    </button>
  );
}

function EditPanel({
  selected,
  styles,
  text,
  updateStyle,
  updateText,
  resetElement,
}: {
  selected: { id: string; section: string | null; label: string | null };
  styles: Record<string, string>;
  text: string;
  updateStyle: (k: string, v: string) => void;
  updateText: (v: string) => void;
  resetElement: () => void;
}) {
  return (
    <div>
      <div
        style={{
          background: "#faf6f5",
          padding: 8,
          borderRadius: 6,
          marginBottom: 10,
        }}
      >
        <div style={{ fontWeight: 700, color: "#521014" }}>
          {selected.label}
        </div>
        <div
          style={{
            fontSize: 10,
            color: "#888",
            direction: "ltr",
            textAlign: "left",
          }}
        >
          {selected.id}
        </div>
      </div>

      <Group title="טקסט">
        <textarea
          value={text}
          onChange={(e) => updateText(e.target.value)}
          rows={2}
          placeholder="השאירי ריק לטקסט המקורי"
          style={{
            width: "100%",
            border: "1px solid #ddd",
            borderRadius: 6,
            padding: 6,
            fontFamily: "inherit",
            fontSize: 12,
            resize: "vertical",
          }}
        />
      </Group>

      <Group title="גודל וריווח">
        <SliderRow
          label="גודל טקסט"
          value={styles["font-size"] || ""}
          unit="px"
          min={8}
          max={120}
          onChange={(v) => updateStyle("font-size", v)}
        />
        <SliderRow
          label="ריווח פנימי"
          value={styles["padding"] || ""}
          unit="px"
          min={0}
          max={120}
          onChange={(v) => updateStyle("padding", v)}
        />
        <SliderRow
          label="ריווח חיצוני"
          value={styles["margin"] || ""}
          unit="px"
          min={0}
          max={120}
          onChange={(v) => updateStyle("margin", v)}
        />
        <TextRow
          label="רוחב"
          value={styles["width"] || ""}
          placeholder="לדוגמה: 300px, 50%, auto"
          onChange={(v) => updateStyle("width", v)}
        />
        <TextRow
          label="גובה"
          value={styles["height"] || ""}
          placeholder="לדוגמה: 200px, auto"
          onChange={(v) => updateStyle("height", v)}
        />
      </Group>

      <Group title="מיקום וסיבוב">
        <TransformSliders styles={styles} onChange={updateStyle} />
      </Group>

      <Group title="צבעים ורקע">
        <ColorRow
          label="צבע טקסט"
          value={styles["color"] || ""}
          onChange={(v) => updateStyle("color", v)}
        />
        <ColorRow
          label="רקע"
          value={styles["background-color"] || ""}
          onChange={(v) => updateStyle("background-color", v)}
        />
        <TextRow
          label="מסגרת"
          value={styles["border"] || ""}
          placeholder="1px solid #000"
          onChange={(v) => updateStyle("border", v)}
        />
        <SliderRow
          label="עיגול פינות"
          value={styles["border-radius"] || ""}
          unit="px"
          min={0}
          max={80}
          onChange={(v) => updateStyle("border-radius", v)}
        />
      </Group>

      <button
        onClick={resetElement}
        style={{
          marginTop: 14,
          width: "100%",
          background: "#fff",
          color: "#9e242b",
          border: "1px solid #9e242b",
          borderRadius: 6,
          padding: "8px 10px",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        אפס אלמנט זה
      </button>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontWeight: 600,
          color: "#521014",
          fontSize: 12,
          marginBottom: 6,
          borderBottom: "1px solid #eee",
          paddingBottom: 3,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  unit,
  min,
  max,
  onChange,
}: {
  label: string;
  value: string;
  unit: string;
  min: number;
  max: number;
  onChange: (v: string) => void;
}) {
  const num = parseFloat(value) || 0;
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "#666",
        }}
      >
        <span>{label}</span>
        <span style={{ direction: "ltr" }}>{value || "—"}</span>
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <input
          type="range"
          min={min}
          max={max}
          value={num}
          onChange={(e) => onChange(`${e.target.value}${unit}`)}
          style={{ flex: 1, direction: "ltr" }}
        />
        <button
          onClick={() => onChange("")}
          title="אפס"
          style={{
            background: "none",
            border: "1px solid #ddd",
            borderRadius: 4,
            padding: "2px 6px",
            cursor: "pointer",
            fontSize: 10,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function TextRow({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#666", marginBottom: 2 }}>{label}</div>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          border: "1px solid #ddd",
          borderRadius: 4,
          padding: "4px 6px",
          fontSize: 12,
          direction: "ltr",
        }}
      />
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#666", marginBottom: 2 }}>{label}</div>
      <div style={{ display: "flex", gap: 4 }}>
        <input
          type="color"
          value={hexOf(value) || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 34,
            height: 28,
            border: "1px solid #ddd",
            borderRadius: 4,
            padding: 0,
            cursor: "pointer",
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000 או transparent"
          style={{
            flex: 1,
            border: "1px solid #ddd",
            borderRadius: 4,
            padding: "4px 6px",
            fontSize: 12,
            direction: "ltr",
          }}
        />
        <button
          onClick={() => onChange("")}
          title="אפס"
          style={{
            background: "none",
            border: "1px solid #ddd",
            borderRadius: 4,
            padding: "2px 6px",
            cursor: "pointer",
            fontSize: 10,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function TransformSliders({
  styles,
  onChange,
}: {
  styles: Record<string, string>;
  onChange: (k: string, v: string) => void;
}) {
  const parsed = parseTransform(styles["transform"] || "");
  const set = (key: "translateX" | "translateY" | "rotate" | "scale", val: number) => {
    const next = { ...parsed, [key]: val };
    const parts: string[] = [];
    if (next.translateX) parts.push(`translateX(${next.translateX}px)`);
    if (next.translateY) parts.push(`translateY(${next.translateY}px)`);
    if (next.rotate) parts.push(`rotate(${next.rotate}deg)`);
    if (next.scale && next.scale !== 1) parts.push(`scale(${next.scale})`);
    onChange("transform", parts.length ? parts.join(" ") : "");
  };
  return (
    <>
      <SliderNumRow
        label="הזזה אופקית"
        value={parsed.translateX}
        min={-400}
        max={400}
        onChange={(v) => set("translateX", v)}
        suffix="px"
      />
      <SliderNumRow
        label="הזזה אנכית"
        value={parsed.translateY}
        min={-400}
        max={400}
        onChange={(v) => set("translateY", v)}
        suffix="px"
      />
      <SliderNumRow
        label="סיבוב"
        value={parsed.rotate}
        min={-180}
        max={180}
        onChange={(v) => set("rotate", v)}
        suffix="°"
      />
      <SliderNumRow
        label="גודל (scale)"
        value={parsed.scale * 100}
        min={10}
        max={300}
        onChange={(v) => set("scale", v / 100)}
        suffix="%"
      />
    </>
  );
}

function SliderNumRow({
  label,
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  suffix: string;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "#666",
        }}
      >
        <span>{label}</span>
        <span style={{ direction: "ltr" }}>
          {Math.round(value)}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", direction: "ltr" }}
      />
    </div>
  );
}

function parseTransform(t: string) {
  const out = { translateX: 0, translateY: 0, rotate: 0, scale: 1 };
  const rx = (name: string) =>
    new RegExp(`${name}\\(([-0-9.]+)`).exec(t)?.[1];
  const tx = rx("translateX");
  const ty = rx("translateY");
  const r = rx("rotate");
  const s = rx("scale");
  if (tx) out.translateX = parseFloat(tx);
  if (ty) out.translateY = parseFloat(ty);
  if (r) out.rotate = parseFloat(r);
  if (s) out.scale = parseFloat(s);
  return out;
}

function hexOf(v: string): string {
  if (/^#[0-9a-f]{6}$/i.test(v)) return v;
  return "";
}

function cssEscape(s: string) {
  if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(s);
  return s.replace(/"/g, '\\"');
}
