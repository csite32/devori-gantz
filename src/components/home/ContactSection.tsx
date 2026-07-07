export function ContactSection() {
  return (
    <section dir="rtl" className="w-full" style={{ background: 'rgba(255,238,218,1)' }}>
      <div className="mx-auto px-6 text-center md:px-[24px]" style={{ maxWidth: 1300, paddingTop: 60, paddingBottom: 60 }}>
        <h2
          className="gsap-title"
          style={{
            fontFamily: 'Discovery FS, sans-serif',
            fontWeight: 300,
            fontSize: 'clamp(28px, 5vw, 60px)',
            color: 'rgba(82,16,20,1)',
            textAlign: 'center',
            margin: '0 0 40px 0',
          }}
        >
          יש לכם שאלה? אנחנו כאן בשבילכם
        </h2>

        <div className="flex flex-col items-start justify-center gap-8 md:flex-row md:items-center md:gap-16">
          <a
            href="tel:035687631"
            className="group inline-flex items-center gap-4 no-underline transition-colors"
            style={{ direction: 'rtl' }}
            aria-label="טלפון או WhatsApp: 03-568-7631"
          >
            <span
              className="inline-flex items-center justify-center rounded-full transition-transform group-hover:scale-105"
              style={{ width: 52, height: 52, background: 'rgba(158,36,43,1)', flexShrink: 0 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: '#fff' }}
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13 1 .37 1.97.72 2.9a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.18-1.18a2 2 0 0 1 2.11-.45c.93.35 1.9.59 2.9.72A2 2 0 0 1 22 16.92z" />
              </svg>
            </span>
            <span className="flex flex-col items-start text-right">
              <span
                style={{
                  fontFamily: 'Discovery FS, sans-serif',
                  fontWeight: 300,
                  fontSize: 'clamp(16px, 2vw, 22px)',
                  color: 'rgba(82,16,20,1)',
                }}
              >
                טלפון / WhatsApp
              </span>
              <span
                style={{
                  fontFamily: 'Discovery FS, sans-serif',
                  fontWeight: 600,
                  fontSize: 'clamp(20px, 3vw, 34px)',
                  color: 'rgba(158,36,43,1)',
                }}
              >
                03-568-7631
              </span>
            </span>
          </a>

          <a
            href="mailto:Ganz.wigs@gmail.com"
            className="group inline-flex items-center gap-4 no-underline transition-colors"
            style={{ direction: 'rtl' }}
            aria-label="אימייל: Ganz.wigs@gmail.com"
          >
            <span
              className="inline-flex items-center justify-center rounded-full transition-transform group-hover:scale-105"
              style={{ width: 52, height: 52, background: 'rgba(158,36,43,1)', flexShrink: 0 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: '#fff' }}
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </span>
            <span className="flex flex-col items-start text-right">
              <span
                style={{
                  fontFamily: 'Discovery FS, sans-serif',
                  fontWeight: 300,
                  fontSize: 'clamp(16px, 2vw, 22px)',
                  color: 'rgba(82,16,20,1)',
                }}
              >
                אימייל
              </span>
              <span
                style={{
                  fontFamily: 'Discovery FS, sans-serif',
                  fontWeight: 600,
                  fontSize: 'clamp(20px, 3vw, 34px)',
                  color: 'rgba(158,36,43,1)',
                }}
              >
                Ganz.wigs@gmail.com
              </span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
