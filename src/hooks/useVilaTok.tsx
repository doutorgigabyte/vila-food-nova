import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface EstablishmentVideo {
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

interface EstablishmentWithVideos {
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

export function useVilaTok(options: UseVilaTokOptions = {}) {
  const { mainCategorySlug } = options;
  const { user } = useAuth();
  const [establishments, setEstablishments] = useState<EstablishmentWithVideos[]>([]);
  const [currentEstablishmentIndex, setCurrentEstablishmentIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [sessionId] = useState(() => {
    let id = localStorage.getItem('vilatok_session_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('vilatok_session_id', id);
    }
    return id;
  });

  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('establishment_videos')
        .select(`
          *,
          establishment:establishments(id, name, slug, logo_url, segment_id),
          product:products(id, name, price, promotional_price, image_url)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      const { data: videos, error } = await query;

      if (error) throw error;

      let filteredVideos = videos || [];

      // Filter by category if specified
      if (mainCategorySlug) {
        // Fetch segments for this category
        const { data: mainCategory } = await supabase
          .from('main_categories')
          .select('id')
          .eq('slug', mainCategorySlug)
          .single();

        if (mainCategory) {
          const { data: segments } = await supabase
            .from('segments')
            .select('id')
            .eq('parent_category_id', mainCategory.id);

          const segmentIds = new Set(segments?.map(s => s.id) || []);
          
          filteredVideos = filteredVideos.filter(video => 
            video.main_category_id === mainCategory.id ||
            (video.establishment?.segment_id && segmentIds.has(video.establishment.segment_id))
          );
        }
      }

      // Group videos by establishment
      const grouped = filteredVideos.reduce((acc, video) => {
        const estId = video.establishment_id;
        if (!acc[estId]) {
          acc[estId] = {
            establishment: video.establishment,
            videos: []
          };
        }
        acc[estId].videos.push(video);
        return acc;
      }, {} as Record<string, EstablishmentWithVideos>);

      setEstablishments(Object.values(grouped));

      // Fetch user's liked videos
      const likeQuery = user?.id
        ? supabase.from('video_likes').select('video_id').eq('user_id', user.id)
        : supabase.from('video_likes').select('video_id').eq('session_id', sessionId);

      const { data: likes } = await likeQuery;
      if (likes) {
        setLikedVideos(new Set(likes.map(l => l.video_id)));
      }
    } catch (error) {
      console.error('Error fetching VilaTok videos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, sessionId, mainCategorySlug]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

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

  const toggleLike = useCallback(async (videoId: string) => {
    const isLiked = likedVideos.has(videoId);

    try {
      if (isLiked) {
        // Unlike
        const deleteQuery = user?.id
          ? supabase.from('video_likes').delete().eq('video_id', videoId).eq('user_id', user.id)
          : supabase.from('video_likes').delete().eq('video_id', videoId).eq('session_id', sessionId);

        await deleteQuery;
        
        // Update local count
        await supabase
          .from('establishment_videos')
          .update({ likes_count: (currentVideo?.likes_count || 1) - 1 })
          .eq('id', videoId);

        setLikedVideos(prev => {
          const next = new Set(prev);
          next.delete(videoId);
          return next;
        });
      } else {
        // Like
        const insertData = user?.id
          ? { video_id: videoId, user_id: user.id }
          : { video_id: videoId, session_id: sessionId };

        await supabase.from('video_likes').insert(insertData);

        // Update local count
        await supabase
          .from('establishment_videos')
          .update({ likes_count: (currentVideo?.likes_count || 0) + 1 })
          .eq('id', videoId);

        setLikedVideos(prev => new Set([...prev, videoId]));
      }

      fetchVideos(); // Refresh to get updated counts
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }, [likedVideos, user?.id, sessionId, currentVideo, fetchVideos]);

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
