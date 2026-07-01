// Detects font families actually loaded in the project via @font-face rules
// and CSS custom properties. Does NOT load new fonts — read-only inspection.

export type ProjectFont = {
  family: string;   // e.g. "Bateran"
  stack: string;    // value to set for font-family, e.g. `"Bateran", sans-serif`
};

function readFontFaceFamilies(): Set<string> {
  const found = new Set<string>();
  if (typeof document === "undefined") return found;
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | null = null;
    try {
      rules = sheet.cssRules;
    } catch {
      // Cross-origin sheets throw on cssRules access — skip.
      continue;
    }
    if (!rules) continue;
    for (const rule of Array.from(rules)) {
      // @font-face has type 5 (CSSRule.FONT_FACE_RULE)
      if ((rule as CSSRule).type === 5) {
        const style = (rule as CSSFontFaceRule).style;
        const fam = style.getPropertyValue("font-family").trim();
        if (fam) found.add(fam.replace(/^["']|["']$/g, ""));
      }
    }
  }
  return found;
}

function readLoadedFontFamilies(): Set<string> {
  const found = new Set<string>();
  if (typeof document === "undefined") return found;
  const fs = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (!fs) return found;
  fs.forEach((ff) => {
    const fam = ff.family.replace(/^["']|["']$/g, "").trim();
    if (fam) found.add(fam);
  });
  return found;
}

// Common system stacks we always want available.
const SYSTEM_FONTS: ProjectFont[] = [
  { family: "ברירת מחדל של המערכת", stack: "system-ui, -apple-system, sans-serif" },
  { family: "Serif", stack: "Georgia, 'Times New Roman', serif" },
  { family: "Monospace", stack: "ui-monospace, SFMono-Regular, Menlo, monospace" },
];

export function listProjectFonts(): ProjectFont[] {
  const families = new Set<string>();
  readFontFaceFamilies().forEach((f) => families.add(f));
  readLoadedFontFamilies().forEach((f) => families.add(f));

  const items: ProjectFont[] = Array.from(families)
    .filter((f) => !/^(system-ui|serif|sans-serif|monospace|inherit)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, "he"))
    .map((family) => ({
      family,
      stack: `"${family}", sans-serif`,
    }));

  return [...items, ...SYSTEM_FONTS];
}
