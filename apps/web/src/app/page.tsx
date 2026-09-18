// src/app/page.tsx

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

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
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