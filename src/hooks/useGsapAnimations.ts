import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useGsapAnimations() {
  useEffect(() => {
    const titles = document.querySelectorAll<HTMLElement>(".gsap-title");

    titles.forEach((title) => {
      if (title.querySelector(".gsap-title-inner")) return;

      title.style.overflow = "hidden";

      const inner = document.createElement("span");
      inner.className = "gsap-title-inner";
      inner.style.display = "inline-block";
      inner.style.width = "100%";

      while (title.firstChild) {
        inner.appendChild(title.firstChild);
      }
      title.appendChild(inner);

      gsap.set(inner, {
        clipPath: "inset(0 0 100% 0)",
        y: -25,
        opacity: 1,
      });

      gsap.to(inner, {
        clipPath: "inset(0% 0 0% 0)",
        y: 0,
        duration: 1.0,
        ease: "power3.out",
        scrollTrigger: {
          trigger: title,
          start: "top 85%",
          end: "bottom 15%",
          toggleActions: "play reverse play reverse",
        },
      });
    });

    // ── Parallax: תמונות Premium ──
    const premiumImgs = document.querySelectorAll<HTMLElement>(".premium-parallax-img");
    const premiumDirections = [-1, 1, -1]; // למעלה, למטה, למעלה

    premiumImgs.forEach((img, i) => {
      const dir = premiumDirections[i] ?? 1;
      gsap.to(img, {
        y: dir * 40,
        ease: "none",
        scrollTrigger: {
          trigger: img.closest("section") ?? img,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
        },
      });
    });

    // ── Parallax: מספריים Benefits ──
    const sc1 = document.querySelector<HTMLElement>(".scissors-parallax-1");
    const sc2 = document.querySelector<HTMLElement>(".scissors-parallax-2");

    if (sc1) {
      gsap.to(sc1, {
        y: -70,
        ease: "none",
        scrollTrigger: {
          trigger: sc1.closest("section") ?? sc1,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
        },
      });
    }
    if (sc2) {
      gsap.to(sc2, {
        y: 70,
        ease: "none",
        scrollTrigger: {
          trigger: sc2.closest("section") ?? sc2,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
        },
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);
}
