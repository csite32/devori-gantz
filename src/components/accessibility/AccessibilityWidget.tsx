import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";

/**
 * AccessibilityWidget
 * -------------------
 * ווידג'ט נגישות מלא לאתר, תואם ת"י 5568 רמה AA ו-WCAG 2.1 AA.
 * - כפתור צף קבוע
 * - פאנל עם פוקוס-טראפ, Esc לסגירה
 * - כל ההעדפות נשמרות ב-localStorage ומיושמות אוטומטית בכל עמוד
 * - Skip link
 */

type Contrast = "none" | "high" | "dark" | "light" | "monochrome";

type Settings = {
  fontScale: number; // 0..4  (0 = default)
  lineHeight: number; // 0..3
  letterSpacing: number; // 0..3
  readableFont: boolean;
  contrast: Contrast;
  invert: boolean;
  highlightLinks: boolean;
  highlightHeadings: boolean;
  bigCursor: boolean;
  readingGuide: boolean;
  readingMask: boolean;
  stopAnimations: boolean;
  hideImages: boolean;
  keyboardNav: boolean;
};

const DEFAULTS: Settings = {
  fontScale: 0,
  lineHeight: 0,
  letterSpacing: 0,
  readableFont: false,
  contrast: "none",
  invert: false,
  highlightLinks: false,
  highlightHeadings: false,
  bigCursor: false,
  readingGuide: false,
  readingMask: false,
  stopAnimations: false,
  hideImages: false,
  keyboardNav: false,
};

const STORAGE_KEY = "a11y-settings-v1";

function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function applySettings(s: Settings) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  const b = document.body;
  if (!b) return;

  // font scale (steps of 12.5%)
  const scale = 1 + s.fontScale * 0.125;
  html.style.setProperty("--a11y-font-scale", String(scale));

  // line height / spacing
  html.style.setProperty("--a11y-line-height", String(1 + s.lineHeight * 0.25));
  html.style.setProperty("--a11y-letter-spacing", `${s.letterSpacing * 0.05}em`);
  html.style.setProperty("--a11y-word-spacing", `${s.letterSpacing * 0.1}em`);

  const toggle = (name: string, on: boolean) =>
    b.classList.toggle(`a11y-${name}`, on);

  toggle("font-scale", s.fontScale > 0);
  toggle("line-height", s.lineHeight > 0);
  toggle("spacing", s.letterSpacing > 0);
  toggle("readable-font", s.readableFont);
  toggle("contrast-high", s.contrast === "high");
  toggle("contrast-dark", s.contrast === "dark");
  toggle("contrast-light", s.contrast === "light");
  toggle("contrast-mono", s.contrast === "monochrome");
  toggle("invert", s.invert);
  toggle("highlight-links", s.highlightLinks);
  toggle("highlight-headings", s.highlightHeadings);
  toggle("big-cursor", s.bigCursor);
  toggle("stop-animations", s.stopAnimations);
  toggle("hide-images", s.hideImages);
  toggle("keyboard-nav", s.keyboardNav);
  toggle("reading-mask", s.readingMask);
  toggle("reading-guide", s.readingGuide);
}

