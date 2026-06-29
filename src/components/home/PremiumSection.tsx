import premium1Asset from "@/assets/courses/Premium1.webp.asset.json";
import premium2Asset from "@/assets/courses/Premium2.webp.asset.json";
import premium3Asset from "@/assets/courses/Premium3.webp.asset.json";
import arrowBtn2Asset from "@/assets/icons/Arrow_button2.svg.asset.json";
import vectorAsset from "@/assets/icons/Vector.svg.asset.json";

export function PremiumSection() {
  return (
    <section dir="rtl" className="premium-section-wrapper relative w-full overflow-hidden flex flex-col" style={{ minHeight: '100vh', background: 'rgba(82,16,20,1)' }}>
      {/* Premium package — מוקטן במובייל */}
      <div aria-hidden className="premium-deco absolute pointer-events-none select-none text-center" style={{
        fontFamily: 'Bateran, cursive', fontSize: 260, fontWeight: 400,
        color: 'rgba(255,255,255,1)', top: 20, left: '50%',
        transform: 'translateX(-50%)', whiteSpace: 'nowrap', lineHeight: 1, zIndex: 1
      }}>
        {/* דסקטופ */}
        <span className="hidden md:inline">Premium package</span>
        {/* מובייל */}
        <span className="inline md:hidden" style={{ fontSize: 64 }}>Premium package</span>
      </div>

      <div className="relative flex-1 mx-auto w-full flex flex-col md:grid md:gap-[40px]"
        style={{
          maxWidth: 1300,
          padding: '40px 24px 60px',
          gridTemplateColumns: '1fr 1fr',
          direction: 'ltr',
          zIndex: 2,
          boxSizing: 'border-box',
          alignItems: 'end',
          alignContent: 'center'
        }}>

        {/* תמונות — ראשונות במובייל */}
        <div className="premium-images-wrap flex flex-row items-start gap-2 mb-6 md:mb-0 md:h-[460px] h-[220px] md:translate-y-[60px]"
          style={{ gridColumn: 2, order: 1, marginTop: 60 }}>
          {[{ src: premium1Asset.url, mt: 0 }, { src: premium2Asset.url, mt: 0 }, { src: premium3Asset.url, mt: 0 }].map(({ src }, i) => (
            <div key={i} className={`premium-parallax-img flex-1 md:flex-none overflow-hidden rounded-sm h-full ${i === 1 ? 'mt-[25px] md:mt-[70px]' : 'mt-0'}`}
              style={{ width: undefined }}>
              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
            </div>
          ))}
        </div>

        {/* תוכן */}
        <div className="flex flex-col items-end gap-4 md:gap-5 w-full mt-[100px] md:mt-0 md:-translate-y-[120px]"
          style={{ gridColumn: 1, direction: 'rtl', textAlign: 'right', order: 2, paddingTop: 0 }}>

          <h2 className="gsap-title w-full" style={{ fontFamily: 'Discovery FS, sans-serif', fontSize: 'clamp(28px, 5vw, 60px)', lineHeight: '1.1em', color: 'white', textAlign: 'right', margin: 0 }}>
            <span style={{ fontWeight: 600, display: 'block', lineHeight: '1.1em', margin: 0, padding: 0 }}>חבילת פרימיום -</span>
            <span style={{ fontWeight: 300, display: 'block', lineHeight: '1.1em', margin: 0, padding: 0 }}>כל 3 הקורסים במחיר מיוחד</span>
          </h2>

          <div className="w-full flex flex-col items-end gap-3 md:gap-5 md:pr-[30px]" style={{ direction: 'rtl', textAlign: 'right', boxSizing: 'border-box' }}>
            <div className="w-full flex flex-col gap-2" style={{ textAlign: 'right', direction: 'rtl' }}>
              <p style={{ fontFamily: 'Discovery FS, sans-serif', fontSize: 'clamp(14px, 3.5vw, 26px)', fontWeight: 300, color: 'white', textAlign: 'right', margin: 0, width: '100%' }}>
                חבילת פרימיום - כל 3 הקורסים במחיר מיוחד
              </p>
              <div className="flex flex-row flex-wrap gap-3 w-full" style={{ direction: 'rtl' }}>
                {['יותר ידע', 'יותר כלים', 'יותר ביטחון מקצועי'].map(item => (
                  <span key={item} style={{ fontFamily: 'Discovery FS, sans-serif', fontSize: 'clamp(14px, 3.5vw, 26px)', fontWeight: 300, color: 'white', display: 'inline-flex', alignItems: 'center', gap: 6, flexDirection: 'row', textAlign: 'right' }}>
                    <img src={vectorAsset.url} alt="" style={{ width: 18, height: 18, flexShrink: 0 }} />
                    {item}
                  </span>
                ))}
              </div>
              <p style={{ fontFamily: 'Discovery FS, sans-serif', fontSize: 'clamp(14px, 3.5vw, 26px)', fontWeight: 300, color: 'white', textAlign: 'right', margin: 0 }}>
                רכשי את 3 הקורסים יחד ותיהני מ־25% הנחה!
              </p>
            </div>
            <div style={{ fontFamily: 'Discovery FS, sans-serif', fontSize: 'clamp(24px, 5vw, 50px)', fontWeight: 600, color: 'white', textAlign: 'right', direction: 'rtl', width: '100%', margin: 0 }}>
              1,800 ₪ <span style={{ fontWeight: 600 }}>במקום 2,400 ₪.</span>
            </div>
            <div style={{ width: '100%', textAlign: 'right' }}>
              <button className="inline-flex items-center group" style={{ gap: 12, padding: '12px 28px', background: 'white', color: 'rgba(82,16,20,1)', fontFamily: 'Discovery FS, sans-serif', fontSize: 'clamp(14px, 3.5vw, 25px)', fontWeight: 300, border: 'none', borderRadius: 33.5, cursor: 'pointer', direction: 'rtl' }}>
                <span>לרכישת חבילת פרימיום</span>
                <img src={arrowBtn2Asset.url} alt="" style={{ width: 24, height: 20 }} className="premium-arrow-hover" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
