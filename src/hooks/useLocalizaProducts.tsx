import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LocalizaProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  promotional_price: number | null;
  image_url: string | null;
  category_id: string | null;
  is_featured: boolean;
  is_active: boolean;
  preparation_time: number | null;
}

interface LocalizaCategory {
  id: string;
  name: string;
  sort_order: number | null;
}

interface LocalizaProductsData {
  products: LocalizaProduct[];
  categories: LocalizaCategory[];
  loading: boolean;
  cached: boolean;
  syncedAt: string | null;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLocalizaProducts(localizaPlaceId: string | null): LocalizaProductsData {
  const [products, setProducts] = useState<LocalizaProduct[]>([]);
  const [categories, setCategories] = useState<LocalizaCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [cached, setCached] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!localizaPlaceId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try the RPC function first (includes cache logic)
      const { data, error: rpcError } = await supabase.rpc(
        "get_localiza_products",
        { p_place_id: localizaPlaceId }
      );

      if (rpcError) throw rpcError;

      const result = data as any;

      if (result?.error) {
        setError(result.error);
        return;
      }

      setProducts(result?.products || []);
      setCategories(result?.categories || []);
      setCached(result?.cached || false);
      setSyncedAt(result?.synced_at || null);
    } catch (err: any) {
      console.error("Error fetching localiza products:", err);
      setError(err.message);

      // Fallback: try direct product sync cache table
      try {
        const { data: cacheData } = await supabase
          .from("localiza_product_sync")
          .select("products_data, categories_data, synced_at")
          .eq("localiza_place_id", localizaPlaceId)
          .single();

        if (cacheData) {
          setProducts((cacheData.products_data as any) || []);
          setCategories((cacheData.categories_data as any) || []);
          setCached(true);
          setSyncedAt(cacheData.synced_at);
          setError(null);
        }
      } catch {
        // Both methods failed
      }
    } finally {
      setLoading(false);
    }
  }, [localizaPlaceId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    categories,
    loading,
    cached,
    syncedAt,
    error,
    refresh: fetchProducts,
  };
}
