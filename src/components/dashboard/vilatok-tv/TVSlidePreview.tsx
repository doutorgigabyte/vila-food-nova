import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/s3";
import { QrCode, Phone, Globe, Instagram } from "lucide-react";

interface TVSlidePreviewProps {
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

export function TVSlidePreview({
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
}: TVSlidePreviewProps) {
  const imageStyle = {
    transform: `scale(${imageScale}) translate(${imagePositionX}%, ${imagePositionY}%)`,
    transformOrigin: 'center center'
  };

  const renderMedia = (className?: string) => {
    const finalUrl = getImageUrl(imageUrl);
    
    if (mediaType === 'video') {
      return (
        <video
          src={finalUrl}
          className={cn("object-cover", className)}
          style={imageStyle}
          muted
          loop
          autoPlay
          playsInline
        />
      );
    }
    
    return (
      <img
        src={finalUrl}
        alt={title}
        className={cn("object-cover", className)}
        style={imageStyle}
      />
    );
  };

  // ===== RODAPÉ PADRONIZADO - Usado em TODOS os templates =====
  const Footer = () => (
    <div 
      className="absolute bottom-0 left-0 right-0 h-6 z-50 flex items-center justify-between px-3"
      style={{ backgroundColor: primaryColor }}
    >
      {/* Left: Social icons + Phone */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Instagram className="w-2.5 h-2.5 text-white/80" />
          <Phone className="w-2.5 h-2.5 text-white/80" />
        </div>
      </div>
      
      {/* Center: Domain */}
      <div className="flex items-center gap-1">
        <Globe className="w-2 h-2 text-white/80" />
        <span className="text-[6px] text-white font-medium whitespace-nowrap">{establishmentSlug}.vilafood.delivery</span>
      </div>
      
      {/* Right: QR Code mini */}
      <div className="flex items-center gap-1">
        <span className="text-[4px] text-white/60 whitespace-nowrap">Cardápio</span>
        <div className="bg-white w-4 h-4 rounded-sm flex items-center justify-center">
          <QrCode className="w-2.5 h-2.5 text-gray-600" />
        </div>
      </div>
    </div>
  );

  // QR Code Preview component
  const QRPreview = ({ color = primaryColor, label = "COMPRE AQUI" }: { color?: string; label?: string }) => (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[5px] font-bold whitespace-nowrap" style={{ color }}>{label}</span>
      <div 
        className="w-8 h-8 bg-white rounded flex items-center justify-center"
        style={{ border: `2px solid ${color}` }}
      >
        <QrCode className="w-5 h-5" style={{ color }} />
      </div>
    </div>
  );

  // Logo component - sempre centralizado no topo
  const Logo = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
    if (!logoUrl) return null;
    const sizes = { sm: "w-6 h-6", md: "w-8 h-8", lg: "w-10 h-10" };
    return (
      <img 
        src={getImageUrl(logoUrl)} 
        alt="" 
        className={cn(sizes[size], "object-cover rounded-full bg-white shadow border-2 border-white")} 
      />
    );
  };

  // Função para calcular contraste
  const isLightColor = (color: string): boolean => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155;
  };

  // Botão "Eu quero!" padrão com contraste automático
  const CTAButton = ({ bgColor = primaryColor }: { bgColor?: string }) => {
    const isLightBg = isLightColor(bgColor);
    const textColor = isLightBg ? '#333333' : '#ffffff';
    
    return (
      <div 
        className="px-3 py-1 rounded-full text-[6px] font-bold whitespace-nowrap"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        Eu quero!
      </div>
    );
  };

  // Preço formatado - nunca quebra linha
  const PriceDisplay = ({ textColor = primaryColor, size = "md" }: { textColor?: string; size?: "sm" | "md" | "lg" }) => {
    if (!price) return null;
    const sizes = { sm: "text-[8px]", md: "text-[10px]", lg: "text-xs" };
    return (
      <span className={cn(sizes[size], "font-bold whitespace-nowrap")} style={{ color: textColor }}>
        {price}
      </span>
    );
  };

  // ===== 1. MINIMAL - Full bleed com gradiente elegante =====
  if (templateType === 'minimal') {
    return (
      <div className="relative w-full h-full bg-black overflow-hidden">
        <div className="absolute inset-0">{renderMedia("w-full h-full")}</div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo /></div>
        <div className="absolute bottom-10 left-3 right-16 space-y-1">
          <h3 className="text-[10px] font-bold text-white drop-shadow-lg truncate">{title}</h3>
          <p className="text-[6px] text-white/80 truncate">{subtitle}</p>
          <PriceDisplay textColor="#ffffff" />
        </div>
        <div className="absolute bottom-10 right-2"><QRPreview color="#ffffff" /></div>
        <Footer />
      </div>
    );
  }

