import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface Establishment {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  neighborhood: string | null;
  is_open: boolean | null;
  primary_color: string | null;
  secondary_color: string | null;
  min_order_value: number | null;
  avg_delivery_time: number | null;
  accepts_delivery: boolean | null;
  accepts_pickup: boolean | null;
  accepts_table: boolean | null;
  segment_id: string | null;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number | null;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  promotional_price: number | null;
  image_url: string | null;
  category_id: string | null;
  is_featured: boolean | null;
  preparation_time: number | null;
  variations: Json;
  additionals: Json;
}

export const useEstablishment = (slug: string) => {
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEstablishment = async () => {
      if (!slug) return;
      
      setLoading(true);
      setError(null);

      try {
        // Fetch establishment by slug
        const { data: estData, error: estError } = await supabase
          .from('establishments')
          .select('*')
          .eq('slug', slug)
          .single();

        if (estError) throw estError;
        if (!estData) throw new Error('Estabelecimento não encontrado');

        setEstablishment(estData as Establishment);

        // Fetch categories
        const { data: catData } = await supabase
          .from('categories')
          .select('*')
          .eq('establishment_id', estData.id)
          .eq('is_active', true)
          .order('sort_order');

        setCategories((catData as Category[]) || []);

        // Fetch products
        const { data: prodData } = await supabase
          .from('products')
          .select('*')
          .eq('establishment_id', estData.id)
          .eq('is_active', true);

        setProducts((prodData as Product[]) || []);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEstablishment();
  }, [slug]);

  return { establishment, categories, products, loading, error };
};

export const useEstablishments = () => {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEstablishments = async () => {
      const { data } = await supabase
        .from('establishments')
        .select('*')
        .eq('status', 'active')
        .order('name');

      setEstablishments((data as Establishment[]) || []);
      setLoading(false);
    };

    fetchEstablishments();
  }, []);

  return { establishments, loading };
};
