import { useEffect, useCallback, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Flame } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel, Keyboard, FreeMode, Virtual } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/mousewheel';
import 'swiper/css/free-mode';
import 'swiper/css/virtual';

import { useVilaTok } from '@/hooks/useVilaTok';
import { useAuth } from '@/hooks/useAuth';
import { VilaTokPlayer } from '@/components/vilatok/VilaTokPlayer';
import { VilaTokSidebar } from '@/components/vilatok/VilaTokSidebar';
import { VilaTokOverlay } from '@/components/vilatok/VilaTokOverlay';
import { VilaTokNavigation } from '@/components/vilatok/VilaTokNavigation';
import { VilaTokProgressBars } from '@/components/vilatok/VilaTokProgressBars';
import { VilaTokTutorial } from '@/components/vilatok/VilaTokTutorial';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import VideoComments from '@/components/stories/VideoComments';

const TUTORIAL_STORAGE_KEY = 'vilatok_tutorial_completed';

export default function VilaTok() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categorySlug = searchParams.get('category');
  const { user } = useAuth();
  
  const verticalSwiperRef = useRef<SwiperType | null>(null);
  const horizontalSwipersRef = useRef<Map<number, SwiperType>>(new Map());
  
  const { addToCart } = useCart();
  const {
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
    totalEstablishments,
    totalVideosInCurrent,
  } = useVilaTok({ mainCategorySlug: categorySlug });

  const [showComments, setShowComments] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem(TUTORIAL_STORAGE_KEY);
  });
  const [currentProgress, setCurrentProgress] = useState(0);
  const [activeEstablishmentIndex, setActiveEstablishmentIndex] = useState(0);
  const [activeVideoIndices, setActiveVideoIndices] = useState<Map<number, number>>(new Map());

  const handleTutorialComplete = useCallback(() => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    setShowTutorial(false);
  }, []);

  // Get current active video index for establishment
  const getActiveVideoIndex = (estIndex: number) => {
    return activeVideoIndices.get(estIndex) || 0;
  };

  // Handle vertical slide change (establishment)
  const handleVerticalSlideChange = useCallback((swiper: SwiperType) => {
    setActiveEstablishmentIndex(swiper.activeIndex);
    setCurrentProgress(0);
  }, []);

  // Handle horizontal slide change (video within establishment)
  const handleHorizontalSlideChange = useCallback((estIndex: number, swiper: SwiperType) => {
    setActiveVideoIndices(prev => {
      const next = new Map(prev);
      next.set(estIndex, swiper.activeIndex);
      return next;
    });
    setCurrentProgress(0);
  }, []);

  // Handle auto-advance: go to next video, or next establishment if last video
  const handleAutoAdvance = useCallback(() => {
    const currentHorizontalSwiper = horizontalSwipersRef.current.get(activeEstablishmentIndex);
    const currentVideoIdx = getActiveVideoIndex(activeEstablishmentIndex);
    const currentEst = establishments[activeEstablishmentIndex];
    
    if (currentEst && currentVideoIdx < currentEst.videos.length - 1) {
      // More videos in current establishment - advance horizontal
      currentHorizontalSwiper?.slideNext();
    } else if (verticalSwiperRef.current && activeEstablishmentIndex < establishments.length - 1) {
      // Last video, go to next establishment
      verticalSwiperRef.current.slideNext();
    }
  }, [activeEstablishmentIndex, establishments, activeVideoIndices]);

  // Reset progress when video changes
  useEffect(() => {
    setCurrentProgress(0);
  }, [activeEstablishmentIndex, activeVideoIndices]);

  const handleShare = useCallback(async () => {
    const estIndex = activeEstablishmentIndex;
    const vidIndex = getActiveVideoIndex(estIndex);
    const est = establishments[estIndex];
    const video = est?.videos[vidIndex];
    
    if (!video || !est) return;

    const shareUrl = `${window.location.origin}/vilatok?v=${video.id}`;
    const shareTitle = video.title || est.establishment.name;
    const shareText = video.description || `Confira ${est.establishment.name} no VilaTok!`;

    try {
      const shareData = {
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      };
      if (navigator.share) {
        await navigator.share(shareData);
        incrementShares(video.id);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copiado para a área de transferência!');
        incrementShares(video.id);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [activeEstablishmentIndex, establishments, activeVideoIndices, incrementShares]);

  const handleAddToCart = useCallback(async () => {
    const estIndex = activeEstablishmentIndex;
    const vidIndex = getActiveVideoIndex(estIndex);
    const est = establishments[estIndex];
    const video = est?.videos[vidIndex];
    
    if (!video?.product || !est) return;

    const product = {
      id: video.product.id,
      name: video.product.name,
      price: video.product.price,
      promotional_price: video.product.promotional_price,
      image_url: video.product.image_url,
      establishment_id: est.establishment.id,
    };

    const establishmentInfo = {
      id: est.establishment.id,
      name: est.establishment.name,
      slug: est.establishment.slug,
      logo_url: est.establishment.logo_url,
      vila_id: null,
      delivery_base_fee: 0,
      min_order_value: 0,
      accepts_pickup: true,
      accepts_delivery: true,
    };

    await addToCart(product, establishmentInfo);
    toast.success(`${video.product.name} adicionado ao carrinho!`);
  }, [activeEstablishmentIndex, establishments, activeVideoIndices, addToCart]);

  const handleGoToStore = useCallback(() => {
    const est = establishments[activeEstablishmentIndex];
    if (!est) return;
    navigate(`/loja/${est.establishment.slug}`);
  }, [activeEstablishmentIndex, establishments, navigate]);

  const handleProgressUpdate = useCallback((progress: number) => {
    setCurrentProgress(progress);
  }, []);

  // Get current active video and establishment
  const activeEst = establishments[activeEstablishmentIndex];
  const activeVideoIdx = getActiveVideoIndex(activeEstablishmentIndex);
  const activeVideo = activeEst?.videos[activeVideoIdx];

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

  if (establishments.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col">
        {/* Header */}
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
    <div className="fixed inset-0 bg-black overflow-hidden vilatok-container">
      {/* Header */}
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

      {/* Instagram-style Progress Bars */}
      {activeEst && (
        <VilaTokProgressBars
          totalVideos={activeEst.videos.length}
          currentVideoIndex={activeVideoIdx}
          currentProgress={currentProgress}
        />
      )}

      {/* Vertical Swiper (Establishments) - Ultra-fluid config */}
      <Swiper
        direction="vertical"
        modules={[Mousewheel, Keyboard, FreeMode, Virtual]}
        virtual
        mousewheel={{
          sensitivity: 1.2,
          thresholdDelta: 10,
          forceToAxis: true,
          releaseOnEdges: true,
        }}
        keyboard={{
          enabled: !showTutorial,
          onlyInViewport: true,
        }}
        speed={200}
        slidesPerView={1}
        threshold={5}
        touchRatio={1.2}
        shortSwipes={true}
        longSwipesRatio={0.15}
        longSwipesMs={100}
        followFinger={true}
        resistanceRatio={0.85}
        cssMode={false}
        touchStartPreventDefault={false}
        touchMoveStopPropagation={true}
        passiveListeners={true}
        edgeSwipeDetection={true}
        edgeSwipeThreshold={20}
        freeMode={{
          enabled: false,
          momentum: true,
          momentumRatio: 0.8,
          momentumBounce: true,
          momentumBounceRatio: 0.6,
        }}
        className="w-full h-full"
        onSwiper={(swiper) => {
          verticalSwiperRef.current = swiper;
        }}
        onSlideChange={handleVerticalSlideChange}
      >
        {establishments.map((est, estIndex) => (
          <SwiperSlide 
            key={est.establishment.id} 
            className="w-full h-full vilatok-slide"
            virtualIndex={estIndex}
          >
            {/* Horizontal Swiper (Videos within Establishment) - Ultra-fluid config */}
            <Swiper
              direction="horizontal"
              modules={[Mousewheel, Keyboard, FreeMode]}
              mousewheel={{
                sensitivity: 1.2,
                thresholdDelta: 10,
                forceToAxis: true,
                releaseOnEdges: true,
              }}
              keyboard={{
                enabled: !showTutorial && estIndex === activeEstablishmentIndex,
                onlyInViewport: true,
              }}
              speed={180}
              slidesPerView={1}
              threshold={5}
              touchRatio={1.2}
              shortSwipes={true}
              longSwipesRatio={0.15}
              longSwipesMs={100}
              followFinger={true}
              resistanceRatio={0.85}
              touchStartPreventDefault={false}
              touchMoveStopPropagation={true}
              passiveListeners={true}
              freeMode={{
                enabled: false,
                momentum: true,
                momentumRatio: 0.8,
              }}
              className="w-full h-full"
              onSwiper={(swiper) => {
                horizontalSwipersRef.current.set(estIndex, swiper);
              }}
              onSlideChange={(swiper) => handleHorizontalSlideChange(estIndex, swiper)}
              nested={true}
            >
              {est.videos.map((video, vidIndex) => {
                const isVideoActive = !showTutorial && estIndex === activeEstablishmentIndex && vidIndex === (activeVideoIndices.get(estIndex) || 0);
                const isNearby = Math.abs(estIndex - activeEstablishmentIndex) <= 1;
                
                return (
                  <SwiperSlide key={video.id} className="w-full h-full vilatok-slide">
                    <div className="relative w-full h-full">
                      {isNearby && (
                        <VilaTokPlayer
                          videoUrl={video.video_url}
                          thumbnailUrl={video.thumbnail_url}
                          musicUrl={video.music_url}
                          isActive={isVideoActive}
                          onViewCountIncrement={() => incrementViews(video.id)}
                          onVideoEnd={() => {}}
                          onAutoAdvance={handleAutoAdvance}
                          onProgressUpdate={handleProgressUpdate}
                        />
                      )}

                      <VilaTokOverlay
                        establishment={est.establishment}
                        video={{
                          title: video.title,
                          description: video.description,
                        }}
                        product={video.product}
                        onProductClick={handleAddToCart}
                      />

                      <div className="absolute right-4 bottom-32 z-20">
                        <VilaTokSidebar
                          videoId={video.id}
                          likesCount={video.likes_count}
                          sharesCount={video.shares_count}
                          commentsCount={video.comments_count || 0}
                          isLiked={likedVideos.has(video.id)}
                          onLike={async () => {
                            const success = await toggleLike(video.id);
                            if (!success) {
                              toast.error('Faça login para curtir', {
                                action: {
                                  label: 'Entrar',
                                  onClick: () => navigate('/auth'),
                                },
                              });
                            }
                          }}
                          onShare={handleShare}
                          onComment={() => {
                            if (!user) {
                              toast.error('Faça login para comentar', {
                                action: {
                                  label: 'Entrar',
                                  onClick: () => navigate('/auth'),
                                },
                              });
                              return;
                            }
                            setShowComments(true);
                          }}
                          onViewProduct={handleAddToCart}
                          onGoToStore={handleGoToStore}
                          hasProduct={!!video.product}
                        />
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation Indicators */}
      <VilaTokNavigation
        totalEstablishments={establishments.length}
        currentEstablishmentIndex={activeEstablishmentIndex}
        totalVideos={activeEst?.videos.length || 0}
        currentVideoIndex={activeVideoIdx}
      />

      {/* Comments Modal */}
      {activeVideo && (
        <VideoComments
          videoId={activeVideo.id}
          isOpen={showComments}
          onClose={() => setShowComments(false)}
        />
      )}

      {/* Tutorial Overlay - First visit only */}
      {showTutorial && (
        <VilaTokTutorial onComplete={handleTutorialComplete} />
      )}
    </div>
  );
}
