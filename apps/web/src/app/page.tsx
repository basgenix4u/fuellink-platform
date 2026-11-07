// src/app/page.tsx

import { latestGantryPrice } from "@/lib/intel";
import {
  Navbar,
  HeroSection,
  ProblemSection,
  SolutionSection,
  HowItWorksSection,
  PricingSection,
  TestimonialsSection,
  CTASection,
  Footer,
} from "@/components/landing";

function periodLabel(date: string): string {
  if (!/^\d{4}-\d{2}$/.test(date)) return "monthly";
  return new Date(`${date}-01T00:00:00Z`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function compact(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

export default function HomePage() {
  const lagos = latestGantryPrice("nmdpra_indicative_lagos");
  const abuja = latestGantryPrice("nmdpra_indicative_abuja");

  return (
    <main id="main" className="min-h-screen">
      <Navbar
        market={{
          lagos: compact(lagos.value),
          abuja: compact(abuja.value),
          month: periodLabel(lagos.date),
        }}
      />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  );
}