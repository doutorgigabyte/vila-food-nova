import { useState } from "react";
import { useEstablishments } from "@/hooks/useEstablishment";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import CategoriesCarousel from "@/components/marketplace/CategoriesCarousel";
import PromoBanners from "@/components/marketplace/PromoBanners";
import HighlightsSection from "@/components/marketplace/HighlightsSection";
import TrendingProducts from "@/components/marketplace/TrendingProducts";
import BestReviewedSection from "@/components/marketplace/BestReviewedSection";
import RestaurantsSection from "@/components/marketplace/RestaurantsSection";
import VilasSection from "@/components/marketplace/VilasSection";
import AllRestaurants from "@/components/marketplace/AllRestaurants";
import Footer from "@/components/landing/Footer";
import BusinessCTABanner from "@/components/marketplace/BusinessCTABanner";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { establishments, loading } = useEstablishments();

  const filteredEstablishments = establishments.filter((est) =>
    est.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketplaceHeader 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm} 
      />

      <main className="flex-1">
        {/* Categories */}
        <CategoriesCarousel />

        {/* Promotional Banners */}
        <PromoBanners />

        {/* Vilas Gastronômicas */}
        <VilasSection />

        {/* Highlights */}
        <HighlightsSection />

        {/* Trending Products */}
        <TrendingProducts />

        {/* Best Reviewed */}
        <BestReviewedSection />

        {/* Want to Dine In */}
        <RestaurantsSection />

        {/* Business CTA Banner */}
        <BusinessCTABanner />

        {/* All Restaurants */}
        <AllRestaurants 
          establishments={filteredEstablishments} 
          loading={loading} 
        />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
