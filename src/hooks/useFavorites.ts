import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const FAVORITES_KEY = 'vilafood_favorites';

export interface FavoriteItem {
  id: string;
  type: 'product' | 'establishment';
  addedAt: string;
}

interface FavoriteEstablishment {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  is_open: boolean | null;
  avg_delivery_time: number | null;
}

interface FavoriteProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  promotional_price: number | null;
  image_url: string | null;
  establishments: {
    name: string;
    slug: string;
  } | null;
}

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [favoriteEstablishments, setFavoriteEstablishments] = useState<FavoriteEstablishment[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(false);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading favorites:', e);
    }
  }, []);

  // Fetch establishment and product data when favorites change
  useEffect(() => {
    const fetchFavoriteData = async () => {
      if (favorites.length === 0) {
        setFavoriteEstablishments([]);
        setFavoriteProducts([]);
        return;
      }

      setLoading(true);
      try {
        const establishmentIds = favorites.filter(f => f.type === 'establishment').map(f => f.id);
        const productIds = favorites.filter(f => f.type === 'product').map(f => f.id);

        if (establishmentIds.length > 0) {
          const { data: establishments } = await supabase
            .from('establishments')
            .select('id, name, slug, description, logo_url, is_open, avg_delivery_time')
            .in('id', establishmentIds);
          setFavoriteEstablishments(establishments || []);
        } else {
          setFavoriteEstablishments([]);
        }

        if (productIds.length > 0) {
          const { data: products } = await supabase
            .from('products')
            .select('id, name, description, price, promotional_price, image_url, establishments(name, slug)')
            .in('id', productIds);
          setFavoriteProducts(products || []);
        } else {
          setFavoriteProducts([]);
        }
      } catch (error) {
        console.error('Error fetching favorite data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteData();
  }, [favorites]);

  const saveFavorites = useCallback((items: FavoriteItem[]) => {
    setFavorites(items);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
  }, []);

  const addFavorite = useCallback((id: string, type: 'product' | 'establishment') => {
    const newFavorite: FavoriteItem = { id, type, addedAt: new Date().toISOString() };
    saveFavorites([...favorites, newFavorite]);
  }, [favorites, saveFavorites]);

  const removeFavorite = useCallback((id: string) => {
    saveFavorites(favorites.filter(f => f.id !== id));
  }, [favorites, saveFavorites]);

  const toggleFavorite = useCallback((id: string, type: 'product' | 'establishment') => {
    const exists = favorites.some(f => f.id === id);
    if (exists) {
      removeFavorite(id);
    } else {
      addFavorite(id, type);
    }
  }, [favorites, addFavorite, removeFavorite]);

  const isFavorite = useCallback((id: string) => {
    return favorites.some(f => f.id === id);
  }, [favorites]);

  const getFavoritesByType = useCallback((type: 'product' | 'establishment') => {
    return favorites.filter(f => f.type === type);
  }, [favorites]);

  // Convenience methods for backward compatibility
  const isEstablishmentFavorite = useCallback((id: string) => isFavorite(id), [isFavorite]);
  const isProductFavorite = useCallback((id: string) => isFavorite(id), [isFavorite]);
  
  const toggleFavoriteEstablishment = useCallback((id: string) => {
    toggleFavorite(id, 'establishment');
  }, [toggleFavorite]);
  
  const toggleFavoriteProduct = useCallback((id: string) => {
    toggleFavorite(id, 'product');
  }, [toggleFavorite]);

  return {
    favorites,
    favoriteEstablishments,
    favoriteProducts,
    loading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    getFavoritesByType,
    // Backward compatibility
    isEstablishmentFavorite,
    isProductFavorite,
    toggleFavoriteEstablishment,
    toggleFavoriteProduct,
  };
};
