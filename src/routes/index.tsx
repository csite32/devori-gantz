import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { HeroSection } from "@/components/home/HeroSection";
import { CourseSections } from "@/components/home/CourseSection";
import { PremiumSection } from "@/components/home/PremiumSection";
import { BenefitsSection } from "@/components/home/BenefitsSection";
import { DvoriSection } from "@/components/home/DvoriSection";
import { ContactSection } from "@/components/home/ContactSection";
import { useGsapAnimations } from "@/hooks/useGsapAnimations";
import { getHomepagePricing } from "@/lib/pricing.functions";

const pricingQuery = queryOptions({
  queryKey: ["homepage-pricing"],
  queryFn: () => getHomepagePricing(),
  staleTime: 60_000,
});

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
  loader: ({ context }) => context.queryClient.ensureQueryData(pricingQuery),
  component: HomePage,
});

function HomePage() {
  useGsapAnimations();
  const { data: pricing } = useSuspenseQuery(pricingQuery);
  return (
    <main>
      <HeroSection />
      <CourseSections
        prices={{
          butterfly: pricing.butterfly_course_price,
          shaggy: pricing.shaggy_bob_course_price,
          lob: pricing.lob_chic_course_price,
        }}
      />
      <PremiumSection bundleText={pricing.bundle_price_text} />
      <BenefitsSection />
      <DvoriSection />
      <ContactSection />
    </main>
  );
}
