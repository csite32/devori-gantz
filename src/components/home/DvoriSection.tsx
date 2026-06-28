import dvoriAsset from "@/assets/dvori.webp.asset.json";

export function DvoriSection() {
  return (
    <section style={{ width: '100%', background: '#fff', display: 'flex', flexDirection: 'row', direction: 'ltr', alignItems: 'center', minHeight: '80vh', overflow: 'hidden' }}>
      <div style={{ flex: '0 0 50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', order: 2 }}>
        <img src={dvoriAsset.url} alt="דבורי גנץ-אדלר" style={{ width: 'auto', maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block' }} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', textAlign: 'right', direction: 'rtl', padding: '80px 60px', gap: 28, order: 1 }}>
        <h2 style={{ fontFamily: 'Discovery FS, sans-serif', fontWeight: 300, fontSize: 60, lineHeight: '1em', color: 'rgba(158,36,43,1)', textAlign: 'right', margin: 0, direction: 'rtl' }}>
          מה הופך את הקורסים<br />האלו למיוחדים?
        </h2>
        <p style={{ fontFamily: 'Discovery FS, sans-serif', fontWeight: 400, fontSize: 30, lineHeight: '1em', color: 'rgba(82,16,20,1)', textAlign: 'right', margin: 0 }}>
          ניסיון מקצועי של למעלה מ־40 שנה בתחום הפאות והתספורות.<br />
          שיטות עבודה מדויקות שנבנו מתוך ניסיון מעשי רב.<br />
          לימוד ברור, מקצועי ומעשי שניתן ליישם מיד.
        </p>
        <p style={{ fontFamily: 'Discovery FS, sans-serif', fontWeight: 600, fontSize: 30, color: 'rgba(82,16,20,1)', textAlign: 'right', margin: 0 }}>ידע הוא כוח.</p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', direction: 'rtl', textAlign: 'right', width: '100%' }}>
          <div style={{ fontFamily: 'Bateran, cursive', fontWeight: 400, fontSize: 132, lineHeight: '0.85em', color: 'rgba(255,20,20,1)', textAlign: 'right', marginBottom: -15 }}>Dvori</div>
          <div style={{ fontFamily: 'Discovery FS, sans-serif', fontWeight: 400, fontSize: 30, lineHeight: '1.4em', color: 'rgba(82,16,20,1)', textAlign: 'right', marginTop: -28 }}>
            דבורי גנץ-אדלר<br />פאנית ומעצבת פאות
          </div>
        </div>
      </div>
    </section>
  );
}
