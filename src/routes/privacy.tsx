import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "מדיניות פרטיות | דבורי גנץ-אדלר" },
      {
        name: "description",
        content:
          "מדיניות הפרטיות של אתר דבורי גנץ-אדלר – איסוף מידע, שימוש בעוגיות, אבטחה וזכויות משתמשים.",
      },
      { property: "og:title", content: "מדיניות פרטיות | דבורי גנץ-אדלר" },
      {
        property: "og:description",
        content: "מדיניות הפרטיות של אתר דבורי גנץ-אדלר.",
      },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
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

      <h1 className="mb-6 text-4xl font-bold">מדיניות פרטיות – דבורי גנץ – אדלר</h1>

      <h2 className="mt-8 mb-3 text-2xl font-bold">1. מבוא</h2>
      <p className="mb-3 leading-relaxed">
        1.1. אתר דבורי גנץ – אדלר (להלן: "האתר", "החברה", "אנחנו", "שלנו") מכבד את פרטיות המשתמשים ופועל בהתאם להוראות חוק הגנת הפרטיות, תשמ"א-1981, התקנות מכוחו והנחיות הרשות להגנת הפרטיות.
      </p>
      <p className="mb-3 leading-relaxed">
        1.2. מטרת מדיניות זו היא להסביר כיצד אנו אוספים, משתמשים, שומרים ומגנים על מידע אישי הנמסר במסגרת השימוש באתר ובמערכת הקורסים הדיגיטלית.
      </p>
      <p className="mb-3 leading-relaxed">
        1.3. השימוש באתר, רכישת קורסים, יצירת חשבון משתמש והכניסה לאזור האישי מהווים הסכמה למדיניות זו.
      </p>

      <h2 className="mt-8 mb-3 text-2xl font-bold">2. סוגי המידע הנאסף</h2>

      <h3 className="mt-6 mb-2 text-xl font-bold">2.1 מידע הנמסר על ידי המשתמש</h3>
      <p className="mb-3 leading-relaxed">
        בעת השימוש באתר או יצירת חשבון משתמש, ייתכן שתתבקשו למסור מידע אישי כגון:
      </p>
      <ul className="mb-4 list-disc pr-6 leading-relaxed">
        <li>שם פרטי ושם משפחה.</li>
        <li>כתובת דואר אלקטרוני.</li>
        <li>פרטי חשבון המשתמש.</li>
        <li>מידע הנמסר במסגרת פנייה לשירות הלקוחות.</li>
      </ul>

      <h3 className="mt-6 mb-2 text-xl font-bold">2.2 מידע הנאסף במסגרת מערכת הקורסים</h3>
      <p className="mb-3 leading-relaxed">
        לצורך מתן השירות וניהול מערכת הקורסים נשמר מידע תפעולי, לרבות:
      </p>
      <ul className="mb-4 list-disc pr-6 leading-relaxed">
        <li>הקורסים אליהם ניתנה למשתמש הרשאת גישה.</li>
        <li>התקדמות הלמידה.</li>
        <li>השיעור האחרון שנצפה.</li>
        <li>סטטוס השלמת שיעורים.</li>
        <li>תוצאות חידונים או משימות, ככל שקיימים.</li>
        <li>נתוני התחברות ושימוש במערכת.</li>
        <li>היסטוריית פעילות הדרושה להפעלת השירות.</li>
      </ul>

      <h3 className="mt-6 mb-2 text-xl font-bold">2.3 מידע הנאסף אוטומטית</h3>
      <p className="mb-3 leading-relaxed">
        האתר עושה שימוש ב-Google Analytics, ובמסגרת זו עשוי להיאסף מידע כגון:
      </p>
      <ul className="mb-4 list-disc pr-6 leading-relaxed">
        <li>כתובת IP.</li>
        <li>סוג דפדפן.</li>
        <li>סוג מכשיר.</li>
        <li>מערכת הפעלה.</li>
        <li>דפים שנצפו.</li>
        <li>משך השהייה באתר.</li>
        <li>Cookies.</li>
      </ul>

      <h2 className="mt-8 mb-3 text-2xl font-bold">3. רכישת קורסים ותשלומים</h2>
      <p className="mb-3 leading-relaxed">3.1. רכישת הקורסים מתבצעת באמצעות דפי תשלום חיצוניים של GROW.</p>
      <p className="mb-3 leading-relaxed">3.2. הזנת פרטי התשלום וביצוע העסקה מתבצעים במערכת GROW בלבד ובהתאם למדיניות הפרטיות ולתנאי השימוש שלה.</p>
      <p className="mb-3 leading-relaxed">3.3. האתר אינו שומר פרטי אשראי או אמצעי תשלום.</p>
      <p className="mb-3 leading-relaxed">3.4. לאחר השלמת הרכישה מתקבל המידע הנדרש לצורך יצירת חשבון המשתמש ומתן הרשאות הגישה לקורסים שנרכשו.</p>

      <h2 className="mt-8 mb-3 text-2xl font-bold">4. מטרות השימוש במידע</h2>
      <p className="mb-3 leading-relaxed">המידע נאסף ומשמש בין היתר לצרכים הבאים:</p>
      <ul className="mb-4 list-disc pr-6 leading-relaxed">
        <li>יצירת וניהול חשבון המשתמש.</li>
        <li>מתן גישה לקורסים שנרכשו.</li>
        <li>ניהול הרשאות צפייה.</li>
        <li>שמירת התקדמות הלמידה.</li>
        <li>מתן שירות ותמיכה.</li>
        <li>אבטחת מערכת הקורסים.</li>
        <li>מניעת שימוש בלתי מורשה.</li>
        <li>שיפור חוויית המשתמש.</li>
        <li>הפקת נתונים סטטיסטיים באמצעות Google Analytics.</li>
        <li>עמידה בדרישות הדין.</li>
      </ul>

      <h2 className="mt-8 mb-3 text-2xl font-bold">5. האזור האישי</h2>
      <p className="mb-3 leading-relaxed">5.1. לאחר רכישת קורס והשלמת תהליך ההרשמה נוצר עבור המשתמש חשבון אישי.</p>
      <p className="mb-3 leading-relaxed">5.2. באזור האישי יוצגו, בין היתר:</p>
      <ul className="mb-4 list-disc pr-6 leading-relaxed">
        <li>שם המשתמש.</li>
        <li>כתובת הדואר האלקטרוני.</li>
        <li>הקורסים שנרכשו.</li>
        <li>הרשאות הגישה.</li>
        <li>התקדמות הלמידה.</li>
        <li>השיעור האחרון שנצפה.</li>
      </ul>
      <p className="mb-3 leading-relaxed">5.3. המשתמש רשאי לעדכן את פרטיו האישיים באזור האישי, ככל שהדבר מתאפשר במערכת.</p>
      <p className="mb-3 leading-relaxed">5.4. המשתמש אחראי לשמור על סודיות פרטי ההתחברות שלו ולא להעבירם לאחרים.</p>
      <p className="mb-3 leading-relaxed">5.5. החברה רשאית להגביל או להשעות גישה לחשבון במקרה של שימוש בניגוד לדין, לתנאי השימוש או במקרה של חשד לשימוש בלתי מורשה.</p>

      <h2 className="mt-8 mb-3 text-2xl font-bold">6. שימוש בעוגיות (Cookies)</h2>
      <p className="mb-3 leading-relaxed">6.1. האתר עושה שימוש בעוגיות לצורך:</p>
      <ul className="mb-4 list-disc pr-6 leading-relaxed">
        <li>תפעול תקין של האתר.</li>
        <li>שמירת התחברות המשתמש.</li>
        <li>ניהול האזור האישי.</li>
        <li>אבטחת המערכת.</li>
        <li>ניתוח נתוני שימוש.</li>
        <li>שיפור חוויית המשתמש.</li>
      </ul>
      <p className="mb-3 leading-relaxed">6.2. ניתן לחסום או למחוק Cookies באמצעות הגדרות הדפדפן, אולם פעולה זו עלולה לפגוע בתפקוד חלק משירותי האתר.</p>

      <h2 className="mt-8 mb-3 text-2xl font-bold">7. שיתוף מידע עם צדדים שלישיים</h2>
      <p className="mb-3 leading-relaxed">המידע האישי עשוי להיות מועבר לצדדים שלישיים רק במקרים הבאים:</p>
      <ul className="mb-4 list-disc pr-6 leading-relaxed">
        <li>GROW – לצורך ביצוע רכישת הקורסים.</li>
        <li>Google Analytics – לצורך ניתוח סטטיסטי של פעילות האתר.</li>
        <li>ספקי שירות טכנולוגיים המסייעים באחסון האתר, הפעלת מערכת הקורסים, גיבוי המידע ואבטחתו.</li>
        <li>כאשר קיימת חובה חוקית או דרישה של רשות מוסמכת.</li>
      </ul>
      <p className="mb-3 leading-relaxed">המידע יועבר רק במידה הנדרשת לצורך מתן השירות ובהתאם להוראות הדין.</p>

      <h2 className="mt-8 mb-3 text-2xl font-bold">8. אבטחת מידע</h2>
      <p className="mb-3 leading-relaxed">8.1. החברה נוקטת באמצעי אבטחה טכנולוגיים וארגוניים סבירים ומקובלים לשם הגנה על המידע האישי.</p>
      <p className="mb-3 leading-relaxed">8.2. הגישה למידע מוגבלת לעובדים ולגורמים מורשים בלבד.</p>
      <p className="mb-3 leading-relaxed">8.3. נעשים מאמצים סבירים להגן על חשבונות המשתמשים, נתוני ההרשאות ותכני מערכת הקורסים מפני גישה בלתי מורשית.</p>

      <h2 className="mt-8 mb-3 text-2xl font-bold">9. שמירת מידע ואופן עיבודו</h2>
      <p className="mb-3 leading-relaxed">9.1. המידע שנמסר באתר נשמר במערכות האתר, בשרתי האחסון ובמאגרי המידע המשמשים להפעלת מערכת הקורסים.</p>
      <p className="mb-3 leading-relaxed">9.2. מידע הנוגע לחשבונות המשתמשים, להרשאות הגישה לקורסים, להתקדמות הלמידה ולנתוני השימוש נשמר לצורך אספקת השירות וניהול תקין של החשבון.</p>
      <p className="mb-3 leading-relaxed">9.3. פניות לשירות הלקוחות עשויות להישלח ולהישמר גם במערכות הדואר האלקטרוני של החברה.</p>
      <p className="mb-3 leading-relaxed">9.4. המידע אינו נמחק באופן אוטומטי ועשוי להישמר לאורך זמן לצרכים תפעוליים, שירותיים, עסקיים או משפטיים.</p>

      <h2 className="mt-8 mb-3 text-2xl font-bold">10. זכויות המשתמש</h2>
      <p className="mb-3 leading-relaxed">
        בהתאם להוראות חוק הגנת הפרטיות, כל אדם רשאי לבקש לעיין במידע אישי המוחזק עליו וכן לבקש את תיקונו, בכפוף להוראות הדין ולסייגים הקבועים בו.
      </p>

      <h2 className="mt-8 mb-3 text-2xl font-bold">11. קטינים</h2>
      <p className="mb-3 leading-relaxed">
        האתר מיועד לבגירים. ככל שקטין עושה שימוש באתר, הדבר ייעשה באישור הורה או אפוטרופוס.
      </p>

      <h2 className="mt-8 mb-3 text-2xl font-bold">12. אבטחת תכני הקורסים</h2>
      <p className="mb-3 leading-relaxed">12.1. כל הקורסים, הסרטונים, המסמכים, המצגות, ההקלטות, חומרי הלימוד והתכנים המופיעים באתר הינם קניינה הרוחני של החברה או של בעלי הזכויות שהתירו את השימוש בהם.</p>
      <p className="mb-3 leading-relaxed">12.2. התכנים מיועדים לשימושו האישי של המשתמש שרכש את הקורס בלבד.</p>
      <p className="mb-3 leading-relaxed">12.3. אין להעתיק, לשכפל, לצלם, להקליט, להפיץ, לשדר, לפרסם, להעביר לאחרים, להעמיד לרשות הציבור או לעשות כל שימוש מסחרי בתכני האתר, כולם או חלקם, ללא אישור מראש ובכתב מהחברה.</p>
      <p className="mb-3 leading-relaxed">12.4. אין להעביר את פרטי ההתחברות או לאפשר שימוש בחשבון למשתמש אחר.</p>
      <p className="mb-3 leading-relaxed">12.5. במקרה של חשד לשיתוף חשבון, הפצת תכנים או שימוש בלתי מורשה, החברה רשאית להגביל או לבטל את הגישה למערכת הקורסים, וזאת מבלי לגרוע מכל זכות אחרת העומדת לה על פי דין.</p>

      <h2 className="mt-8 mb-3 text-2xl font-bold">13. שינויים במדיניות</h2>
      <p className="mb-3 leading-relaxed">
        החברה רשאית לעדכן את מדיניות הפרטיות מעת לעת. כל שינוי מהותי יפורסם באתר וייכנס לתוקף עם פרסומו.
      </p>

      <h2 className="mt-8 mb-3 text-2xl font-bold">14. יצירת קשר</h2>
      <p className="mb-3 leading-relaxed">
        לשאלות, בקשות או בירורים בנוגע למדיניות פרטיות זו ניתן לפנות באמצעות פרטי ההתקשרות המופיעים באתר.
      </p>

      <p className="mt-8 text-sm text-brand-primary-dark/70">
        עודכן לאחרונה: ינואר 2026
      </p>
    </main>
  );
}