  // ===== 2. CLEAN_WHITE - Layout lado a lado limpo =====
  if (templateType === 'clean_white') {
    return (
      <div className="relative w-full h-full bg-white overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        {/* Imagem à esquerda */}
        <div className="absolute top-8 left-2 bottom-8 w-[48%] rounded-xl overflow-hidden shadow-lg">
          {renderMedia("w-full h-full")}
        </div>
        {/* Conteúdo à direita */}
        <div className="absolute top-10 right-2 bottom-10 w-[44%] flex flex-col justify-center gap-1">
          <h3 className="text-[10px] font-bold text-gray-800 truncate">{title}</h3>
          <p className="text-[5px] text-gray-500 line-clamp-2">{subtitle}</p>
          <PriceDisplay textColor={primaryColor} size="lg" />
          <div className="flex items-center gap-2 mt-1">
            <QRPreview />
            <CTAButton />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 3. ZEN_SIMPLE - Círculo minimalista à esquerda =====
  if (templateType === 'zen_simple') {
    return (
      <div className="relative w-full h-full bg-stone-50 overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute top-10 left-3 w-16 h-16 rounded-full overflow-hidden shadow-lg border-2 border-stone-200">
          {renderMedia("w-full h-full")}
        </div>
        <div className="absolute top-10 right-2 max-w-[50%] text-right space-y-1">
          <h3 className="text-[9px] font-light text-gray-700 truncate">{title}</h3>
          <p className="text-[5px] text-gray-500 truncate">{subtitle}</p>
          <PriceDisplay textColor="#57534e" />
        </div>
        <div className="absolute bottom-10 right-2"><QRPreview color="#78716c" /></div>
        <div className="absolute bottom-10 left-3"><CTAButton bgColor="#78716c" /></div>
        <Footer />
      </div>
    );
  }

  // ===== 4. NEON_GLOW - Pill horizontal com glow neon =====
  if (templateType === 'neon_glow') {
    return (
      <div className="relative w-full h-full bg-gray-900 overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute left-3 top-10 bottom-10 w-[50%] rounded-2xl overflow-hidden"
          style={{ boxShadow: `0 0 20px ${primaryColor}, 0 0 40px ${primaryColor}50` }}>
          {renderMedia("w-full h-full")}
        </div>
        <div className="absolute right-2 top-12 max-w-[42%] space-y-1">
          <h3 className="text-[10px] font-bold text-white truncate" style={{ textShadow: `0 0 10px ${primaryColor}` }}>{title}</h3>
          <p className="text-[5px] text-white/70 truncate">{subtitle}</p>
          <PriceDisplay textColor="#ffffff" size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview color="#ffffff" />
          <CTAButton />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 5. POP_ART - Grid 2x2 colorido estilo Warhol =====
  if (templateType === 'pop_art') {
    return (
      <div className="relative w-full h-full bg-yellow-400 overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10"><Logo size="sm" /></div>
        <div className="absolute top-8 left-2 right-12 bottom-8 grid grid-cols-2 grid-rows-2 gap-0.5">
          <div className="overflow-hidden rounded" style={{ filter: 'sepia(100%) saturate(400%) hue-rotate(0deg)' }}>{renderMedia("w-full h-full")}</div>
          <div className="overflow-hidden rounded" style={{ filter: 'sepia(100%) saturate(400%) hue-rotate(90deg)' }}>{renderMedia("w-full h-full")}</div>
          <div className="overflow-hidden rounded" style={{ filter: 'sepia(100%) saturate(400%) hue-rotate(180deg)' }}>{renderMedia("w-full h-full")}</div>
          <div className="overflow-hidden rounded" style={{ filter: 'sepia(100%) saturate(400%) hue-rotate(270deg)' }}>{renderMedia("w-full h-full")}</div>
        </div>
        <div className="absolute right-2 top-10 bottom-10 w-10 flex flex-col items-center justify-center gap-2">
          <span className="text-[7px] font-black text-black bg-white px-1 py-0.5 rounded truncate max-w-full">{title}</span>
          <QRPreview color="#000000" />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 6. GRADIENT_BURST - Triângulo invertido com explosão =====
  if (templateType === 'gradient_burst') {
    return (
      <div className="relative w-full h-full overflow-hidden" style={{ background: `radial-gradient(circle at center, ${primaryColor}60, ${primaryColor})` }}>
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute left-3 top-10 bottom-10 w-[45%] overflow-hidden"
          style={{ clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)' }}>
          {renderMedia("w-full h-full")}
        </div>
        <div className="absolute right-2 top-12 max-w-[45%] space-y-1">
          <h3 className="text-[10px] font-bold text-white drop-shadow-lg truncate">{title}</h3>
          <p className="text-[5px] text-white/80 truncate">{subtitle}</p>
          <PriceDisplay textColor="#ffffff" size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview color="#ffffff" />
          <CTAButton bgColor="rgba(255,255,255,0.2)" />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 7. BLOB_MODERN - Blob orgânico SVG =====
  if (templateType === 'blob_modern') {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute left-2 top-10 bottom-10 w-[50%] flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <clipPath id="blobClip">
                <path d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.5,90,-16.2,88.5,-0.9C87,14.5,81.4,28.9,73.1,41.8C64.8,54.7,53.8,66,40.4,73.5C27,81,11.2,84.6,-3.9,90.3C-19,96,-37.3,103.8,-51.3,98.1C-65.3,92.5,-75,73.5,-80.4,54.8C-85.8,36.1,-86.9,18.1,-85.2,1C-83.5,-16.1,-79,-32.2,-70.3,-44.8C-61.6,-57.4,-48.7,-66.5,-35,-74.1C-21.3,-81.7,-6.9,-87.8,7,-92.1C20.9,-96.4,30.5,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
              </clipPath>
            </defs>
            <image href={getImageUrl(imageUrl)} width="200" height="200" clipPath="url(#blobClip)" preserveAspectRatio="xMidYMid slice" />
          </svg>
        </div>
        <div className="absolute right-2 top-12 max-w-[42%] space-y-1">
          <h3 className="text-[10px] font-bold text-gray-800 truncate">{title}</h3>
          <p className="text-[5px] text-gray-500 truncate">{subtitle}</p>
          <PriceDisplay size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview />
          <CTAButton />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 8. PRODUCT_SHOWCASE - Arco superior =====
  if (templateType === 'product_showcase') {
    return (
      <div className="relative w-full h-full bg-white overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute left-2 top-10 bottom-10 w-[50%] overflow-hidden rounded-t-full">
          {renderMedia("w-full h-full")}
        </div>
        <div className="absolute right-2 top-12 max-w-[42%] space-y-1">
          <h3 className="text-[10px] font-bold text-gray-800 truncate">{title}</h3>
          <p className="text-[5px] text-gray-500 truncate">{subtitle}</p>
          <PriceDisplay size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview />
          <CTAButton />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 9. PROMO - Diagonal agressiva =====
  if (templateType === 'promo') {
    return (
      <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: primaryColor }}>
        <div className="absolute top-2 left-3"><Logo size="sm" /></div>
        <div className="absolute top-0 right-0 w-[55%] h-full overflow-hidden"
          style={{ clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)' }}>
          {renderMedia("w-full h-full")}
        </div>
        {badgeText && (
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-400 rounded-full z-10">
            <span className="text-[5px] font-bold text-amber-900 whitespace-nowrap">⭐ {badgeText}</span>
          </div>
        )}
        <div className="absolute left-3 top-12 max-w-[40%] space-y-1">
          <h3 className="text-[10px] font-black text-white uppercase truncate">{title}</h3>
          <p className="text-[5px] text-white/80 truncate">{subtitle}</p>
          <PriceDisplay textColor="#ffffff" size="lg" />
        </div>
        <div className="absolute bottom-10 left-3 flex items-center gap-2">
          <QRPreview color="#ffffff" />
          <CTAButton bgColor="rgba(255,255,255,0.2)" />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 10. POLAROID - 3 polaroids empilhados =====
  if (templateType === 'polaroid') {
    return (
      <div className="relative w-full h-full bg-amber-50 overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute left-3 top-10 bottom-10 w-[45%] flex items-center justify-center">
          <div className="relative w-full h-full">
            <div className="absolute inset-2 bg-white p-1 pb-2 shadow-lg rotate-[-8deg] origin-center">
              <div className="w-full h-[80%] overflow-hidden bg-gray-200">{renderMedia("w-full h-full")}</div>
            </div>
            <div className="absolute inset-2 bg-white p-1 pb-2 shadow-lg rotate-[5deg] origin-center translate-x-1">
              <div className="w-full h-[80%] overflow-hidden bg-gray-200">{renderMedia("w-full h-full")}</div>
            </div>
            <div className="absolute inset-2 bg-white p-1 pb-2 shadow-xl rotate-[-1deg] origin-center">
              <div className="w-full h-[80%] overflow-hidden bg-gray-200">{renderMedia("w-full h-full")}</div>
            </div>
          </div>
        </div>
        <div className="absolute right-2 top-12 max-w-[45%] space-y-1">
          <h3 className="text-[9px] font-medium text-gray-700 truncate" style={{ fontFamily: 'cursive' }}>{title}</h3>
          <p className="text-[5px] text-gray-500 truncate">{subtitle}</p>
          <PriceDisplay textColor="#78716c" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview color="#78716c" />
          <CTAButton bgColor="#78716c" />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 11. RETRO_70S - Círculos concêntricos vinyl =====
  if (templateType === 'retro_70s') {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-orange-200 to-amber-100 overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute left-3 top-10 bottom-10 w-[45%] flex items-center justify-center">
          <div className="relative w-full aspect-square max-h-full">
            <div className="absolute inset-0 rounded-full border-4 border-orange-500" />
            <div className="absolute inset-[8%] rounded-full border-2 border-amber-600" />
            <div className="absolute inset-[16%] rounded-full border border-orange-400" />
            <div className="absolute inset-[20%] rounded-full overflow-hidden">{renderMedia("w-full h-full")}</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-gray-800" />
            </div>
          </div>
        </div>
        <div className="absolute right-2 top-12 max-w-[45%] space-y-1">
          <h3 className="text-[10px] font-bold text-orange-800 truncate">{title}</h3>
          <p className="text-[5px] text-orange-600 truncate">{subtitle}</p>
          <PriceDisplay textColor="#9a3412" size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview color="#9a3412" />
          <CTAButton bgColor="#9a3412" />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 12. ART_DECO - Diamante com bordas douradas =====
  if (templateType === 'art_deco') {
    return (
      <div className="relative w-full h-full bg-slate-900 overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute top-7 left-2 w-6 h-0.5 bg-amber-400" />
        <div className="absolute top-7 right-2 w-6 h-0.5 bg-amber-400" />
        <div className="absolute left-3 top-10 bottom-10 w-[42%] flex items-center justify-center">
          <div className="relative w-16 h-16 border-2 border-amber-400 rotate-45" style={{ boxShadow: '0 0 15px #d4af3780' }}>
            <div className="absolute inset-0.5 overflow-hidden">
              <div className="-rotate-45 scale-[1.8] w-full h-full origin-center">{renderMedia("w-full h-full")}</div>
            </div>
          </div>
        </div>
        <div className="absolute right-2 top-12 max-w-[45%] space-y-1">
          <h3 className="text-[9px] font-light text-amber-400 tracking-widest uppercase truncate">{title}</h3>
          <p className="text-[5px] text-amber-200/70 truncate">{subtitle}</p>
          <PriceDisplay textColor="#fbbf24" size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview color="#fbbf24" />
          <CTAButton bgColor="#fbbf24" />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 13. RUSTIC_WOOD - Papel rasgado =====
  if (templateType === 'rustic_wood') {
    return (
      <div className="relative w-full h-full bg-amber-800 overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.2) 4px, rgba(0,0,0,0.2) 8px)' }} />
        <div className="absolute left-3 top-10 bottom-10 w-[45%] flex items-center justify-center">
          <div className="bg-amber-100 shadow-lg p-1 rotate-2">
            <div className="w-full h-full overflow-hidden"
              style={{ clipPath: 'polygon(2% 0%, 98% 3%, 97% 98%, 0% 100%)' }}>
              {renderMedia("w-full h-full")}
            </div>
          </div>
        </div>
        <div className="absolute right-2 top-12 max-w-[45%] space-y-1">
          <h3 className="text-[10px] font-bold text-amber-100 truncate">{title}</h3>
          <p className="text-[5px] text-amber-200/70 truncate">{subtitle}</p>
          <PriceDisplay textColor="#fef3c7" size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview color="#fef3c7" />
          <CTAButton bgColor="#fef3c7" />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 14. CHRISTMAS - Árvore + neve =====
  if (templateType === 'christmas') {
    return (
      <div className="relative w-full h-full bg-gradient-to-b from-blue-900 to-blue-950 overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        {[...Array(12)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 bg-white rounded-full opacity-60" style={{ left: `${5 + i * 8}%`, top: `${8 + (i % 4) * 8}%` }} />
        ))}
        <div className="absolute left-3 top-10 bottom-10 w-[42%] flex items-center justify-center">
          <div className="overflow-hidden" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)', width: '100%', height: '80%' }}>
            {renderMedia("w-full h-full")}
          </div>
        </div>
        <div className="absolute left-[22%] top-[25%] text-amber-400 text-[8px]">⭐</div>
        <div className="absolute right-2 top-12 max-w-[45%] space-y-1">
          <h3 className="text-[10px] font-bold text-white truncate">{title}</h3>
          <p className="text-[5px] text-white/70 truncate">{subtitle}</p>
          <PriceDisplay textColor="#ffffff" size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview color="#ffffff" />
          <CTAButton bgColor="#dc2626" />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 15. VALENTINES - Coração =====
  if (templateType === 'valentines') {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-pink-100 to-red-100 overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute top-8 left-4 text-pink-300 text-[6px]">♥</div>
        <div className="absolute top-10 right-20 text-red-300 text-[5px]">♥</div>
        <div className="absolute left-3 top-10 bottom-10 w-[45%] flex items-center justify-center">
          <svg viewBox="0 0 100 90" className="w-full h-full">
            <defs>
              <clipPath id="heartClip">
                <path d="M50,85 C25,65 0,50 0,30 C0,10 20,0 35,0 C45,0 50,10 50,15 C50,10 55,0 65,0 C80,0 100,10 100,30 C100,50 75,65 50,85 Z" />
              </clipPath>
            </defs>
            <image href={getImageUrl(imageUrl)} width="100" height="90" clipPath="url(#heartClip)" preserveAspectRatio="xMidYMid slice" />
          </svg>
        </div>
        <div className="absolute right-2 top-12 max-w-[45%] space-y-1">
          <h3 className="text-[10px] font-medium text-pink-700 truncate">{title}</h3>
          <p className="text-[5px] text-pink-500 truncate">{subtitle}</p>
          <PriceDisplay textColor="#be185d" size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview color="#be185d" />
          <CTAButton bgColor="#be185d" />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 16. SAO_JOAO - Bandeirinhas =====
  if (templateType === 'sao_joao') {
    return (
      <div className="relative w-full h-full bg-gradient-to-b from-purple-800 to-purple-900 overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute top-7 left-0 right-0 flex justify-center gap-0.5">
          {['bg-red-500', 'bg-yellow-400', 'bg-green-500', 'bg-blue-500', 'bg-pink-500', 'bg-orange-400', 'bg-cyan-400'].map((color, i) => (
            <div key={i} className={`w-2 h-2 ${color} rotate-45`} />
          ))}
        </div>
        <div className="absolute left-3 top-12 bottom-10 w-[45%] rounded-xl overflow-hidden border-4 border-amber-500 shadow-lg">
          {renderMedia("w-full h-full")}
        </div>
        <div className="absolute right-2 top-14 max-w-[45%] space-y-1">
          <h3 className="text-[10px] font-bold text-yellow-300 truncate">{title}</h3>
          <p className="text-[5px] text-yellow-200/70 truncate">{subtitle}</p>
          <PriceDisplay textColor="#fde047" size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview color="#fde047" />
          <CTAButton bgColor="#fde047" />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 17. CARNIVAL - Máscara + confetes =====
  if (templateType === 'carnival') {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-yellow-400 overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        {[...Array(15)].map((_, i) => (
          <div key={i} className="absolute w-0.5 h-1.5 rounded-full" style={{ backgroundColor: ['#ff0', '#f0f', '#0ff', '#0f0', '#f00'][i % 5], left: `${5 + i * 6}%`, top: `${8 + (i % 5) * 6}%`, transform: `rotate(${i * 25}deg)` }} />
        ))}
        <div className="absolute left-3 top-10 bottom-10 w-[45%] overflow-hidden"
          style={{ clipPath: 'ellipse(50% 60% at 50% 50%)', borderRadius: '50% 50% 30% 30%' }}>
          {renderMedia("w-full h-full")}
        </div>
        <div className="absolute right-2 top-12 max-w-[45%] space-y-1">
          <h3 className="text-[10px] font-black text-white drop-shadow-lg uppercase truncate">{title}</h3>
          <p className="text-[5px] text-white/80 truncate">{subtitle}</p>
          <PriceDisplay textColor="#ffffff" size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview color="#ffffff" />
          <CTAButton bgColor="rgba(255,255,255,0.3)" />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 18. HALLOWEEN - Abóbora + morcegos =====
  if (templateType === 'halloween') {
    return (
      <div className="relative w-full h-full bg-gradient-to-b from-orange-600 to-gray-900 overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute top-8 left-4 text-[6px]">🦇</div>
        <div className="absolute top-10 right-16 text-[5px]">🦇</div>
        <div className="absolute top-6 right-4 text-[5px]">🦇</div>
        <div className="absolute left-3 top-10 bottom-10 w-[45%] flex items-center justify-center">
          <div className="relative w-full h-[80%] overflow-hidden" style={{ clipPath: 'ellipse(50% 50% at 50% 55%)' }}>
            {renderMedia("w-full h-full")}
          </div>
        </div>
        <div className="absolute right-2 top-12 max-w-[45%] space-y-1">
          <h3 className="text-[10px] font-bold text-orange-300 truncate">{title}</h3>
          <p className="text-[5px] text-orange-200/70 truncate">{subtitle}</p>
          <PriceDisplay textColor="#fdba74" size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview color="#fdba74" />
          <CTAButton bgColor="#ea580c" />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 19. BEACH_TROPICAL - Onda cortando =====
  if (templateType === 'beach_tropical') {
    return (
      <div className="relative w-full h-full bg-gradient-to-b from-cyan-400 to-blue-500 overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute left-3 top-10 bottom-12 w-[45%] rounded-2xl overflow-hidden shadow-lg border-2 border-white">
          {renderMedia("w-full h-full")}
        </div>
        <svg className="absolute bottom-6 left-0 right-0 h-4" viewBox="0 0 100 30" preserveAspectRatio="none">
          <path d="M0,15 Q15,5 30,15 T60,15 T90,15 T120,15 L120,30 L0,30 Z" fill="#f5deb3" />
        </svg>
        <div className="absolute right-2 top-12 max-w-[45%] space-y-1">
          <h3 className="text-[10px] font-bold text-white drop-shadow-lg truncate">{title}</h3>
          <p className="text-[5px] text-white/80 truncate">{subtitle}</p>
          <PriceDisplay textColor="#ffffff" size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview color="#ffffff" />
          <CTAButton bgColor="#0891b2" />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 20. SUNSET_BEACH - Semicírculo pôr do sol =====
  if (templateType === 'sunset_beach') {
    return (
      <div className="relative w-full h-full bg-gradient-to-b from-orange-400 via-pink-500 to-purple-700 overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute left-3 top-10 w-[45%] h-[50%] overflow-hidden" style={{ clipPath: 'ellipse(50% 100% at 50% 100%)' }}>
          {renderMedia("w-full h-full")}
        </div>
        <div className="absolute bottom-16 left-3 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-300/40 to-transparent" />
        <div className="absolute right-2 top-12 max-w-[45%] space-y-1">
          <h3 className="text-[10px] font-bold text-white drop-shadow-lg truncate">{title}</h3>
          <p className="text-[5px] text-white/80 truncate">{subtitle}</p>
          <PriceDisplay textColor="#ffffff" size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview color="#ffffff" />
          <CTAButton bgColor="#f97316" />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 21. TROPICAL_FRUITS - Melancia =====
  if (templateType === 'tropical_fruits') {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-green-400 to-emerald-600 overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute left-3 top-10 bottom-10 w-[45%] flex items-center justify-center">
          <div className="relative w-full h-[60%] overflow-hidden border-b-4 border-green-800"
            style={{ clipPath: 'ellipse(50% 100% at 50% 0%)', background: '#ff6b6b' }}>
            {renderMedia("w-full h-full")}
          </div>
        </div>
        <div className="absolute right-2 top-12 max-w-[45%] space-y-1">
          <h3 className="text-[10px] font-bold text-white drop-shadow-lg truncate">{title}</h3>
          <p className="text-[5px] text-white/80 truncate">{subtitle}</p>
          <PriceDisplay textColor="#ffffff" size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview color="#ffffff" />
          <CTAButton bgColor="#16a34a" />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 22. NORDESTE_RUSTIC - Renda nordestina =====
  if (templateType === 'nordeste_rustic') {
    return (
      <div className="relative w-full h-full bg-amber-100 overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute top-7 left-0 right-0 h-3 flex justify-center gap-0.5">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="w-1 h-2 border border-amber-600 rounded-b-full bg-amber-50" />
          ))}
        </div>
        <div className="absolute left-3 top-12 bottom-10 w-[45%] rounded-lg overflow-hidden border-2 border-amber-600 shadow-lg">
          {renderMedia("w-full h-full")}
        </div>
        <div className="absolute right-2 top-14 max-w-[45%] space-y-1">
          <h3 className="text-[10px] font-bold text-amber-800 truncate">{title}</h3>
          <p className="text-[5px] text-amber-600 truncate">{subtitle}</p>
          <PriceDisplay textColor="#92400e" size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview color="#92400e" />
          <CTAButton bgColor="#92400e" />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 23. CIRCLES - 3 círculos overlapping =====
  if (templateType === 'circles') {
    return (
      <div className="relative w-full h-full bg-slate-100 overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute left-2 top-10 bottom-10 w-[50%] flex items-center justify-center">
          <div className="relative w-full h-14">
            <div className="absolute left-0 top-1 w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-lg">{renderMedia("w-full h-full")}</div>
            <div className="absolute left-6 top-0 w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-xl z-10">{renderMedia("w-full h-full")}</div>
            <div className="absolute right-0 top-1 w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-lg">{renderMedia("w-full h-full")}</div>
          </div>
        </div>
        <div className="absolute right-2 top-12 max-w-[42%] space-y-1">
          <h3 className="text-[10px] font-bold text-gray-800 truncate">{title}</h3>
          <p className="text-[5px] text-gray-500 truncate">{subtitle}</p>
          <PriceDisplay size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview />
          <CTAButton />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 24. DIAMOND - Losango rotacionado =====
  if (templateType === 'diamond') {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute left-3 top-10 bottom-10 w-[42%] flex items-center justify-center">
          <div className="w-14 h-14 overflow-hidden rotate-45 border border-white/30"
            style={{ boxShadow: '0 0 25px rgba(255,255,255,0.15)' }}>
            <div className="-rotate-45 scale-150 w-full h-full">{renderMedia("w-full h-full")}</div>
          </div>
        </div>
        <div className="absolute right-2 top-12 max-w-[45%] space-y-1">
          <h3 className="text-[9px] font-light text-white tracking-wide truncate">{title}</h3>
          <p className="text-[5px] text-white/60 truncate">{subtitle}</p>
          <PriceDisplay textColor="#ffffff" size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview color="#ffffff" />
          <CTAButton bgColor="rgba(255,255,255,0.2)" />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 25. DIAGONAL - Corte diagonal =====
  if (templateType === 'diagonal') {
    return (
      <div className="relative w-full h-full bg-white overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute top-0 left-0 w-[55%] h-full overflow-hidden"
          style={{ clipPath: 'polygon(0 0, 100% 0, 70% 100%, 0 100%)' }}>
          {renderMedia("w-full h-full")}
        </div>
        <div className="absolute right-2 top-12 max-w-[40%] space-y-1">
          <h3 className="text-[10px] font-bold text-gray-800 truncate">{title}</h3>
          <p className="text-[5px] text-gray-500 truncate">{subtitle}</p>
          <PriceDisplay size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview />
          <CTAButton />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 26. MENU_GRID - Grid 3x1 =====
  if (templateType === 'menu_grid') {
    return (
      <div className="relative w-full h-full bg-white overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute top-9 left-2 right-14 flex gap-1 h-12">
          <div className="flex-1 rounded-lg overflow-hidden shadow">{renderMedia("w-full h-full")}</div>
          <div className="flex-1 rounded-lg overflow-hidden shadow">{renderMedia("w-full h-full")}</div>
          <div className="flex-1 rounded-lg overflow-hidden shadow">{renderMedia("w-full h-full")}</div>
        </div>
        <div className="absolute right-2 top-10 max-w-[10%] flex flex-col items-center gap-1">
          <QRPreview />
        </div>
        <div className="absolute bottom-10 left-2 max-w-[60%] space-y-0.5">
          <h3 className="text-[10px] font-bold text-gray-800 truncate">{title}</h3>
          <PriceDisplay size="lg" />
        </div>
        <div className="absolute bottom-10 right-2">
          <CTAButton />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 27. SPECIAL_DAY - Arco portal =====
  if (templateType === 'special_day') {
    return (
      <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: primaryColor }}>
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute left-3 top-10 bottom-10 w-[45%] flex items-center justify-center">
          <div className="w-full h-[80%] overflow-hidden bg-white/10"
            style={{ clipPath: 'polygon(0% 100%, 0% 25%, 20% 0%, 80% 0%, 100% 25%, 100% 100%)', borderRadius: '40% 40% 0 0' }}>
            {renderMedia("w-full h-full")}
          </div>
        </div>
        <div className="absolute right-2 top-12 max-w-[45%] space-y-1">
          <h3 className="text-[10px] font-bold text-white truncate">{title}</h3>
          <p className="text-[5px] text-white/80 truncate">{subtitle}</p>
          <PriceDisplay textColor="#ffffff" size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview color="#ffffff" />
          <CTAButton bgColor="rgba(255,255,255,0.2)" />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 28. CATERING - Split vertical =====
  if (templateType === 'catering') {
    return (
      <div className="relative w-full h-full bg-gray-100 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[50%] overflow-hidden">
          {renderMedia("w-full h-full")}
        </div>
        <div className="absolute top-1 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute bottom-10 left-2 max-w-[60%] space-y-0.5">
          <h3 className="text-[10px] font-bold text-gray-800 truncate">{title}</h3>
          <p className="text-[5px] text-gray-500 truncate">{subtitle}</p>
          <PriceDisplay size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview />
          <CTAButton />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 29. MODERN_CLASSIC - Hexágono + linhas =====
  if (templateType === 'modern_classic') {
    return (
      <div className="relative w-full h-full bg-white overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute top-7 left-2 w-4 h-0.5" style={{ backgroundColor: primaryColor }} />
        <div className="absolute top-7 left-2 w-0.5 h-4" style={{ backgroundColor: primaryColor }} />
        <div className="absolute bottom-12 right-2 w-4 h-0.5" style={{ backgroundColor: primaryColor }} />
        <div className="absolute bottom-8 right-2 w-0.5 h-4" style={{ backgroundColor: primaryColor }} />
        <div className="absolute left-3 top-10 bottom-10 w-[42%] flex items-center justify-center">
          <div className="w-14 h-14 overflow-hidden"
            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
            {renderMedia("w-full h-full")}
          </div>
        </div>
        <div className="absolute right-2 top-12 max-w-[45%] space-y-1">
          <h3 className="text-[9px] font-medium text-gray-800 truncate">{title}</h3>
          <p className="text-[5px] text-gray-500 truncate">{subtitle}</p>
          <PriceDisplay size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview />
          <CTAButton />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 30. FULL_IMAGE - Vignette circular =====
  if (templateType === 'full_image') {
    return (
      <div className="relative w-full h-full overflow-hidden">
        <div className="absolute inset-0">{renderMedia("w-full h-full")}</div>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.6) 100%)' }} />
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute bottom-10 left-3 max-w-[55%] space-y-1">
          <h3 className="text-[10px] font-bold text-white drop-shadow-lg truncate">{title}</h3>
          <p className="text-[5px] text-white/80 truncate">{subtitle}</p>
          <PriceDisplay textColor="#ffffff" size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview color="#ffffff" />
          <CTAButton />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 31. GLASS_CARD =====
  if (templateType === 'glass_card') {
    return (
      <div className="relative w-full h-full overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryColor}30, ${primaryColor}10)` }}>
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute left-3 top-10 bottom-10 w-[45%] flex items-center justify-center">
          <div className="bg-white/40 backdrop-blur-sm rounded-xl p-2 shadow-lg">
            <div className="w-full h-full rounded-lg overflow-hidden">
              {renderMedia("w-full h-full")}
            </div>
          </div>
        </div>
        <div className="absolute right-2 top-12 max-w-[45%] space-y-1">
          <h3 className="text-[10px] font-bold truncate" style={{ color: primaryColor }}>{title}</h3>
          <p className="text-[5px] text-gray-600 truncate">{subtitle}</p>
          <PriceDisplay size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview />
          <CTAButton />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 32. WARM_COZY =====
  if (templateType === 'warm_cozy') {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute left-3 top-10 bottom-10 w-[45%] flex items-center justify-center">
          <div className="w-full h-[80%] rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 8px 32px rgba(251, 146, 60, 0.3)' }}>
            {renderMedia("w-full h-full")}
          </div>
        </div>
        <div className="absolute right-2 top-12 max-w-[45%] space-y-1">
          <h3 className="text-[10px] font-medium text-amber-800 truncate">{title}</h3>
          <p className="text-[5px] text-amber-600 truncate">{subtitle}</p>
          <PriceDisplay textColor="#92400e" size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview color="#92400e" />
          <CTAButton bgColor="#92400e" />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== 33. FRESH_GREEN - Folha/gota =====
  if (templateType === 'fresh_green') {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-green-50 to-emerald-100 overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
        <div className="absolute left-3 top-10 bottom-10 w-[45%] flex items-center justify-center">
          <div className="w-full h-[85%] overflow-hidden"
            style={{ clipPath: 'ellipse(50% 50% at 50% 40%)', borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%' }}>
            {renderMedia("w-full h-full")}
          </div>
        </div>
        <div className="absolute right-2 top-12 max-w-[45%] space-y-1">
          <h3 className="text-[10px] font-bold text-green-700 truncate">{title}</h3>
          <p className="text-[5px] text-green-600 truncate">{subtitle}</p>
          <PriceDisplay textColor="#15803d" size="lg" />
        </div>
        <div className="absolute bottom-10 right-2 flex items-center gap-2">
          <QRPreview color="#15803d" />
          <CTAButton bgColor="#15803d" />
        </div>
        <Footer />
      </div>
    );
  }

  // ===== DEFAULT fallback =====
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
      <div className="absolute top-2 left-1/2 -translate-x-1/2"><Logo size="sm" /></div>
      <div className="absolute left-3 top-10 bottom-10 w-[45%] rounded-lg overflow-hidden shadow-lg">
        {renderMedia("w-full h-full")}
      </div>
      <div className="absolute right-2 top-12 max-w-[45%] space-y-1">
        <h3 className="text-[10px] font-bold text-gray-800 truncate">{title}</h3>
        <p className="text-[5px] text-gray-500 truncate">{subtitle}</p>
        <PriceDisplay size="lg" />
      </div>
      <div className="absolute bottom-10 right-2 flex items-center gap-2">
        <QRPreview />
        <CTAButton />
      </div>
      <Footer />
    </div>
  );
}
