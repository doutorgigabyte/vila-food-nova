import { useState, useEffect } from "react";
import { useEstablishments } from "@/hooks/useEstablishment";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import VilaTokStoriesRow from "@/components/marketplace/VilaTokStoriesRow";
import SubcategoriesCarousel from "@/components/marketplace/SubcategoriesCarousel";
import CategoryBannerSlider from "@/components/marketplace/CategoryBannerSlider";
import TopOffersSection from "@/components/marketplace/TopOffersSection";
import DepartmentProductsSection from "@/components/marketplace/DepartmentProductsSection";
import NearbyStoresSection from "@/components/marketplace/NearbyStoresSection";
import BestStoresSection from "@/components/marketplace/BestStoresSection";
import NewPartnersSection from "@/components/marketplace/NewPartnersSection";
import JustForYouCarousel from "@/components/marketplace/JustForYouCarousel";
import VilasSection from "@/components/marketplace/VilasSection";
import AllRestaurants from "@/components/marketplace/AllRestaurants";
import VideoHighlightsSection from "@/components/marketplace/VideoHighlightsSection";
import MobileBottomNav from "@/components/marketplace/MobileBottomNav";
import Footer from "@/components/landing/Footer";
import BusinessCTABanner from "@/components/marketplace/BusinessCTABanner";
import SmartSearch from "@/components/marketplace/SmartSearch";
import { getCategoryTheme } from "@/lib/categoryThemes";
import { cn } from "@/lib/utils";
import { setOrderSourceDirect } from "@/hooks/useOrderSource";

const Index = () => {
  // Set order source to marketplace when user enters this page
  useEffect(() => {
    setOrderSourceDirect('marketplace');
  }, []);
  
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
        {/* VilaTok Stories Row - Instagram-like story bubbles */}
        <VilaTokStoriesRow />

        {/* Subcategories carousel - shows when main category is selected */}
        <SubcategoriesCarousel 
          mainCategory={selectedMainCategory}
          selectedSubcategory={selectedSubcategory}
          onSubcategoryClick={setSelectedSubcategory}
        />

        {/* Category-specific Banner Slider with real images */}
        <CategoryBannerSlider mainCategory={selectedMainCategory} />

        {/* Just For You Carousel - 3D effect, filtered by category */}
        <JustForYouCarousel mainCategory={selectedMainCategory} />

        {/* Video Highlights - Premium Partner Section */}
        <VideoHighlightsSection />

        {/* Top Offers - Products with discounts, filtered by category */}
        <TopOffersSection mainCategory={selectedMainCategory} />

        {/* Department-organized Products (only when no category selected) */}
        <DepartmentProductsSection mainCategory={selectedMainCategory} />

        {/* Vilas Gastronômicas - only show when no category or comida */}
        {(!selectedMainCategory || selectedMainCategory === 'comida') && (
          <VilasSection />
        )}

        {/* Nearby Stores - Establishments by proximity */}
        <NearbyStoresSection 
          mainCategory={selectedMainCategory} 
          subcategory={selectedSubcategory} 
        />

        {/* Best Stores - Filtered by category */}
        <BestStoresSection 
          mainCategory={selectedMainCategory} 
          subcategory={selectedSubcategory} 
        />

        {/* New Partners - Filtered by category */}
        <NewPartnersSection 
          mainCategory={selectedMainCategory} 
          subcategory={selectedSubcategory} 
        />

        {/* Business CTA Banner */}
        <BusinessCTABanner />

        {/* All Establishments - Filtered */}
        <AllRestaurants 
          establishments={filteredEstablishments} 
          loading={loading} 
          mainCategory={selectedMainCategory}
          subcategory={selectedSubcategory}
        />
      </main>

      <Footer />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Smart Search Overlay */}
      <SmartSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};

export default Index;
