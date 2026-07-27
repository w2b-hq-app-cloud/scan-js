import { createFileRoute } from "@tanstack/react-router";
import ScanApp from "@/components/sphere/SphereApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SCAN - Notation modeler" },
      {
        name: "description",
        content:
          "Minimal reference UI for System & Component Architecture Notation - embeddable viewer and modeler toolkit.",
      },
      { property: "og:title", content: "SCAN - Notation modeler" },
      {
        property: "og:description",
        content:
          "Minimal reference UI for System & Component Architecture Notation - embeddable viewer and modeler toolkit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

function Home() {
  return <ScanApp />;
}
