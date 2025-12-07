import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import TrustBadgesSection from "@/components/landing/TrustBadgesSection";
import UniqueSellingPointsSection from "@/components/landing/UniqueSellingPointsSection";
import PlatformOverviewSection from "@/components/landing/PlatformOverviewSection";
import ComparisonSection from "@/components/landing/ComparisonSection";
import UseCasesSection from "@/components/landing/UseCasesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PricingSection from "@/components/landing/PricingSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FAQSection from "@/components/landing/FAQSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Conheca = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <TrustBadgesSection />
      <UniqueSellingPointsSection />
      <PlatformOverviewSection />
      <ComparisonSection />
      <UseCasesSection />
      <HowItWorksSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
};

export default Conheca;
