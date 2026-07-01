import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  upsertOverride,
  deleteOverride,
  type UIOverride,
} from "@/lib/ui-overrides.functions";
import { useOverrides } from "./OverridesProvider";
import { scanEditableElements, type ScannedElement } from "@/lib/visual-editor/scanner";

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
  const { overrides, setLocalOverride, reapplyAll } = useOverrides();
  const upsert = useServerFn(upsertOverride);
  const del = useServerFn(deleteOverride);

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [open, setOpen] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [tab, setTab] = useState<"list" | "edit">("list");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(),
  );
  // Session undo stack: previous override value for each change made
  // since the panel was opened. Never touches changes saved in earlier sessions.
  const undoStackRef = useRef<Array<{ id: string; prev: UIOverride | null }>>([]);
  const [undoCount, setUndoCount] = useState(0);

  // Panel position (draggable). Default: top-right.
  const [panelPos, setPanelPos] = useState<{ top: number; left: number }>(() => {
    if (typeof window === "undefined") return { top: 12, left: 12 };
    try {
      const saved = localStorage.getItem("visual-editor:panel-pos");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { top: 12, left: Math.max(12, window.innerWidth - 352) };
  });
  const dragState = useRef<{ dx: number; dy: number } | null>(null);
  useEffect(() => {
    try {
      localStorage.setItem("visual-editor:panel-pos", JSON.stringify(panelPos));
    } catch {}
  }, [panelPos]);

  // Scan the DOM continuously so the list always reflects the current route.
  // Uses the shared scanner that filters technical noise and stamps
  // `data-editor-id` (stable ID) on auto-detected elements so overrides apply.
  const [domElements, setDomElements] = useState<ScannedElement[]>([]);

  useEffect(() => {
    let raf = 0;
    const scan = () => {
      const list = scanEditableElements(pathname);
      setDomElements(list);
      // Ensure overrides apply to freshly-stamped nodes.
      reapplyAll();
    };
    const trigger = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(scan);
    };
    trigger();
    const obs = new MutationObserver((mutations) => {
      // Ignore mutations we cause ourselves (attribute stamps + style writes).
      let interesting = false;
      for (const m of mutations) {
        if (m.type === "childList" && (m.addedNodes.length || m.removedNodes.length)) {
          interesting = true;
          break;
        }
      }
      if (interesting) trigger();
    });
    obs.observe(document.body, { childList: true, subtree: true });
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [pathname, reapplyAll]);

  // Clear selection & undo history when route changes.
  useEffect(() => {
    setSelectedId(null);
    setTab("list");
    undoStackRef.current = [];
    setUndoCount(0);
  }, [pathname]);

  const allElements = useMemo(() => domElements, [domElements]);

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

  // Hover preview outline (thin, different color) on page elements
  useEffect(() => {
    if (!hoverId || hoverId === selectedId) return;
    const node = document.querySelector<HTMLElement>(
      `[data-editor-id="${cssEscape(hoverId)}"]`,
    );
    if (!node) return;
    const prev = node.style.outline;
    const prevOffset = node.style.outlineOffset;
    node.style.outline = "1px dashed rgba(158,36,43,0.5)";
    node.style.outlineOffset = "2px";
    return () => {
      node.style.outline = prev;
      node.style.outlineOffset = prevOffset;
    };
  }, [hoverId, selectedId]);

  // Click-to-select on the page. Runs whenever the editor is mounted (admin+dev),
  // regardless of whether the panel is open — clicking auto-opens the panel.
  useEffect(() => {
    const clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-editor-panel]")) return;
      let match = target.closest<HTMLElement>("[data-editor-id]");
      if (!match) return;
      // Alt+Click → step one level up to the nearest editable ancestor.
      if (e.altKey) {
        const parent = match.parentElement?.closest<HTMLElement>("[data-editor-id]");
        if (parent) match = parent;
      }
      e.preventDefault();
      e.stopPropagation();
      const id = match.getAttribute("data-editor-id");
      if (id) {
        setSelectedId(id);
        setTab("edit");
        setOpen(true);
      }
    };
    const overHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || target.closest("[data-editor-panel]")) {
        setHoverId(null);
        return;
      }
      const match = target.closest<HTMLElement>("[data-editor-id]");
      setHoverId(match ? match.getAttribute("data-editor-id") : null);
    };
    document.addEventListener("click", clickHandler, true);
    document.addEventListener("mouseover", overHandler, true);
    return () => {
      document.removeEventListener("click", clickHandler, true);
      document.removeEventListener("mouseover", overHandler, true);
    };
  }, []);

  const selected = selectedId
    ? allElements.find((e) => e.id === selectedId) ?? null
    : null;
  const currentOverride: UIOverride | null = selectedId
    ? overrides[selectedId] ?? null
    : null;

  const currentStyles = currentOverride?.styles ?? {};
  const currentText = currentOverride?.text_content ?? "";

  const pushUndo = (id: string, prev: UIOverride | null) => {
    undoStackRef.current.push({ id, prev: prev ? { ...prev, styles: { ...prev.styles } } : null });
    setUndoCount(undoStackRef.current.length);
  };

  const persist = async (next: UIOverride | null, id: string) => {
    try {
      if (next == null) await del({ data: { editor_id: id } });
      else await upsert({ data: next });
    } catch (e) {
      console.error(e);
    }
  };

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
    pushUndo(selectedId, currentOverride);
    setLocalOverride(selectedId, next);
    await persist(next, selectedId);
  };

  const updateText = async (value: string) => {
    if (!selectedId || !selected) return;
    const next: UIOverride = {
      editor_id: selectedId,
      section: selected.section,
      styles: currentStyles,
      text_content: value || null,
    };
    pushUndo(selectedId, currentOverride);
    setLocalOverride(selectedId, next);
    await persist(next, selectedId);
  };

  const resetElement = async () => {
    if (!selectedId) return;
    pushUndo(selectedId, currentOverride);
    setLocalOverride(selectedId, null);
    await persist(null, selectedId);
  };

  const undoLast = async () => {
    const last = undoStackRef.current.pop();
    setUndoCount(undoStackRef.current.length);
    if (!last) return;
    setLocalOverride(last.id, last.prev);
    await persist(last.prev, last.id);
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
            top: panelPos.top,
            left: panelPos.left,
            height: "min(720px, calc(100vh - 24px))",
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
            onMouseDown={(e) => {
              // Only start drag from empty header area, not from buttons
              if ((e.target as HTMLElement).closest("button")) return;
              dragState.current = {
                dx: e.clientX - panelPos.left,
                dy: e.clientY - panelPos.top,
              };
              const move = (ev: MouseEvent) => {
                if (!dragState.current) return;
                const nx = Math.max(
                  0,
                  Math.min(window.innerWidth - 340, ev.clientX - dragState.current.dx),
                );
                const ny = Math.max(
                  0,
                  Math.min(window.innerHeight - 80, ev.clientY - dragState.current.dy),
                );
                setPanelPos({ top: ny, left: nx });
              };
              const up = () => {
                dragState.current = null;
                document.removeEventListener("mousemove", move);
                document.removeEventListener("mouseup", up);
              };
              document.addEventListener("mousemove", move);
              document.addEventListener("mouseup", up);
            }}
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid #eee",
              background: "#faf6f5",
              cursor: "grab",
              userSelect: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#521014" }}>
                ✥ עורך ויזואלי
              </div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                גררי מהכותרת • לחצי על אלמנט לעריכה
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 20,
                cursor: "pointer",
                color: "#521014",
                lineHeight: 1,
              }}
              title="סגור"
            >
              ×
            </button>
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
                              onMouseEnter={() => setHoverId(el.id)}
                              onMouseLeave={() => setHoverId(null)}
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
                  onClick={undoLast}
                  disabled={undoCount === 0}
                  style={{
                    marginTop: 14,
                    width: "100%",
                    background: undoCount === 0 ? "#f4f4f4" : "#fff",
                    color: undoCount === 0 ? "#aaa" : "#9e242b",
                    border: "1px solid #9e242b",
                    borderRadius: 6,
                    padding: "8px 10px",
                    cursor: undoCount === 0 ? "not-allowed" : "pointer",
                    fontWeight: 600,
                  }}
                  title="מבטל את השינוי האחרון שבוצע בסשן הנוכחי בלבד. שינויים ישנים שכבר נשמרו לא נמחקים."
                >
                  ↶ בטל שינוי אחרון{undoCount > 0 ? ` (${undoCount})` : ""}
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
