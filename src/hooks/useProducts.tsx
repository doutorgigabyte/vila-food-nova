import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { segmentToCategoryMap } from "@/components/marketplace/MainCategoriesGrid";
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
  // Group by establishment
  const byEstablishment: Record<string, Product[]> = {};
  products.forEach(product => {
    const estId = product.establishment_id;
    if (!byEstablishment[estId]) {
      byEstablishment[estId] = [];
    }
    byEstablishment[estId].push(product);
  });

  // Shuffle products within each establishment and take limited amount
  const distributed: Product[] = [];
  Object.values(byEstablishment).forEach((estProducts, idx) => {
    const shuffled = shuffleWithSeed(estProducts, seed + idx);
    distributed.push(...shuffled.slice(0, maxPerEstablishment));
  });

  // Final shuffle to mix establishments
  return shuffleWithSeed(distributed, seed);
};

export const useProducts = (limit?: number) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const seed = useMemo(() => getRandomizationSeed(), []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch more products than needed to allow fair distribution
        const fetchLimit = limit ? limit * 5 : 200;
        
        const { data, error } = await supabase
          .from("products")
          .select(`
            id,
            name,
            description,
            price,
            promotional_price,
            image_url,
            is_featured,
            is_active,
            establishment_id,
            category_id,
            establishments (
              name,
              slug,
              segment_id
            )
          `)
          .eq("is_active", true)
          .limit(fetchLimit);

        if (error) throw error;

        const formattedProducts = (data || []).map((p: any) => ({
          ...p,
          establishment: p.establishments
        }));

        // Apply fair distribution with session-based seed
        const distributed = distributeProductsFairly(formattedProducts, seed);
        
        // Apply limit after distribution
        const finalProducts = limit ? distributed.slice(0, limit) : distributed;

        setProducts(finalProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [limit, seed]);

  return { products, loading };
};

export const useFeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select(`
            id,
            name,
            description,
            price,
            promotional_price,
            image_url,
            is_featured,
            is_active,
            establishment_id,
            category_id,
            establishments (
              name,
              slug,
              segment_id
            )
          `)
          .eq("is_active", true)
          .eq("is_featured", true)
          .limit(10);

        if (error) throw error;

        const formattedProducts = (data || []).map((p: any) => ({
          ...p,
          establishment: p.establishments
        }));

        setProducts(formattedProducts);
      } catch (error) {
        console.error("Error fetching featured products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading };
};

// Hook para buscar produtos por categoria principal com distribuição justa
export const useProductsByMainCategory = (mainCategory: string | null, limit?: number) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const seed = useMemo(() => getRandomizationSeed(), []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Fetch more products to allow fair distribution
        const fetchLimit = limit ? limit * 5 : 300;

        // First, get all segments to identify which belong to the category
        const { data: segments } = await supabase
          .from("segments")
          .select("id, name");

        // Map segment IDs that belong to the main category
        const categorySegmentIds = (segments || [])
          .filter(segment => {
            const segmentKey = segment.name.toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/\s+/g, "");
            const mappedCategory = segmentToCategoryMap[segmentKey];
            return mainCategory ? mappedCategory === mainCategory : true;
          })
          .map(s => s.id);

        // Get establishments with these segments
        let estQuery = supabase
          .from("establishments")
          .select("id, segment_id")
          .eq("status", "active");

        if (mainCategory && categorySegmentIds.length > 0) {
          estQuery = estQuery.in("segment_id", categorySegmentIds);
        }

        const { data: establishments } = await estQuery;
        const establishmentIds = (establishments || []).map(e => e.id);

        // Fetch products from these establishments
        let query = supabase
          .from("products")
          .select(`
            id,
            name,
            description,
            price,
            promotional_price,
            image_url,
            is_featured,
            is_active,
            establishment_id,
            category_id,
            establishments (
              name,
              slug,
              segment_id
            )
          `)
          .eq("is_active", true)
          .limit(fetchLimit);

        // Only filter by establishment if we have a main category selected
        if (mainCategory && establishmentIds.length > 0) {
          query = query.in("establishment_id", establishmentIds);
        }

        const { data, error } = await query;

        if (error) throw error;

        const formattedProducts = (data || []).map((p: any) => ({
          ...p,
          establishment: p.establishments
        }));

        // Apply fair distribution with session-based seed
        const distributed = distributeProductsFairly(formattedProducts, seed);
        
        // Apply limit after distribution
        const finalProducts = limit ? distributed.slice(0, limit) : distributed;

        setProducts(finalProducts);
      } catch (error) {
        console.error("Error fetching products by category:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [mainCategory, limit, seed]);

  return { products, loading };
};
