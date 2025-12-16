import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowLeft } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';

import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { VilaTokPlayer } from '@/components/vilatok/VilaTokPlayer';
import { VilaTokSidebar } from '@/components/vilatok/VilaTokSidebar';
import { VilaTokOverlay } from '@/components/vilatok/VilaTokOverlay';
import { VilaTokProgressBars } from '@/components/vilatok/VilaTokProgressBars';
import { VilaTokComments } from '@/components/vilatok/VilaTokComments';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StoreVideo {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  music_url: string | null;
  title: string | null;
  description: string | null;
  duration: number | null;
  likes_count: number;
  shares_count: number;
  comments_count: number;
  product: {
    id: string;
    name: string;
    price: number;
    promotional_price: number | null;
    image_url: string | null;
  } | null;
}

interface StoreVilaTokProps {
  videos: StoreVideo[];
  establishment: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function StoreVilaTok({ videos, establishment, isOpen, onClose }: StoreVilaTokProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  
  const swiperRef = useRef<SwiperType | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());

  const currentVideo = videos[currentIndex];

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setCurrentProgress(0);
      swiperRef.current?.slideTo(0, 0);
    }
  }, [isOpen]);

  // Fetch user's liked videos
  useEffect(() => {
    if (!user || !isOpen) return;
    
    const fetchLikes = async () => {
      const { data } = await supabase
        .from('video_likes')
        .select('video_id')
        .eq('user_id', user.id)
        .in('video_id', videos.map(v => v.id));
      
      if (data) {
        setLikedVideos(new Set(data.map(d => d.video_id)));
      }
    };
    
    fetchLikes();
  }, [user, isOpen, videos]);

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    setCurrentIndex(swiper.activeIndex);
    setCurrentProgress(0);
  }, []);

  const handleAutoAdvance = useCallback(() => {
    if (currentIndex < videos.length - 1) {
      swiperRef.current?.slideNext();
    } else {
      onClose();
    }
  }, [currentIndex, videos.length, onClose]);

  const toggleLike = useCallback(async (videoId: string) => {
    if (!user) {
      toast.error('Faça login para curtir', {
        action: { label: 'Entrar', onClick: () => navigate('/auth') },
      });
      return false;
    }

    const isLiked = likedVideos.has(videoId);
    
    // Optimistic update
    setLikedVideos(prev => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(videoId);
      } else {
        next.add(videoId);
      }
      return next;
    });

    try {
      if (isLiked) {
        await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', user.id);
        
        // Decrement likes count
        const video = videos.find(v => v.id === videoId);
        if (video) {
          await supabase
            .from('establishment_videos')
            .update({ likes_count: Math.max(0, video.likes_count - 1) })
            .eq('id', videoId);
        }
      } else {
        await supabase
          .from('video_likes')
          .insert({ video_id: videoId, user_id: user.id });
        
        // Increment likes count
        const video = videos.find(v => v.id === videoId);
        if (video) {
          await supabase
            .from('establishment_videos')
            .update({ likes_count: video.likes_count + 1 })
            .eq('id', videoId);
        }
      }
      return true;
    } catch (error) {
      // Revert on error
      setLikedVideos(prev => {
        const next = new Set(prev);
        if (isLiked) {
          next.add(videoId);
        } else {
          next.delete(videoId);
        }
        return next;
      });
      console.error('Error toggling like:', error);
      return false;
    }
  }, [user, likedVideos, navigate]);

  const handleShare = useCallback(async () => {
    if (!currentVideo) return;

    const shareUrl = `${window.location.origin}/loja/${establishment.slug}?story=${currentVideo.id}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: currentVideo.title || establishment.name,
          text: currentVideo.description || `Confira ${establishment.name}!`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copiado!');
      }
      
      // Increment share count
      const video = videos.find(v => v.id === currentVideo.id);
      if (video) {
        await supabase
          .from('establishment_videos')
          .update({ shares_count: video.shares_count + 1 })
          .eq('id', currentVideo.id);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [currentVideo, establishment, videos]);

  const handleAddToCart = useCallback(async () => {
    if (!currentVideo?.product) return;

    await addToCart(
      {
        id: currentVideo.product.id,
        name: currentVideo.product.name,
        price: currentVideo.product.price,
        promotional_price: currentVideo.product.promotional_price,
        image_url: currentVideo.product.image_url,
        establishment_id: establishment.id,
      },
      {
        id: establishment.id,
        name: establishment.name,
        slug: establishment.slug,
        logo_url: establishment.logo_url,
        vila_id: null,
        delivery_base_fee: 0,
        min_order_value: 0,
        accepts_pickup: true,
        accepts_delivery: true,
      }
    );
    toast.success(`${currentVideo.product.name} adicionado!`);
  }, [currentVideo, establishment, addToCart]);

  const incrementViews = useCallback(async (videoId: string) => {
    // Fetch current view count and increment
    const { data } = await supabase
      .from('establishment_videos')
      .select('views_count')
      .eq('id', videoId)
      .single();
    
    if (data) {
      await supabase
        .from('establishment_videos')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', videoId);
    }
  }, []);

  if (!isOpen || videos.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      <div className="w-full h-full flex items-center justify-center">
        <div 
          className="relative w-full h-full md:w-auto md:h-full md:flex-shrink-0" 
          style={{ 
            maxWidth: 'calc(100vh * 9 / 16)',
            maxHeight: '100vh',
            aspectRatio: '9/16'
          }}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center pointer-events-auto active:bg-black/60"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-2">
              {establishment.logo_url && (
                <img 
                  src={establishment.logo_url} 
                  alt={establishment.name}
                  className="w-8 h-8 rounded-full object-cover border border-white/50"
                />
              )}
              <span className="text-white font-medium">{establishment.name}</span>
            </div>
            <div className="w-10" />
          </div>

          {/* Progress Bars */}
          <VilaTokProgressBars
            totalVideos={videos.length}
            currentVideoIndex={currentIndex}
            currentProgress={currentProgress}
          />

          {/* Horizontal Swiper for videos */}
          <Swiper
            direction="horizontal"
            speed={180}
            slidesPerView={1}
            threshold={10}
            touchRatio={1}
            resistanceRatio={0.8}
            className="w-full h-full"
            onSwiper={(swiper) => { swiperRef.current = swiper; }}
            onSlideChange={handleSlideChange}
          >
            {videos.map((video, index) => {
              const isActive = index === currentIndex;
              const isNearby = Math.abs(index - currentIndex) <= 1;
              
              return (
                <SwiperSlide key={video.id} className="w-full h-full">
                  <div className="relative w-full h-full">
                    {isNearby && (
                      <VilaTokPlayer
                        videoUrl={video.video_url}
                        thumbnailUrl={video.thumbnail_url}
                        musicUrl={video.music_url}
                        isActive={isActive}
                        isLastVideo={index === videos.length - 1}
                        establishmentSlug={establishment.slug}
                        onViewCountIncrement={() => incrementViews(video.id)}
                        onVideoEnd={() => {}}
                        onAutoAdvance={handleAutoAdvance}
                        onProgressUpdate={setCurrentProgress}
                        onTapLeft={() => swiperRef.current?.slidePrev()}
                        onTapRight={() => {
                          if (index < videos.length - 1) {
                            swiperRef.current?.slideNext();
                          } else {
                            onClose();
                          }
                        }}
                        onSwipeToProfile={() => {}} // No profile in store context
                      />
                    )}

                    <VilaTokOverlay
                      establishment={establishment}
                      video={{ title: video.title, description: video.description }}
                      product={video.product}
                      onProductClick={handleAddToCart}
                    />

                    <VilaTokSidebar
                      likesCount={video.likes_count + (likedVideos.has(video.id) && !videos.find(v => v.id === video.id)?.likes_count ? 1 : 0)}
                      sharesCount={video.shares_count}
                      commentsCount={video.comments_count}
                      isLiked={likedVideos.has(video.id)}
                      hasProduct={!!video.product}
                      onLike={() => toggleLike(video.id)}
                      onComment={() => {
                        if (!user) {
                          toast.error('Faça login para comentar', {
                            action: { label: 'Entrar', onClick: () => navigate('/auth') },
                          });
                          return;
                        }
                        setShowComments(true);
                      }}
                      onShare={handleShare}
                      onProduct={handleAddToCart}
                      onStore={() => {
                        onClose();
                        // Already on store page
                      }}
                    />
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </div>

      {/* Comments Panel */}
      <VilaTokComments
        videoId={currentVideo?.id || ''}
        isOpen={showComments && !!currentVideo}
        onClose={() => setShowComments(false)}
        commentsCount={currentVideo?.comments_count || 0}
        onCommentsCountChange={() => {}}
      />
    </div>
  );
}
