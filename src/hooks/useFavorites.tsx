import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Favorite {
  id: string;
  user_id: string;
  establishment_id: string | null;
  product_id: string | null;
  created_at: string;
}

interface FavoriteEstablishment {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  banner_url: string | null;
  description: string | null;
  is_open: boolean;
  avg_delivery_time: number | null;
  segment_id: string | null;
}

interface FavoriteProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  promotional_price: number | null;
  image_url: string | null;
  establishment_id: string;
  establishments?: {
    name: string;
    slug: string;
  };
}

export const useFavorites = () => {
  const [favoriteEstablishments, setFavoriteEstablishments] = useState<FavoriteEstablishment[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<FavoriteProduct[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<{ establishments: string[]; products: string[] }>({
    establishments: [],
    products: []
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteEstablishments([]);
      setFavoriteProducts([]);
      setFavoriteIds({ establishments: [], products: [] });
      setLoading(false);
      return;
    }

    try {
      // Fetch all favorites
      const { data: favorites, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const establishmentIds = favorites?.filter(f => f.establishment_id).map(f => f.establishment_id!) || [];
      const productIds = favorites?.filter(f => f.product_id).map(f => f.product_id!) || [];

      setFavoriteIds({ establishments: establishmentIds, products: productIds });

      // Fetch establishment details
      if (establishmentIds.length > 0) {
        const { data: establishments } = await supabase
          .from('establishments')
          .select('id, name, slug, logo_url, banner_url, description, is_open, avg_delivery_time, segment_id')
          .in('id', establishmentIds);
        setFavoriteEstablishments(establishments || []);
      } else {
        setFavoriteEstablishments([]);
      }

      // Fetch product details
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, name, description, price, promotional_price, image_url, establishment_id, establishments(name, slug)')
          .in('id', productIds);
        setFavoriteProducts(products as FavoriteProduct[] || []);
      } else {
        setFavoriteProducts([]);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();

    if (!user) return;

    // Subscribe to realtime changes
    const channel = supabase
      .channel('favorites-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favorites',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchFavorites();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFavorites, user]);

  const toggleFavoriteEstablishment = async (establishmentId: string) => {
    if (!user) {
      toast.error('Faça login para favoritar');
      return;
    }

    const isFavorite = favoriteIds.establishments.includes(establishmentId);

    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('establishment_id', establishmentId);
        toast.success('Removido dos favoritos');
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, establishment_id: establishmentId });
        toast.success('Adicionado aos favoritos');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Erro ao atualizar favoritos');
    }
  };

  const toggleFavoriteProduct = async (productId: string) => {
    if (!user) {
      toast.error('Faça login para favoritar');
      return;
    }

    const isFavorite = favoriteIds.products.includes(productId);

    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        toast.success('Removido dos favoritos');
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, product_id: productId });
        toast.success('Adicionado aos favoritos');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Erro ao atualizar favoritos');
    }
  };

  const isEstablishmentFavorite = (establishmentId: string) => {
    return favoriteIds.establishments.includes(establishmentId);
  };

  const isProductFavorite = (productId: string) => {
    return favoriteIds.products.includes(productId);
  };

  return {
    favoriteEstablishments,
    favoriteProducts,
    loading,
    toggleFavoriteEstablishment,
    toggleFavoriteProduct,
    isEstablishmentFavorite,
    isProductFavorite,
    refetch: fetchFavorites
  };
};
