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

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);
}