export function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLDivElement | null>(null);
  const maskTopRef = useRef<HTMLDivElement | null>(null);
  const maskBotRef = useRef<HTMLDivElement | null>(null);

  // hydrate
  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    setMounted(true);
  }, []);

  // apply + persist
  useEffect(() => {
    if (!mounted) return;
    applySettings(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings, mounted]);

  // reading guide / mask - track mouse
  useEffect(() => {
    if (!settings.readingGuide && !settings.readingMask) return;
    const onMove = (e: MouseEvent) => {
      const y = e.clientY;
      if (guideRef.current) guideRef.current.style.top = `${y}px`;
      if (maskTopRef.current) maskTopRef.current.style.height = `${Math.max(0, y - 50)}px`;
      if (maskBotRef.current) {
        maskBotRef.current.style.top = `${y + 50}px`;
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [settings.readingGuide, settings.readingMask]);

  // Esc to close + focus trap
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    // focus first control
    setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>('button, [href], input, select, textarea')
        ?.focus();
    }, 50);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = () => {
    setSettings(DEFAULTS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const bump = (key: "fontScale" | "lineHeight" | "letterSpacing", delta: number, max = 4) => {
    setSettings((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(max, prev[key] + delta)),
    }));
  };

  return (
    <>
      {/* Skip link */}
      <a href="#main-content" className="a11y-skip-link">
        דלג לתוכן הראשי
      </a>

      {/* Reading guide */}
      {settings.readingGuide && (
        <div ref={guideRef} className="a11y-reading-guide" aria-hidden="true" />
      )}

      {/* Reading mask */}
      {settings.readingMask && (
        <>
          <div ref={maskTopRef} className="a11y-reading-mask a11y-reading-mask-top" aria-hidden="true" />
          <div ref={maskBotRef} className="a11y-reading-mask a11y-reading-mask-bot" aria-hidden="true" />
        </>
      )}

      {/* Floating button */}
      <button
        ref={buttonRef}
        type="button"
        aria-label="תפריט נגישות"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className="a11y-fab"
        dir="rtl"
      >
        <AccessibilityIcon />
      </button>

      {/* Panel */}
      {open && (
        <>
          <div className="a11y-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="a11y-panel-title"
            dir="rtl"
            lang="he"
            className="a11y-panel"
          >
            <div className="a11y-panel-header">
              <h2 id="a11y-panel-title">תפריט נגישות</h2>
              <button
                type="button"
                aria-label="סגור תפריט נגישות"
                onClick={() => {
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
                className="a11y-close"
              >
                ✕
              </button>
            </div>

            <div className="a11y-panel-body">
              <Group title="גודל טקסט">
                <Stepper
                  label="גודל טקסט"
                  value={settings.fontScale}
                  onDec={() => bump("fontScale", -1)}
                  onInc={() => bump("fontScale", 1)}
                />
              </Group>

              <Group title="ריווח">
                <Stepper
                  label="גובה שורה"
                  value={settings.lineHeight}
                  onDec={() => bump("lineHeight", -1, 3)}
                  onInc={() => bump("lineHeight", 1, 3)}
                />
                <Stepper
                  label="ריווח אותיות ומילים"
                  value={settings.letterSpacing}
                  onDec={() => bump("letterSpacing", -1, 3)}
                  onInc={() => bump("letterSpacing", 1, 3)}
                />
                <Toggle
                  label="גופן קריא"
                  on={settings.readableFont}
                  onChange={(v) => update("readableFont", v)}
                />
              </Group>

              <Group title="ניגודיות וצבע">
                <ContrastButtons value={settings.contrast} onChange={(v) => update("contrast", v)} />
                <Toggle label="היפוך צבעים" on={settings.invert} onChange={(v) => update("invert", v)} />
              </Group>

              <Group title="הדגשות">
                <Toggle
                  label="הדגשת קישורים"
                  on={settings.highlightLinks}
                  onChange={(v) => update("highlightLinks", v)}
                />
                <Toggle
                  label="הדגשת כותרות"
                  on={settings.highlightHeadings}
                  onChange={(v) => update("highlightHeadings", v)}
                />
              </Group>

              <Group title="כלי קריאה וניווט">
                <Toggle label="סמן גדול" on={settings.bigCursor} onChange={(v) => update("bigCursor", v)} />
                <Toggle
                  label="קו הנחיה לקריאה"
                  on={settings.readingGuide}
                  onChange={(v) => update("readingGuide", v)}
                />
                <Toggle
                  label="מסכת קריאה"
                  on={settings.readingMask}
                  onChange={(v) => update("readingMask", v)}
                />
                <Toggle
                  label="ניווט מקלדת מודגש"
                  on={settings.keyboardNav}
                  onChange={(v) => update("keyboardNav", v)}
                />
              </Group>

              <Group title="מדיה ואנימציה">
                <Toggle
                  label="עצירת אנימציות"
                  on={settings.stopAnimations}
                  onChange={(v) => update("stopAnimations", v)}
                />
                <Toggle
                  label="הסתרת תמונות"
                  on={settings.hideImages}
                  onChange={(v) => update("hideImages", v)}
                />
              </Group>

              <div className="a11y-actions">
                <button type="button" className="a11y-reset" onClick={reset}>
                  איפוס כל ההגדרות
                </button>
                <Link
                  to="/accessibility"
                  onClick={() => setOpen(false)}
                  className="a11y-statement-link"
                >
                  הצהרת נגישות
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="a11y-group">
      <legend>{title}</legend>
      <div className="a11y-group-body">{children}</div>
    </fieldset>
  );
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`a11y-toggle ${on ? "is-on" : ""}`}
    >
      <span>{label}</span>
      <span className="a11y-toggle-state" aria-hidden="true">
        {on ? "פעיל" : "כבוי"}
      </span>
    </button>
  );
}

function Stepper({
  label,
  value,
  onDec,
  onInc,
}: {
  label: string;
  value: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="a11y-stepper">
      <span className="a11y-stepper-label">{label}</span>
      <div className="a11y-stepper-controls">
        <button type="button" aria-label={`הקטן ${label}`} onClick={onDec}>
          −
        </button>
        <span className="a11y-stepper-value" aria-live="polite">
          {value}
        </span>
        <button type="button" aria-label={`הגדל ${label}`} onClick={onInc}>
          +
        </button>
      </div>
    </div>
  );
}

function ContrastButtons({
  value,
  onChange,
}: {
  value: Contrast;
  onChange: (v: Contrast) => void;
}) {
  const opts: { v: Contrast; label: string }[] = [
    { v: "none", label: "רגיל" },
    { v: "high", label: "ניגודיות גבוהה" },
    { v: "dark", label: "מצב חשוך" },
    { v: "light", label: "מצב בהיר" },
    { v: "monochrome", label: "שחור-לבן" },
  ];
  return (
    <div className="a11y-contrast-grid" role="radiogroup" aria-label="מצב ניגודיות">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          role="radio"
          aria-checked={value === o.v}
          onClick={() => onChange(o.v)}
          className={`a11y-contrast-btn ${value === o.v ? "is-on" : ""}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function AccessibilityIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="12" cy="5.5" r="1.6" fill="currentColor" />
      <path
        d="M5 8.5c2.2.8 4.6 1.2 7 1.2s4.8-.4 7-1.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 9.7v4.3m0 0-2.4 6m2.4-6 2.4 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
