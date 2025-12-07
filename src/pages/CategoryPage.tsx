import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCategoryConfig, CategoryConfig } from "@/lib/categoryConfig";
import { supabase } from "@/integrations/supabase/client";
import CategoryHeader from "@/components/marketplace/CategoryHeader";
import SubcategoryGrid from "@/components/marketplace/SubcategoryGrid";
import CategoryStoresSection from "@/components/marketplace/CategoryStoresSection";
import CategoryProductsSection from "@/components/marketplace/CategoryProductsSection";
import MobileBottomNav from "@/components/marketplace/MobileBottomNav";
import VideoHighlightsSection from "@/components/marketplace/VideoHighlightsSection";
import TopOffersSection from "@/components/marketplace/TopOffersSection";
import BestStoresSection from "@/components/marketplace/BestStoresSection";
import Footer from "@/components/landing/Footer";
import { Skeleton } from "@/components/ui/skeleton";

const CategoryPage = () => {
  const { categoryId, subcategoryId } = useParams<{ categoryId: string; subcategoryId?: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<CategoryConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(subcategoryId || null);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load category config
  useEffect(() => {
    if (categoryId) {
      const config = getCategoryConfig(categoryId);
      if (config) {
        setCategory(config);
      } else {
        navigate("/");
      }
    }
  }, [categoryId, navigate]);

  // Fetch establishments and products for this category
  useEffect(() => {
    const fetchData = async () => {
      if (!category) return;

      setLoading(true);
      try {
        // Fetch establishments with segments that match this category
        const { data: establishmentsData, error: estError } = await supabase
          .from("establishments")
          .select(`
            id,
            name,
            slug,
            logo_url,
            banner_url,
            description,
            is_open,
            avg_delivery_time,
            segment_id,
            segments:segment_id (
              id,
              name
            )
          `)
          .eq("status", "active")
          .order("name");

        if (estError) throw estError;

        // Filter by category based on segment name keywords
        const categoryKeywords = getCategoryKeywords(category.id);
        const filteredEstablishments = establishmentsData?.filter(est => {
          const segmentName = (est.segments as any)?.name?.toLowerCase() || "";
          return categoryKeywords.some(keyword => segmentName.includes(keyword));
        }) || [];

        setEstablishments(filteredEstablishments);

        // Fetch products from these establishments
        if (filteredEstablishments.length > 0) {
          const establishmentIds = filteredEstablishments.map(e => e.id);
          const { data: productsData, error: prodError } = await supabase
            .from("products")
            .select(`
              id,
              name,
              price,
              promotional_price,
              image_url,
              establishment_id,
              establishments:establishment_id (
                slug,
                name
              )
            `)
            .in("establishment_id", establishmentIds)
            .eq("is_active", true)
            .eq("is_featured", true)
            .limit(20);

          if (prodError) throw prodError;
          setProducts(productsData || []);
        }
      } catch (error) {
        console.error("Error fetching category data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category]);

  const getCategoryKeywords = (catId: string): string[] => {
    const keywordMap: Record<string, string[]> = {
      mercado: ["mercado", "supermercado", "minimercado", "mercearia", "açougue", "padaria", "hortifruti"],
      farmacia: ["farmacia", "farmácia", "drogaria", "saúde"],
      compras: ["loja", "shopping", "roupa", "moda", "eletronico", "eletrônico", "pet", "presente"],
      comida: ["pizzaria", "pizza", "hamburgueria", "hamburguer", "restaurante", "lanchonete", "bar", "japonesa", "sushi", "italiana", "churrasco", "açaí", "acai", "sorveteria", "doceria", "confeitaria", "pastelaria", "tapioca", "comida"],
      artesanato: ["artesanato", "arte", "artesão", "cerâmica", "bordado", "renda", "madeira"],
      servicos: ["serviço", "servico", "manutenção", "limpeza", "evento", "entrega"],
    };
    return keywordMap[catId] || [];
  };

  const handleSubcategoryClick = (subId: string) => {
    if (selectedSubcategory === subId) {
      setSelectedSubcategory(null);
      navigate(`/categoria/${categoryId}`);
    } else {
      setSelectedSubcategory(subId);
      navigate(`/categoria/${categoryId}/${subId}`);
    }
  };

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <CategoryHeader
        category={category}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <SubcategoryGrid
        subcategories={category.subcategories}
        selectedSubcategory={selectedSubcategory}
        onSubcategoryClick={handleSubcategoryClick}
        categoryColor={category.color}
        categoryBgColor={category.bgColor}
      />

      {/* Video Highlights for this category */}
      <VideoHighlightsSection mainCategory={categoryId} />

      {/* Top Offers for this category */}
      <TopOffersSection mainCategory={categoryId} />

      <CategoryProductsSection
        products={products}
        categoryName={category.name}
        loading={loading}
      />

      {/* Best Stores Section */}
      <BestStoresSection 
        mainCategory={categoryId} 
        subcategory={selectedSubcategory}
      />

      <CategoryStoresSection
        establishments={establishments}
        categoryName={category.name}
        loading={loading}
      />

      <Footer />

      <MobileBottomNav />
    </div>
  );
};

export default CategoryPage;
