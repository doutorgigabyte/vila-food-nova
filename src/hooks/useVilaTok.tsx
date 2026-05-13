import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { generateUUID } from '@/lib/utils';

export interface EstablishmentVideo {
  id: string;
  establishment_id: string;
  product_id: string | null;
  video_url: string;
  thumbnail_url: string | null;
  title: string | null;
  description: string | null;
  duration: number | null;
  views_count: number;
  likes_count: number;
  shares_count: number;
  comments_count: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  music_url: string | null;
  main_category_id: string | null;
  establishment?: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    segment_id: string | null;
  };
  product?: {
    id: string;
    name: string;
    price: number;
    promotional_price: number | null;
    image_url: string | null;
  } | null;
}

export interface EstablishmentWithVideos {
  establishment: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  videos: EstablishmentVideo[];
}

interface UseVilaTokOptions {
  mainCategorySlug?: string | null;
}

// Optimized fetch function
async function fetchVilaTokData(mainCategorySlug: string | null | undefined) {
  // Single optimized query with all joins
  let query = supabase
    .from('establishment_videos')
    .select(`
      id, establishment_id, product_id, video_url, thumbnail_url,
      title, description, duration, views_count, likes_count,
      shares_count, comments_count, is_active, sort_order,
      created_at, music_url, main_category_id,
      establishment:establishments!inner(id, name, slug, logo_url, segment_id),
      product:products(id, name, price, promotional_price, image_url)
    `)
    .eq('is_active', true)
    .eq('display_in_marketplace', true)
    .order('created_at', { ascending: false })
    .limit(50); // Limit initial load for performance

  const { data: videos, error } = await query;
  if (error) throw error;

  let filteredVideos = videos || [];

  // Filter by category if specified (single query instead of multiple)
  if (mainCategorySlug && filteredVideos.length > 0) {
    const { data: categoryData } = await supabase
      .from('main_categories')
      .select('id, segments:segments(id)')
      .eq('slug', mainCategorySlug)
      .single();

    if (categoryData) {
      const segmentIds = new Set(categoryData.segments?.map((s: { id: string }) => s.id) || []);
      filteredVideos = filteredVideos.filter(video => 
        video.main_category_id === categoryData.id ||
        (video.establishment?.segment_id && segmentIds.has(video.establishment.segment_id))
      );
    }
  }

  // Group videos by establishment
  const grouped = filteredVideos.reduce((acc, video) => {
    const estId = video.establishment_id;
    if (!acc[estId] && video.establishment) {
      acc[estId] = {
        establishment: video.establishment,
        videos: [],
        mostRecentAt: video.created_at // Track most recent video date
      };
    }
    if (acc[estId]) {
      acc[estId].videos.push(video);
      // Update most recent date if this video is newer
      if (video.created_at > acc[estId].mostRecentAt) {
        acc[estId].mostRecentAt = video.created_at;
      }
    }
    return acc;
  }, {} as Record<string, EstablishmentWithVideos & { mostRecentAt: string }>);

  // Sort establishments by most recent video (Instagram-style: last posted = first in queue)
  const sortedEstablishments = Object.values(grouped)
    .sort((a, b) => new Date(b.mostRecentAt).getTime() - new Date(a.mostRecentAt).getTime())
    .map(({ mostRecentAt, ...rest }) => rest); // Remove mostRecentAt from final output

  return sortedEstablishments;
}

