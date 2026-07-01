// DOM scanner for the visual editor.
//
// Finds "meaningful" editable elements on the current page — headings,
// paragraphs, buttons, links, media, and top-level semantic containers —
// and stamps them with `data-editor-id` computed from `computeStableId`
// so the existing overrides pipeline works transparently.
//
// Skips technical noise: SVG internals, scripts, hidden/tiny nodes, the
// editor panel itself, and anything under `[data-editor-ignore]`.

import { computeStableId } from "./stable-id";

export type ScannedElement = {
  id: string;
  node: HTMLElement;
  section: string;
  label: string;
  tag: string;
};

// Candidate selector — restrictive on purpose. Adds div/section/article ONLY
// when they look like top-level containers (semantic tag or scope attr).
const CANDIDATE_SELECTOR = [
  "h1","h2","h3","h4","h5","h6",
  "p","blockquote","li",
  "a[href]","button",
  "img","video","picture",
  "section","article","header","footer","main","aside",
  "[data-editor-id]","[data-editor-scope]",
].join(",");

function isVisible(el: HTMLElement): boolean {
  if (el.hidden) return false;
  if (el.getAttribute("aria-hidden") === "true") return false;
  const rect = el.getBoundingClientRect();
  if (rect.width < 8 || rect.height < 8) return false;
  const cs = window.getComputedStyle(el);
  if (cs.display === "none" || cs.visibility === "hidden") return false;
  return true;
}

function isBlacklisted(el: HTMLElement): boolean {
  if (el.closest("[data-editor-panel]")) return true;
  if (el.closest("[data-editor-ignore]")) return true;
  if (el.closest("script,style,noscript,head")) return true;
  // Inside SVG (but not the <svg> root itself) — internal SVG shouldn't be selectable.
  const svg = el.closest("svg");
  if (svg && el !== svg) return true;
  return false;
}

function computeSection(el: HTMLElement): string {
  const manual = el.getAttribute("data-editor-section");
  if (manual) return manual;
  let cur: HTMLElement | null = el.parentElement;
  while (cur && cur !== document.body) {
    const scope = cur.getAttribute("data-editor-scope");
    if (scope) return scope;
    const secLabel = cur.getAttribute("aria-label");
    if (cur.tagName === "SECTION" && secLabel) return secLabel;
    if (cur.tagName === "HEADER") return "כותרת עליונה";
    if (cur.tagName === "FOOTER") return "כותרת תחתונה";
    if (cur.tagName === "ASIDE") return "סרגל צד";
    if (cur.tagName === "MAIN") return "אזור ראשי";
    if (cur.tagName === "SECTION") return "אזור בעמוד";
    cur = cur.parentElement;
  }
  return "כללי";
}

function computeLabel(el: HTMLElement): string {
  const manual = el.getAttribute("data-editor-label");
  if (manual) return manual;
  const tag = el.tagName.toLowerCase();
  if (el.tagName === "IMG") {
    const alt = (el as HTMLImageElement).alt;
    return alt ? `תמונה: ${alt}` : "תמונה";
  }
  if (el.tagName === "VIDEO") return "וידאו";
  if (el.tagName === "A") {
    const t = (el.textContent ?? "").trim().slice(0, 40);
    return t ? `קישור: ${t}` : "קישור";
  }
  if (el.tagName === "BUTTON") {
    const t = (el.textContent ?? "").trim().slice(0, 40);
    return t ? `כפתור: ${t}` : "כפתור";
  }
  if (/^H[1-6]$/.test(el.tagName)) {
    const t = (el.textContent ?? "").trim().slice(0, 50);
    return `${tag}: ${t || "(ריק)"}`;
  }
  const t = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 50);
  if (t) return t;
  return tag;
}

export function scanEditableElements(routePath: string): ScannedElement[] {
  if (typeof document === "undefined") return [];
  const raw = document.body.querySelectorAll<HTMLElement>(CANDIDATE_SELECTOR);
  const results: ScannedElement[] = [];
  const seen = new Set<string>();

  raw.forEach((el) => {
    if (isBlacklisted(el)) return;
    if (!isVisible(el)) return;

    const manualId = el.getAttribute("data-editor-id");
    const id = manualId || computeStableId(el, routePath);
    if (!manualId) {
      // Stamp so highlight, click handlers, and OverridesProvider can find it.
      el.setAttribute("data-editor-id", id);
    }
    if (seen.has(id)) return;
    seen.add(id);

    const section = computeSection(el);
    if (!el.getAttribute("data-editor-section")) {
      el.setAttribute("data-editor-section", section);
    }
    const label = computeLabel(el);

    results.push({
      id,
      node: el,
      section,
      label,
      tag: el.tagName.toLowerCase(),
    });
  });

  return results;
}
