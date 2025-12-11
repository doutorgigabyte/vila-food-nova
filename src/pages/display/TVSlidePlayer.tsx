import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { DOMAIN } from "@/lib/constants";
import { 
  GradientBackground, 
  WaveLines, 
  GeometricShapes, 
  NoiseTexture, 
  AnimatedDots,
  BlobShapes,
  StripeLines
} from "@/components/dashboard/vilatok-tv/TVBackgroundPatterns";
import { SlideFooter } from "@/components/dashboard/vilatok-tv/SlideFooter";
import { QRCodeWithFrame, QRCodeCompact } from "@/components/dashboard/vilatok-tv/QRCodeWithFrame";

interface TVSlide {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  product_id: string | null;
  template_type: string;
  badge_text?: string | null;
  secondary_images?: string[];
  media_type?: string;
  duration_seconds?: number;
  image_scale?: number;
  image_position_x?: number;
  image_position_y?: number;
  product?: {
    id: string;
    name: string;
    price: number;
    promotional_price: number | null;
  } | null;
}

interface Establishment {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  website_url: string | null;
}

interface PlaylistSettings {
  playback_mode: 'sequential' | 'random' | 'loop';
  default_duration: number;
  transition_type: 'fade' | 'slide' | 'zoom';
}

// =====================
// COMPONENTES AUXILIARES
// =====================

// Logo fixa com moldura circular - PREENCHENDO 100% da moldura
function FixedLogo({ logoUrl, name, variant = 'light' }: { logoUrl: string | null; name: string; variant?: 'light' | 'dark' }) {
  if (!logoUrl) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
      className="absolute top-10 left-10 z-30"
    >
      <div 
        className={`w-28 h-28 rounded-full overflow-hidden border-4 shadow-2xl ${
          variant === 'dark' ? 'border-white/40 bg-white/20' : 'border-white bg-white'
        }`}
        style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}
      >
        <img 
          src={logoUrl} 
          alt={name} 
          className="w-full h-full object-cover"
        />
      </div>
    </motion.div>
  );
}

// Renderiza mídia (imagem ou vídeo) com ajustes
function MediaFrame({
  slide,
  className = "",
  frameClassName = "",
  showOverlay = false,
}: {
  slide: TVSlide;
  className?: string;
  frameClassName?: string;
  showOverlay?: boolean;
}) {
  const isVideo = slide.media_type === 'video' || slide.image_url?.match(/\.(mp4|webm|mov)$/i);
  const scale = slide.image_scale || 1;
  const posX = slide.image_position_x || 0;
  const posY = slide.image_position_y || 0;
  
  const mediaStyle = {
    transform: `scale(${scale}) translate(${posX}%, ${posY}%)`,
    transformOrigin: 'center center'
  };

  if (isVideo) {
    return (
      <div className={`overflow-hidden ${frameClassName}`}>
        <video
          src={slide.image_url}
          className={`w-full h-full object-cover ${className}`}
          style={mediaStyle}
          autoPlay
          muted
          loop
          playsInline
        />
        {showOverlay && <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />}
      </div>
    );
  }

  return (
    <div className={`overflow-hidden ${frameClassName}`}>
      <img
        src={slide.image_url}
        alt={slide.title || 'Slide'}
        className={`w-full h-full object-cover ${className}`}
        style={mediaStyle}
      />
      {showOverlay && <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />}
    </div>
  );
}

// =====================
// COMPONENTE PRINCIPAL
// =====================

