import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProductKit {
  id: string;
  name: string;
  description: string | null;
  kit_price: number;
  original_price: number;
  image_url: string | null;
  is_active: boolean;
  establishment_id: string;
  items: ProductKitItem[];
}

export interface ProductKitItem {
  id: string;
  kit_id: string;
  product_id: string;
  quantity: number;
  is_replaceable: boolean;
  product?: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  };
}

export const useProductKits = (establishmentId?: string) => {
  const [kits, setKits] = useState<ProductKit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!establishmentId) {
      setKits([]);
      setLoading(false);
      return;
    }

    fetchKits();
  }, [establishmentId]);

  const fetchKits = async () => {
    if (!establishmentId) return;

    setLoading(true);

    // Fetch kits
    const { data: kitsData, error: kitsError } = await supabase
      .from('product_kits')
      .select('*')
      .eq('establishment_id', establishmentId)
      .eq('is_active', true);

    if (kitsError) {
      console.error('Error fetching kits:', kitsError);
      setLoading(false);
      return;
    }

    if (!kitsData || kitsData.length === 0) {
      setKits([]);
      setLoading(false);
      return;
    }

    // Fetch kit items
    const kitIds = kitsData.map(k => k.id);
    const { data: itemsData, error: itemsError } = await supabase
      .from('product_kit_items')
      .select('*')
      .in('kit_id', kitIds);

    if (itemsError) {
      console.error('Error fetching kit items:', itemsError);
    }

    // Fetch products for items
    const productIds = (itemsData || []).map(i => i.product_id);
    const { data: productsData } = await supabase
      .from('products')
      .select('id, name, price, image_url')
      .in('id', productIds.length > 0 ? productIds : ['none']);

    // Map everything together
    const enrichedKits: ProductKit[] = kitsData.map(kit => {
      const kitItems = (itemsData || [])
        .filter(i => i.kit_id === kit.id)
        .map(item => ({
          ...item,
          product: (productsData || []).find(p => p.id === item.product_id),
        }));

      return {
        ...kit,
        items: kitItems,
      };
    });

    setKits(enrichedKits);
    setLoading(false);
  };

  return { kits, loading, refetch: fetchKits };
};
