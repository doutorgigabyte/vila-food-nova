import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, Phone, Globe, Play, QrCode } from "lucide-react";
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
}

interface PlaylistSettings {
  playback_mode: 'sequential' | 'random' | 'loop';
  default_duration: number;
  transition_type: 'fade' | 'slide' | 'zoom';
}

// Transition variants based on playlist settings
const getTransitionVariants = (transitionType: string) => {
  switch (transitionType) {
    case 'slide':
      return {
        initial: { opacity: 0, x: 100 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -100 },
      };
    case 'zoom':
      return {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.2 },
      };
    case 'fade':
    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };
  }
};

// Product QR Code Component with CTA
function ProductQRCode({ 
  url, 
  label = "Compre pelo QR Code",
  size = "lg",
  variant = "default"
}: { 
  url: string; 
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "card" | "minimal";
}) {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&color=333333&bgcolor=FFFFFF&margin=1`;
  
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24", 
    lg: "w-32 h-32"
  };

  if (variant === "minimal") {
    return (
      <div className="bg-white p-2 rounded-xl shadow-lg">
        <img src={qrCodeUrl} alt="QR Code" className={sizeClasses[size]} />
      </div>
    );
  }

  if (variant === "card") {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-2xl flex flex-col items-center gap-3"
      >
        <div className="flex items-center gap-2 text-gray-700">
          <QrCode className="w-5 h-5" />
          <span className="text-sm font-semibold uppercase tracking-wide">{label}</span>
        </div>
        <img src={qrCodeUrl} alt="QR Code" className={sizeClasses[size]} />
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
      className="flex items-center gap-4"
    >
      <div className="bg-white p-3 rounded-2xl shadow-xl">
        <img src={qrCodeUrl} alt="QR Code" className={sizeClasses[size]} />
      </div>
      <div className="flex flex-col">
        <span className="text-sm opacity-80 uppercase tracking-wider">Escaneie</span>
        <span className="text-lg font-bold">{label}</span>
      </div>
    </motion.div>
  );
}

// Render media (image or video) with adjustments
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
        {showOverlay && <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />}
      </div>
    );
  }

  return (
    <div className={`overflow-hidden ${frameClassName}`}>
      <img
        src={slide.image_url}
        alt={slide.title || 'Slide'}
        className={`w-full h-full object-cover ${className}`}
        style={{
          ...mediaStyle,
        }}
      />
      {showOverlay && <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />}
    </div>
  );
}

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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (token) validateAndFetch();
  }, [token]);

  // Create shuffled order when slides change and mode is random
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

  const handleVideoEnd = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

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
        .select("id, name, slug, logo_url, primary_color, phone, whatsapp")
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="animate-pulse text-white text-2xl">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white">
        <h1 className="text-3xl font-bold mb-4">{establishment?.name}</h1>
        <p className="text-gray-400">Nenhum slide configurado</p>
      </div>
    );
  }

  const actualIndex = getActualSlideIndex(currentIndex);
  const currentSlide = slides[actualIndex];
  const storeUrl = establishment ? `https://${establishment.slug}.${DOMAIN}` : '';
  const productUrl = currentSlide.product?.id 
    ? `${storeUrl}/produto/${currentSlide.product.id}`
    : storeUrl;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(productUrl)}&color=333333&bgcolor=FFFFFF&margin=1`;
  const primaryColor = establishment?.primary_color || '#2D8B8B';
  const secondaryColor = '#F8F5F0';
  const accentColor = '#C4A574';
  const transitionVariants = getTransitionVariants(playlistSettings.transition_type);
  const isVideo = currentSlide?.media_type === 'video' || currentSlide?.image_url?.match(/\.(mp4|webm|mov)$/i);

  const formatPhone = (phone: string | null) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const displayPhone = formatPhone(establishment?.whatsapp || establishment?.phone);
  const formatPrice = (price: number) => `R$ ${price.toFixed(2).replace('.', ',')}`;

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
              
              <div className="flex-1 flex relative z-10">
                {/* Image - 55% width, bleeds off left edge */}
                <div className="w-[55%] h-full relative">
                  <motion.div
                    initial={{ scale: 0.9, x: -50, opacity: 0 }}
                    animate={{ scale: 1, x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="absolute inset-0 -left-8"
                  >
                    <MediaFrame 
                      slide={currentSlide} 
                      frameClassName="w-full h-full rounded-r-[60px] shadow-2xl"
                      showOverlay
                    />
                  </motion.div>
                </div>

                {/* Content - 45% width */}
                <div className="w-[45%] h-full flex flex-col justify-center items-start p-12 pl-16">
                  {establishment?.logo_url && (
                    <motion.img 
                      initial={{ opacity: 0, y: -20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: 0.1 }} 
                      src={establishment.logo_url} 
                      alt={establishment.name} 
                      className="h-20 w-auto mb-6" 
                    />
                  )}
                  
                  <motion.h1 
                    initial={{ opacity: 0, x: 30 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: 0.2 }} 
                    className="text-7xl font-black uppercase mb-4 leading-none" 
                    style={{ color: primaryColor, textShadow: '3px 3px 0 rgba(0,0,0,0.08)' }}
                  >
                    {currentSlide.title || currentSlide.product?.name || 'Destaque'}
                  </motion.h1>
                  
                  {currentSlide.subtitle && (
                    <motion.p 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: 0.3 }} 
                      className="text-2xl text-gray-600 mb-6 max-w-lg leading-relaxed"
                    >
                      {currentSlide.subtitle}
                    </motion.p>
                  )}
                  
                  {currentSlide.product && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      transition={{ delay: 0.4 }} 
                      className="text-6xl font-black text-gray-800 mb-8"
                    >
                      {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                    </motion.div>
                  )}
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.5 }} 
                    className="flex items-center gap-6"
                  >
                    <div 
                      className="px-12 py-5 rounded-full text-white text-3xl font-bold shadow-xl" 
                      style={{ backgroundColor: primaryColor }}
                    >
                      Eu quero!
                    </div>
                    <ProductQRCode 
                      url={productUrl} 
                      label={currentSlide.product ? "Compre aqui" : "Ver cardápio"}
                      variant="card"
                      size="md"
                    />
                  </motion.div>
                </div>
              </div>

              {/* Footer */}
              <div className="h-20 flex items-center justify-center gap-16 px-12" style={{ backgroundColor: primaryColor }}>
                {displayPhone && (
                  <div className="flex items-center gap-4 text-white">
                    <Phone className="w-7 h-7" />
                    <span className="text-xl font-semibold tracking-wide">PEÇA O SEU!</span>
                    <span className="text-2xl font-bold">{displayPhone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-white">
                  <Globe className="w-6 h-6" />
                  <span className="text-xl font-medium">{establishment?.slug}.{DOMAIN}</span>
                </div>
              </div>
            </div>
          )}

          {/* ===== TEMPLATE: MINIMAL ===== */}
          {currentSlide.template_type === 'minimal' && (
            <div className="relative w-full h-full">
              <MediaFrame 
                slide={currentSlide} 
                frameClassName="w-full h-full"
                showOverlay
              />
              
              {establishment?.logo_url && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  className="absolute top-8 left-8"
                >
                  <img 
                    src={establishment.logo_url} 
                    alt={establishment.name} 
                    className="h-20 w-auto drop-shadow-lg" 
                  />
                </motion.div>
              )}
              
              <ProductQRCode 
                url={productUrl}
                label={currentSlide.product ? "Compre aqui" : "Escaneie e peça!"}
                variant="card"
                size="lg"
              />
              
              {currentSlide.title && (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="absolute bottom-8 left-8 bg-black/60 backdrop-blur-sm px-8 py-4 rounded-2xl"
                >
                  <h2 className="text-4xl font-bold text-white">{currentSlide.title}</h2>
                  {currentSlide.product && (
                    <p className="text-2xl font-semibold text-white/90 mt-1">
                      {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                    </p>
                  )}
                </motion.div>
              )}

              {/* QR positioned bottom-right */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ delay: 0.3 }}
                className="absolute bottom-8 right-8"
              >
                <ProductQRCode 
                  url={productUrl}
                  label={currentSlide.product ? "Compre aqui" : "Ver cardápio"}
                  variant="card"
                  size="lg"
                />
              </motion.div>
            </div>
          )}

          {/* ===== TEMPLATE: PROMO ===== */}
          {currentSlide.template_type === 'promo' && (
            <div className="relative w-full h-full flex flex-col" style={{ backgroundColor: secondaryColor }}>
              <GradientBackground primaryColor={primaryColor} secondaryColor={secondaryColor} variant="diagonal" />
              <WaveLines color={primaryColor} opacity={0.1} />
              <GeometricShapes color={primaryColor} variant="circles" />
              <NoiseTexture opacity={0.02} />
              
              <div className="flex-1 flex relative z-10">
                {/* Info Side - 40% */}
                <div className="w-2/5 h-full flex flex-col justify-center p-12">
                  {establishment?.logo_url && (
                    <img 
                      src={establishment.logo_url} 
                      alt={establishment.name} 
                      className="h-16 w-auto mb-6" 
                    />
                  )}
                  
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1] }} 
                    transition={{ repeat: Infinity, duration: 2 }} 
                    className="inline-flex items-center gap-2 px-6 py-2 rounded-full text-xl font-bold text-white mb-6 w-fit shadow-lg" 
                    style={{ backgroundColor: accentColor }}
                  >
                    ⭐ {currentSlide.badge_text || 'Menu Especial'}
                  </motion.div>
                  
                  <h1 
                    className="text-6xl font-black uppercase leading-none mb-4" 
                    style={{ color: primaryColor, textShadow: '2px 2px 0 rgba(0,0,0,0.08)' }}
                  >
                    {currentSlide.title || currentSlide.product?.name}
                  </h1>
                  
                  {currentSlide.product && (
                    <div className="mb-8">
                      {currentSlide.product.promotional_price && (
                        <span className="text-3xl text-gray-400 line-through mr-4">
                          {formatPrice(currentSlide.product.price)}
                        </span>
                      )}
                      <span className="text-5xl font-black text-gray-800">
                        {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                      </span>
                    </div>
                  )}
                  
                  <div className="space-y-3 text-gray-700 mb-8">
                    {displayPhone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-6 h-6" style={{ color: primaryColor }} />
                        <span className="text-xl">{displayPhone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Globe className="w-6 h-6" style={{ color: primaryColor }} />
                      <span className="text-xl">{establishment?.slug}.{DOMAIN}</span>
                    </div>
                  </div>

                  <ProductQRCode 
                    url={productUrl}
                    label={currentSlide.product ? "Compre pelo QR" : "Ver cardápio"}
                    variant="default"
                    size="md"
                  />
                </div>

                {/* Image Side - 60%, bleeds right */}
                <div className="w-3/5 h-full relative">
                  <motion.div 
                    initial={{ scale: 0.9, x: 50 }} 
                    animate={{ scale: 1, x: 0 }} 
                    transition={{ duration: 0.5 }} 
                    className="absolute inset-0 -right-8"
                  >
                    <MediaFrame 
                      slide={currentSlide}
                      frameClassName="w-full h-full rounded-l-[60px] shadow-2xl"
                      showOverlay
                    />
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.4 }} 
                    className="absolute bottom-16 left-12 px-10 py-4 rounded-full text-white text-2xl font-bold shadow-xl" 
                    style={{ backgroundColor: accentColor }}
                  >
                    Eu quero!
                  </motion.div>
                </div>
              </div>

              {/* Footer */}
              <div className="h-16 flex items-center justify-center gap-12" style={{ backgroundColor: primaryColor }}>
                <div className="flex items-center gap-4 text-white">
                  <Phone className="w-6 h-6" />
                  <span className="text-lg font-semibold">PEÇA O SEU!</span>
                  <span className="text-lg font-bold">{displayPhone}</span>
                </div>
              </div>
            </div>
          )}

          {/* ===== TEMPLATE: FULL IMAGE ===== */}
          {currentSlide.template_type === 'full_image' && (
            <div className="relative w-full h-full">
              <MediaFrame slide={currentSlide} frameClassName="w-full h-full" showOverlay />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ delay: 0.3 }}
                className="absolute bottom-8 right-8"
              >
                <ProductQRCode 
                  url={productUrl}
                  label={currentSlide.product ? "Compre aqui" : "Ver cardápio"}
                  variant="card"
                  size="lg"
                />
              </motion.div>

              {currentSlide.title && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-8 left-8 bg-black/70 backdrop-blur-sm px-8 py-4 rounded-2xl"
                >
                  <h2 className="text-4xl font-bold text-white">{currentSlide.title}</h2>
                  {currentSlide.product && (
                    <p className="text-3xl font-black text-white mt-2">
                      {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                    </p>
                  )}
                </motion.div>
              )}
            </div>
          )}

          {/* ===== TEMPLATE: BLOB MODERN ===== */}
          {currentSlide.template_type === 'blob_modern' && (
            <div className="relative w-full h-full bg-gray-900 overflow-hidden">
              <BlobShapes color={primaryColor} variant="large" />
              <BlobShapes color={accentColor} variant="scattered" />
              <NoiseTexture opacity={0.04} />
              
              <div className="relative z-10 w-full h-full flex items-center px-16">
                {/* Image - Large circle, 55% of screen */}
                <div className="flex-1 flex items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    transition={{ duration: 0.6 }} 
                    className="relative"
                  >
                    <div className="absolute inset-0 rounded-full bg-white/10 blur-3xl scale-125" />
                    <div className="relative w-[550px] h-[550px] rounded-full overflow-hidden border-8 border-white shadow-2xl">
                      <MediaFrame slide={currentSlide} frameClassName="w-full h-full" />
                    </div>
                  </motion.div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-center pl-8">
                  {establishment?.logo_url && (
                    <motion.img 
                      initial={{ opacity: 0, y: -20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      src={establishment.logo_url} 
                      alt={establishment.name} 
                      className="h-16 w-auto mb-8 brightness-0 invert" 
                    />
                  )}
                  
                  <motion.h1 
                    initial={{ opacity: 0, x: 30 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: 0.2 }} 
                    className="text-7xl font-black text-white uppercase leading-none mb-4"
                  >
                    {currentSlide.title || currentSlide.product?.name || 'Destaque'}
                  </motion.h1>
                  
                  {currentSlide.subtitle && (
                    <motion.p 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: 0.3 }} 
                      className="text-2xl text-gray-300 mb-6 max-w-md"
                    >
                      {currentSlide.subtitle}
                    </motion.p>
                  )}
                  
                  {currentSlide.product && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      transition={{ delay: 0.4 }} 
                      className="text-5xl font-black mb-8" 
                      style={{ color: accentColor }}
                    >
                      {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                    </motion.div>
                  )}
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.5 }} 
                    className="flex items-center gap-6"
                  >
                    <div 
                      className="px-10 py-4 rounded-full text-gray-900 text-2xl font-bold" 
                      style={{ backgroundColor: accentColor }}
                    >
                      Eu quero!
                    </div>
                    <ProductQRCode 
                      url={productUrl}
                      size="md"
                      variant="minimal"
                    />
                  </motion.div>
                </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 h-20 flex items-center justify-center gap-12 bg-gradient-to-t from-black/80 to-transparent">
                {displayPhone && (
                  <div className="flex items-center gap-3 text-white">
                    <Phone className="w-6 h-6" />
                    <span className="text-xl font-semibold">{displayPhone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-white">
                  <Globe className="w-6 h-6" />
                  <span className="text-xl">{establishment?.slug}.{DOMAIN}</span>
                </div>
              </div>
            </div>
          )}

          {/* ===== TEMPLATE: POLAROID ===== */}
          {currentSlide.template_type === 'polaroid' && (
            <div className="relative w-full h-full bg-gray-800 overflow-hidden">
              <AnimatedDots color={primaryColor} count={25} />
              <StripeLines color="#fff" angle={-45} spacing={80} />
              <NoiseTexture opacity={0.03} />
              
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <div className="flex items-center gap-20">
                  {/* Polaroid Photo - Large */}
                  <motion.div 
                    initial={{ rotate: -12, scale: 0.8, opacity: 0 }} 
                    animate={{ rotate: -6, scale: 1, opacity: 1 }} 
                    transition={{ duration: 0.5 }} 
                    className="bg-white p-6 pb-20 rounded-lg shadow-2xl transform -rotate-6"
                  >
                    <div className="w-80 h-80 overflow-hidden">
                      <MediaFrame slide={currentSlide} frameClassName="w-full h-full" />
                    </div>
                    <p className="absolute bottom-6 left-0 right-0 text-center font-handwriting text-gray-700 text-2xl">
                      {currentSlide.title || 'Delícia!'}
                    </p>
                  </motion.div>
                  
                  {/* Content */}
                  <div className="flex flex-col items-start max-w-lg">
                    {establishment?.logo_url && (
                      <motion.img 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        src={establishment.logo_url} 
                        alt={establishment.name} 
                        className="h-16 w-auto mb-6 brightness-0 invert" 
                      />
                    )}
                    
                    <motion.h1 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: 0.3 }} 
                      className="text-6xl font-black text-white uppercase leading-tight mb-4"
                    >
                      {currentSlide.title || 'Novidade'}
                    </motion.h1>
                    
                    {currentSlide.subtitle && (
                      <motion.p 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ delay: 0.4 }} 
                        className="text-xl text-gray-300 mb-6"
                      >
                        {currentSlide.subtitle}
                      </motion.p>
                    )}
                    
                    {currentSlide.product && (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ delay: 0.5 }} 
                        className="text-4xl font-black mb-6" 
                        style={{ color: accentColor }}
                      >
                        {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                      </motion.div>
                    )}
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: 0.6 }} 
                      className="flex items-center gap-4"
                    >
                      <div 
                        className="px-8 py-3 rounded-full text-white text-xl font-bold" 
                        style={{ backgroundColor: primaryColor }}
                      >
                        Eu quero!
                      </div>
                      <ProductQRCode url={productUrl} size="md" variant="minimal" />
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-16 flex items-center justify-center gap-8" 
                style={{ backgroundColor: primaryColor }}
              >
                <span className="text-white text-lg font-semibold">{displayPhone}</span>
                <span className="text-white/80">|</span>
                <span className="text-white text-lg">{establishment?.slug}.{DOMAIN}</span>
              </div>
            </div>
          )}

          {/* ===== TEMPLATE: DIAMOND ===== */}
          {currentSlide.template_type === 'diamond' && (
            <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: secondaryColor }}>
              <GradientBackground primaryColor={primaryColor} secondaryColor={secondaryColor} variant="mesh" />
              <AnimatedDots color={primaryColor} count={30} />
              <GeometricShapes color={primaryColor} variant="diamonds" />
              <NoiseTexture opacity={0.02} />
              
              <div className="relative z-10 w-full h-full flex items-center px-16">
                {/* Diamond Frame - Large, 50% of screen */}
                <div className="flex-1 flex items-center justify-center">
                  <motion.div 
                    initial={{ rotate: 45, scale: 0.6, opacity: 0 }} 
                    animate={{ rotate: 45, scale: 1, opacity: 1 }} 
                    transition={{ duration: 0.6 }} 
                    className="relative w-[420px] h-[420px] transform rotate-45 overflow-hidden rounded-[40px] shadow-2xl border-8 border-white"
                  >
                    <MediaFrame 
                      slide={currentSlide} 
                      className="transform -rotate-45 scale-[1.5]"
                      frameClassName="w-full h-full"
                    />
                  </motion.div>
                </div>
                
                {/* Content */}
                <div className="flex-1 flex flex-col justify-center">
                  {establishment?.logo_url && (
                    <motion.img 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      src={establishment.logo_url} 
                      alt={establishment.name} 
                      className="h-16 w-auto mb-6" 
                    />
                  )}
                  
                  {currentSlide.badge_text && (
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      transition={{ delay: 0.2, type: 'spring' }} 
                      className="inline-flex items-center justify-center w-28 h-28 rounded-full text-white text-2xl font-black mb-6 bg-red-500 shadow-xl"
                    >
                      {currentSlide.badge_text}
                    </motion.div>
                  )}
                  
                  <motion.h1 
                    initial={{ opacity: 0, x: 30 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: 0.3 }} 
                    className="text-6xl font-black uppercase leading-none mb-4" 
                    style={{ color: primaryColor }}
                  >
                    {currentSlide.title || currentSlide.product?.name || 'Especial'}
                  </motion.h1>
                  
                  {currentSlide.subtitle && (
                    <motion.p 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: 0.4 }} 
                      className="text-xl text-gray-600 mb-6 max-w-md"
                    >
                      {currentSlide.subtitle}
                    </motion.p>
                  )}
                  
                  {currentSlide.product && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: 0.5 }} 
                      className="text-5xl font-black text-gray-800 mb-8"
                    >
                      {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                    </motion.div>
                  )}
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.6 }} 
                    className="flex items-center gap-6"
                  >
                    <div 
                      className="px-10 py-4 rounded-full text-white text-2xl font-bold shadow-lg" 
                      style={{ backgroundColor: primaryColor }}
                    >
                      Eu quero!
                    </div>
                    <ProductQRCode 
                      url={productUrl}
                      label={currentSlide.product ? "Compre aqui" : "Ver cardápio"}
                      variant="card"
                      size="md"
                    />
                  </motion.div>
                </div>
              </div>

              {/* Footer */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-20 flex items-center justify-center gap-12" 
                style={{ backgroundColor: primaryColor }}
              >
                {displayPhone && (
                  <div className="flex items-center gap-3 text-white">
                    <Phone className="w-6 h-6" />
                    <span className="text-xl font-semibold">{displayPhone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-white">
                  <Globe className="w-6 h-6" />
                  <span className="text-xl">{establishment?.slug}.{DOMAIN}</span>
                </div>
              </div>
            </div>
          )}

          {/* ===== TEMPLATE: DIAGONAL ===== */}
          {currentSlide.template_type === 'diagonal' && (
            <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: secondaryColor }}>
              <GradientBackground primaryColor={primaryColor} secondaryColor={secondaryColor} variant="diagonal" />
              <StripeLines color={primaryColor} angle={-15} spacing={100} />
              <NoiseTexture opacity={0.02} />
              
              {/* Diagonal Image - 60% width, bleeds edges */}
              <motion.div 
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 w-[65%]" 
                style={{ clipPath: 'polygon(0 0, 100% 0, 75% 100%, 0 100%)' }}
              >
                <MediaFrame slide={currentSlide} frameClassName="w-full h-full" showOverlay />
              </motion.div>
              
              {/* Badge */}
              <div className="absolute top-10 right-10 z-20">
                {currentSlide.badge_text && (
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    transition={{ type: 'spring' }} 
                    className="w-32 h-32 rounded-full bg-red-500 text-white flex items-center justify-center text-center font-black text-xl shadow-xl"
                  >
                    {currentSlide.badge_text}
                  </motion.div>
                )}
              </div>
              
              {/* Content - Right side */}
              <div className="absolute right-12 top-1/2 -translate-y-1/2 max-w-lg z-10">
                {establishment?.logo_url && (
                  <motion.img 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    src={establishment.logo_url} 
                    alt={establishment.name} 
                    className="h-14 w-auto mb-6" 
                  />
                )}
                
                <motion.h1 
                  initial={{ opacity: 0, x: 30 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: 0.2 }} 
                  className="text-6xl font-black uppercase leading-none mb-4" 
                  style={{ color: primaryColor }}
                >
                  {currentSlide.title || currentSlide.product?.name || 'Destaque'}
                </motion.h1>
                
                {currentSlide.subtitle && (
                  <motion.p 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: 0.3 }} 
                    className="text-xl text-gray-700 mb-6"
                  >
                    {currentSlide.subtitle}
                  </motion.p>
                )}
                
                {currentSlide.product && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: 0.4 }} 
                    className="text-5xl font-black text-gray-800 mb-8"
                  >
                    {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                  </motion.div>
                )}
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.5 }} 
                  className="flex items-center gap-6"
                >
                  <div 
                    className="px-10 py-4 rounded-full text-white text-2xl font-bold shadow-lg" 
                    style={{ backgroundColor: primaryColor }}
                  >
                    Eu quero!
                  </div>
                  <ProductQRCode url={productUrl} size="md" variant="minimal" />
                </motion.div>
              </div>

              {/* Footer */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-20 flex items-center justify-center gap-12" 
                style={{ backgroundColor: primaryColor }}
              >
                {displayPhone && (
                  <div className="flex items-center gap-3 text-white">
                    <Phone className="w-6 h-6" />
                    <span className="text-xl font-semibold">{displayPhone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-white">
                  <Globe className="w-6 h-6" />
                  <span className="text-xl">{establishment?.slug}.{DOMAIN}</span>
                </div>
              </div>
            </div>
          )}

          {/* ===== TEMPLATE: MENU GRID ===== */}
          {currentSlide.template_type === 'menu_grid' && (
            <div className="relative w-full h-full bg-gray-900 overflow-hidden">
              <BlobShapes color={primaryColor} variant="large" />
              <BlobShapes color={accentColor} variant="scattered" />
              <NoiseTexture opacity={0.04} />
              
              <div className="relative z-10 w-full h-full flex flex-col p-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  {establishment?.logo_url && (
                    <img 
                      src={establishment.logo_url} 
                      alt={establishment.name} 
                      className="h-16 w-auto brightness-0 invert" 
                    />
                  )}
                  <motion.h2 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="text-5xl font-black text-white uppercase tracking-wide"
                  >
                    {currentSlide.title || 'Menu Especial'}
                  </motion.h2>
                  <ProductQRCode url={productUrl} size="md" variant="minimal" />
                </div>
                
                {/* Main Image - Large circle */}
                <div className="flex-1 flex items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    transition={{ duration: 0.5 }} 
                    className="relative"
                  >
                    <div className="w-[650px] h-[650px] rounded-full overflow-hidden border-[12px] border-white shadow-2xl">
                      <MediaFrame slide={currentSlide} frameClassName="w-full h-full" />
                    </div>
                    {currentSlide.product && (
                      <div 
                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-10 py-4 rounded-full text-white text-4xl font-black shadow-xl" 
                        style={{ backgroundColor: primaryColor }}
                      >
                        {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 h-20 flex items-center justify-center gap-12 bg-gradient-to-t from-black/80 to-transparent">
                {displayPhone && (
                  <div className="flex items-center gap-3 text-white">
                    <Phone className="w-6 h-6" />
                    <span className="text-xl font-semibold">{displayPhone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-white">
                  <Globe className="w-6 h-6" />
                  <span className="text-xl">{establishment?.slug}.{DOMAIN}</span>
                </div>
              </div>
            </div>
          )}

          {/* ===== TEMPLATE: SPECIAL DAY ===== */}
          {currentSlide.template_type === 'special_day' && (
            <div 
              className="relative w-full h-full overflow-hidden" 
              style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)` }}
            >
              <BlobShapes color={accentColor} variant="scattered" />
              <BlobShapes color="#fff" variant="large" />
              <NoiseTexture opacity={0.03} />
              
              <div className="relative z-10 w-full h-full flex items-center px-16">
                {/* Content */}
                <div className="flex-1 flex flex-col justify-center">
                  {establishment?.logo_url && (
                    <motion.img 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      src={establishment.logo_url} 
                      alt={establishment.name} 
                      className="h-16 w-auto mb-8 brightness-0 invert" 
                    />
                  )}
                  
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.2 }} 
                    className="text-7xl font-black text-white uppercase leading-none mb-6"
                  >
                    {currentSlide.title || 'Especial do Dia'}
                  </motion.h1>
                  
                  {currentSlide.subtitle && (
                    <motion.p 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: 0.3 }} 
                      className="text-2xl text-white/80 mb-8 max-w-md"
                    >
                      {currentSlide.subtitle}
                    </motion.p>
                  )}
                  
                  {currentSlide.product && (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }} 
                      animate={{ scale: 1, opacity: 1 }} 
                      transition={{ delay: 0.4 }} 
                      className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl mb-8" 
                      style={{ backgroundColor: accentColor }}
                    >
                      <span className="text-gray-900 text-lg font-semibold">APENAS</span>
                      <span className="text-4xl font-black text-gray-900">
                        {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                      </span>
                    </motion.div>
                  )}
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.5 }} 
                    className="flex items-center gap-6"
                  >
                    <div className="px-10 py-4 rounded-full bg-white text-gray-900 text-2xl font-bold shadow-lg">
                      Eu quero!
                    </div>
                    <ProductQRCode url={productUrl} size="md" variant="minimal" />
                  </motion.div>
                </div>

                {/* Image - Large circle */}
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
                    <div className="relative w-[550px] h-[550px] rounded-full overflow-hidden border-[12px] border-white shadow-2xl">
                      <MediaFrame slide={currentSlide} frameClassName="w-full h-full" />
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 h-20 flex items-center justify-center gap-12 bg-black/30">
                {displayPhone && (
                  <div className="flex items-center gap-3 text-white">
                    <Phone className="w-6 h-6" />
                    <span className="text-xl font-semibold">{displayPhone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-white">
                  <Globe className="w-6 h-6" />
                  <span className="text-xl">{establishment?.slug}.{DOMAIN}</span>
                </div>
              </div>
            </div>
          )}

          {/* ===== TEMPLATE: CATERING ===== */}
          {currentSlide.template_type === 'catering' && (
            <div className="relative w-full h-full flex overflow-hidden">
              {/* Image - 65% width */}
              <div className="w-[65%] h-full relative">
                <MediaFrame slide={currentSlide} frameClassName="w-full h-full" showOverlay />
                
                {/* Footer overlay on image */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-black/50 flex items-center justify-center gap-8">
                  {displayPhone && (
                    <div className="flex items-center gap-2 text-white">
                      <Phone className="w-5 h-5" />
                      <span className="text-lg">{displayPhone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-white">
                    <Globe className="w-5 h-5" />
                    <span className="text-lg">{establishment?.slug}.{DOMAIN}</span>
                  </div>
                </div>
              </div>
              
              {/* Content Panel - 35% */}
              <div className="w-[35%] h-full relative" style={{ backgroundColor: primaryColor }}>
                <WaveLines color="#fff" opacity={0.08} animated={false} />
                <NoiseTexture opacity={0.03} />
                
                <div className="relative z-10 h-full flex flex-col justify-center p-12">
                  {establishment?.logo_url && (
                    <motion.img 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      src={establishment.logo_url} 
                      alt={establishment.name} 
                      className="h-14 w-auto mb-8 brightness-0 invert" 
                    />
                  )}
                  
                  {currentSlide.badge_text && (
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      transition={{ type: 'spring' }} 
                      className="inline-flex items-center justify-center px-6 py-2 rounded-full text-lg font-bold mb-6 bg-white/20 text-white border-2 border-white/30 w-fit"
                    >
                      {currentSlide.badge_text}
                    </motion.div>
                  )}
                  
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.2 }} 
                    className="text-5xl font-black text-white uppercase leading-tight mb-6"
                  >
                    {currentSlide.title || 'Eventos & Catering'}
                  </motion.h1>
                  
                  {currentSlide.subtitle && (
                    <motion.p 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: 0.3 }} 
                      className="text-xl text-white/80 mb-8"
                    >
                      {currentSlide.subtitle}
                    </motion.p>
                  )}
                  
                  {currentSlide.product && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: 0.4 }} 
                      className="text-4xl font-black text-white mb-8"
                    >
                      {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                    </motion.div>
                  )}
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.5 }} 
                    className="flex flex-col gap-4"
                  >
                    <div className="px-8 py-4 rounded-full bg-white text-gray-900 text-xl font-bold text-center shadow-lg">
                      Solicite um orçamento
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <ProductQRCode url={productUrl} size="md" variant="minimal" />
                      <span className="text-white/80">Escaneie para ver o menu</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          )}

          {/* ===== TEMPLATE: CIRCLES ===== */}
          {currentSlide.template_type === 'circles' && (
            <div 
              className="relative w-full h-full overflow-hidden" 
              style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)` }}
            >
              <GeometricShapes color="#fff" variant="circles" />
              <NoiseTexture opacity={0.03} />
              
              <div className="relative z-10 w-full h-full flex items-center px-16">
                {/* Circles Layout - Larger */}
                <div className="flex-1 flex items-center justify-center gap-6">
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    transition={{ delay: 0.1, type: 'spring' }} 
                    className="relative"
                  >
                    <div 
                      className="w-56 h-56 rounded-full overflow-hidden border-4 shadow-xl" 
                      style={{ borderColor: accentColor }}
                    >
                      <MediaFrame slide={currentSlide} frameClassName="w-full h-full" />
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    transition={{ delay: 0.2, type: 'spring' }} 
                    className="relative -mt-24"
                  >
                    <div 
                      className="w-72 h-72 rounded-full overflow-hidden border-4 shadow-xl" 
                      style={{ borderColor: accentColor }}
                    >
                      <MediaFrame slide={currentSlide} frameClassName="w-full h-full" />
                    </div>
                    {currentSlide.product && (
                      <div 
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full text-lg font-bold text-white" 
                        style={{ backgroundColor: accentColor }}
                      >
                        {formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}
                      </div>
                    )}
                  </motion.div>
                  
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    transition={{ delay: 0.3, type: 'spring' }} 
                    className="relative"
                  >
                    <div 
                      className="w-56 h-56 rounded-full overflow-hidden border-4 shadow-xl" 
                      style={{ borderColor: accentColor }}
                    >
                      <MediaFrame slide={currentSlide} frameClassName="w-full h-full" />
                    </div>
                  </motion.div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-center pl-8">
                  {establishment?.logo_url && (
                    <motion.img 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      src={establishment.logo_url} 
                      alt={establishment.name} 
                      className="h-16 w-auto mb-8 brightness-0 invert" 
                    />
                  )}
                  
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.4 }} 
                    className="text-6xl font-black text-white uppercase leading-tight mb-6"
                  >
                    {currentSlide.title || 'Especial'}
                  </motion.h1>
                  
                  {currentSlide.subtitle && (
                    <motion.p 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: 0.5 }} 
                      className="text-2xl text-white/80 mb-8 max-w-md"
                    >
                      {currentSlide.subtitle}
                    </motion.p>
                  )}
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.6 }} 
                    className="flex items-center gap-6"
                  >
                    <div 
                      className="px-10 py-4 rounded-full text-gray-900 text-2xl font-bold shadow-lg" 
                      style={{ backgroundColor: accentColor }}
                    >
                      Eu quero!
                    </div>
                    <ProductQRCode url={productUrl} size="md" variant="minimal" />
                  </motion.div>
                </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 h-20 flex items-center justify-center gap-12 bg-black/30">
                {displayPhone && (
                  <div className="flex items-center gap-3 text-white">
                    <Phone className="w-6 h-6" />
                    <span className="text-xl font-semibold">{displayPhone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-white">
                  <Globe className="w-6 h-6" />
                  <span className="text-xl">{establishment?.slug}.{DOMAIN}</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Slide Indicators */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-50">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
