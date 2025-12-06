import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Establishment } from "@/hooks/useEstablishment";

/**
 * Hook que busca estabelecimentos por categoria principal usando parent_category_id do banco
 * Corrige o problema de filtrar por mapeamento de nomes
 */
export const useEstablishmentsByMainCategory = (
  mainCategorySlug: string | null,
  subcategoryId: string | null = null,
  limit?: number
) => {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEstablishments = async () => {
      setLoading(true);
      try {
        // Se subcategoria está selecionada, filtra direto pelo segment_id
        if (subcategoryId) {
          const { data, error } = await supabase
            .from("establishments")
            .select(`*, segments (id, name, icon)`)
            .eq("status", "active")
            .eq("segment_id", subcategoryId)
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

        // Se não há categoria principal, busca todos
        if (!mainCategorySlug) {
          const { data, error } = await supabase
            .from("establishments")
            .select(`*, segments (id, name, icon)`)
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

        // Buscar a main_category pelo slug
        const { data: mainCategory } = await supabase
          .from("main_categories")
          .select("id")
          .eq("slug", mainCategorySlug)
          .single();

        if (!mainCategory) {
          setEstablishments([]);
          setLoading(false);
          return;
        }

        // Buscar segmentos que pertencem a essa categoria (usando parent_category_id)
        const { data: segments } = await supabase
          .from("segments")
          .select("id")
          .eq("parent_category_id", mainCategory.id);

        const segmentIds = (segments || []).map(s => s.id);

        if (segmentIds.length === 0) {
          setEstablishments([]);
          setLoading(false);
          return;
        }

        // Buscar estabelecimentos com esses segmentos
        const { data, error } = await supabase
          .from("establishments")
          .select(`*, segments (id, name, icon)`)
          .eq("status", "active")
          .in("segment_id", segmentIds)
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
  }, [mainCategorySlug, subcategoryId, limit]);

  return { establishments, loading };
};

/**
 * Hook para buscar subcategorias (segmentos) de uma categoria principal
 */
export const useSubcategoriesByMainCategory = (mainCategorySlug: string | null) => {
  const [subcategories, setSubcategories] = useState<Array<{
    id: string;
    name: string;
    icon: string | null;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubcategories = async () => {
      setLoading(true);
      try {
        if (!mainCategorySlug) {
          setSubcategories([]);
          setLoading(false);
          return;
        }

        // Buscar a main_category pelo slug
        const { data: mainCategory } = await supabase
          .from("main_categories")
          .select("id")
          .eq("slug", mainCategorySlug)
          .single();

        if (!mainCategory) {
          setSubcategories([]);
          setLoading(false);
          return;
        }

        // Buscar segmentos que pertencem a essa categoria
        const { data: segments, error } = await supabase
          .from("segments")
          .select("id, name, icon")
          .eq("parent_category_id", mainCategory.id)
          .eq("is_active", true)
          .order("name");

        if (error) throw error;

        setSubcategories(segments || []);
      } catch (error) {
        console.error("Error fetching subcategories:", error);
        setSubcategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubcategories();
  }, [mainCategorySlug]);

  return { subcategories, loading };
};
