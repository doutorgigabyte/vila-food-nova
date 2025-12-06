import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCategoryConfig, CategoryConfig } from "@/lib/categoryConfig";
import { supabase } from "@/integrations/supabase/client";
import CategoryHeader from "@/components/marketplace/CategoryHeader";
import SubcategoryGrid from "@/components/marketplace/SubcategoryGrid";
import CategoryStoresSection from "@/components/marketplace/CategoryStoresSection";
import CategoryProductsSection from "@/components/marketplace/CategoryProductsSection";
import MobileBottomNav from "@/components/marketplace/MobileBottomNav";

const CategoryPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<CategoryConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
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
        // For now, we'll fetch all active establishments and filter client-side
        // In production, you'd want to add segment mapping to the database
        const { data: establishmentsData, error: estError } = await supabase
          .from("establishments")
          .select(`
            id,
            name,
            slug,
            logo_url,
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

  const handleSubcategoryClick = (subcategoryId: string) => {
    setSelectedSubcategory(prev => prev === subcategoryId ? null : subcategoryId);
  };

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
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

      <CategoryProductsSection
        products={products}
        categoryName={category.name}
        loading={loading}
      />

      <CategoryStoresSection
        establishments={establishments}
        categoryName={category.name}
        loading={loading}
      />

      <MobileBottomNav />
    </div>
  );
};

export default CategoryPage;
