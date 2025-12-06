import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { segmentToCategoryMap } from "@/components/marketplace/MainCategoriesGrid";
import { Establishment } from "@/hooks/useEstablishment";

export const useEstablishmentsByCategory = (
  mainCategory: string | null,
  subcategory: string | null = null,
  limit?: number
) => {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEstablishments = async () => {
      setLoading(true);
      try {
        // If subcategory is provided, filter directly by segment_id
        if (subcategory) {
          const { data, error } = await supabase
            .from("establishments")
            .select(`
              *,
              segments (id, name, icon)
            `)
            .eq("status", "active")
            .eq("segment_id", subcategory)
            .limit(limit || 100);

          if (error) throw error;

          const formatted = (data || []).map((est: any) => ({
            ...est,
            segment: est.segments
          }));

          setEstablishments(formatted);
          setLoading(false);
          return;
        }

        // If no main category, fetch all
        if (!mainCategory) {
          const { data, error } = await supabase
            .from("establishments")
            .select(`
              *,
              segments (id, name, icon)
            `)
            .eq("status", "active")
            .limit(limit || 100);

          if (error) throw error;

          const formatted = (data || []).map((est: any) => ({
            ...est,
            segment: est.segments
          }));

          setEstablishments(formatted);
          setLoading(false);
          return;
        }

        // Get segments that belong to the main category
        const { data: segments } = await supabase
          .from("segments")
          .select("id, name");

        const categorySegmentIds = (segments || [])
          .filter(segment => {
            const segmentKey = segment.name.toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/\s+/g, "");
            const mappedCategory = segmentToCategoryMap[segmentKey];
            return mappedCategory === mainCategory;
          })
          .map(s => s.id);

        if (categorySegmentIds.length === 0) {
          setEstablishments([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("establishments")
          .select(`
            *,
            segments (id, name, icon)
          `)
          .eq("status", "active")
          .in("segment_id", categorySegmentIds)
          .limit(limit || 100);

        if (error) throw error;

        const formatted = (data || []).map((est: any) => ({
          ...est,
          segment: est.segments
        }));

        setEstablishments(formatted);
      } catch (error) {
        console.error("Error fetching establishments by category:", error);
        setEstablishments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEstablishments();
  }, [mainCategory, subcategory, limit]);

  return { establishments, loading };
};

// Hook for category title based on selected category
export const useCategoryTitle = (mainCategory: string | null, subcategoryName?: string | null) => {
  const categoryTitles: Record<string, { 
    stores: string; 
    highlights: string; 
    trending: string;
    bestReviewed: string;
    newPartners: string;
  }> = {
    comida: {
      stores: "Restaurantes e Lanchonetes",
      highlights: "Destaques de Comida",
      trending: "Mais Pedidos",
      bestReviewed: "Melhor Avaliados",
      newPartners: "Novos Restaurantes"
    },
    mercado: {
      stores: "Mercados e Supermercados",
      highlights: "Destaques de Mercado",
      trending: "Produtos em Alta",
      bestReviewed: "Mercados Top",
      newPartners: "Novos Mercados"
    },
    farmacia: {
      stores: "Farmácias e Drogarias",
      highlights: "Ofertas em Saúde",
      trending: "Mais Procurados",
      bestReviewed: "Farmácias Confiáveis",
      newPartners: "Novas Farmácias"
    },
    compras: {
      stores: "Lojas e Varejo",
      highlights: "Ofertas Imperdíveis",
      trending: "Mais Vendidos",
      bestReviewed: "Lojas Top",
      newPartners: "Novas Lojas"
    },
    artesanato: {
      stores: "Artesãos Locais",
      highlights: "Arte e Criatividade",
      trending: "Artesanato Popular",
      bestReviewed: "Artesãos Premiados",
      newPartners: "Novos Artesãos"
    },
    servicos: {
      stores: "Serviços Disponíveis",
      highlights: "Serviços em Destaque",
      trending: "Mais Procurados",
      bestReviewed: "Bem Avaliados",
      newPartners: "Novos Serviços"
    }
  };

  const defaultTitles = {
    stores: "Todos os Estabelecimentos",
    highlights: "Destaques para Você",
    trending: "Em Alta",
    bestReviewed: "Melhores Avaliados",
    newPartners: "Novos no VilaFood"
  };

  if (subcategoryName) {
    return {
      stores: `${subcategoryName}s`,
      highlights: `Destaques - ${subcategoryName}`,
      trending: `${subcategoryName}s em Alta`,
      bestReviewed: `Melhores ${subcategoryName}s`,
      newPartners: `Novas ${subcategoryName}s`
    };
  }

  return mainCategory ? categoryTitles[mainCategory] || defaultTitles : defaultTitles;
};
