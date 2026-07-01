// Deterministic stable identifier for a DOM node, used by the visual editor
// as the key in the `ui_overrides` table.
//
// Format: auto::{routePath}::{anchor}::{path}::{textHash?}
// - routePath: TanStack pathname (e.g. "/dashboard"). Dynamic segments are
//   already replaced with param names by the caller when needed.
// - anchor: nearest ancestor with a stable hook — [id], [data-editor-scope],
//   or the semantic tag (main/section/header/footer/aside). Falls back to
//   "body".
// - path: chain from anchor to node as `tag:nth-of-type(n)` segments.
// - textHash: 8-char hash of the first 40 chars of textContent, only for
//   text-bearing leaf tags. Helps disambiguate siblings; small text edits
//   won't invalidate it if the first 40 chars stay the same-ish.

const TEXT_TAGS = new Set([
  "H1","H2","H3","H4","H5","H6","P","A","BUTTON","LI","BLOCKQUOTE","SPAN",
]);

function shortHash(str: string): string {
  // FNV-1a 32-bit → base36
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(36).padStart(7, "0").slice(0, 8);
}

function nthOfType(el: Element): number {
  let i = 1;
  let sib = el.previousElementSibling;
  while (sib) {
    if (sib.tagName === el.tagName) i++;
    sib = sib.previousElementSibling;
  }
  return i;
}

function findAnchor(el: Element): { node: Element; token: string } {
  let cur: Element | null = el.parentElement;
  while (cur && cur !== document.body) {
    const scope = cur.getAttribute("data-editor-scope");
    if (scope) return { node: cur, token: `scope:${scope}` };
    if (cur.id) return { node: cur, token: `id:${cur.id}` };
    const tag = cur.tagName;
    if (tag === "MAIN" || tag === "SECTION" || tag === "HEADER" || tag === "FOOTER" || tag === "ASIDE" || tag === "ARTICLE") {
      // Prefer semantic anchors, but include nth-of-type so multiple sections don't collide.
      return { node: cur, token: `${tag.toLowerCase()}:${nthOfType(cur)}` };
    }
    cur = cur.parentElement;
  }
  return { node: document.body, token: "body" };
}

function pathFromAnchor(anchor: Element, el: Element): string {
  const parts: string[] = [];
  let cur: Element | null = el;
  while (cur && cur !== anchor) {
    parts.unshift(`${cur.tagName.toLowerCase()}:${nthOfType(cur)}`);
    cur = cur.parentElement;
  }
  return parts.join(">");
}

export function computeStableId(el: HTMLElement, routePath: string): string {
  const { node: anchor, token: anchorToken } = findAnchor(el);
  const path = pathFromAnchor(anchor, el);
  let textHash = "";
  if (TEXT_TAGS.has(el.tagName)) {
    const t = (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
    if (t) textHash = shortHash(t);
  }
  const raw = `auto::${routePath}::${anchorToken}::${path}${textHash ? `::${textHash}` : ""}`;
  return raw;
}
