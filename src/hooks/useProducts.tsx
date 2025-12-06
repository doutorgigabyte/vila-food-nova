import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { segmentToCategoryMap } from "@/components/marketplace/MainCategoriesGrid";

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

export const useProducts = (limit?: number) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
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
          .order("is_featured", { ascending: false });

        if (limit) {
          query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        const formattedProducts = (data || []).map((p: any) => ({
          ...p,
          establishment: p.establishments
        }));

        setProducts(formattedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [limit]);

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

// Hook para buscar produtos por categoria principal
export const useProductsByMainCategory = (mainCategory: string | null, limit?: number) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Primeiro buscar todos os segments para identificar quais pertencem à categoria
        const { data: segments } = await supabase
          .from("segments")
          .select("id, name");

        // Mapear segment IDs que pertencem à categoria principal
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

        // Buscar estabelecimentos com esses segments
        let estQuery = supabase
          .from("establishments")
          .select("id, segment_id");

        if (mainCategory && categorySegmentIds.length > 0) {
          estQuery = estQuery.in("segment_id", categorySegmentIds);
        }

        const { data: establishments } = await estQuery;
        const establishmentIds = (establishments || []).map(e => e.id);

        // Buscar produtos desses estabelecimentos
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
          .order("is_featured", { ascending: false });

        if (mainCategory && establishmentIds.length > 0) {
          query = query.in("establishment_id", establishmentIds);
        }

        if (limit) {
          query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        const formattedProducts = (data || []).map((p: any) => ({
          ...p,
          establishment: p.establishments
        }));

        setProducts(formattedProducts);
      } catch (error) {
        console.error("Error fetching products by category:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [mainCategory, limit]);

  return { products, loading };
};
