import { useState } from "react";
import { useEstablishments } from "@/hooks/useEstablishment";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import MainCategoriesGrid from "@/components/marketplace/MainCategoriesGrid";
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
import { segmentToCategoryMap } from "@/components/marketplace/MainCategoriesGrid";

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
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

    // Filtra por categoria principal (mapeia o segment para a categoria)
    // Aqui precisamos verificar se o segment do estabelecimento pertence à categoria principal
    // Por enquanto, vamos mostrar todos quando uma categoria principal é selecionada
    // A lógica completa requer acesso ao nome do segmento
    return true;
  });

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

        {/* Subcategories Bar - only shows when a main category is selected */}
        {selectedMainCategory && (
          <SubcategoriesBar
            mainCategory={selectedMainCategory}
            selectedSubcategory={selectedSubcategory}
            onSubcategorySelect={setSelectedSubcategory}
          />
        )}

        {/* Show regular categories when no main category selected */}
        {!selectedMainCategory && <CategoriesCarousel />}

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