export default function TVSlidePlayer() {
  const { token } = useParams<{ token: string }>();
  const [slides, setSlides] = useState<TVSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [playlistSettings, setPlaylistSettings] = useState<PlaylistSettings>({
    playback_mode: 'sequential',
    default_duration: 10,
    transition_type: 'fade'
  });
  const [shuffledOrder, setShuffledOrder] = useState<number[]>([]);

  useEffect(() => {
    if (token) validateAndFetch();
  }, [token]);

  useEffect(() => {
    if (playlistSettings.playback_mode === 'random' && slides.length > 0) {
      const order = [...Array(slides.length).keys()];
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      setShuffledOrder(order);
    }
  }, [slides.length, playlistSettings.playback_mode]);

  const getActualSlideIndex = useCallback((index: number) => {
    if (playlistSettings.playback_mode === 'random' && shuffledOrder.length > 0) {
      return shuffledOrder[index % shuffledOrder.length];
    }
    return index;
  }, [playlistSettings.playback_mode, shuffledOrder]);

  useEffect(() => {
    if (slides.length === 0) return;
    
    const actualIndex = getActualSlideIndex(currentIndex);
    const currentSlide = slides[actualIndex];
    const isVideo = currentSlide?.media_type === 'video' || 
      currentSlide?.image_url?.match(/\.(mp4|webm|mov)$/i);
    
    if (isVideo) return;
    
    const duration = (currentSlide?.duration_seconds || playlistSettings.default_duration) * 1000;
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [currentIndex, slides, playlistSettings.default_duration, getActualSlideIndex]);

  const validateAndFetch = async () => {
    try {
      const { data: tokenData, error: tokenError } = await (supabase
        .from("public_display_tokens" as any)
        .select("establishment_id")
        .eq("token", token)
        .eq("display_type", "tv_slides")
        .eq("is_active", true)
        .single() as any);

      if (tokenError || !tokenData) {
        setError("Token inválido ou expirado");
        setLoading(false);
        return;
      }

      const { data: estData } = await supabase
        .from("establishments")
        .select("id, name, slug, logo_url, primary_color, phone, whatsapp, instagram_url, facebook_url, tiktok_url, twitter_url, youtube_url, website_url")
        .eq("id", tokenData.establishment_id)
        .single();

      if (estData) setEstablishment(estData);

      const { data: settingsData } = await (supabase
        .from("tv_playlist_settings" as any)
        .select("playback_mode, default_duration, transition_type")
        .eq("establishment_id", tokenData.establishment_id)
        .single() as any);

      if (settingsData) {
        setPlaylistSettings(settingsData);
      }

      const { data: slidesData } = await (supabase
        .from("tv_slides" as any)
        .select("*, product:products(id, name, price, promotional_price)")
        .eq("establishment_id", tokenData.establishment_id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }) as any);

      setSlides((slidesData || []) as TVSlide[]);
    } catch (err) {
      setError("Erro ao carregar slides");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="animate-pulse text-white text-4xl font-bold">Carregando...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white">
        <AlertCircle className="w-24 h-24 text-red-500 mb-8" />
        <h1 className="text-5xl font-bold mb-4">Acesso Negado</h1>
        <p className="text-3xl text-gray-400">{error}</p>
      </div>
    );
  }

  // Empty state
  if (slides.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white">
        <h1 className="text-6xl font-bold mb-8">{establishment?.name}</h1>
        <p className="text-3xl text-gray-400">Nenhum slide configurado</p>
      </div>
    );
  }

  const actualIndex = getActualSlideIndex(currentIndex);
  const currentSlide = slides[actualIndex];
  const storeUrl = establishment ? `https://${establishment.slug}.${DOMAIN}` : '';
  const productUrl = currentSlide.product?.id 
    ? `${storeUrl}/produto/${currentSlide.product.id}`
    : storeUrl;
  const primaryColor = establishment?.primary_color || '#2D8B8B';
  const secondaryColor = '#F8F5F0';
  const accentColor = '#C4A574';

  const formatPrice = (price: number) => `R$ ${price.toFixed(2).replace('.', ',')}`;

  const socialLinks = {
    instagram_url: establishment?.instagram_url,
    facebook_url: establishment?.facebook_url,
    tiktok_url: establishment?.tiktok_url,
    twitter_url: establishment?.twitter_url,
    youtube_url: establishment?.youtube_url
  };

  // =====================
  // CONSTANTES DE TIPOGRAFIA TV
  // =====================
  const TV_TITLE = "text-8xl font-black uppercase leading-[0.92]";
  const TV_SUBTITLE = "text-3xl leading-relaxed";
  const TV_PRICE = "text-7xl font-black";
  const TV_MARGIN = "px-16 py-12";

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: secondaryColor }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {/* ===== TEMPLATE: PRODUCT SHOWCASE ===== */}
          {currentSlide.template_type === 'product_showcase' && (
            <div className="relative w-full h-full flex flex-col" style={{ backgroundColor: secondaryColor }}>
              <GradientBackground primaryColor={primaryColor} secondaryColor={secondaryColor} variant="mesh" />
              <WaveLines color={primaryColor} opacity={0.12} />
              <NoiseTexture opacity={0.02} />
              
              <FixedLogo logoUrl={establishment?.logo_url} name={establishment?.name || ''} />
              
              <div className="flex-1 flex relative z-10">
                {/* Imagem - 58% largura */}
                <div className="w-[58%] h-full relative">
                  <motion.div
                    initial={{ scale: 0.9, x: -50, opacity: 0 }}
                    animate={{ scale: 1, x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="absolute inset-y-8 left-0 right-8"
                  >
                    <MediaFrame 
                      slide={currentSlide} 
                      frameClassName="w-full h-full rounded-r-[80px] shadow-[0_0_80px_rgba(0,0,0,0.25)]"
                    />
                  </motion.div>
                </div>

                {/* Conteúdo - 42% largura */}
                <div className="w-[42%] h-full flex flex-col justify-center items-start pl-8 pr-16">
                  <motion.h1 
                    initial={{ opacity: 0, x: 30 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: 0.2 }} 
                    className={`${TV_TITLE} mb-8`}
                    style={{ color: primaryColor, textShadow: '4px 4px 0 rgba(0,0,0,0.08)' }}
                  >
                    {currentSlide.title || currentSlide.product?.name || 'Destaque'}
                  </motion.h1>
                  
                  {currentSlide.subtitle && (
                    <motion.p 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: 0.3 }} 
                      className={`${TV_SUBTITLE} text-gray-600 mb-8 max-w-xl line-clamp-3`}
                    >
                      {currentSlide.subtitle}
                    </motion.p>
                  )}
                  
                  {currentSlide.product && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      transition={{ delay: 0.4 }} 
                      className={`${TV_PRICE} text-gray-800 mb-10`}
                    >
                      {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                    </motion.div>
                  )}
                  
                  <QRCodeWithFrame
                    url={productUrl}
                    primaryColor={primaryColor}
                    label="COMPRE AQUI"
                    buttonText="Eu quero!"
                    size="lg"
                  />
                </div>
              </div>

              <SlideFooter 
                primaryColor={primaryColor}
                slug={establishment?.slug || ''}
                phone={establishment?.phone}
                whatsapp={establishment?.whatsapp}
                socialLinks={socialLinks}
              />
            </div>
          )}

          {/* ===== TEMPLATE: MINIMAL ===== */}
          {currentSlide.template_type === 'minimal' && (
            <div className="relative w-full h-full flex flex-col">
              <div className="flex-1 relative">
                <MediaFrame 
                  slide={currentSlide} 
                  frameClassName="w-full h-full"
                  showOverlay
                />
                
                <FixedLogo logoUrl={establishment?.logo_url} name={establishment?.name || ''} variant="dark" />
                
                {/* Conteúdo sobreposto */}
                <div className="absolute bottom-16 left-16 right-16 flex items-end justify-between">
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="bg-black/70 backdrop-blur-md px-12 py-8 rounded-3xl max-w-3xl"
                  >
                    <h2 className="text-7xl font-black text-white uppercase leading-tight mb-4">
                      {currentSlide.title || 'Destaque'}
                    </h2>
                    {currentSlide.product && (
                      <p className="text-5xl font-black text-white">
                        {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                      </p>
                    )}
                  </motion.div>

                  <QRCodeCompact 
                    url={productUrl}
                    primaryColor={primaryColor}
                    buttonText="Eu quero!"
                    size="lg"
                  />
                </div>
              </div>

              <SlideFooter 
                primaryColor={primaryColor}
                slug={establishment?.slug || ''}
                phone={establishment?.phone}
                whatsapp={establishment?.whatsapp}
                socialLinks={socialLinks}
                variant="dark"
              />
            </div>
          )}

          {/* ===== TEMPLATE: PROMO ===== */}
          {currentSlide.template_type === 'promo' && (
            <div className="relative w-full h-full flex flex-col" style={{ backgroundColor: secondaryColor }}>
              <GradientBackground primaryColor={primaryColor} secondaryColor={secondaryColor} variant="diagonal" />
              <WaveLines color={primaryColor} opacity={0.1} />
              <GeometricShapes color={primaryColor} variant="circles" />
              <NoiseTexture opacity={0.02} />
              
              <FixedLogo logoUrl={establishment?.logo_url} name={establishment?.name || ''} />
              
              <div className="flex-1 flex relative z-10">
                {/* Info - 42% */}
                <div className="w-[42%] h-full flex flex-col justify-center pl-16 pr-8 pt-20">
                  {currentSlide.badge_text && (
                    <motion.div 
                      animate={{ scale: [1, 1.05, 1] }} 
                      transition={{ repeat: Infinity, duration: 2 }} 
                      className="inline-flex items-center gap-3 px-10 py-4 rounded-full text-2xl font-bold text-white mb-10 w-fit shadow-xl" 
                      style={{ backgroundColor: accentColor }}
                    >
                      ⭐ {currentSlide.badge_text}
                    </motion.div>
                  )}
                  
                  <h1 
                    className={`${TV_TITLE} mb-8`}
                    style={{ color: primaryColor, textShadow: '4px 4px 0 rgba(0,0,0,0.08)' }}
                  >
                    {currentSlide.title || currentSlide.product?.name}
                  </h1>
                  
                  {currentSlide.product && (
                    <div className="mb-12">
                      {currentSlide.product.promotional_price && (
                        <span className="text-4xl text-gray-400 line-through mr-6">
                          {formatPrice(currentSlide.product.price)}
                        </span>
                      )}
                      <span className={`${TV_PRICE} text-gray-800`}>
                        {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                      </span>
                    </div>
                  )}

                  <QRCodeWithFrame
                    url={productUrl}
                    primaryColor={primaryColor}
                    label="COMPRE AQUI"
                    buttonText="Eu quero!"
                    size="md"
                  />
                </div>

                {/* Imagem - 58% */}
                <div className="w-[58%] h-full relative">
                  <motion.div 
                    initial={{ scale: 0.9, x: 50 }} 
                    animate={{ scale: 1, x: 0 }} 
                    transition={{ duration: 0.5 }} 
                    className="absolute inset-y-8 left-8 right-0"
                  >
                    <MediaFrame 
                      slide={currentSlide}
                      frameClassName="w-full h-full rounded-l-[80px] shadow-[0_0_80px_rgba(0,0,0,0.25)]"
                    />
                  </motion.div>
                </div>
              </div>

              <SlideFooter 
                primaryColor={primaryColor}
                slug={establishment?.slug || ''}
                phone={establishment?.phone}
                whatsapp={establishment?.whatsapp}
                socialLinks={socialLinks}
              />
            </div>
          )}

          {/* ===== TEMPLATE: FULL IMAGE ===== */}
          {currentSlide.template_type === 'full_image' && (
            <div className="relative w-full h-full flex flex-col">
              <div className="flex-1 relative">
                <MediaFrame slide={currentSlide} frameClassName="w-full h-full" showOverlay />
                
                <FixedLogo logoUrl={establishment?.logo_url} name={establishment?.name || ''} variant="dark" />

                <div className="absolute bottom-16 left-16 right-16 flex items-end justify-between">
                  {currentSlide.title && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-black/70 backdrop-blur-md px-12 py-8 rounded-3xl"
                    >
                      <h2 className="text-7xl font-black text-white uppercase">{currentSlide.title}</h2>
                      {currentSlide.product && (
                        <p className="text-5xl font-black text-white mt-4">
                          {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                        </p>
                      )}
                    </motion.div>
                  )}

                  <QRCodeCompact 
                    url={productUrl}
                    primaryColor={primaryColor}
                    buttonText="Eu quero!"
                    size="lg"
                  />
                </div>
              </div>

              <SlideFooter 
                primaryColor={primaryColor}
                slug={establishment?.slug || ''}
                phone={establishment?.phone}
                whatsapp={establishment?.whatsapp}
                socialLinks={socialLinks}
                variant="dark"
              />
            </div>
          )}

          {/* ===== TEMPLATE: BLOB MODERN ===== */}
          {currentSlide.template_type === 'blob_modern' && (
            <div className="relative w-full h-full bg-gray-900 flex flex-col overflow-hidden">
              <BlobShapes color={primaryColor} variant="large" />
              <BlobShapes color={accentColor} variant="scattered" />
              <NoiseTexture opacity={0.04} />
              
              <FixedLogo logoUrl={establishment?.logo_url} name={establishment?.name || ''} variant="dark" />
              
              <div className="flex-1 relative z-10 flex items-center px-20 pt-16">
                {/* Imagem - círculo grande */}
                <div className="flex-1 flex items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    transition={{ duration: 0.6 }} 
                    className="relative"
                  >
                    <div className="absolute inset-0 rounded-full bg-white/10 blur-3xl scale-125" />
                    <div className="relative w-[650px] h-[650px] rounded-full overflow-hidden border-[14px] border-white shadow-2xl">
                      <MediaFrame slide={currentSlide} frameClassName="w-full h-full" />
                    </div>
                  </motion.div>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 flex flex-col justify-center pl-12">
                  <motion.h1 
                    initial={{ opacity: 0, x: 30 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: 0.2 }} 
                    className={`${TV_TITLE} text-white mb-8`}
                  >
                    {currentSlide.title || currentSlide.product?.name || 'Destaque'}
                  </motion.h1>
                  
                  {currentSlide.subtitle && (
                    <motion.p 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: 0.3 }} 
                      className={`${TV_SUBTITLE} text-gray-300 mb-10 max-w-xl`}
                    >
                      {currentSlide.subtitle}
                    </motion.p>
                  )}
                  
                  {currentSlide.product && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      transition={{ delay: 0.4 }} 
                      className={`${TV_PRICE} mb-12`}
                      style={{ color: accentColor }}
                    >
                      {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                    </motion.div>
                  )}
                  
                  <QRCodeCompact 
                    url={productUrl}
                    primaryColor={accentColor}
                    buttonText="Eu quero!"
                    size="lg"
                  />
                </div>
              </div>

              <SlideFooter 
                primaryColor={primaryColor}
                slug={establishment?.slug || ''}
                phone={establishment?.phone}
                whatsapp={establishment?.whatsapp}
                socialLinks={socialLinks}
                variant="transparent"
              />
            </div>
          )}

          {/* ===== TEMPLATE: POLAROID ===== */}
          {currentSlide.template_type === 'polaroid' && (
            <div className="relative w-full h-full bg-gray-800 flex flex-col overflow-hidden">
              <AnimatedDots color={primaryColor} count={25} />
              <StripeLines color="#fff" angle={-45} spacing={80} />
              <NoiseTexture opacity={0.03} />
              
              <FixedLogo logoUrl={establishment?.logo_url} name={establishment?.name || ''} variant="dark" />
              
              <div className="flex-1 relative z-10 flex items-center justify-center pt-20 px-16">
                <div className="flex items-center gap-24">
                  {/* Polaroid - maior */}
                  <motion.div 
                    initial={{ rotate: -12, scale: 0.8, opacity: 0 }} 
                    animate={{ rotate: -6, scale: 1, opacity: 1 }} 
                    transition={{ duration: 0.5 }} 
                    className="bg-white p-8 pb-28 rounded-lg shadow-2xl transform -rotate-6"
                  >
                    <div className="w-[480px] h-[480px] overflow-hidden">
                      <MediaFrame slide={currentSlide} frameClassName="w-full h-full" />
                    </div>
                    <p className="absolute bottom-10 left-0 right-0 text-center font-handwriting text-gray-700 text-4xl">
                      {currentSlide.title || 'Delícia!'}
                    </p>
                  </motion.div>
                  
                  {/* Conteúdo */}
                  <div className="flex flex-col items-start max-w-2xl">
                    <motion.h1 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: 0.3 }} 
                      className={`${TV_TITLE} text-white mb-8`}
                    >
                      {currentSlide.title || 'Novidade'}
                    </motion.h1>
                    
                    {currentSlide.subtitle && (
                      <motion.p 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ delay: 0.4 }} 
                        className={`${TV_SUBTITLE} text-gray-300 mb-10`}
                      >
                        {currentSlide.subtitle}
                      </motion.p>
                    )}
                    
                    {currentSlide.product && (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ delay: 0.5 }} 
                        className={`${TV_PRICE} mb-12`}
                        style={{ color: accentColor }}
                      >
                        {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                      </motion.div>
                    )}
                    
                    <QRCodeCompact 
                      url={productUrl}
                      primaryColor={primaryColor}
                      buttonText="Eu quero!"
                      size="lg"
                    />
                  </div>
                </div>
              </div>

              <SlideFooter 
                primaryColor={primaryColor}
                slug={establishment?.slug || ''}
                phone={establishment?.phone}
                whatsapp={establishment?.whatsapp}
                socialLinks={socialLinks}
              />
            </div>
          )}

          {/* ===== TEMPLATE: DIAMOND ===== */}
          {currentSlide.template_type === 'diamond' && (
            <div className="relative w-full h-full flex flex-col overflow-hidden" style={{ backgroundColor: secondaryColor }}>
              <GradientBackground primaryColor={primaryColor} secondaryColor={secondaryColor} variant="mesh" />
              <AnimatedDots color={primaryColor} count={30} />
              <GeometricShapes color={primaryColor} variant="diamonds" />
              <NoiseTexture opacity={0.02} />
              
              <FixedLogo logoUrl={establishment?.logo_url} name={establishment?.name || ''} />
              
              <div className="flex-1 relative z-10 flex items-center px-20 pt-20">
                {/* Conteúdo */}
                <div className="flex-1 flex flex-col justify-center pr-12">
                  <motion.h1 
                    initial={{ opacity: 0, x: -30 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: 0.2 }} 
                    className={`${TV_TITLE} mb-10`}
                    style={{ color: primaryColor }}
                  >
                    {currentSlide.title || currentSlide.product?.name || 'Destaque'}
                  </motion.h1>
                  
                  {currentSlide.subtitle && (
                    <motion.p 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: 0.3 }} 
                      className={`${TV_SUBTITLE} text-gray-600 mb-10 max-w-xl`}
                    >
                      {currentSlide.subtitle}
                    </motion.p>
                  )}
                  
                  {currentSlide.product && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: 0.4 }} 
                      className={`${TV_PRICE} text-gray-800 mb-12`}
                    >
                      {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                    </motion.div>
                  )}
                  
                  <QRCodeWithFrame
                    url={productUrl}
                    primaryColor={primaryColor}
                    label="COMPRE AQUI"
                    buttonText="Eu quero!"
                    size="md"
                  />
                </div>

                {/* Imagem - Losango grande */}
                <div className="flex-1 flex items-center justify-center">
                  <motion.div 
                    initial={{ rotate: 45, scale: 0.8, opacity: 0 }} 
                    animate={{ rotate: 45, scale: 1, opacity: 1 }} 
                    transition={{ duration: 0.6 }} 
                    className="relative"
                  >
                    <div 
                      className="absolute inset-0 blur-3xl scale-110 rotate-0" 
                      style={{ backgroundColor: primaryColor, opacity: 0.2 }} 
                    />
                    <div 
                      className="relative w-[550px] h-[550px] overflow-hidden border-[16px] border-white shadow-2xl"
                      style={{ borderRadius: '24px' }}
                    >
                      <div className="-rotate-45 scale-[1.42] w-full h-full">
                        <MediaFrame slide={currentSlide} frameClassName="w-full h-full" />
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              <SlideFooter 
                primaryColor={primaryColor}
                slug={establishment?.slug || ''}
                phone={establishment?.phone}
                whatsapp={establishment?.whatsapp}
                socialLinks={socialLinks}
              />
            </div>
          )}

          {/* ===== TEMPLATE: DIAGONAL ===== */}
          {currentSlide.template_type === 'diagonal' && (
            <div className="relative w-full h-full flex flex-col overflow-hidden" style={{ backgroundColor: secondaryColor }}>
              <GradientBackground primaryColor={primaryColor} secondaryColor={secondaryColor} variant="diagonal" />
              <StripeLines color={primaryColor} angle={-15} spacing={100} />
              <NoiseTexture opacity={0.02} />
              
              <FixedLogo logoUrl={establishment?.logo_url} name={establishment?.name || ''} />
              
              <div className="flex-1 relative z-10 flex items-center">
                {/* Imagem diagonal - 55% */}
                <div className="w-[55%] h-full relative">
                  <motion.div 
                    initial={{ x: -100, opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }} 
                    transition={{ duration: 0.6 }} 
                    className="absolute inset-0 -left-20"
                    style={{ 
                      clipPath: 'polygon(0 0, 90% 0, 100% 100%, 0% 100%)'
                    }}
                  >
                    <MediaFrame slide={currentSlide} frameClassName="w-full h-full" />
                  </motion.div>
                </div>

                {/* Conteúdo - 45% */}
                <div className="w-[45%] h-full flex flex-col justify-center px-16">
                  <motion.h1 
                    initial={{ opacity: 0, x: 30 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: 0.2 }} 
                    className={`${TV_TITLE} mb-10`}
                    style={{ color: primaryColor }}
                  >
                    {currentSlide.title || currentSlide.product?.name || 'Destaque'}
                  </motion.h1>
                  
                  {currentSlide.subtitle && (
                    <motion.p 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: 0.3 }} 
                      className={`${TV_SUBTITLE} text-gray-600 mb-10 max-w-lg`}
                    >
                      {currentSlide.subtitle}
                    </motion.p>
                  )}
                  
                  {currentSlide.product && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: 0.4 }} 
                      className={`${TV_PRICE} text-gray-800 mb-12`}
                    >
                      {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                    </motion.div>
                  )}
                  
                  <QRCodeWithFrame
                    url={productUrl}
                    primaryColor={primaryColor}
                    label="COMPRE AQUI"
                    buttonText="Eu quero!"
                    size="md"
                  />
                </div>
              </div>

              <SlideFooter 
                primaryColor={primaryColor}
                slug={establishment?.slug || ''}
                phone={establishment?.phone}
                whatsapp={establishment?.whatsapp}
                socialLinks={socialLinks}
              />
            </div>
          )}

          {/* ===== TEMPLATE: MENU GRID ===== */}
          {currentSlide.template_type === 'menu_grid' && (
            <div 
              className="relative w-full h-full flex flex-col overflow-hidden" 
              style={{ background: `linear-gradient(135deg, ${primaryColor}ee 0%, ${primaryColor} 100%)` }}
            >
              <WaveLines color="#fff" opacity={0.08} animated={false} />
              <NoiseTexture opacity={0.03} />
              
              <FixedLogo logoUrl={establishment?.logo_url} name={establishment?.name || ''} variant="dark" />
              
              <div className="flex-1 relative z-10 flex items-center px-20 pt-20">
                {/* Conteúdo - esquerda */}
                <div className="flex-1 flex flex-col justify-center">
                  <motion.h1 
                    initial={{ opacity: 0, x: -30 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: 0.2 }} 
                    className={`${TV_TITLE} text-white mb-10`}
                  >
                    {currentSlide.title || 'Menu do Dia'}
                  </motion.h1>
                  
                  {currentSlide.subtitle && (
                    <motion.p 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: 0.3 }} 
                      className={`${TV_SUBTITLE} text-white/80 mb-10 max-w-lg`}
                    >
                      {currentSlide.subtitle}
                    </motion.p>
                  )}
                  
                  {currentSlide.product && (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }} 
                      animate={{ scale: 1, opacity: 1 }} 
                      transition={{ delay: 0.4 }} 
                      className={`${TV_PRICE} text-white mb-12`}
                    >
                      {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                    </motion.div>
                  )}
                  
                  <QRCodeCompact 
                    url={productUrl}
                    primaryColor="#fff"
                    buttonText="Eu quero!"
                    size="lg"
                  />
                </div>
                
                {/* Imagem Principal - círculo grande */}
                <div className="flex-1 flex items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    transition={{ duration: 0.5 }} 
                    className="relative"
                  >
                    <div className="w-[700px] h-[700px] rounded-full overflow-hidden border-[18px] border-white shadow-2xl">
                      <MediaFrame slide={currentSlide} frameClassName="w-full h-full" />
                    </div>
                    {currentSlide.product && (
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-16 py-6 rounded-full text-white text-6xl font-black shadow-xl" 
                        style={{ backgroundColor: accentColor }}
                      >
                        {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </div>

              <SlideFooter 
                primaryColor={primaryColor}
                slug={establishment?.slug || ''}
                phone={establishment?.phone}
                whatsapp={establishment?.whatsapp}
                socialLinks={socialLinks}
                variant="transparent"
              />
            </div>
          )}

          {/* ===== TEMPLATE: SPECIAL DAY ===== */}
          {currentSlide.template_type === 'special_day' && (
            <div 
              className="relative w-full h-full flex flex-col overflow-hidden" 
              style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)` }}
            >
              <BlobShapes color={accentColor} variant="scattered" />
              <BlobShapes color="#fff" variant="large" />
              <NoiseTexture opacity={0.03} />
              
              <FixedLogo logoUrl={establishment?.logo_url} name={establishment?.name || ''} variant="dark" />
              
              <div className="flex-1 relative z-10 flex items-center px-20 pt-20">
                {/* Conteúdo */}
                <div className="flex-1 flex flex-col justify-center">
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.2 }} 
                    className={`${TV_TITLE} text-white mb-10`}
                  >
                    {currentSlide.title || 'Especial do Dia'}
                  </motion.h1>
                  
                  {currentSlide.subtitle && (
                    <motion.p 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: 0.3 }} 
                      className={`${TV_SUBTITLE} text-white/80 mb-12 max-w-lg`}
                    >
                      {currentSlide.subtitle}
                    </motion.p>
                  )}
                  
                  {currentSlide.product && (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }} 
                      animate={{ scale: 1, opacity: 1 }} 
                      transition={{ delay: 0.4 }} 
                      className="inline-flex items-center gap-6 px-12 py-6 rounded-2xl mb-12" 
                      style={{ backgroundColor: accentColor }}
                    >
                      <span className="text-gray-900 text-3xl font-semibold">APENAS</span>
                      <span className="text-6xl font-black text-gray-900">
                        {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                      </span>
                    </motion.div>
                  )}
                  
                  <QRCodeCompact 
                    url={productUrl}
                    primaryColor="#fff"
                    buttonText="Eu quero!"
                    size="lg"
                  />
                </div>

                {/* Imagem - círculo grande */}
                <div className="flex-1 flex items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    transition={{ duration: 0.6 }} 
                    className="relative"
                  >
                    <div 
                      className="absolute inset-0 rounded-full blur-3xl scale-125" 
                      style={{ backgroundColor: accentColor, opacity: 0.3 }} 
                    />
                    <div className="relative w-[650px] h-[650px] rounded-full overflow-hidden border-[18px] border-white shadow-2xl">
                      <MediaFrame slide={currentSlide} frameClassName="w-full h-full" />
                    </div>
                  </motion.div>
                </div>
              </div>

              <SlideFooter 
                primaryColor={primaryColor}
                slug={establishment?.slug || ''}
                phone={establishment?.phone}
                whatsapp={establishment?.whatsapp}
                socialLinks={socialLinks}
                variant="transparent"
              />
            </div>
          )}

          {/* ===== TEMPLATE: CATERING ===== */}
          {currentSlide.template_type === 'catering' && (
            <div className="relative w-full h-full flex flex-col overflow-hidden">
              {/* Imagem - 62% largura */}
              <div className="flex-1 flex">
                <div className="w-[62%] h-full relative">
                  <MediaFrame slide={currentSlide} frameClassName="w-full h-full" showOverlay />
                  <FixedLogo logoUrl={establishment?.logo_url} name={establishment?.name || ''} variant="dark" />
                </div>
                
                {/* Painel de Conteúdo - 38% */}
                <div className="w-[38%] h-full relative" style={{ backgroundColor: primaryColor }}>
                  <WaveLines color="#fff" opacity={0.08} animated={false} />
                  <NoiseTexture opacity={0.03} />
                  
                  <div className="relative z-10 h-full flex flex-col justify-center p-16">
                    {currentSlide.badge_text && (
                      <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        transition={{ type: 'spring' }} 
                        className="inline-flex items-center justify-center px-10 py-4 rounded-full text-2xl font-bold mb-10 bg-white/20 text-white border-2 border-white/30 w-fit"
                      >
                        {currentSlide.badge_text}
                      </motion.div>
                    )}
                    
                    <motion.h1 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: 0.2 }} 
                      className="text-7xl font-black text-white uppercase leading-[0.92] mb-10"
                    >
                      {currentSlide.title || 'Eventos & Catering'}
                    </motion.h1>
                    
                    {currentSlide.subtitle && (
                      <motion.p 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ delay: 0.3 }} 
                        className={`${TV_SUBTITLE} text-white/80 mb-12`}
                      >
                        {currentSlide.subtitle}
                      </motion.p>
                    )}
                    
                    {currentSlide.product && (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ delay: 0.4 }} 
                        className={`${TV_PRICE} text-white mb-12`}
                      >
                        {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                      </motion.div>
                    )}
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: 0.5 }} 
                      className="flex flex-col gap-6"
                    >
                      <div className="px-12 py-6 rounded-full bg-white text-gray-900 text-3xl font-bold text-center shadow-lg">
                        Solicite um orçamento
                      </div>
                      <div className="flex items-center gap-6 mt-4">
                        <div className="bg-white p-3 rounded-xl">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(productUrl)}&color=333333&bgcolor=FFFFFF&margin=1`}
                            alt="QR Code" 
                            className="w-24 h-24"
                          />
                        </div>
                        <span className="text-white/80 text-2xl">Escaneie para ver o menu</span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              <SlideFooter 
                primaryColor={primaryColor}
                slug={establishment?.slug || ''}
                phone={establishment?.phone}
                whatsapp={establishment?.whatsapp}
                socialLinks={socialLinks}
              />
            </div>
          )}

          {/* ===== TEMPLATE: CIRCLES ===== */}
          {currentSlide.template_type === 'circles' && (
            <div className="relative w-full h-full flex flex-col overflow-hidden" style={{ backgroundColor: '#1a1a2e' }}>
              <AnimatedDots color={primaryColor} count={40} />
              <NoiseTexture opacity={0.03} />
              
              <FixedLogo logoUrl={establishment?.logo_url} name={establishment?.name || ''} variant="dark" />
              
              <div className="flex-1 relative z-10 flex items-center px-20 pt-20">
                {/* Imagem - círculo com decorações */}
                <div className="flex-1 flex items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    transition={{ duration: 0.6 }} 
                    className="relative"
                  >
                    {/* Círculos decorativos */}
                    <div 
                      className="absolute -top-24 -left-24 w-48 h-48 rounded-full border-4 opacity-30"
                      style={{ borderColor: primaryColor }}
                    />
                    <div 
                      className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full"
                      style={{ backgroundColor: accentColor, opacity: 0.6 }}
                    />
                    
                    {/* Imagem principal */}
                    <div className="relative w-[650px] h-[650px] rounded-full overflow-hidden border-[16px] border-white shadow-2xl">
                      <MediaFrame slide={currentSlide} frameClassName="w-full h-full" />
                    </div>
                  </motion.div>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 flex flex-col justify-center pl-12">
                  <motion.h1 
                    initial={{ opacity: 0, x: 30 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: 0.2 }} 
                    className={`${TV_TITLE} text-white mb-10`}
                  >
                    {currentSlide.title || currentSlide.product?.name || 'Destaque'}
                  </motion.h1>
                  
                  {currentSlide.subtitle && (
                    <motion.p 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: 0.3 }} 
                      className={`${TV_SUBTITLE} text-gray-300 mb-10 max-w-xl`}
                    >
                      {currentSlide.subtitle}
                    </motion.p>
                  )}
                  
                  {currentSlide.product && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: 0.4 }} 
                      className={`${TV_PRICE} mb-12`}
                      style={{ color: accentColor }}
                    >
                      {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                    </motion.div>
                  )}
                  
                  <QRCodeCompact 
                    url={productUrl}
                    primaryColor={primaryColor}
                    buttonText="Eu quero!"
                    size="lg"
                  />
                </div>
              </div>

              <SlideFooter 
                primaryColor={primaryColor}
                slug={establishment?.slug || ''}
                phone={establishment?.phone}
                whatsapp={establishment?.whatsapp}
                socialLinks={socialLinks}
                variant="transparent"
              />
            </div>
          )}

          {/* ===== FALLBACK para templates não mapeados ===== */}
          {!['product_showcase', 'minimal', 'promo', 'full_image', 'blob_modern', 'polaroid', 'diamond', 'diagonal', 'menu_grid', 'special_day', 'catering', 'circles'].includes(currentSlide.template_type) && (
            <div className="relative w-full h-full flex flex-col" style={{ backgroundColor: secondaryColor }}>
              <GradientBackground primaryColor={primaryColor} secondaryColor={secondaryColor} variant="mesh" />
              <NoiseTexture opacity={0.02} />
              
              <FixedLogo logoUrl={establishment?.logo_url} name={establishment?.name || ''} />
              
              <div className="flex-1 flex relative z-10">
                <div className="w-[58%] h-full relative">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-y-8 left-0 right-8"
                  >
                    <MediaFrame 
                      slide={currentSlide} 
                      frameClassName="w-full h-full rounded-r-[80px] shadow-[0_0_80px_rgba(0,0,0,0.25)]"
                    />
                  </motion.div>
                </div>

                <div className="w-[42%] h-full flex flex-col justify-center items-start pl-8 pr-16">
                  <motion.h1 
                    initial={{ opacity: 0, x: 30 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    className={`${TV_TITLE} mb-8`}
                    style={{ color: primaryColor }}
                  >
                    {currentSlide.title || currentSlide.product?.name || 'Destaque'}
                  </motion.h1>
                  
                  {currentSlide.subtitle && (
                    <p className={`${TV_SUBTITLE} text-gray-600 mb-8 max-w-xl line-clamp-3`}>
                      {currentSlide.subtitle}
                    </p>
                  )}
                  
                  {currentSlide.product && (
                    <div className={`${TV_PRICE} text-gray-800 mb-10`}>
                      {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                    </div>
                  )}
                  
                  <QRCodeWithFrame
                    url={productUrl}
                    primaryColor={primaryColor}
                    label="COMPRE AQUI"
                    buttonText="Eu quero!"
                    size="lg"
                  />
                </div>
              </div>

              <SlideFooter 
                primaryColor={primaryColor}
                slug={establishment?.slug || ''}
                phone={establishment?.phone}
                whatsapp={establishment?.whatsapp}
                socialLinks={socialLinks}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
