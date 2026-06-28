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
}

function CourseBlock({ number, image, imageAlt, decoText, title, description, imageRight = true, showMainTitle = false }: CourseBlockProps) {
  return (
    <section dir="rtl" className="relative w-full overflow-hidden" style={{ background: '#fff', padding: '80px 0 100px' }}>
      <div aria-hidden className="absolute pointer-events-none select-none" style={{
        fontFamily: 'Atletico FS, sans-serif', fontSize: 680, lineHeight: 1,
        color: 'rgba(158,36,43,0.05)', top: '50%', left: number === "02" ? '44%' : '50%',
        transform: 'translate(-50%,-42%)', whiteSpace: 'nowrap', zIndex: 0
      }}>{number}</div>

      {showMainTitle && (
        <h2 className="relative text-center mb-[120px] gsap-title" style={{ fontFamily: 'Discovery FS, sans-serif', fontSize: 60, fontWeight: 300, color: 'rgba(82,16,20,1)', zIndex: 1 }}>
          בחרי את הקורס שמתאים לך
        </h2>
      )}

      <div className="relative mx-auto" style={{ maxWidth: 1300, padding: '0 60px', display: 'grid', gridTemplateColumns: '1fr 1fr', direction: 'ltr', gap: 160, alignItems: 'end', zIndex: 1 }}>
        <div className="flex flex-col" style={{ direction: 'rtl', textAlign: 'right', position: 'relative', minHeight: 500, paddingTop: imageRight ? 200 : 0, justifyContent: imageRight ? 'space-between' : 'center', alignItems: 'flex-end', order: imageRight ? 1 : 2 }}>
          <div aria-hidden className="pointer-events-none select-none" style={{
            fontFamily: 'Bateran, cursive', fontSize: 180, fontWeight: 400,
            color: 'rgba(255,20,20,1)', whiteSpace: 'nowrap', lineHeight: 1,
            position: 'absolute',
            top: imageRight ? 0 : undefined,
            bottom: imageRight ? undefined : 60,
            right: imageRight ? -280 : undefined,
            left: !imageRight ? -260 : undefined,
            width: 'calc(100% + 260px)', zIndex: 3
          }}>{decoText}</div>
          <div style={{ direction: 'rtl', textAlign: 'right', display: 'block', width: '100%' }}>
            <h3 className="gsap-title" style={{ fontFamily: 'Discovery FS, sans-serif', fontSize: 60, fontWeight: 300, color: 'rgba(82,16,20,1)', display: 'block', marginBottom: 12 }}>{title}</h3>
            <p style={{ fontFamily: 'Discovery FS, sans-serif', fontSize: 28, fontWeight: 300, lineHeight: 1.4, color: 'rgba(82,16,20,1)', marginBottom: 12 }}>{description}</p>
            <div style={{ fontFamily: 'Discovery FS, sans-serif', fontSize: 50, fontWeight: 600, color: 'rgba(158,36,43,1)', marginBottom: 8 }}>800 ₪</div>
            <button className="inline-flex items-center group" style={{ gap: 14, padding: '14px 32px', border: '1px solid rgba(158,36,43,1)', borderRadius: 33.5, background: 'transparent', cursor: 'pointer', fontFamily: 'Discovery FS, sans-serif', fontSize: 22, fontWeight: 300, color: 'rgba(82,16,20,1)', direction: 'rtl', marginTop: 15 }}>
              <span>לרכישת הקורס</span>
              <img src={arrowBtnAsset.url} alt="" style={{ width: 28, height: 23 }} className="arrow-hover" />
            </button>
          </div>
        </div>
        <div style={{ order: imageRight ? 2 : 1 }}>
          <img src={image} alt={imageAlt} style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }} />
        </div>
      </div>
    </section>
  );
}

export function CourseSections() {
  return (
    <>
      <CourseBlock number="01" image={butterflyCutAsset.url} imageAlt="בטרפליי קאט" decoText="Butterfly Cut" title="בטרפליי קאט" description="למדי את כל שלבי העבודה, החלוקות, הזוויות והטכניקות ליצירת תספורת מדויקת, מחמיאה ומקצועית." imageRight={true} showMainTitle={true} />
      <CourseBlock number="02" image={shaggyBobAsset.url} imageAlt="שאגי בוב" decoText="Shaggy Bob" title="שאגי בוב" description="קורס מקצועי שילמד אותך כיצד ליצור מראה טבעי, מלא תנועה ונפח, עם כל הדגשים שהופכים את התוצאה למושלמת." imageRight={false} />
      <CourseBlock number="03" image={lobChicAsset.url} imageAlt="לוב שיק" decoText="Lob Chic" title="לוב שיק" description="תספורת קלאסית ועדכנית עם הסברים מפורטים, חלוקות נכונות וטכניקות עבודה מתקדמות." imageRight={true} />
    </>
  );
}
