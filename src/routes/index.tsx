import { createFileRoute } from "@tanstack/react-router";
import { HeroSection } from "@/components/home/HeroSection";
import { CourseSections } from "@/components/home/CourseSection";
import { PremiumSection } from "@/components/home/PremiumSection";
import { BenefitsSection } from "@/components/home/BenefitsSection";
import { DvoriSection } from "@/components/home/DvoriSection";
import { useGsapAnimations } from "@/hooks/useGsapAnimations";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "דבורי גנץ-אדלר | קורסי התספורות הדיגיטליים" },
      {
        name: "description",
        content:
          "למדי את שיטות התספורת המקצועיות של דבורי גנץ-אדלר בקורסים דיגיטליים מקצועיים.",
      },
      { property: "og:title", content: "דבורי גנץ-אדלר | קורסי התספורות הדיגיטליים" },
      { property: "og:description", content: "למדי את שיטות התספורת המקצועיות של דבורי גנץ-אדלר בקורסים דיגיטליים מקצועיים." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  useGsapAnimations();
  return (
    <main>
      <HeroSection />
      <CourseSections />
      <PremiumSection />
      <BenefitsSection />
      <DvoriSection />
    </main>
  );
}
