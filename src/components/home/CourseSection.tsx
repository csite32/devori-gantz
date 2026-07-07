import butterflyCutAsset from "@/assets/courses/Butterfly_Cut.webp.asset.json";
import shaggyBobAsset from "@/assets/courses/Shaggy_Bob.webp.asset.json";
import lobChicAsset from "@/assets/courses/Lob_Chic.webp.asset.json";
import arrowBtnAsset from "@/assets/icons/Arrow_button.svg.asset.json";

interface CourseBlockProps {
  number: "01" | "02" | "03";
  image: string;
  imageAlt: string;
  decoText: string;
  title: string;
  description: string;
  imageRight?: boolean;
  showMainTitle?: boolean;
  purchaseUrl: string;
}

function CourseBlock({ number, image, imageAlt, decoText, title, description, imageRight = true, showMainTitle = false, purchaseUrl }: CourseBlockProps) {
  const contentTopPadding = imageRight
    ? number === "03"
      ? "pt-12 md:pt-0"
      : "pt-20 md:pt-20"
    : "";
  return (
    <section dir="rtl" className="relative w-full overflow-hidden pt-6 pb-4 md:pt-[80px] md:pb-[100px]" style={{ background: '#fff' }}>
      {/* מספר רקע — מוסתר במובייל */}
      <div aria-hidden className="absolute pointer-events-none select-none hidden md:block" style={{
        fontFamily: 'Atletico FS, sans-serif', fontSize: 680, lineHeight: 1,
        color: 'rgba(158,36,43,0.05)', top: '50%',
        left: number === "01" ? '44%' : number === "02" ? '47%' : number === "03" ? '42%' : '50%',
        transform: 'translate(-50%,-42%)', whiteSpace: 'nowrap', zIndex: 0
      }}>{number}</div>

      {showMainTitle && (
        <h2 className="relative text-center mb-8 md:mb-[120px] gsap-title px-4 md:px-0"
          style={{ fontFamily: 'Discovery FS, sans-serif', fontSize: 'clamp(28px, 5vw, 60px)', fontWeight: 300, color: 'rgba(82,16,20,1)', zIndex: 1 }}>
          בחרי את הקורס שמתאים לך
        </h2>
      )}

      {/* Layout: בדסקטופ Grid, במובייל עמודה */}
      <div className="relative mx-auto md:grid md:gap-[160px]"
        style={{
          maxWidth: 1300,
          padding: '0 24px',
          gridTemplateColumns: '1fr 1fr',
          direction: 'ltr',
          alignItems: 'end',
          zIndex: 1
        }}>

        {/* עמודת תוכן */}
        <div className={`flex flex-col w-full md:min-h-[500px] ${contentTopPadding}`}
          style={{
            direction: 'rtl', textAlign: 'right', position: 'relative',
            justifyContent: imageRight ? 'space-between' : 'center',
            alignItems: 'flex-end',
            order: imageRight ? 1 : 2
          }}>
          {/* טקסט דקורטיבי — מוסתר במובייל (דסקטופ בלבד) */}
          <div aria-hidden className="pointer-events-none select-none hidden md:block deco-float" style={{
            fontFamily: 'Bateran, cursive', fontSize: 180, fontWeight: 400,
            color: 'rgba(255,20,20,1)', whiteSpace: 'nowrap', lineHeight: 1,
            position: 'absolute',
            top: (imageRight && number !== "03") ? -120 : undefined,
            bottom: (imageRight && number === "03") ? -40 : (!imageRight ? -80 : undefined),
            right: imageRight ? (number === "03" ? -320 : -280) : undefined,
            left: !imageRight ? -480 : undefined,
            width: 'calc(100% + 260px)', zIndex: 3
          }}>{decoText}</div>

          {/* פרטי קורס */}
          <div style={{ direction: 'rtl', textAlign: 'right', display: 'block', width: '100%' }}>
            {/* טקסט אנגלי במובייל — מעל הכותרת העברית */}
            <div aria-hidden className="block md:hidden mb-1 deco-float" style={{
              fontFamily: 'Bateran, cursive', fontSize: 'clamp(40px, 13vw, 72px)', fontWeight: 400,
              color: 'rgba(255,20,20,1)', lineHeight: 1,
              overflow: 'hidden'
            }}>{decoText}</div>
            <h3 className="gsap-title" style={{ fontFamily: 'Discovery FS, sans-serif', fontSize: 'clamp(28px, 4vw, 60px)', fontWeight: 300, color: 'rgba(82,16,20,1)', display: 'block', marginBottom: 12 }}>{title}</h3>
            <p style={{ fontFamily: 'Discovery FS, sans-serif', fontSize: 'clamp(16px, 2.5vw, 28px)', fontWeight: 300, lineHeight: 1.4, color: 'rgba(82,16,20,1)', marginBottom: 12 }}>{description}</p>
            <div style={{ fontFamily: 'Discovery FS, sans-serif', fontSize: 'clamp(28px, 4vw, 50px)', fontWeight: 600, color: 'rgba(158,36,43,1)', marginBottom: 8 }}>800 ₪</div>
            <a href={purchaseUrl} className="inline-flex items-center group" style={{ gap: 14, padding: '14px 32px', border: '1px solid rgba(158,36,43,1)', borderRadius: 33.5, background: 'transparent', cursor: 'pointer', fontFamily: 'Discovery FS, sans-serif', fontSize: 'clamp(16px, 2vw, 22px)', fontWeight: 300, color: 'rgba(82,16,20,1)', direction: 'rtl', marginTop: 15, textDecoration: 'none' }}>
              <span>לרכישת הקורס</span>
              <img src={arrowBtnAsset.url} alt="" style={{ width: 28, height: 23 }} className="arrow-hover" />
            </a>
          </div>
        </div>

        {/* תמונה — מעל התוכן במובייל */}
        <div className="mt-6 mb-0 md:mt-0" style={{ order: imageRight ? 2 : 1 }}>
          <img src={image} alt={imageAlt} style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }} />
        </div>
      </div>
    </section>
  );
}

export function CourseSections() {
  return (
    <>
      <CourseBlock number="01" image={butterflyCutAsset.url} imageAlt="בטרפליי קאט" decoText="Butterfly Cut" title="בטרפליי קאט" description="למדי את כל שלבי העבודה, החלוקות, הזוויות והטכניקות ליצירת תספורת מדויקת, מחמיאה ומקצועית." imageRight={true} showMainTitle={true} purchaseUrl="https://pay.grow.link/MTAyNzQ2~9a960482beaf118ad4c38986822171b4-MzY1NTg2Nw" />
      <CourseBlock number="02" image={shaggyBobAsset.url} imageAlt="שאגי בוב" decoText="Shaggy Bob" title="שאגי בוב" description="קורס מקצועי שילמד אותך כיצד ליצור מראה טבעי, מלא תנועה ונפח, עם כל הדגשים שהופכים את התוצאה למושלמת." imageRight={false} purchaseUrl="https://pay.grow.link/MTAyNzQ2~f53fe1c86cfa93fdf0f9933325aea3e9-MzY1NTg4OA" />
      <CourseBlock number="03" image={lobChicAsset.url} imageAlt="לוב שיק" decoText="Lob Chic" title="לוב שיק" description="תספורת קלאסית ועדכנית עם הסברים מפורטים, חלוקות נכונות וטכניקות עבודה מתקדמות." imageRight={true} purchaseUrl="https://pay.grow.link/MTAyNzQ2~5894efd6209fa0263194035f264a7bbc-MzY1NTg5OQ" />
    </>
  );
}
