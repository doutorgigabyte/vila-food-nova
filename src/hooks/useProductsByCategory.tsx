import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getRandomizationSeed, seededRandom } from "@/hooks/useBehaviorTracking";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  promotional_price: number | null;
  image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  establishment_id: string;
  category_id: string | null;
  establishment?: {
    name: string;
    slug: string;
    segment_id: string | null;
  };
}

// Shuffle array with seeded random for session-consistent ordering
const shuffleWithSeed = <T,>(array: T[], seed: number): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed, i) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Distribute products fairly across establishments
const distributeProductsFairly = (products: Product[], seed: number, maxPerEstablishment: number = 3): Product[] => {
  const byEstablishment: Record<string, Product[]> = {};
  products.forEach(product => {
    const estId = product.establishment_id;
    if (!byEstablishment[estId]) {
      byEstablishment[estId] = [];
    }
    byEstablishment[estId].push(product);
  });

  const distributed: Product[] = [];
  Object.values(byEstablishment).forEach((estProducts, idx) => {
    const shuffled = shuffleWithSeed(estProducts, seed + idx);
    distributed.push(...shuffled.slice(0, maxPerEstablishment));
  });

  return shuffleWithSeed(distributed, seed);
};

/**
 * Hook que busca produtos por categoria principal usando parent_category_id do banco
 * Corrige o problema de filtrar por mapeamento de nomes
 */
export const useProductsByMainCategory = (mainCategorySlug: string | null, limit?: number) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const seed = useMemo(() => getRandomizationSeed(), []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const fetchLimit = limit ? limit * 5 : 300;

        // Se não há categoria, busca todos os produtos
        if (!mainCategorySlug) {
          const { data, error } = await supabase
            .from("products")
            .select(`
              id, name, description, price, promotional_price, image_url,
              is_featured, is_active, establishment_id, category_id,
              establishments (name, slug, segment_id)
            `)
            .eq("is_active", true)
            .limit(fetchLimit);

          if (error) throw error;

          const formattedProducts = (data || []).map((p: any) => ({
            ...p,
            establishment: p.establishments
          }));

          const distributed = distributeProductsFairly(formattedProducts, seed);
          setProducts(limit ? distributed.slice(0, limit) : distributed);
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
          setProducts([]);
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
          setProducts([]);
          setLoading(false);
          return;
        }

        // Buscar estabelecimentos com esses segmentos
        const { data: establishments } = await supabase
          .from("establishments")
          .select("id")
          .eq("status", "active")
          .in("segment_id", segmentIds);

        const establishmentIds = (establishments || []).map(e => e.id);

        if (establishmentIds.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }

        // Buscar produtos desses estabelecimentos
        const { data, error } = await supabase
          .from("products")
          .select(`
            id, name, description, price, promotional_price, image_url,
            is_featured, is_active, establishment_id, category_id,
            establishments (name, slug, segment_id)
          `)
          .eq("is_active", true)
          .in("establishment_id", establishmentIds)
          .limit(fetchLimit);

        if (error) throw error;

        const formattedProducts = (data || []).map((p: any) => ({
          ...p,
          establishment: p.establishments
        }));

        const distributed = distributeProductsFairly(formattedProducts, seed);
        setProducts(limit ? distributed.slice(0, limit) : distributed);
      } catch (error) {
        console.error("Error fetching products by category:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [mainCategorySlug, limit, seed]);

  return { products, loading };
};

/**
 * Hook que busca produtos por subcategoria (segment_id direto)
 */
export const useProductsBySubcategory = (segmentId: string | null, limit?: number) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const seed = useMemo(() => getRandomizationSeed(), []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        if (!segmentId) {
          setProducts([]);
          setLoading(false);
          return;
        }

        const fetchLimit = limit ? limit * 5 : 200;

        // Buscar estabelecimentos com esse segmento
        const { data: establishments } = await supabase
          .from("establishments")
          .select("id")
          .eq("status", "active")
          .eq("segment_id", segmentId);

        const establishmentIds = (establishments || []).map(e => e.id);

        if (establishmentIds.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("products")
          .select(`
            id, name, description, price, promotional_price, image_url,
            is_featured, is_active, establishment_id, category_id,
            establishments (name, slug, segment_id)
          `)
          .eq("is_active", true)
          .in("establishment_id", establishmentIds)
          .limit(fetchLimit);

        if (error) throw error;

        const formattedProducts = (data || []).map((p: any) => ({
          ...p,
          establishment: p.establishments
        }));

        const distributed = distributeProductsFairly(formattedProducts, seed);
        setProducts(limit ? distributed.slice(0, limit) : distributed);
      } catch (error) {
        console.error("Error fetching products by subcategory:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [segmentId, limit, seed]);

  return { products, loading };
};
