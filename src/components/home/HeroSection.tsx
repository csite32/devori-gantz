import logoAsset from "@/assets/logo_d.png.asset.json";
import { UserIconLink } from "@/components/auth/UserIconLink";
import arrowAsset from "@/assets/icons/arrow-3.svg.asset.json";
import videoAsset from "@/assets/media/Video-4.mp4.asset.json";
import { useEffect, useRef } from "react";

export function HeroSection() {
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const badge = badgeRef.current;
    if (!badge) return;
    const group = badge.querySelector('#badgeTextGroup') as SVGGElement | null;
    if (!group) return;
    if (group.children.length > 0) return;

    const cx = 100, cy = 100, r = 78;
    const fontSize = 18;
    const text = "40 שנות ניסיון מקצועי – עכשיו גם בדיגיטל   ";
    const reversedText = text.split('').reverse().join('');
    const displayText = reversedText.slice(0, -2) + '40';
    const svgNS = "http://www.w3.org/2000/svg";

    for (let i = 0; i < displayText.length; i++) {
      const angleDeg = -90 + (i * (360 / displayText.length));
      const angleRad = angleDeg * Math.PI / 180;
      const x = cx + r * Math.cos(angleRad);
      const y = cy + r * Math.sin(angleRad);
      const el = document.createElementNS(svgNS, 'text');
      el.setAttribute('x', String(x));
      el.setAttribute('y', String(y));
      el.setAttribute('font-family', 'Discovery FS, sans-serif');
      el.setAttribute('font-size', String(fontSize));
      el.setAttribute('font-weight', '300');
      el.setAttribute('fill', 'rgba(158,36,43,1)');
      el.setAttribute('text-anchor', 'middle');
      el.setAttribute('dominant-baseline', 'central');
      el.setAttribute('transform', `rotate(${angleDeg + 90},${x},${y})`);
      el.textContent = displayText[i];
      group.appendChild(el);
    }
  }, []);

  return (
    <section dir="rtl" className="relative w-full overflow-hidden flex flex-col" style={{ height: '100vh', background: 'rgba(255,238,218,1)' }}>
      <div className="absolute top-0 right-0 h-full z-10 pointer-events-none" style={{ width: '35px', background: 'rgba(208,164,145,0.56)' }} />
      
      <div className="absolute top-0 left-0 bottom-0 z-10 hidden md:block" style={{ width: '44%' }}>
        <video src={videoAsset.url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
      </div>
      <header dir="ltr" className="relative z-20 flex items-center justify-between pr-12 pl-4 pt-5 md:px-[110px] md:pt-6 md:pl-8">
        <UserIconLink />
        <img src={logoAsset.url} alt="דבורי גנץ" className="h-16 md:h-[115px] w-auto object-contain" />
      </header>
      <div className="relative z-20 flex-1 flex items-center pr-12 pl-4 pb-8 md:pl-6 md:pr-[110px] md:pb-[60px] md:max-w-[58%] md:ml-auto">
        <div>
          <h1
            data-editor-id="home.hero.title"
            data-editor-section="עמוד הבית — Hero"
            data-editor-label="כותרת ראשית בהירו"
            className="text-right gsap-title"
            style={{ fontFamily: 'Atletico FS, sans-serif', color: 'rgba(158,36,43,1)', lineHeight: 1.05 }}
          >
            <span
              data-editor-id="home.hero.title.line1"
              data-editor-section="עמוד הבית — Hero"
              data-editor-label="שורת כותרת ראשונה (ראשית)"
              className="block font-bold"
              style={{ fontSize: 'clamp(46px,6vw,117px)' }}
            >
              קורסי התספורות
            </span>
            <span
              data-editor-id="home.hero.title.line2"
              data-editor-section="עמוד הבית — Hero"
              data-editor-label="שורת כותרת שנייה (משנית)"
              className="block font-bold"
              style={{ fontSize: 'clamp(46px,6vw,117px)' }}
            >
              הדיגיטליים
            </span>
            <span className="block font-normal" style={{ fontSize: 'clamp(38px,5vw,95px)' }}>של דבורי גנץ-אדלר</span>
          </h1>
          <p
            data-editor-id="home.hero.subtitle"
            data-editor-section="עמוד הבית — Hero"
            data-editor-label="טקסט משנה בהירו"
            className="mt-6 text-right"
            style={{ fontFamily: 'Discovery FS, sans-serif', fontSize: 'clamp(20px, 4vw, 35px)', fontWeight: 300, lineHeight: '1.1em', color: 'rgba(82,16,20,1)', maxWidth: 650 }}
          >
            ידע, ניסיון וטכניקות מקצועיות שנצברו במשך עשרות שנים – זמינים עבורך בקורסים דיגיטליים מקצועיים, לצפייה מכל מקום ובכל זמן.
          </p>
        </div>
      </div>
      <div ref={badgeRef} className="absolute z-30 w-[120px] h-[120px] md:w-[200px] md:h-[200px]" style={{ bottom: 36, left: 36 }}>
        <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full" style={{ animation: 'badge-spin 25s linear infinite', direction: 'ltr' }}>
          <circle cx="100" cy="100" r="94" fill="none" stroke="rgba(255,20,20,1)" strokeWidth="0.7" />
          <circle cx="100" cy="100" r="62" fill="none" stroke="rgba(255,20,20,1)" strokeWidth="0.7" />
          <g id="badgeTextGroup" />
        </svg>
        <div className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 50, height: 58 }}>
          <img src={arrowAsset.url} alt="" style={{ width: 50, height: 58 }} />
        </div>
      </div>
      <div className="relative z-10 block md:hidden w-full" style={{ height: '60vw' }}>
        <video src={videoAsset.url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
      </div>
    </section>
  );
}
