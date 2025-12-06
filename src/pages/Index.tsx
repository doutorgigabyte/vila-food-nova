import { useState } from "react";
import { useEstablishments } from "@/hooks/useEstablishment";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import MainCategoriesGrid from "@/components/marketplace/MainCategoriesGrid";
import SubcategoriesCarousel from "@/components/marketplace/SubcategoriesCarousel";
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
import { getCategoryTheme } from "@/lib/categoryThemes";
import { cn } from "@/lib/utils";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { establishments, loading } = useEstablishments();

  // Get theme based on selected category
  const theme = getCategoryTheme(selectedMainCategory);

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
    <div className={cn(
      "min-h-screen flex flex-col pb-16 md:pb-0 transition-colors duration-300",
      selectedMainCategory 
        ? `bg-gradient-to-b ${theme.bgGradient} bg-background`
        : "bg-background"
    )}>
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

        {/* Subcategories carousel - shows when main category is selected */}
        <SubcategoriesCarousel 
          mainCategory={selectedMainCategory}
          selectedSubcategory={selectedSubcategory}
          onSubcategoryClick={setSelectedSubcategory}
        />

        {/* Promotional Banners */}
        <PromoBanners />

        {/* Video Highlights - Premium Partner Section */}
        <VideoHighlightsSection />

        {/* Top Offers - filtered by category */}
        <TopOffersSection mainCategory={selectedMainCategory} />

        {/* Vilas Gastronômicas - only show when no category or comida */}
        {(!selectedMainCategory || selectedMainCategory === 'comida') && (
          <VilasSection />
        )}

        {/* Just For You Carousel - filtered by category */}
        <JustForYouCarousel mainCategory={selectedMainCategory} />

        {/* Best Stores Nearby */}
        <BestStoresSection />

        {/* New Partners */}
        <NewPartnersSection />

        {/* Highlights - only show when no category or comida */}
        {(!selectedMainCategory || selectedMainCategory === 'comida') && (
          <HighlightsSection />
        )}

        {/* Trending Products - filtered by category */}
        <TrendingProducts mainCategory={selectedMainCategory} />

        {/* Best Reviewed */}
        <BestReviewedSection />

        {/* Want to Dine In - only show when no category or comida */}
        {(!selectedMainCategory || selectedMainCategory === 'comida') && (
          <RestaurantsSection />
        )}

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