export function useVilaTok(options: UseVilaTokOptions = {}) {
  const { mainCategorySlug } = options;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [currentEstablishmentIndex, setCurrentEstablishmentIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  
  const sessionId = useMemo(() => {
    let id = localStorage.getItem('vilatok_session_id');
    if (!id) {
      id = generateUUID();
      localStorage.setItem('vilatok_session_id', id);
    }
    return id;
  }, []);

  // Use React Query for optimized caching and fetching
  const { data: establishments = [], isLoading } = useQuery({
    queryKey: ['vilatok-videos', mainCategorySlug],
    queryFn: () => fetchVilaTokData(mainCategorySlug),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    refetchOnWindowFocus: false,
  });

  // Fetch liked videos separately (only when user is logged in)
  const { data: userLikes } = useQuery({
    queryKey: ['vilatok-likes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('video_likes')
        .select('video_id')
        .eq('user_id', user.id);
      return data?.map(l => l.video_id) || [];
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minute
  });

  // Update liked videos when userLikes changes
  useEffect(() => {
    if (userLikes) {
      setLikedVideos(new Set(userLikes));
    } else {
      setLikedVideos(new Set());
    }
  }, [userLikes]);

  // Reset indices when category changes
  useEffect(() => {
    setCurrentEstablishmentIndex(0);
    setCurrentVideoIndex(0);
  }, [mainCategorySlug]);

  const currentEstablishment = establishments[currentEstablishmentIndex];
  const currentVideo = currentEstablishment?.videos[currentVideoIndex];

  const goToNextEstablishment = useCallback(() => {
    if (currentEstablishmentIndex < establishments.length - 1) {
      setCurrentEstablishmentIndex(prev => prev + 1);
      setCurrentVideoIndex(0);
    }
  }, [currentEstablishmentIndex, establishments.length]);

  const goToPreviousEstablishment = useCallback(() => {
    if (currentEstablishmentIndex > 0) {
      setCurrentEstablishmentIndex(prev => prev - 1);
      setCurrentVideoIndex(0);
    }
  }, [currentEstablishmentIndex]);

  const goToNextVideo = useCallback(() => {
    if (currentEstablishment && currentVideoIndex < currentEstablishment.videos.length - 1) {
      setCurrentVideoIndex(prev => prev + 1);
    }
  }, [currentEstablishment, currentVideoIndex]);

  const goToPreviousVideo = useCallback(() => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(prev => prev - 1);
    }
  }, [currentVideoIndex]);

  const toggleLike = useCallback(async (videoId: string): Promise<boolean> => {
    // Require authentication for likes
    if (!user?.id) {
      return false; // Signal that auth is required
    }

    const isLiked = likedVideos.has(videoId);

    try {
      // Optimistic update
      if (isLiked) {
        setLikedVideos(prev => {
          const next = new Set(prev);
          next.delete(videoId);
          return next;
        });
      } else {
        setLikedVideos(prev => new Set([...prev, videoId]));
      }

      if (isLiked) {
        const { error } = await supabase.from('video_likes').delete().eq('video_id', videoId).eq('user_id', user.id);
        if (error) throw error;
        
        await supabase
          .from('establishment_videos')
          .update({ likes_count: (currentVideo?.likes_count || 1) - 1 })
          .eq('id', videoId);
      } else {
        const { error } = await supabase.from('video_likes').insert({ video_id: videoId, user_id: user.id });
        if (error) throw error;

        await supabase
          .from('establishment_videos')
          .update({ likes_count: (currentVideo?.likes_count || 0) + 1 })
          .eq('id', videoId);
      }

      // Invalidate cache to refetch on next access
      queryClient.invalidateQueries({ queryKey: ['vilatok-videos'] });
      queryClient.invalidateQueries({ queryKey: ['vilatok-likes'] });
      return true;
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert on error
      if (isLiked) {
        setLikedVideos(prev => new Set([...prev, videoId]));
      } else {
        setLikedVideos(prev => {
          const next = new Set(prev);
          next.delete(videoId);
          return next;
        });
      }
      return false;
    }
  }, [likedVideos, user?.id, currentVideo, queryClient]);

  const incrementViews = useCallback(async (videoId: string) => {
    try {
      // Manual increment since RPC doesn't exist
      const { data: video } = await supabase
        .from('establishment_videos')
        .select('views_count')
        .eq('id', videoId)
        .single();
      
      await supabase
        .from('establishment_videos')
        .update({ views_count: (video?.views_count || 0) + 1 })
        .eq('id', videoId);
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  }, []);

  const incrementShares = useCallback(async (videoId: string) => {
    try {
      await supabase
        .from('establishment_videos')
        .update({ shares_count: (currentVideo?.shares_count || 0) + 1 })
        .eq('id', videoId);
    } catch (error) {
      console.error('Error incrementing shares:', error);
    }
  }, [currentVideo]);

  return {
    establishments,
    currentEstablishment,
    currentVideo,
    currentEstablishmentIndex,
    currentVideoIndex,
    isLoading,
    likedVideos,
    goToNextEstablishment,
    goToPreviousEstablishment,
    goToNextVideo,
    goToPreviousVideo,
    toggleLike,
    incrementViews,
    incrementShares,
    totalEstablishments: establishments.length,
    totalVideosInCurrent: currentEstablishment?.videos.length || 0,
  };
}
