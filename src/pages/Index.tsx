import { useState } from "react";
import { useEstablishments } from "@/hooks/useEstablishment";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import MainCategoriesGrid from "@/components/marketplace/MainCategoriesGrid";
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
import BusinessCTABanner from "@/components/marketplace/BusinessCTABanner";
import SmartSearch from "@/components/marketplace/SmartSearch";
import VilaTokBubble from "@/components/vilatok/VilaTokBubble";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { establishments, loading } = useEstablishments();

  // Filtra estabelecimentos por categoria principal e subcategoria
  const filteredEstablishments = establishments.filter((est) => {
    // Filtro por termo de busca
    const matchesSearch = est.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // Se nenhuma categoria principal selecionada, mostra todos
    if (!selectedMainCategory) return true;

    // Filtra por subcategoria específica (segment_id)
    if (selectedSubcategory) {
      return est.segment_id === selectedSubcategory;
    }

    return true;
  });

  const handleMainCategorySelect = (categoryId: string | null) => {
    setSelectedMainCategory(categoryId);
    setSelectedSubcategory(null);
  };

  const handleSearchClick = () => {
    setIsSearchOpen(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 md:pb-0">
      <MarketplaceHeader 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm}
        onSearchClick={handleSearchClick}
      />

      <main className="flex-1">
        {/* Main Categories Grid - Large cards like 6amMart */}
        <MainCategoriesGrid 
          selectedCategory={selectedMainCategory}
          onCategorySelect={handleMainCategorySelect}
        />

        {/* Subcategories carousel - filtered by main category if selected */}
        <CategoriesCarousel 
          mainCategory={selectedMainCategory}
          selectedCategory={selectedSubcategory}
          onCategoryClick={(id) => setSelectedSubcategory(selectedSubcategory === id ? null : id)}
        />

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

        {/* Business CTA Banner */}
        <BusinessCTABanner />

        {/* All Restaurants */}
        <AllRestaurants 
          establishments={filteredEstablishments} 
          loading={loading} 
        />
      </main>

      <Footer />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* VilaTok Stories Bubble */}
      <VilaTokBubble />

      {/* Smart Search Overlay */}
      <SmartSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};

export default Index;
