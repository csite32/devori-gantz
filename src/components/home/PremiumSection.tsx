import premium1Asset from "@/assets/courses/Premium1.webp.asset.json";
import premium2Asset from "@/assets/courses/Premium2.webp.asset.json";
import premium3Asset from "@/assets/courses/Premium3.webp.asset.json";
import arrowBtn2Asset from "@/assets/icons/Arrow_button2.svg.asset.json";
import vectorAsset from "@/assets/icons/Vector.svg.asset.json";

export function PremiumSection({ bundleText }: { bundleText: string }) {
  return (
    <section dir="rtl" className="premium-section-wrapper relative w-full overflow-hidden flex flex-col" style={{ minHeight: '100vh', background: 'rgba(82,16,20,1)' }}>

      {/* Premium package דקורטיבי */}
      <div aria-hidden className="premium-deco absolute pointer-events-none select-none text-center" style={{
        fontFamily: 'Bateran, cursive', fontSize: 260, fontWeight: 400,
        color: 'rgba(255,255,255,1)', top: 20, left: '50%',
        transform: 'translateX(-50%)', whiteSpace: 'nowrap', lineHeight: 1, zIndex: 1
      }}>Premium package</div>

      {/* גוף — desktop: grid, mobile: override ב-CSS */}
      <div className="premium-body relative flex-1 mx-auto w-full" style={{
        maxWidth: 1300,
        padding: '40px 60px 80px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        direction: 'ltr',
        alignItems: 'end',
        alignContent: 'center',
        gap: 40,
        zIndex: 2,
        boxSizing: 'border-box'
      }}>

        {/* עמודת תוכן — גריד col 1 (שמאל) */}
        <div style={{
          gridColumn: 1,
          direction: 'rtl',
          textAlign: 'right',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 20,
          paddingTop: 50
        }}>
          <h2 className="gsap-title" style={{ fontFamily: 'Discovery FS, sans-serif', fontSize: 'clamp(28px, 5vw, 60px)', lineHeight: '1.1em', color: 'white', textAlign: 'right', margin: 0, width: '100%' }}>
            <span style={{ fontWeight: 600, display: 'block', lineHeight: '1.1em', margin: 0, padding: 0 }}>חבילת פרימיום -</span>
            <span style={{ fontWeight: 300, display: 'block', lineHeight: '1.1em', margin: 0, padding: 0, whiteSpace: 'nowrap' }}>כל 3 הקורסים במחיר מיוחד</span>
          </h2>
          <div style={{ direction: 'rtl', textAlign: 'right', width: '100%', paddingRight: 30, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'right', direction: 'rtl', width: '100%' }}>
              <p style={{ fontFamily: 'Discovery FS, sans-serif', fontSize: 'clamp(14px, 2vw, 26px)', fontWeight: 300, color: 'white', textAlign: 'right', margin: 0, width: '100%' }}>
                חבילת פרימיום - כל 3 הקורסים במחיר מיוחד
              </p>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 16, direction: 'rtl', width: '100%', flexWrap: 'wrap' }}>
                {['יותר ידע', 'יותר כלים', 'יותר ביטחון מקצועי'].map(item => (
                  <span key={item} style={{ fontFamily: 'Discovery FS, sans-serif', fontSize: 'clamp(14px, 2vw, 26px)', fontWeight: 300, color: 'white', display: 'inline-flex', alignItems: 'center', gap: 6, flexDirection: 'row', textAlign: 'right' }}>
                    <img src={vectorAsset.url} alt="" style={{ width: 20, height: 20, flexShrink: 0 }} />
                    {item}
                  </span>
                ))}
              </div>
              <p style={{ fontFamily: 'Discovery FS, sans-serif', fontSize: 'clamp(14px, 2vw, 26px)', fontWeight: 300, color: 'white', textAlign: 'right', margin: 0 }}>
                רכשי את 3 הקורסים יחד ותיהני מ־25% הנחה!
              </p>
            </div>
            <div style={{ fontFamily: 'Discovery FS, sans-serif', fontSize: 'clamp(24px, 4vw, 50px)', fontWeight: 600, color: 'white', textAlign: 'right', direction: 'rtl', width: '100%', margin: 0 }}>
              1,500 ₪ <span style={{ fontWeight: 600 }}>במקום 1,740 ₪</span>
            </div>
            <div style={{ width: '100%', textAlign: 'right' }}>
              <a href="https://pay.grow.link/MTAyNzQ2~f1c15c4145daff9afe7167b00da09c11-MzY1NTkxOQ" className="inline-flex items-center group" style={{ gap: 14, padding: '16px 40px', background: 'white', color: 'rgba(82,16,20,1)', fontFamily: 'Discovery FS, sans-serif', fontSize: 'clamp(14px, 2vw, 25px)', fontWeight: 300, border: 'none', borderRadius: 33.5, cursor: 'pointer', direction: 'rtl', textDecoration: 'none' }}>
                <span>לרכישת חבילת פרימיום</span>
                <img src={arrowBtn2Asset.url} alt="" style={{ width: 28, height: 23 }} className="premium-arrow-hover" />
              </a>
            </div>
          </div>
        </div>

        {/* עמודת תמונות — גריד col 2 (ימין) */}
        <div className="premium-images-wrap" style={{
          gridColumn: 2,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          height: 460
        }}>
          {[
            { src: premium1Asset.url, mt: 0 },
            { src: premium2Asset.url, mt: 70 },
            { src: premium3Asset.url, mt: 0 }
          ].map(({ src, mt }, i) => (
            <div key={i} className="premium-parallax-img" style={{ flex: '0 0 237px', width: 237, height: '100%', overflow: 'hidden', borderRadius: 4, marginTop: mt }}>
              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
