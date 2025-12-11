import { lazy, Suspense, useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import IFoodCalculator from "@/components/landing/IFoodCalculator";

// Lazy load sections below the fold for performance
const TrustBadgesSection = lazy(() => import("@/components/landing/TrustBadgesSection"));
const AllFeaturesSection = lazy(() => import("@/components/landing/AllFeaturesSection"));
const ComparisonSection = lazy(() => import("@/components/landing/ComparisonSection"));
const HowItWorksSection = lazy(() => import("@/components/landing/HowItWorksSection"));
const PricingSection = lazy(() => import("@/components/landing/PricingSection"));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection"));
const FAQSection = lazy(() => import("@/components/landing/FAQSection"));
const CTASection = lazy(() => import("@/components/landing/CTASection"));
const Footer = lazy(() => import("@/components/landing/Footer"));

// Simple loading skeleton
const SectionSkeleton = () => (
  <div className="py-16 md:py-24 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const Conheca = () => {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <IFoodCalculator />
      
      <Suspense fallback={<SectionSkeleton />}>
        <TrustBadgesSection />
      </Suspense>
      
      <Suspense fallback={<SectionSkeleton />}>
        <AllFeaturesSection />
      </Suspense>
      
      <Suspense fallback={<SectionSkeleton />}>
        <ComparisonSection />
      </Suspense>
      
      <Suspense fallback={<SectionSkeleton />}>
        <HowItWorksSection />
      </Suspense>
      
      <Suspense fallback={<SectionSkeleton />}>
        <PricingSection />
      </Suspense>
      
      <Suspense fallback={<SectionSkeleton />}>
        <TestimonialsSection />
      </Suspense>
      
      <Suspense fallback={<SectionSkeleton />}>
        <FAQSection />
      </Suspense>
      
      <Suspense fallback={<SectionSkeleton />}>
        <CTASection />
      </Suspense>
      
      <Suspense fallback={<SectionSkeleton />}>
        <Footer />
      </Suspense>
    </main>
  );
};

export default Conheca;
