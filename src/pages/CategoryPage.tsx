import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence } from "framer-motion";

// Components
import CategoryPageHeader from "@/components/marketplace/CategoryPageHeader";
import SubcategoryCarousel from "@/components/marketplace/SubcategoryCarousel";
import SubcategoryBanner from "@/components/marketplace/SubcategoryBanner";
import VideoHighlightsSection from "@/components/marketplace/VideoHighlightsSection";
import TopOffersSection from "@/components/marketplace/TopOffersSection";
import CategoryProductsSection from "@/components/marketplace/CategoryProductsSection";
import BestStoresSection from "@/components/marketplace/BestStoresSection";
import CategoryStoresSection from "@/components/marketplace/CategoryStoresSection";
import MobileBottomNav from "@/components/marketplace/MobileBottomNav";
import Footer from "@/components/landing/Footer";
import { Skeleton } from "@/components/ui/skeleton";

// Types
interface MainCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  bg_color: string | null;
  icon_color: string | null;
}

interface Subcategory {
  id: string;
  name: string;
  icon?: string;
}

interface Establishment {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  banner_url: string | null;
  description: string | null;
  is_open: boolean;
  avg_delivery_time: number | null;
  min_order_value: number | null;
  segment_id: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  promotional_price: number | null;
  image_url: string | null;
  establishment_id: string;
  establishments?: {
    name: string;
    slug: string;
    logo_url: string | null;
  };
}

// Category icons mapping
const categoryIcons: Record<string, string> = {
  mercado: "🛒",
  farmacia: "💊",
  compras: "🛍️",
  comida: "🍔",
  artesanato: "🎨",
  servicos: "🔧",
};

const CategoryPage = () => {
  const { categoryId, subcategoryId } = useParams();
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(true);
  const [mainCategory, setMainCategory] = useState<MainCategory | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch main category and subcategories
  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!categoryId) return;

      try {
        // Fetch main category
        const { data: categoryData } = await supabase
          .from("main_categories")
          .select("*")
          .eq("slug", categoryId)
          .eq("is_active", true)
          .single();

        if (categoryData) {
          setMainCategory(categoryData);

          // Fetch subcategories (segments) for this main category
          const { data: segmentsData } = await supabase
            .from("segments")
            .select("id, name, icon")
            .eq("parent_category_id", categoryData.id)
            .eq("is_active", true)
            .order("name");

          if (segmentsData) {
            setSubcategories(segmentsData);
            
            // If subcategoryId in URL, find and select it
            if (subcategoryId) {
              const found = segmentsData.find(
                s => s.name.toLowerCase().replace(/\s+/g, '-') === subcategoryId ||
                     s.id === subcategoryId
              );
              if (found) {
                setSelectedSubcategory(found);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching category:", error);
      }
    };

    fetchCategoryData();
  }, [categoryId, subcategoryId]);

  // Fetch establishments and products based on category/subcategory
  useEffect(() => {
    const fetchContent = async () => {
      if (!mainCategory) return;
      
      setLoading(true);

      try {
        // Get segment IDs to filter by
        let segmentIds: string[] = [];
        
        if (selectedSubcategory) {
          segmentIds = [selectedSubcategory.id];
        } else {
          segmentIds = subcategories.map(s => s.id);
        }

        // Fetch establishments
        let estQuery = supabase
          .from("establishments")
          .select("id, name, slug, logo_url, banner_url, description, is_open, avg_delivery_time, min_order_value, segment_id")
          .eq("status", "active")
          .eq("is_open", true);

        if (segmentIds.length > 0) {
          estQuery = estQuery.in("segment_id", segmentIds);
        }

        const { data: estData } = await estQuery.limit(20);
        setEstablishments(estData || []);

        // Fetch products from these establishments
        if (estData && estData.length > 0) {
          const estIds = estData.map(e => e.id);
          
          const { data: prodData } = await supabase
            .from("products")
            .select(`
              id, name, price, promotional_price, image_url, establishment_id,
              establishments:establishment_id (name, slug, logo_url)
            `)
            .in("establishment_id", estIds)
            .eq("is_active", true)
            .limit(30);

          setProducts(prodData || []);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Error fetching content:", error);
      } finally {
        setLoading(false);
      }
    };

    if (mainCategory && subcategories.length >= 0) {
      fetchContent();
    }
  }, [mainCategory, selectedSubcategory, subcategories]);

  // Handle subcategory selection
  const handleSubcategorySelect = (id: string | null) => {
    if (id === null) {
      setSelectedSubcategory(null);
      navigate(`/categoria/${categoryId}`);
    } else {
      const subcategory = subcategories.find(s => s.id === id);
      if (subcategory) {
        setSelectedSubcategory(subcategory);
        const slug = subcategory.name.toLowerCase().replace(/\s+/g, '-');
        navigate(`/categoria/${categoryId}/${slug}`);
      }
    }
  };

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // Filter products by search term
  const filteredProducts = searchTerm
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  // Loading skeleton
  if (!mainCategory && loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-4">
          <Skeleton className="h-14 w-full mb-4" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-12 w-full mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const categoryIcon = mainCategory?.icon || categoryIcons[categoryId || ""] || "📦";
  const categoryName = selectedSubcategory?.name || mainCategory?.name || "Categoria";

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Smart Header */}
      <CategoryPageHeader
        categoryName={mainCategory?.name || "Categoria"}
        categoryIcon={categoryIcon}
        categorySlug={categoryId || ""}
        subcategoryName={selectedSubcategory?.name}
        subcategoryIcon={selectedSubcategory?.icon}
        onSearch={handleSearch}
        showStories={true}
      />

      <main className="container mx-auto px-4 py-4 space-y-6">
        {/* Subcategory Carousel */}
        {subcategories.length > 0 && (
          <SubcategoryCarousel
            subcategories={subcategories}
            selectedId={selectedSubcategory?.id || null}
            onSelect={handleSubcategorySelect}
            categoryIcon={categoryIcon}
          />
        )}

        {/* Subcategory Banner (when selected) */}
        <AnimatePresence>
          {selectedSubcategory && (
            <SubcategoryBanner
              name={selectedSubcategory.name}
              icon={selectedSubcategory.icon}
              productCount={filteredProducts.length}
              storeCount={establishments.length}
              onClear={() => handleSubcategorySelect(null)}
            />
          )}
        </AnimatePresence>

        {/* Content Sections */}
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : (
          <>
            {/* Video Highlights */}
            <VideoHighlightsSection mainCategory={categoryId} />

            {/* Top Offers - using existing component props */}
            <TopOffersSection mainCategory={categoryId} />

            {/* Products Grid */}
            <CategoryProductsSection
              products={filteredProducts}
              categoryName={categoryName}
              loading={false}
            />

            {/* Best Stores */}
            <BestStoresSection 
              mainCategory={categoryId}
              subcategory={selectedSubcategory?.id}
            />

            {/* All Stores */}
            <CategoryStoresSection
              establishments={establishments}
              categoryName={categoryName}
              loading={false}
            />
          </>
        )}
      </main>

      <Footer />
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default CategoryPage;
