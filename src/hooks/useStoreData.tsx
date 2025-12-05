import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StoreEstablishment {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  is_open: boolean;
  avg_delivery_time: number | null;
  delivery_base_fee: number | null;
  min_order_value: number | null;
  whatsapp: string | null;
  phone: string | null;
  address: string | null;
  neighborhood: string | null;
  accepts_delivery: boolean;
  accepts_pickup: boolean;
  accepts_table: boolean;
  operating_hours: any;
  primary_color: string | null;
  secondary_color: string | null;
  vila_id: string | null;
  segment?: {
    name: string;
    icon: string | null;
  };
}

export interface StoreProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  promotional_price: number | null;
  image_url: string | null;
  is_featured: boolean;
  category_id: string | null;
  establishment_id: string;
  additionals: any;
  variations: any;
  preparation_time: number | null;
  category?: {
    id: string;
    name: string;
    sort_order: number | null;
  };
}

export interface StoreCategory {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number | null;
}

export const useStoreData = (slug: string | undefined) => {
  const [establishment, setEstablishment] = useState<StoreEstablishment | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchStoreData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch establishment
        const { data: estData, error: estError } = await supabase
          .from("establishments")
          .select(`
            id,
            name,
            slug,
            description,
            logo_url,
            banner_url,
            is_open,
            avg_delivery_time,
            delivery_base_fee,
            min_order_value,
            whatsapp,
            phone,
            address,
            neighborhood,
            accepts_delivery,
            accepts_pickup,
            accepts_table,
            operating_hours,
            primary_color,
            secondary_color,
            segment_id,
            vila_id
          `)
          .eq("slug", slug)
          .maybeSingle();

        if (estError) throw estError;
        if (!estData) throw new Error("Estabelecimento não encontrado");

        // Fetch segment if exists
        let segment: { name: string; icon: string | null } | undefined;
        if (estData.segment_id) {
          const { data: segData } = await supabase
            .from("segments")
            .select("name, icon")
            .eq("id", estData.segment_id)
            .maybeSingle();
          if (segData) {
            segment = segData;
          }
        }

        const formattedEstablishment: StoreEstablishment = {
          ...estData,
          segment
        };
        setEstablishment(formattedEstablishment);

        // Fetch categories
        const { data: catData, error: catError } = await supabase
          .from("categories")
          .select("id, name, description, image_url, sort_order")
          .eq("establishment_id", estData.id)
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (catError) throw catError;
        setCategories(catData || []);

        // Fetch products
        const { data: prodData, error: prodError } = await supabase
          .from("products")
          .select(`
            id,
            name,
            description,
            price,
            promotional_price,
            image_url,
            is_featured,
            category_id,
            establishment_id,
            additionals,
            variations,
            preparation_time,
            categories (
              id,
              name,
              sort_order
            )
          `)
          .eq("establishment_id", estData.id)
          .eq("is_active", true)
          .order("is_featured", { ascending: false });

        if (prodError) throw prodError;
        
        const formattedProducts = (prodData || []).map((p: any) => ({
          ...p,
          category: p.categories
        }));
        setProducts(formattedProducts);

      } catch (err: any) {
        console.error("Error fetching store data:", err);
        setError(err.message || "Erro ao carregar dados da loja");
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [slug]);

  // Computed values
  const promotionalProducts = products.filter(p => p.promotional_price && p.promotional_price < p.price);
  const featuredProducts = products.filter(p => p.is_featured);
  
  const productsByCategory = categories.map(cat => ({
    category: cat,
    products: products.filter(p => p.category_id === cat.id)
  })).filter(group => group.products.length > 0);

  // Products without category
  const uncategorizedProducts = products.filter(p => !p.category_id);

  return {
    establishment,
    products,
    categories,
    promotionalProducts,
    featuredProducts,
    productsByCategory,
    uncategorizedProducts,
    loading,
    error
  };
};
