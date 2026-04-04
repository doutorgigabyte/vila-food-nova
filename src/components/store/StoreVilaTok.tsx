import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, Heart, MessageCircle, Share2, ShoppingBag, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VilaTokComments } from "@/components/vilatok/VilaTokComments";
import { getImageUrl } from "@/lib/s3";

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

const formatCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

export function StoreVilaTok({ 
  videos, 
  establishment,
  isOpen,
  onClose,
}: StoreVilaTokProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [localLikesCount, setLocalLikesCount] = useState<Record<string, number>>({});
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressInterval = useRef<NodeJS.Timeout>();

  const currentVideo = videos[currentIndex];
  const hasVideos = videos.length > 0;

  // Initialize local likes count
  useEffect(() => {
    const counts: Record<string, number> = {};
    videos.forEach(v => { counts[v.id] = v.likes_count; });
    setLocalLikesCount(counts);
  }, [videos]);

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

  // Progress timer
  useEffect(() => {
    if (!isOpen || isPaused || showComments) return;

    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goToNext();
          return 0;
        }
        const duration = currentVideo?.duration || 15;
        return prev + (100 / (duration * 10));
      });
    }, 100);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isOpen, isPaused, showComments, currentIndex, currentVideo]);

  // Handle audio sync with mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      if (!isMuted && isOpen) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [isMuted, isOpen, currentIndex]);

  // Increment view count on video change
  useEffect(() => {
    if (!isOpen || !currentVideo) return;
    
    const incrementViews = async () => {
      await supabase
        .from('establishment_videos')
        .update({ views_count: (currentVideo as any).views_count ? (currentVideo as any).views_count + 1 : 1 })
        .eq('id', currentVideo.id);
    };
    
    incrementViews();
  }, [isOpen, currentIndex, currentVideo?.id]);

  const goToNext = useCallback(() => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
      setCurrentIndex(0);
      setProgress(0);
    }
  }, [currentIndex, videos.length, onClose]);

  const goToPrevious = useCallback(() => {
    if (progress > 10) {
      setProgress(0);
    } else if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  }, [currentIndex, progress]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setProgress(0);
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
    setCurrentIndex(0);
    setProgress(0);
    setIsPaused(false);
    setShowComments(false);
  };

  const handleTouchStart = () => {
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    
    const touch = e.changedTouches[0];
    const screenWidth = window.innerWidth;
    
    if (touch.clientX < screenWidth / 3) {
      goToPrevious();
    } else if (touch.clientX > (screenWidth * 2) / 3) {
      goToNext();
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const toggleLike = useCallback(async () => {
    if (!user || !currentVideo) {
      toast.error('Faça login para curtir', {
        action: { label: 'Entrar', onClick: () => navigate('/auth') },
      });
      return;
    }

    const videoId = currentVideo.id;
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
    
    setLocalLikesCount(prev => ({
      ...prev,
      [videoId]: isLiked ? Math.max(0, (prev[videoId] || 0) - 1) : (prev[videoId] || 0) + 1
    }));

    try {
      if (isLiked) {
        await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', user.id);
        
        await supabase
          .from('establishment_videos')
          .update({ likes_count: Math.max(0, (localLikesCount[videoId] || 0) - 1) })
          .eq('id', videoId);
      } else {
        await supabase
          .from('video_likes')
          .insert({ video_id: videoId, user_id: user.id });
        
        await supabase
          .from('establishment_videos')
          .update({ likes_count: (localLikesCount[videoId] || 0) + 1 })
          .eq('id', videoId);
      }
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
      setLocalLikesCount(prev => ({
        ...prev,
        [videoId]: isLiked ? (prev[videoId] || 0) + 1 : Math.max(0, (prev[videoId] || 0) - 1)
      }));
      console.error('Error toggling like:', error);
    }
  }, [user, currentVideo, likedVideos, localLikesCount, navigate]);

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
      
      await supabase
        .from('establishment_videos')
        .update({ shares_count: (currentVideo.shares_count || 0) + 1 })
        .eq('id', currentVideo.id);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [currentVideo, establishment]);

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
    toast.success(`${currentVideo.product.name} adicionado ao carrinho!`);
  }, [currentVideo, establishment, addToCart]);

  const handleOpenComments = () => {
    if (!user) {
      toast.error('Faça login para comentar', {
        action: { label: 'Entrar', onClick: () => navigate('/auth') },
      });
      return;
    }
    setShowComments(true);
  };

  if (!hasVideos || !isOpen || !currentVideo) {
    return null;
  }

  const isLiked = likedVideos.has(currentVideo.id);
  const likesCount = localLikesCount[currentVideo.id] ?? currentVideo.likes_count;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-black"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Progress bars - EXACTLY like StoreStories */}
        <div className="absolute top-0 left-0 right-0 z-20 p-2 safe-area-inset-top">
          <div className="flex gap-1">
            {videos.map((_, index) => (
              <div 
                key={index}
                className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
              >
                <div 
                  className="h-full bg-white transition-all duration-100"
                  style={{ 
                    width: index < currentIndex 
                      ? "100%" 
                      : index === currentIndex 
                        ? `${progress}%` 
                        : "0%" 
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Header - EXACTLY like StoreStories */}
        <div className="absolute top-8 left-0 right-0 z-20 flex items-center justify-between px-4 safe-area-inset-top">
          <div className="flex items-center gap-3">
            {establishment.logo_url && (
              <img 
                src={getImageUrl(establishment.logo_url)}
                alt={establishment.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white"
              />
            )}
            <span className="text-white font-medium text-sm">{establishment.name}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Video/Image Content - EXACTLY like StoreStories */}
        <div className="absolute inset-0 flex items-center justify-center">
          {currentVideo.video_url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
            <img
              src={currentVideo.video_url}
              alt=""
              className="w-full h-full object-contain"
              draggable={false}
            />
          ) : (
            <video
              ref={videoRef}
              src={currentVideo.video_url}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              muted={isMuted}
              loop
            />
          )}
          
          {/* Audio for music */}
          {currentVideo.music_url && (
            <audio
              ref={audioRef}
              src={currentVideo.music_url}
              autoPlay
              loop
              muted={isMuted}
            />
          )}
        </div>

        {/* Navigation arrows (desktop) - EXACTLY like StoreStories */}
        <div className="absolute inset-y-0 left-0 w-1/3 z-10 hidden md:flex items-center justify-start pl-4">
          {currentIndex > 0 && (
            <button
              onClick={goToPrevious}
              className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}
        </div>
        
        <div className="absolute inset-y-0 right-0 w-1/3 z-10 hidden md:flex items-center justify-end pr-16">
          {currentIndex < videos.length - 1 && (
            <button
              onClick={goToNext}
              className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}
        </div>

        {/* NEW: Sidebar with actions (right side) */}
        <div className="absolute right-3 bottom-32 z-20 flex flex-col items-center gap-4">
          {/* Like */}
          <button onClick={toggleLike} className="flex flex-col items-center gap-1">
            <div className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center",
              isLiked ? "bg-red-500" : "bg-black/40"
            )}>
              <Heart className={cn("w-6 h-6", isLiked ? "text-white fill-white" : "text-white")} />
            </div>
            <span className="text-white text-xs font-medium">{formatCount(likesCount)}</span>
          </button>

          {/* Comment */}
          <button onClick={handleOpenComments} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-black/40 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium">{formatCount(currentVideo.comments_count)}</span>
          </button>

          {/* Share */}
          <button onClick={handleShare} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-black/40 flex items-center justify-center">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium">{formatCount(currentVideo.shares_count)}</span>
          </button>

          {/* Product (if exists) */}
          {currentVideo.product && (
            <button onClick={handleAddToCart} className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs font-medium">Comprar</span>
            </button>
          )}
        </div>

        {/* Bottom section: Description + Product Card */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent safe-area-inset-bottom z-10">
          {/* Product Card (if exists) */}
          {currentVideo.product && (
            <button
              onClick={handleAddToCart}
              className="w-full mb-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center gap-3 active:bg-white/20 transition-colors"
            >
              {currentVideo.product.image_url && (
                <img
                  src={getImageUrl(currentVideo.product.image_url)}
                  alt={currentVideo.product.name}
                  className="w-14 h-14 rounded-lg object-cover"
                />
              )}
              <div className="flex-1 text-left">
                <p className="text-white font-medium text-sm line-clamp-1">{currentVideo.product.name}</p>
                <div className="flex items-center gap-2">
                  {currentVideo.product.promotional_price ? (
                    <>
                      <span className="text-white/60 text-xs line-through">
                        R$ {currentVideo.product.price.toFixed(2)}
                      </span>
                      <span className="text-green-400 font-bold text-sm">
                        R$ {currentVideo.product.promotional_price.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-white font-bold text-sm">
                      R$ {currentVideo.product.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-primary px-4 py-2 rounded-lg">
                <span className="text-white text-sm font-semibold">Eu Quero!</span>
              </div>
            </button>
          )}

          {/* Description */}
          {(currentVideo.title || currentVideo.description) && (
            <div className="pr-16">
              {currentVideo.title && (
                <p className="text-white font-semibold text-sm mb-1">{currentVideo.title}</p>
              )}
              {currentVideo.description && (
                <p className="text-white/90 text-sm line-clamp-2">{currentVideo.description}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comments Panel */}
      <VilaTokComments
        videoId={currentVideo.id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        commentsCount={currentVideo.comments_count}
        onCommentsCountChange={() => {}}
      />
    </>
  );
}

export default StoreVilaTok;
