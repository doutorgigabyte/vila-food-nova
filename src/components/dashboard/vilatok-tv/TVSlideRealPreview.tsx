import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getImageUrl } from "@/lib/s3";
import { getContrastColor } from "@/lib/colorUtils";
import { DOMAIN } from "@/lib/constants";
import { 
  GradientBackground, 
  WaveLines, 
  NoiseTexture 
} from "./TVBackgroundPatterns";
import { SlideFooter } from "./SlideFooter";
import { QRCodeWithFrame, QRCodeCompact } from "./QRCodeWithFrame";

interface TVSlideRealPreviewProps {
  imageUrl: string;
  title: string;
  subtitle: string;
  templateType: string;
  badgeText?: string;
  primaryColor?: string;
  logoUrl?: string;
  establishmentName?: string;
  establishmentSlug?: string;
  imageScale: number;
  imagePositionX: number;
  imagePositionY: number;
  mediaType?: 'image' | 'video';
  productId?: string;
  price?: string;
}

interface SlideData {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  template_type: string;
  badge_text?: string | null;
  media_type?: string;
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

// Logo fixa centralizada
function FixedLogo({ logoUrl, name, variant = 'light' }: { logoUrl: string | null; name: string; variant?: 'light' | 'dark' }) {
  if (!logoUrl) return null;
  
  return (
    <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30">
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
    </div>
  );
}

// MediaFrame com tratamento de erro
function MediaFrame({
  slide,
  className = "",
  frameClassName = "",
  showOverlay = false,
}: {
  slide: SlideData;
  className?: string;
  frameClassName?: string;
  showOverlay?: boolean;
}) {
  const [imageError, setImageError] = useState(false);
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

  if (imageError || !slide.image_url) {
    return (
      <div className={`overflow-hidden ${frameClassName}`}>
        <div 
          className={`w-full h-full flex items-center justify-center ${className}`}
          style={{ 
            background: 'linear-gradient(135deg, #e5e7eb 0%, #9ca3af 100%)'
          }}
        >
          <span className="text-gray-500 text-2xl">Imagem indisponível</span>
        </div>
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
        onError={() => setImageError(true)}
      />
      {showOverlay && <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />}
    </div>
  );
}

export function TVSlideRealPreview({
  imageUrl,
  title,
  subtitle,
  templateType,
  badgeText,
  primaryColor = '#ea580c',
  logoUrl,
  establishmentName = 'Estabelecimento',
  establishmentSlug = 'loja',
  imageScale,
  imagePositionX,
  imagePositionY,
  mediaType = 'image',
  productId,
  price
}: TVSlideRealPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;
        const scaleX = containerWidth / 1920;
        const scaleY = containerHeight / 1080;
        setScale(Math.min(scaleX, scaleY));
      }
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const secondaryColor = '#F8F5F0';
  const storeUrl = `https://${establishmentSlug}.${DOMAIN}`;
  const productUrl = productId ? `${storeUrl}/produto/${productId}` : storeUrl;
  const formatPrice = (p: number) => `R$ ${p.toFixed(2).replace('.', ',')}`;

  const socialLinks = {
    instagram_url: undefined,
    facebook_url: undefined,
    tiktok_url: undefined,
    twitter_url: undefined,
    youtube_url: undefined
  };

  // Criar objeto slide compatível
  const slide: SlideData = {
    id: 'preview',
    title: title || null,
    subtitle: subtitle || null,
    image_url: imageUrl,
    template_type: templateType,
    badge_text: badgeText,
    media_type: mediaType,
    image_scale: imageScale,
    image_position_x: imagePositionX,
    image_position_y: imagePositionY,
    product: price ? {
      id: productId || '',
      name: title,
      price: parseFloat(price.replace('R$', '').replace(',', '.').trim()) || 0,
      promotional_price: null
    } : null
  };

  // Tipografia TV
  const TV_TITLE = "text-8xl font-black uppercase leading-[0.92]";
  const TV_SUBTITLE = "text-3xl leading-relaxed";
  const TV_PRICE = "text-7xl font-black";

  const renderTemplate = () => {
    // ===== TEMPLATE: PRODUCT SHOWCASE =====
    if (templateType === 'product_showcase') {
      return (
        <div className="relative w-full h-full flex flex-col" style={{ backgroundColor: secondaryColor }}>
          <GradientBackground primaryColor={primaryColor} secondaryColor={secondaryColor} variant="mesh" />
          <WaveLines color={primaryColor} opacity={0.12} />
          <NoiseTexture opacity={0.02} />
          
          <FixedLogo logoUrl={logoUrl || null} name={establishmentName} />
          
          <div className="flex-1 flex relative z-10">
            <div className="w-[58%] h-full relative">
              <div className="absolute inset-y-8 left-0 right-8">
                <MediaFrame 
                  slide={slide} 
                  frameClassName="w-full h-full rounded-r-[80px] shadow-[0_0_80px_rgba(0,0,0,0.25)]"
                />
              </div>
            </div>

            <div className="w-[42%] h-full flex flex-col justify-center items-start pl-8 pr-16">
              <h1 
                className={`${TV_TITLE} mb-8`}
                style={{ color: primaryColor, textShadow: '4px 4px 0 rgba(0,0,0,0.08)' }}
              >
                {title || 'Destaque'}
              </h1>
              
              {subtitle && (
                <p className={`${TV_SUBTITLE} text-gray-600 mb-8 max-w-xl line-clamp-3`}>
                  {subtitle}
                </p>
              )}
              
              {price && (
                <div className={`${TV_PRICE} text-gray-800 mb-10`}>
                  {price}
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
            slug={establishmentSlug}
            socialLinks={socialLinks}
          />
        </div>
      );
    }

    // ===== TEMPLATE: MINIMAL =====
    if (templateType === 'minimal') {
      return (
        <div className="relative w-full h-full flex flex-col">
          <div className="flex-1 relative">
            <MediaFrame 
              slide={slide} 
              frameClassName="w-full h-full"
              showOverlay
            />
            
            <FixedLogo logoUrl={logoUrl || null} name={establishmentName} variant="dark" />
            
            <div className="absolute bottom-16 left-16 right-16 flex items-end justify-between">
              <div className="bg-black/70 backdrop-blur-md px-12 py-8 rounded-3xl max-w-3xl">
                <h2 className="text-7xl font-black text-white uppercase leading-tight mb-4">
                  {title || 'Destaque'}
                </h2>
                {price && (
                  <p className="text-5xl font-black text-white">
                    {price}
                  </p>
                )}
              </div>

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
            slug={establishmentSlug}
            socialLinks={socialLinks}
            variant="dark"
          />
        </div>
      );
    }

    // ===== TEMPLATE: PROMO =====
    if (templateType === 'promo') {
      return (
        <div className="relative w-full h-full flex flex-col" style={{ backgroundColor: secondaryColor }}>
          <GradientBackground primaryColor={primaryColor} secondaryColor={secondaryColor} variant="diagonal" />
          <WaveLines color={primaryColor} opacity={0.15} />
          <NoiseTexture opacity={0.02} />
          
          <FixedLogo logoUrl={logoUrl || null} name={establishmentName} />
          
          <div className="flex-1 flex relative z-10">
            <div className="w-[55%] h-full relative">
              <div 
                className="absolute inset-y-8 left-0 right-4"
                style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0% 100%)' }}
              >
                <MediaFrame 
                  slide={slide} 
                  frameClassName="w-full h-full shadow-[0_0_60px_rgba(0,0,0,0.3)]"
                />
              </div>
            </div>

            <div className="w-[45%] h-full flex flex-col justify-center items-start pl-4 pr-16">
              {badgeText && (
                <div 
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full mb-6 text-2xl font-bold"
                  style={{ 
                    backgroundColor: 'rgba(251, 191, 36, 0.9)',
                    color: '#78350f'
                  }}
                >
                  <span>⭐</span>
                  <span>{badgeText}</span>
                </div>
              )}
              
              <h1 
                className={`${TV_TITLE} mb-8`}
                style={{ color: primaryColor, textShadow: '4px 4px 0 rgba(0,0,0,0.08)' }}
              >
                {title || 'PROMOÇÃO'}
              </h1>
              
              {subtitle && (
                <p className={`${TV_SUBTITLE} text-gray-600 mb-8 max-w-xl line-clamp-3`}>
                  {subtitle}
                </p>
              )}
              
              {price && (
                <div className={`${TV_PRICE} text-gray-800 mb-10`}>
                  {price}
                </div>
              )}
              
              <QRCodeWithFrame
                url={productUrl}
                primaryColor={primaryColor}
                label="APROVEITE"
                buttonText="Eu quero!"
                size="lg"
              />
            </div>
          </div>

          <SlideFooter 
            primaryColor={primaryColor}
            slug={establishmentSlug}
            socialLinks={socialLinks}
          />
        </div>
      );
    }

    // ===== TEMPLATE: CLEAN_WHITE =====
    if (templateType === 'clean_white') {
      return (
        <div className="relative w-full h-full flex flex-col bg-white">
          <FixedLogo logoUrl={logoUrl || null} name={establishmentName} />
          
          <div className="flex-1 flex relative z-10 px-16 pt-36 pb-20">
            <div className="w-[50%] h-full relative">
              <MediaFrame 
                slide={slide} 
                frameClassName="w-full h-full rounded-3xl shadow-xl"
              />
            </div>

            <div className="w-[50%] h-full flex flex-col justify-center items-start pl-16">
              <h1 
                className={`${TV_TITLE} mb-8`}
                style={{ color: '#1f2937' }}
              >
                {title || 'Destaque'}
              </h1>
              
              {subtitle && (
                <p className={`${TV_SUBTITLE} text-gray-500 mb-8 max-w-xl line-clamp-3`}>
                  {subtitle}
                </p>
              )}
              
              {price && (
                <div className={`${TV_PRICE} mb-10`} style={{ color: primaryColor }}>
                  {price}
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
            slug={establishmentSlug}
            socialLinks={socialLinks}
          />
        </div>
      );
    }

    // ===== DEFAULT FALLBACK =====
    return (
      <div className="relative w-full h-full flex flex-col" style={{ backgroundColor: secondaryColor }}>
        <GradientBackground primaryColor={primaryColor} secondaryColor={secondaryColor} variant="mesh" />
        <FixedLogo logoUrl={logoUrl || null} name={establishmentName} />
        
        <div className="flex-1 flex relative z-10">
          <div className="w-[58%] h-full relative">
            <div className="absolute inset-y-8 left-0 right-8">
              <MediaFrame 
                slide={slide} 
                frameClassName="w-full h-full rounded-r-[80px] shadow-[0_0_80px_rgba(0,0,0,0.25)]"
              />
            </div>
          </div>

          <div className="w-[42%] h-full flex flex-col justify-center items-start pl-8 pr-16">
            <h1 
              className={`${TV_TITLE} mb-8`}
              style={{ color: primaryColor }}
            >
              {title || 'Destaque'}
            </h1>
            
            {subtitle && (
              <p className={`${TV_SUBTITLE} text-gray-600 mb-8`}>
                {subtitle}
              </p>
            )}
            
            {price && (
              <div className={`${TV_PRICE} text-gray-800 mb-10`}>
                {price}
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
          slug={establishmentSlug}
          socialLinks={socialLinks}
        />
      </div>
    );
  };

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden bg-black relative">
      <div 
        className="absolute origin-top-left"
        style={{ 
          width: 1920, 
          height: 1080,
          transform: `scale(${scale})`,
          left: '50%',
          top: '50%',
          marginLeft: -(1920 * scale) / 2,
          marginTop: -(1080 * scale) / 2
        }}
      >
        {renderTemplate()}
      </div>
    </div>
  );
}
