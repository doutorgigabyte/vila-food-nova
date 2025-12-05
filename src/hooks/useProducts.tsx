import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
              slug
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
              slug
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
