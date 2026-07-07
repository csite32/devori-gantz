import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/accessibility")({
  head: () => ({
    meta: [
      { title: "הצהרת נגישות | דבורי גנץ-אדלר" },
      {
        name: "description",
        content:
          "הצהרת הנגישות של אתר דבורי גנץ-אדלר – עמידה בת\"י 5568 רמה AA ובתקנות שוויון זכויות לאנשים עם מוגבלות.",
      },
      { property: "og:title", content: "הצהרת נגישות | דבורי גנץ-אדלר" },
      {
        property: "og:description",
        content: "הצהרת הנגישות של אתר דבורי גנץ-אדלר.",
      },
    ],
  }),
  component: AccessibilityStatementPage,
});

function AccessibilityStatementPage() {
  return (
    <main
      id="main-content"
      dir="rtl"
      lang="he"
      className="mx-auto max-w-3xl px-6 py-16 text-brand-primary-dark"
      style={{ fontFamily: 'Discovery FS, sans-serif' }}
    >
      <nav aria-label="ניווט" className="mb-6 text-sm">
        <Link to="/" className="underline">← חזרה לעמוד הבית</Link>
      </nav>

      <h1 className="mb-6 text-4xl font-bold">הצהרת נגישות</h1>

      <p className="mb-4 leading-relaxed">
        אתר דבורי גנץ-אדלר פועל להנגשת האתר לאנשים עם מוגבלות בהתאם לחוק שוויון זכויות
        לאנשים עם מוגבלות התשנ"ח-1998 ולתקנות שוויון זכויות לאנשים עם מוגבלות
        (התאמות נגישות לשירות), תשע"ג-2013.
      </p>

      <h2 className="mt-8 mb-3 text-2xl font-bold">רמת נגישות</h2>
      <p className="mb-4 leading-relaxed">
        האתר הונגש בהתאם לתקן הישראלי ת"י 5568 ברמה AA ולהנחיות
        WCAG 2.1 של ארגון W3C ברמה AA.
      </p>

      <h2 className="mt-8 mb-3 text-2xl font-bold">מועד הנגשת האתר</h2>
      <p className="mb-4 leading-relaxed">
        האתר הונגש לראשונה בשנת 2026 ומתעדכן באופן שוטף.
      </p>

      <h2 className="mt-8 mb-3 text-2xl font-bold">הסדרי הנגישות באתר</h2>
      <ul className="mb-4 list-disc pr-6 leading-relaxed">
        <li>ניתן לנווט באתר במקלדת בלבד באמצעות מקש Tab.</li>
        <li>קיים סמן מיקוד חזותי (Focus) על רכיבים אינטראקטיביים.</li>
        <li>האתר תומך בקוראי מסך (NVDA, JAWS, VoiceOver, TalkBack).</li>
        <li>מבנה סמנטי תקני עם כותרות, אזורי landmark ותוויות ARIA.</li>
        <li>תמיכה מלאה ב-RTL וכיווניות עברית.</li>
        <li>
          תפריט נגישות צף המאפשר: הגדלת/הקטנת טקסט, ריווח שורות ואותיות, גופן קריא,
          ניגודיות גבוהה, מצב חשוך/בהיר, שחור-לבן, היפוך צבעים, הדגשת קישורים וכותרות,
          סמן גדול, קו הנחיה לקריאה, מסכת קריאה, עצירת אנימציות, הסתרת תמונות ואיפוס.
        </li>
        <li>ההעדפות נשמרות בין עמודים ובביקורים חוזרים.</li>
        <li>קישור "דלג לתוכן הראשי" זמין ברכיב הראשון בעמוד.</li>
      </ul>

      <h2 className="mt-8 mb-3 text-2xl font-bold">חלקים או תכנים שאינם נגישים</h2>
      <p className="mb-4 leading-relaxed">
        על אף מאמצינו להנגיש את כל דפי האתר, ייתכן שיתגלו חלקים או תכנים שטרם הונגשו.
        אנו ממשיכים לפעול לשיפור הנגישות באתר במסגרת מאמצינו המתמשכים.
      </p>

      <h2 className="mt-8 mb-3 text-2xl font-bold">פנייה לרכז הנגישות</h2>
      <p className="mb-4 leading-relaxed">
        נתקלתם בבעיית נגישות באתר? נשמח לקבל משוב באמצעות פנייה לרכז הנגישות שלנו:
      </p>
      <ul className="mb-4 list-none pr-0 leading-relaxed">
        <li><strong>שם רכז הנגישות:</strong> [יש למלא על ידי בעל האתר]</li>
        <li><strong>דוא"ל:</strong> [יש למלא על ידי בעל האתר]</li>
        <li><strong>טלפון:</strong> [יש למלא על ידי בעל האתר]</li>
        <li><strong>זמן מענה:</strong> עד 10 ימי עסקים</li>
      </ul>

      <p className="mt-8 text-sm text-brand-primary-dark/70">
        עודכן לאחרונה: ינואר 2026
      </p>
    </main>
  );
}
