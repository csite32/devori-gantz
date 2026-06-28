import scissors1Asset from "@/assets/Scissors1.png.asset.json";
import scissors2Asset from "@/assets/Scissors2.png.asset.json";
import vector2Asset from "@/assets/icons/Vector_2.svg.asset.json";

const BENEFITS = [
  'שיעור מקצועי ומעמיק',
  'הסבר מלא על החלוקות והזוויות',
  'טכניקות עבודה מתקדמות',
  'דגשים מקצועיים שעושים את ההבדל',
  'גישה דיגיטלית מלאה –',
  'לצפייה בכל זמן ומכל מקום',
];

export function BenefitsSection() {
  return (
    <section dir="rtl" className="relative w-full overflow-hidden text-center" style={{ background: 'rgba(255,238,218,1)', padding: '100px' }}>
      <h2 style={{ fontFamily: 'Discovery FS, sans-serif', fontWeight: 300, fontSize: 60, color: 'rgba(82,16,20,1)', textAlign: 'center', margin: '0 0 70px 0', position: 'relative', zIndex: 2 }}>
        בכל קורס תקבלי:
      </h2>
      <div className="relative inline-block text-center" style={{ zIndex: 1 }}>
        <img src={scissors1Asset.url} alt="" aria-hidden style={{ position: 'absolute', width: 567, top: -160, right: -260, transform: 'rotate(5deg) translateY(26px)', zIndex: 3, pointerEvents: 'none' }} />
        <img src={scissors2Asset.url} alt="" aria-hidden style={{ position: 'absolute', width: 420, bottom: -40, left: -220, transform: 'rotate(-6deg)', zIndex: 3, pointerEvents: 'none' }} />
        <div style={{ fontFamily: 'Atletico FS, sans-serif', fontWeight: 400, fontSize: 92, lineHeight: '1.6em', color: 'rgba(82,16,20,1)', textAlign: 'center', position: 'relative', zIndex: 2, display: 'block', width: '100%' }}>
          {BENEFITS.map((item) => (
            <p key={item} style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 14, width: '100%' }}>
              <span style={{ order: 1 }}>{item}</span>
              <span style={{ order: 2, display: 'inline-flex', alignItems: 'flex-start', flexShrink: 0, marginTop: 36 }}>
                <img src={vector2Asset.url} alt="" style={{ width: 28, height: 28 }} />
              </span>
            </p>
          ))}
        </div>
      </div>
      <div style={{ width: '85%', height: 1, background: 'rgba(229,197,177,1)', margin: '60px auto' }} />
      <div style={{ fontFamily: 'Discovery FS, sans-serif', fontSize: 35, fontWeight: 300, color: 'rgba(82,16,20,1)', textAlign: 'center', lineHeight: '1em', position: 'relative', zIndex: 2 }}>
        <p style={{ margin: 0 }}>
          המטרה שלי היא לא שתעתיקי אותי.<br />
          אני רוצה שתביני.<br />
          שתביני את החלוקות.<br />
          שתביני את הזוויות.<br />
          <strong style={{ fontWeight: 600 }}>שתביני את החשיבה שמאחורי הגזירה.</strong><br />
          <strong style={{ fontWeight: 600 }}>כי ברגע שמבינים – הידיים כבר יודעות לעבוד.</strong>
        </p>
      </div>
    </section>
  );
}
