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
import VideoHighlightsSection from "@/components/marketplace/VideoHighlightsSection";
import MobileBottomNav from "@/components/marketplace/MobileBottomNav";
import TopOffersSection from "@/components/marketplace/TopOffersSection";
import BestStoresSection from "@/components/marketplace/BestStoresSection";
import NewPartnersSection from "@/components/marketplace/NewPartnersSection";
import JustForYouCarousel from "@/components/marketplace/JustForYouCarousel";
import Footer from "@/components/landing/Footer";

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { establishments, loading } = useEstablishments();

  const filteredEstablishments = establishments.filter((est) =>
    est.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 md:pb-0">
      <MarketplaceHeader 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm} 
      />

      <main className="flex-1">
        {/* Categories */}
        <CategoriesCarousel />

        {/* Promotional Banners */}
        <PromoBanners />

        {/* Video Highlights - Premium Partner Section */}
        <VideoHighlightsSection />

        {/* Top Offers */}
        <TopOffersSection />

        {/* Vilas Gastronômicas */}
        <VilasSection />

        {/* Just For You Carousel */}
        <JustForYouCarousel />

        {/* Best Stores Nearby */}
        <BestStoresSection />

        {/* New Partners */}
        <NewPartnersSection />

        {/* Highlights */}
        <HighlightsSection />

        {/* Trending Products */}
        <TrendingProducts />

        {/* Best Reviewed */}
        <BestReviewedSection />

        {/* Want to Dine In */}
        <RestaurantsSection />

        {/* All Restaurants */}
        <AllRestaurants 
          establishments={filteredEstablishments} 
          loading={loading} 
        />
      </main>

      <Footer />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default Marketplace;
