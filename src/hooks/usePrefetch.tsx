import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Prefetch critical data to improve perceived performance
 * This hook pre-loads commonly accessed data into the React Query cache
 */
export const usePrefetch = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch main categories
    const prefetchMainCategories = async () => {
      await queryClient.prefetchQuery({
        queryKey: ['main-categories'],
        queryFn: async () => {
          const { data } = await supabase
            .from('main_categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });
          return data || [];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
      });
    };

    // Prefetch segments
    const prefetchSegments = async () => {
      await queryClient.prefetchQuery({
        queryKey: ['segments'],
        queryFn: async () => {
          const { data } = await supabase
            .from('segments')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true });
          return data || [];
        },
        staleTime: 1000 * 60 * 5,
      });
    };

    // Prefetch cities
    const prefetchCities = async () => {
      await queryClient.prefetchQuery({
        queryKey: ['cities'],
        queryFn: async () => {
          const { data } = await supabase
            .from('cities')
            .select('*, states(name, uf)')
            .eq('is_active', true)
            .order('name', { ascending: true })
            .limit(50);
          return data || [];
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
      });
    };

    // Prefetch vilas
    const prefetchVilas = async () => {
      await queryClient.prefetchQuery({
        queryKey: ['vilas'],
        queryFn: async () => {
          const { data } = await supabase
            .from('vilas')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true })
            .limit(20);
          return data || [];
        },
        staleTime: 1000 * 60 * 10,
      });
    };

    // Run prefetches in parallel with low priority
    const runPrefetches = async () => {
      // Use requestIdleCallback for non-critical prefetches
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          Promise.all([
            prefetchMainCategories(),
            prefetchSegments(),
            prefetchCities(),
            prefetchVilas(),
          ]);
        }, { timeout: 3000 });
      } else {
        // Fallback: delay prefetches to not block initial render
        setTimeout(() => {
          Promise.all([
            prefetchMainCategories(),
            prefetchSegments(),
            prefetchCities(),
            prefetchVilas(),
          ]);
        }, 1000);
      }
    };

    runPrefetches();
  }, [queryClient]);
};

/**
 * Prefetch establishment data when user hovers over a card
 */
export const usePrefetchEstablishment = (slug: string | undefined) => {
  const queryClient = useQueryClient();

  const prefetch = () => {
    if (!slug) return;

    queryClient.prefetchQuery({
      queryKey: ['establishment', slug],
      queryFn: async () => {
        const { data } = await supabase
          .from('establishments')
          .select('*, segments(*), vilas(*)')
          .eq('slug', slug)
          .eq('status', 'active')
          .single();
        return data;
      },
      staleTime: 1000 * 60 * 2, // 2 minutes
    });

    // Also prefetch products
    queryClient.prefetchQuery({
      queryKey: ['establishment-products', slug],
      queryFn: async () => {
        const { data: establishment } = await supabase
          .from('establishments')
          .select('id')
          .eq('slug', slug)
          .single();

        if (!establishment) return [];

        const { data } = await supabase
          .from('products')
          .select('*, categories(*)')
          .eq('establishment_id', establishment.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .limit(50);
        return data || [];
      },
      staleTime: 1000 * 60 * 2,
    });
  };

  return { prefetch };
};

/**
 * Prefetch user-related data when authenticated
 */
export const usePrefetchUserData = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const prefetchUserData = async () => {
      // Prefetch user profile
      queryClient.prefetchQuery({
        queryKey: ['profile', userId],
        queryFn: async () => {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          return data;
        },
        staleTime: 1000 * 60 * 5,
      });

      // Prefetch saved addresses
      queryClient.prefetchQuery({
        queryKey: ['saved-addresses', userId],
        queryFn: async () => {
          const { data } = await supabase
            .from('saved_addresses')
            .select('*')
            .eq('user_id', userId)
            .order('is_default', { ascending: false });
          return data || [];
        },
        staleTime: 1000 * 60 * 5,
      });

      // Prefetch user favorites
      queryClient.prefetchQuery({
        queryKey: ['favorites', userId],
        queryFn: async () => {
          const { data } = await supabase
            .from('favorites')
            .select('*, establishments(*), products(*)')
            .eq('user_id', userId);
          return data || [];
        },
        staleTime: 1000 * 60 * 2,
      });
    };

    // Delay user data prefetch to prioritize main content
    setTimeout(prefetchUserData, 500);
  }, [userId, queryClient]);
};
