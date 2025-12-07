import { useEffect, useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Flame } from 'lucide-react';
import { useVilaTok } from '@/hooks/useVilaTok';
import { VilaTokPlayer } from '@/components/vilatok/VilaTokPlayer';
import { VilaTokSidebar } from '@/components/vilatok/VilaTokSidebar';
import { VilaTokOverlay } from '@/components/vilatok/VilaTokOverlay';
import { VilaTokNavigation } from '@/components/vilatok/VilaTokNavigation';
import { VilaTokTutorial } from '@/components/vilatok/VilaTokTutorial';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import VideoComments from '@/components/stories/VideoComments';

const TUTORIAL_STORAGE_KEY = 'vilatok_tutorial_completed';

export default function VilaTok() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get('category');
  
  const { addToCart } = useCart();
  const {
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
    totalEstablishments,
    totalVideosInCurrent,
  } = useVilaTok({ mainCategorySlug: categorySlug });

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem(TUTORIAL_STORAGE_KEY);
  });

  const handleTutorialComplete = useCallback(() => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    setShowTutorial(false);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          goToPreviousEstablishment();
          break;
        case 'ArrowDown':
          goToNextEstablishment();
          break;
        case 'ArrowLeft':
          goToPreviousVideo();
          break;
        case 'ArrowRight':
          goToNextVideo();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextEstablishment, goToPreviousEstablishment, goToNextVideo, goToPreviousVideo]);

  // Handle touch swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart) return;

    const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;

    const minSwipeDistance = 50;

    // Check if horizontal or vertical swipe
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          goToPreviousVideo();
        } else {
          goToNextVideo();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0) {
          goToPreviousEstablishment();
        } else {
          goToNextEstablishment();
        }
      }
    }

    setTouchStart(null);
  }, [touchStart, goToNextEstablishment, goToPreviousEstablishment, goToNextVideo, goToPreviousVideo]);

  const handleShare = useCallback(async () => {
    if (!currentVideo || !currentEstablishment) return;

    const shareUrl = `${window.location.origin}/vilatok?v=${currentVideo.id}`;
    const shareTitle = currentVideo.title || currentEstablishment.establishment.name;
    const shareText = currentVideo.description || `Confira ${currentEstablishment.establishment.name} no VilaTok!`;

    try {
      const shareData = {
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      };
      if (navigator.share) {
        await navigator.share(shareData);
        incrementShares(currentVideo.id);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copiado para a área de transferência!');
        incrementShares(currentVideo.id);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [currentVideo, currentEstablishment, incrementShares]);

  const handleAddToCart = useCallback(async () => {
    if (!currentVideo?.product || !currentEstablishment) return;

    const product = {
      id: currentVideo.product.id,
      name: currentVideo.product.name,
      price: currentVideo.product.price,
      promotional_price: currentVideo.product.promotional_price,
      image_url: currentVideo.product.image_url,
      establishment_id: currentEstablishment.establishment.id,
    };

    const establishmentInfo = {
      id: currentEstablishment.establishment.id,
      name: currentEstablishment.establishment.name,
      slug: currentEstablishment.establishment.slug,
      logo_url: currentEstablishment.establishment.logo_url,
      vila_id: null,
      delivery_base_fee: 0,
      min_order_value: 0,
      accepts_pickup: true,
      accepts_delivery: true,
    };

    await addToCart(product, establishmentInfo);
    toast.success(`${currentVideo.product.name} adicionado ao carrinho!`);
  }, [currentVideo, currentEstablishment, addToCart]);

  const handleGoToStore = useCallback(() => {
    if (!currentEstablishment) return;
    navigate(`/loja/${currentEstablishment.establishment.slug}`);
  }, [currentEstablishment, navigate]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Flame className="w-16 h-16 text-primary mx-auto animate-pulse" />
          <p className="text-white">Carregando VilaTok...</p>
        </div>
      </div>
    );
  }

  if (!currentVideo || !currentEstablishment) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col">
        {/* Header with category pills */}
        <div className="absolute top-0 left-0 right-0 z-30 bg-black/80 backdrop-blur-sm">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>

            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-primary" />
              <span className="text-white font-bold text-lg">VilaTok</span>
            </div>

            <div className="w-10" />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 pt-32">
          <Flame className="w-20 h-20 text-primary mb-6" />
          <h2 className="text-white text-2xl font-bold mb-2">VilaTok</h2>
          <p className="text-white/70 text-center mb-8">
            {categorySlug 
              ? `Nenhum vídeo disponível nesta categoria ainda.`
              : `Nenhum vídeo disponível ainda. Em breve, os estabelecimentos vão compartilhar seus melhores momentos aqui!`
            }
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium"
          >
            Voltar ao Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header with category pills */}
      <div className="absolute top-0 left-0 right-0 z-30">
        <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-primary" />
            <span className="text-white font-bold text-lg">VilaTok</span>
          </div>

          <div className="w-10" />
        </div>
        
      </div>

      {/* Video Player */}
      <VilaTokPlayer
        videoUrl={currentVideo.video_url}
        thumbnailUrl={currentVideo.thumbnail_url}
        musicUrl={currentVideo.music_url}
        isActive={!showTutorial}
        onViewCountIncrement={() => incrementViews(currentVideo.id)}
        onVideoEnd={goToNextEstablishment}
        onAutoAdvance={goToNextVideo}
      />

      {/* Navigation Indicators */}
      <VilaTokNavigation
        totalEstablishments={totalEstablishments}
        currentEstablishmentIndex={currentEstablishmentIndex}
        totalVideos={totalVideosInCurrent}
        currentVideoIndex={currentVideoIndex}
      />

      {/* Sidebar */}
      <div className="absolute right-4 bottom-32 z-20">
        <VilaTokSidebar
          videoId={currentVideo.id}
          likesCount={currentVideo.likes_count}
          sharesCount={currentVideo.shares_count}
          commentsCount={currentVideo.comments_count || 0}
          isLiked={likedVideos.has(currentVideo.id)}
          onLike={() => toggleLike(currentVideo.id)}
          onShare={handleShare}
          onComment={() => setShowComments(true)}
          onViewProduct={handleAddToCart}
          onGoToStore={handleGoToStore}
          hasProduct={!!currentVideo.product}
        />
      </div>

      {/* Comments Modal */}
      <VideoComments
        videoId={currentVideo.id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />

      {/* Overlay */}
      <VilaTokOverlay
        establishment={currentEstablishment.establishment}
        video={{
          title: currentVideo.title,
          description: currentVideo.description,
        }}
        product={currentVideo.product}
        onProductClick={handleAddToCart}
      />

      {/* Tutorial Overlay - First visit only */}
      {showTutorial && (
        <VilaTokTutorial onComplete={handleTutorialComplete} />
      )}
    </div>
  );
}
