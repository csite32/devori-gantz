// Simple Hebrew→Latin slug helper for course slugs.
const HEB_MAP: Record<string, string> = {
  א: "a", ב: "b", ג: "g", ד: "d", ה: "h", ו: "v", ז: "z", ח: "h",
  ט: "t", י: "y", כ: "k", ך: "k", ל: "l", מ: "m", ם: "m", נ: "n",
  ן: "n", ס: "s", ע: "a", פ: "p", ף: "f", צ: "tz", ץ: "tz",
  ק: "k", ר: "r", ש: "sh", ת: "t",
};

export function slugify(input: string): string {
  if (!input) return "";
  const transliterated = Array.from(input)
    .map((ch) => HEB_MAP[ch] ?? ch)
    .join("");
  const slug = transliterated
    .toLowerCase()
    .replace(/['"׳״`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || `course-${Date.now().toString(36)}`;
}
