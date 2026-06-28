import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/hero/Hero";

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
  component: Index,
});

function Index() {
  return <Hero />;
}
