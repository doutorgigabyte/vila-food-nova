import { useState, useMemo } from "react";
import { useEstablishmentsByCategory } from "@/hooks/useEstablishmentsByCategory";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import MainCategoriesGrid from "@/components/marketplace/MainCategoriesGrid";
import PlatformBannerSlider from "@/components/marketplace/PlatformBannerSlider";
import SubcategoriesBar from "@/components/marketplace/SubcategoriesBar";
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
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  
  // Use the category-filtered hook for establishments
  const { establishments, loading } = useEstablishmentsByCategory(
    selectedMainCategory, 
    selectedSubcategory
  );

  // Filter by search term
  const filteredEstablishments = useMemo(() => {
    if (!searchTerm) return establishments;
    return establishments.filter((est) =>
      est.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [establishments, searchTerm]);

  const handleMainCategorySelect = (categoryId: string | null) => {
    setSelectedMainCategory(categoryId);
    setSelectedSubcategory(null); // Reset subcategory when main category changes
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 md:pb-0">
      <MarketplaceHeader 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm} 
      />

      <main className="flex-1">
        {/* Main Categories Grid */}
        <MainCategoriesGrid 
          selectedCategory={selectedMainCategory}
          onCategorySelect={handleMainCategorySelect}
        />

        {/* Platform Banner Slider */}
        <PlatformBannerSlider />

        {/* Subcategories Bar - only shows when a main category is selected */}
        {selectedMainCategory && (
          <SubcategoriesBar
            mainCategory={selectedMainCategory}
            selectedSubcategory={selectedSubcategory}
            onSubcategorySelect={setSelectedSubcategory}
          />
        )}

        {/* Subcategories carousel - filtered by main category if selected */}
        <CategoriesCarousel 
          mainCategory={selectedMainCategory}
          selectedCategory={selectedSubcategory}
          onCategoryClick={(id) => setSelectedSubcategory(selectedSubcategory === id ? null : id)}
        />

        {/* Promotional Banners - filtered by category */}
        <PromoBanners mainCategory={selectedMainCategory} />

        {/* Video Highlights - Premium Partner Section - filtered by category */}
        <VideoHighlightsSection mainCategory={selectedMainCategory} />

        {/* Top Offers - filtered by category */}
        <TopOffersSection mainCategory={selectedMainCategory} />

        {/* Vilas Gastronômicas - only show when no category selected or food category */}
        {(!selectedMainCategory || selectedMainCategory === 'comida') && (
          <VilasSection />
        )}

        {/* Just For You Carousel - filtered by category */}
        <JustForYouCarousel mainCategory={selectedMainCategory} />

        {/* Best Stores Nearby - filtered by category */}
        <BestStoresSection 
          mainCategory={selectedMainCategory} 
          subcategory={selectedSubcategory}
        />

        {/* New Partners - filtered by category */}
        <NewPartnersSection 
          mainCategory={selectedMainCategory}
          subcategory={selectedSubcategory}
        />

        {/* Highlights - filtered by category */}
        <HighlightsSection 
          mainCategory={selectedMainCategory}
          subcategory={selectedSubcategory}
        />

        {/* Trending Products - filtered by category */}
        <TrendingProducts mainCategory={selectedMainCategory} />

        {/* Best Reviewed - filtered by category */}
        <BestReviewedSection 
          mainCategory={selectedMainCategory}
          subcategory={selectedSubcategory}
        />

        {/* Want to Dine In - filtered by category */}
        <RestaurantsSection 
          mainCategory={selectedMainCategory}
          subcategory={selectedSubcategory}
        />

        {/* All Restaurants/Establishments - filtered by category */}
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
    </div>
  );
};

export default Marketplace;
