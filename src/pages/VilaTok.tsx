import { useCallback, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Flame } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Virtual } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/virtual';

import { useVilaTok } from '@/hooks/useVilaTok';
import { useAuth } from '@/hooks/useAuth';
import { VilaTokPlayer } from '@/components/vilatok/VilaTokPlayer';
import { VilaTokSidebar } from '@/components/vilatok/VilaTokSidebar';
import { VilaTokOverlay } from '@/components/vilatok/VilaTokOverlay';
import { VilaTokNavigation } from '@/components/vilatok/VilaTokNavigation';
import { VilaTokProgressBars } from '@/components/vilatok/VilaTokProgressBars';
import { VilaTokComments } from '@/components/vilatok/VilaTokComments';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';

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
    isLoading,
    likedVideos,
    toggleLike,
    incrementViews,
    incrementShares,
  } = useVilaTok({ mainCategorySlug: categorySlug });

  const [currentProgress, setCurrentProgress] = useState(0);
  const [activeEstablishmentIndex, setActiveEstablishmentIndex] = useState(0);
  const [activeVideoIndices, setActiveVideoIndices] = useState<Map<number, number>>(new Map());
  const [showComments, setShowComments] = useState(false);

  const getActiveVideoIndex = (estIndex: number) => activeVideoIndices.get(estIndex) || 0;

  const handleVerticalSlideChange = useCallback((swiper: SwiperType) => {
    const newEstIndex = swiper.activeIndex;
    setActiveEstablishmentIndex(newEstIndex);
    setCurrentProgress(0);
    
    const horizontalSwiper = horizontalSwipersRef.current.get(newEstIndex);
    if (horizontalSwiper?.activeIndex !== 0) {
      horizontalSwiper?.slideTo(0, 0);
    }
    
    setActiveVideoIndices(prev => {
      const next = new Map(prev);
      next.set(newEstIndex, 0);
      return next;
    });
  }, []);

  const handleHorizontalSlideChange = useCallback((estIndex: number, swiper: SwiperType) => {
    setActiveVideoIndices(prev => {
      const next = new Map(prev);
      next.set(estIndex, swiper.activeIndex);
      return next;
    });
    setCurrentProgress(0);
  }, []);

  const handleAutoAdvance = useCallback(() => {
    const currentHorizontalSwiper = horizontalSwipersRef.current.get(activeEstablishmentIndex);
    const currentVideoIdx = getActiveVideoIndex(activeEstablishmentIndex);
    const currentEst = establishments[activeEstablishmentIndex];
    
    if (currentEst && currentVideoIdx < currentEst.videos.length - 1) {
      currentHorizontalSwiper?.slideNext();
    } else if (verticalSwiperRef.current && activeEstablishmentIndex < establishments.length - 1) {
      verticalSwiperRef.current.slideNext();
    }
  }, [activeEstablishmentIndex, establishments]);

  const handleShare = useCallback(async () => {
    console.log('handleShare called');
    const est = establishments[activeEstablishmentIndex];
    const video = est?.videos[getActiveVideoIndex(activeEstablishmentIndex)];
    if (!video || !est) {
      console.log('No video or establishment found');
      return;
    }

    const shareUrl = `${window.location.origin}/vilatok?v=${video.id}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: video.title || est.establishment.name,
          text: video.description || `Confira ${est.establishment.name} no VilaTok!`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copiado!');
      }
      incrementShares(video.id);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [activeEstablishmentIndex, establishments, incrementShares]);

  const handleAddToCart = useCallback(async () => {
    const est = establishments[activeEstablishmentIndex];
    const video = est?.videos[getActiveVideoIndex(activeEstablishmentIndex)];
    if (!video?.product || !est) return;

    await addToCart(
      {
        id: video.product.id,
        name: video.product.name,
        price: video.product.price,
        promotional_price: video.product.promotional_price,
        image_url: video.product.image_url,
        establishment_id: est.establishment.id,
      },
      {
        id: est.establishment.id,
        name: est.establishment.name,
        slug: est.establishment.slug,
        logo_url: est.establishment.logo_url,
        vila_id: null,
        delivery_base_fee: 0,
        min_order_value: 0,
        accepts_pickup: true,
        accepts_delivery: true,
      }
    );
    toast.success(`${video.product.name} adicionado!`);
  }, [activeEstablishmentIndex, establishments, addToCart]);

  const handleGoToStore = useCallback(() => {
    const est = establishments[activeEstablishmentIndex];
    const video = est?.videos[getActiveVideoIndex(activeEstablishmentIndex)];
    if (est && video?.product) {
      // Navegar para a loja com o produto selecionado
      navigate(`/loja/${est.establishment.slug}?product=${video.product.id}`);
    } else if (est) {
      navigate(`/loja/${est.establishment.slug}`);
    }
  }, [activeEstablishmentIndex, establishments, navigate]);

  const activeEst = establishments[activeEstablishmentIndex];
  const activeVideoIdx = getActiveVideoIndex(activeEstablishmentIndex);
  const activeVideo = activeEst?.videos[activeVideoIdx];

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Flame className="w-16 h-16 text-primary animate-pulse" />
      </div>
    );
  }

  if (!establishments.length) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <Flame className="w-20 h-20 text-primary mb-6" />
        <h2 className="text-white text-2xl font-bold mb-2">VilaTok</h2>
        <p className="text-white/70 text-center mb-8">Nenhum vídeo disponível ainda.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Container com proporção 9:16 no desktop e comentários ao lado */}
      <div className="w-full h-full flex items-center justify-center md:flex-row">
        <div className="relative w-full h-full md:w-auto md:h-full md:flex-shrink-0" style={{ 
          maxWidth: 'calc(100vh * 9 / 16)',
          maxHeight: '100vh',
          aspectRatio: '9/16'
        }}>
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
            <button
              onClick={() => navigate(-1)}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(-1);
              }}
              className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center pointer-events-auto active:bg-black/60"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-primary" />
              <span className="text-white font-bold text-lg">VilaTok</span>
            </div>
            <div className="w-10" />
          </div>

          {/* Progress Bars */}
          {activeEst && (
            <VilaTokProgressBars
              totalVideos={activeEst.videos.length}
              currentVideoIndex={activeVideoIdx}
              currentProgress={currentProgress}
            />
          )}

          {/* Vertical Swiper */}
          <Swiper
            direction="vertical"
            modules={[Virtual]}
            virtual
            speed={200}
            slidesPerView={1}
            threshold={10}
            touchRatio={1}
            longSwipesRatio={0.2}
            resistanceRatio={0.8}
            className="w-full h-full"
            onSwiper={(swiper) => { verticalSwiperRef.current = swiper; }}
            onSlideChange={handleVerticalSlideChange}
          >
        {establishments.map((est, estIndex) => (
          <SwiperSlide key={est.establishment.id} virtualIndex={estIndex} className="w-full h-full">
            {/* Horizontal Swiper */}
            <Swiper
              direction="horizontal"
              speed={180}
              slidesPerView={1}
              threshold={10}
              touchRatio={1}
              resistanceRatio={0.8}
              nested
              className="w-full h-full"
              onSwiper={(swiper) => { horizontalSwipersRef.current.set(estIndex, swiper); }}
              onSlideChange={(swiper) => handleHorizontalSlideChange(estIndex, swiper)}
            >
              {est.videos.map((video, vidIndex) => {
                const isActive = estIndex === activeEstablishmentIndex && vidIndex === activeVideoIdx;
                const isNearby = Math.abs(estIndex - activeEstablishmentIndex) <= 1;
                
                return (
                  <SwiperSlide key={video.id} className="w-full h-full">
                    <div className="relative w-full h-full">
                      {isNearby && (
                        <VilaTokPlayer
                          videoUrl={video.video_url}
                          thumbnailUrl={video.thumbnail_url}
                          musicUrl={video.music_url}
                          isActive={isActive}
                          isLastVideo={vidIndex === est.videos.length - 1}
                          establishmentSlug={est.establishment.slug}
                          onViewCountIncrement={() => incrementViews(video.id)}
                          onVideoEnd={() => {}}
                          onAutoAdvance={handleAutoAdvance}
                          onProgressUpdate={setCurrentProgress}
                          onTapLeft={() => horizontalSwipersRef.current.get(estIndex)?.slidePrev()}
                          onTapRight={() => {
                            const hs = horizontalSwipersRef.current.get(estIndex);
                            if (hs && hs.activeIndex < est.videos.length - 1) {
                              hs.slideNext();
                            } else {
                              verticalSwiperRef.current?.slideNext();
                            }
                          }}
                          onSwipeToProfile={() => navigate(`/vilatok/perfil/@${est.establishment.slug}`)}
                        />
                      )}

                      <VilaTokOverlay
                        establishment={est.establishment}
                        video={{ title: video.title, description: video.description }}
                        product={video.product}
                        onProductClick={handleAddToCart}
                      />

                      <VilaTokSidebar
                        likesCount={video.likes_count}
                        sharesCount={video.shares_count}
                        commentsCount={video.comments_count || 0}
                        isLiked={likedVideos.has(video.id)}
                        hasProduct={!!video.product}
                        onLike={async () => {
                          console.log('Like button clicked for video:', video.id);
                          try {
                            const result = await toggleLike(video.id);
                            if (!result) {
                              toast.error('Faça login para curtir', {
                                action: { label: 'Entrar', onClick: () => navigate('/auth') },
                              });
                            }
                          } catch (error) {
                            console.error('Error toggling like:', error);
                            toast.error('Erro ao curtir');
                          }
                        }}
                        onComment={() => {
                          console.log('Comment button clicked');
                          if (!user) {
                            toast.error('Faça login para comentar', {
                              action: { label: 'Entrar', onClick: () => navigate('/auth') },
                            });
                            return;
                          }
                          setShowComments(true);
                        }}
                        onShare={() => {
                          console.log('Share button clicked');
                          handleShare();
                        }}
                        onProduct={handleAddToCart}
                        onStore={() => {
                          const est = establishments[activeEstablishmentIndex];
                          const video = est?.videos[getActiveVideoIndex(activeEstablishmentIndex)];
                          if (est && video?.product) {
                            // Navegar para a loja com o produto selecionado
                            navigate(`/loja/${est.establishment.slug}?product=${video.product.id}`);
                          } else if (est) {
                            navigate(`/loja/${est.establishment.slug}`);
                          }
                        }}
                      />
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation */}
      <VilaTokNavigation
        totalEstablishments={establishments.length}
        currentEstablishmentIndex={activeEstablishmentIndex}
        totalVideos={activeEst?.videos.length || 0}
        currentVideoIndex={activeVideoIdx}
      />
        </div>
      </div>

      {/* Comments Panel - sempre renderizado para evitar erro de hooks */}
      <VilaTokComments
        videoId={activeVideo?.id || ''}
        isOpen={showComments && !!activeVideo}
        onClose={() => setShowComments(false)}
        commentsCount={activeVideo?.comments_count || 0}
        onCommentsCountChange={(count) => {
          // Update comments count if needed
        }}
      />
    </div>
  );
}