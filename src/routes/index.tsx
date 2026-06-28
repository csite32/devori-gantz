import { createFileRoute } from "@tanstack/react-router";
import { HeroSection } from "@/components/home/HeroSection";
import { CourseSections } from "@/components/home/CourseSection";
import { PremiumSection } from "@/components/home/PremiumSection";
import { BenefitsSection } from "@/components/home/BenefitsSection";
import { DvoriSection } from "@/components/home/DvoriSection";
import { SiteFooter } from "@/components/home/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "דבורי גנץ-אדלר | קורסי תספורות דיגיטליים" },
      {
        name: "description",
        content:
          "קורסי תספורות דיגיטליים של דבורי גנץ-אדלר – ידע וניסיון של עשרות שנים בפורמט מקצועי, לצפייה מכל מקום ובכל זמן.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <main>
      <HeroSection />
      <CourseSections />
      <PremiumSection />
      <BenefitsSection />
      <DvoriSection />
      <SiteFooter />
    </main>
  );
}
