import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/s3";
import { QrCode, Phone, Globe } from "lucide-react";

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
  productId
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

  // Rodapé padronizado com z-50
  const Footer = () => (
    <div 
      className="absolute bottom-0 left-0 right-0 h-5 z-50 flex items-center justify-between px-2"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="flex items-center gap-1">
        <Phone className="w-2 h-2 text-white/80" />
      </div>
      <span className="text-[5px] text-white font-medium">{establishmentSlug}.vilafood</span>
      <div className="bg-white/90 w-3 h-3 rounded-sm flex items-center justify-center">
        <QrCode className="w-2 h-2 text-gray-600" />
      </div>
    </div>
  );

  // QR Code Preview component
  const QRPreview = ({ color = primaryColor, label = "Menu" }: { color?: string; label?: string }) => (
    <div className="flex flex-col items-center gap-0.5">
      <div 
        className="w-6 h-6 bg-white rounded flex items-center justify-center"
        style={{ border: `2px solid ${color}` }}
      >
        <QrCode className="w-4 h-4" style={{ color }} />
      </div>
      <span className="text-[5px] font-medium" style={{ color }}>{label}</span>
    </div>
  );

  // Logo component
  const Logo = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
    if (!logoUrl) return null;
    const sizes = { sm: "w-6 h-6", md: "w-8 h-8", lg: "w-10 h-10" };
    return (
      <img 
        src={getImageUrl(logoUrl)} 
        alt="" 
        className={cn(sizes[size], "object-contain rounded-full bg-white p-0.5 shadow")} 
      />
    );
  };

  // ===== MINIMAL =====
  if (templateType === 'minimal') {
    return (
      <div className="relative w-full h-full bg-black overflow-hidden">
        <div className="absolute inset-0">{renderMedia("w-full h-full")}</div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-3 left-3"><Logo /></div>
        {title && (
          <div className="absolute bottom-8 left-3 right-16 bg-black/60 backdrop-blur-sm px-2 py-1.5 rounded-lg">
            <span className="text-[10px] font-bold text-white block truncate">{title}</span>
            {subtitle && <span className="text-[7px] text-white/80 block truncate">{subtitle}</span>}
          </div>
        )}
        <div className="absolute bottom-8 right-3"><QRPreview color="#ffffff" label={productId ? "Compre" : "Menu"} /></div>
        <Footer />
      </div>
    );
  }

  // ===== PRODUCT SHOWCASE =====
  if (templateType === 'product_showcase') {
    return (
      <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: `${primaryColor}08` }}>
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 20% 20%, ${primaryColor}15 0%, transparent 50%)` }} />
        <div className="flex h-full pb-5">
          <div className="w-[55%] h-full overflow-hidden rounded-r-2xl -ml-1 shadow-lg">
            {renderMedia("w-full h-full")}
          </div>
          <div className="w-[45%] p-3 flex flex-col justify-center">
            <Logo size="sm" />
            <h3 className="text-xs font-bold mt-2 truncate" style={{ color: primaryColor }}>{title || 'Título do Produto'}</h3>
            <p className="text-[7px] text-muted-foreground line-clamp-2 mt-1">{subtitle || 'Descrição'}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[6px] px-2 py-1 rounded-full text-white font-bold" style={{ backgroundColor: primaryColor }}>Eu quero!</span>
              <QRPreview label="Compre" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== PROMO =====
  if (templateType === 'promo') {
    return (
      <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: `${primaryColor}08` }}>
        <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full opacity-10" style={{ backgroundColor: primaryColor }} />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 rounded-full opacity-5" style={{ backgroundColor: primaryColor }} />
        <div className="flex h-full pb-5">
          <div className="w-2/5 p-3 flex flex-col justify-center">
            {badgeText && (
              <span className="text-[7px] px-2 py-1 rounded-full bg-amber-400 text-amber-900 w-fit mb-2 font-bold">⭐ {badgeText}</span>
            )}
            <h3 className="text-sm font-bold" style={{ color: primaryColor }}>{title || 'Promoção'}</h3>
            <p className="text-[7px] text-muted-foreground mt-1">{subtitle || 'Descrição'}</p>
            <div className="mt-3"><QRPreview label="Compre" /></div>
          </div>
          <div className="w-3/5 h-full overflow-hidden rounded-l-2xl -mr-1">{renderMedia("w-full h-full")}</div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== FULL IMAGE =====
  if (templateType === 'full_image') {
    return (
      <div className="relative w-full h-full bg-black overflow-hidden">
        {renderMedia("w-full h-full")}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-3 left-3"><Logo /></div>
        {title && (
          <div className="absolute bottom-8 left-3 bg-black/70 backdrop-blur-sm px-2 py-1.5 rounded-lg">
            <span className="text-[10px] font-bold text-white">{title}</span>
          </div>
        )}
        <div className="absolute bottom-8 right-3"><QRPreview color="#ffffff" label="Compre" /></div>
        <Footer />
      </div>
    );
  }

  // ===== BLOB MODERN =====
  if (templateType === 'blob_modern') {
    return (
      <div className="relative w-full h-full bg-gray-900 overflow-hidden">
        <div className="absolute -top-8 -left-8 w-24 h-24 rounded-full blur-xl opacity-30" style={{ backgroundColor: primaryColor }} />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20" style={{ backgroundColor: primaryColor }} />
        <div className="flex items-center h-full p-3 pb-8">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-lg flex-shrink-0">
            {renderMedia("w-full h-full")}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <h3 className="text-xs font-bold text-white truncate">{title || 'Título'}</h3>
            <p className="text-[7px] text-white/70 truncate">{subtitle || 'Subtítulo'}</p>
            <div className="mt-2"><QRPreview color="#ffffff" /></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== POLAROID =====
  if (templateType === 'polaroid') {
    return (
      <div className="relative w-full h-full bg-gray-800 overflow-hidden flex items-center justify-center pb-5">
        <div className="flex items-center gap-3">
          <div className="w-16 h-20 bg-white p-1 pb-3 shadow-lg transform -rotate-3">
            <div className="w-full h-14 overflow-hidden bg-gray-100">{renderMedia("w-full h-full")}</div>
            <p className="text-[5px] text-center mt-1 truncate text-gray-600">{title || 'Título'}</p>
          </div>
          <div className="flex flex-col max-w-[45%]">
            <h3 className="text-[10px] font-bold text-white truncate">{title || 'Novidade'}</h3>
            <p className="text-[6px] text-white/70 truncate">{subtitle}</p>
            <div className="mt-2"><QRPreview color="#ffffff" /></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== DIAMOND =====
  if (templateType === 'diamond') {
    return (
      <div className="relative w-full h-full overflow-hidden pb-5" style={{ backgroundColor: `${primaryColor}05` }}>
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-20 h-20 transform rotate-45 overflow-hidden rounded-lg" style={{ backgroundColor: primaryColor }}>
          {renderMedia("w-full h-full -rotate-45 scale-150")}
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 max-w-[45%]">
          <h3 className="text-xs font-bold" style={{ color: primaryColor }}>{title || 'Título'}</h3>
          <p className="text-[6px] text-muted-foreground truncate">{subtitle || 'Subtítulo'}</p>
          <div className="mt-2"><QRPreview label="Compre" /></div>
        </div>
        {badgeText && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-[6px] text-white font-bold">{badgeText}</span>
          </div>
        )}
        <Footer />
      </div>
    );
  }

  // ===== DIAGONAL =====
  if (templateType === 'diagonal') {
    return (
      <div className="relative w-full h-full overflow-hidden pb-5" style={{ backgroundColor: `${primaryColor}08` }}>
        <div className="absolute inset-0 w-[65%]" style={{ clipPath: 'polygon(0 0, 100% 0, 75% 100%, 0 100%)' }}>
          {renderMedia("w-full h-full")}
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 max-w-[40%]">
          <h3 className="text-xs font-bold" style={{ color: primaryColor }}>{title || 'Título'}</h3>
          <p className="text-[6px] text-muted-foreground truncate">{subtitle || 'Subtítulo'}</p>
          <div className="mt-2"><QRPreview /></div>
        </div>
        {badgeText && (
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-[5px] text-white font-bold text-center leading-tight">{badgeText}</span>
          </div>
        )}
        <Footer />
      </div>
    );
  }

  // ===== MENU GRID =====
  if (templateType === 'menu_grid') {
    return (
      <div className="relative w-full h-full bg-gray-900 overflow-hidden pb-5">
        <div className="absolute top-2 right-3 left-3 flex items-center justify-between">
          <h3 className="text-[10px] text-white font-bold">{title || 'Menu'}</h3>
          <QRPreview color="#ffffff" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center pt-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white">{renderMedia("w-full h-full")}</div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== SPECIAL DAY =====
  if (templateType === 'special_day') {
    return (
      <div className="relative w-full h-full overflow-hidden pb-5" style={{ background: `linear-gradient(135deg, ${primaryColor}cc, ${primaryColor})` }}>
        <div className="flex h-full p-3">
          <div className="w-1/2 flex flex-col justify-center">
            <h3 className="text-xs text-white font-bold">{title || 'Especial'}</h3>
            <p className="text-[6px] text-white/80 mt-1">{subtitle}</p>
            <div className="mt-2"><QRPreview color="#ffffff" /></div>
          </div>
          <div className="w-1/2 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white/90 shadow border-2 border-white">{renderMedia("w-full h-full")}</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== CATERING =====
  if (templateType === 'catering') {
    return (
      <div className="relative w-full h-full overflow-hidden bg-gray-100 pb-5">
        <div className="flex h-full">
          <div className="w-[60%] h-full overflow-hidden">{renderMedia("w-full h-full")}</div>
          <div className="w-[40%] flex flex-col items-center justify-center p-3" style={{ backgroundColor: primaryColor }}>
            <h3 className="text-[10px] text-white font-bold text-center">{title || 'Evento'}</h3>
            <p className="text-[6px] text-white/80 text-center mt-1">{subtitle || 'Descrição'}</p>
            <div className="mt-2"><QRPreview color="#ffffff" /></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== CIRCLES =====
  if (templateType === 'circles') {
    return (
      <div className="relative w-full h-full overflow-hidden pb-5" style={{ background: `linear-gradient(135deg, ${primaryColor}aa, ${primaryColor}ee)` }}>
        <div className="absolute top-1/2 -translate-y-1/2 left-3 flex items-center gap-2">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400 bg-white shadow">{renderMedia("w-full h-full")}</div>
          <div className="w-16 h-16 -mt-6 rounded-full overflow-hidden border-2 border-amber-400 bg-white shadow">{renderMedia("w-full h-full")}</div>
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400 bg-white shadow">{renderMedia("w-full h-full")}</div>
        </div>
        <div className="absolute top-2 right-3"><h3 className="text-[10px] text-white font-bold">{title || 'Destaques'}</h3></div>
        <div className="absolute bottom-8 right-3"><QRPreview color="#ffffff" /></div>
        <Footer />
      </div>
    );
  }

  // ===== CLEAN WHITE =====
  if (templateType === 'clean_white') {
    return (
      <div className="relative w-full h-full bg-white overflow-hidden pb-5">
        <div className="flex h-full">
          <div className="w-[55%] h-full overflow-hidden rounded-r-2xl -ml-1">{renderMedia("w-full h-full")}</div>
          <div className="w-[45%] p-3 flex flex-col justify-center">
            <Logo size="sm" />
            <h3 className="text-xs font-bold text-gray-900 truncate mt-2">{title || 'Título'}</h3>
            <p className="text-[6px] text-gray-500 line-clamp-2 mt-1">{subtitle}</p>
            <div className="mt-2"><QRPreview /></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== ZEN SIMPLE =====
  if (templateType === 'zen_simple') {
    return (
      <div className="relative w-full h-full bg-gray-50 overflow-hidden flex items-center p-3 pb-8">
        <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">{renderMedia("w-full h-full")}</div>
        <div className="flex-1 pl-3 min-w-0">
          <h3 className="text-[10px] font-light text-gray-800 truncate">{title || 'Zen'}</h3>
          <p className="text-[6px] text-gray-500 truncate">{subtitle}</p>
          <div className="mt-2"><QRPreview /></div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== GLASS CARD =====
  if (templateType === 'glass_card') {
    return (
      <div className="relative w-full h-full overflow-hidden pb-5" style={{ backgroundColor: `${primaryColor}10` }}>
        <div className="absolute inset-0 backdrop-blur-sm" />
        <div className="flex h-full relative z-10">
          <div className="w-[55%] h-full p-2">
            <div className="w-full h-full rounded-xl overflow-hidden border border-white/30 backdrop-blur-sm">
              {renderMedia("w-full h-full")}
            </div>
          </div>
          <div className="w-[45%] p-3 flex flex-col justify-center">
            <div className="bg-white/80 backdrop-blur rounded-xl p-2">
              <h3 className="text-[10px] font-bold truncate" style={{ color: primaryColor }}>{title || 'Glass'}</h3>
              <p className="text-[6px] text-gray-600 truncate">{subtitle}</p>
              <div className="mt-2"><QRPreview /></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== NEON GLOW =====
  if (templateType === 'neon_glow') {
    return (
      <div className="relative w-full h-full bg-gray-900 overflow-hidden pb-5">
        <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 50% 50%, ${primaryColor}40, transparent 70%)` }} />
        <div className="flex h-full relative z-10">
          <div className="w-1/2 flex items-center justify-center p-3">
            <div className="w-20 h-20 rounded-xl overflow-hidden" style={{ boxShadow: `0 0 30px ${primaryColor}80` }}>
              {renderMedia("w-full h-full")}
            </div>
          </div>
          <div className="w-1/2 p-3 flex flex-col justify-center">
            <h3 className="text-xs font-bold text-white truncate" style={{ textShadow: `0 0 15px ${primaryColor}` }}>{title || 'Neon'}</h3>
            <p className="text-[6px] text-gray-400 truncate">{subtitle}</p>
            <div className="mt-2"><QRPreview color="#ffffff" /></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== POP ART =====
  if (templateType === 'pop_art') {
    return (
      <div className="relative w-full h-full overflow-hidden pb-5" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%)' }}>
        <div className="absolute inset-0 opacity-20">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute w-4 h-4 rounded-full bg-white" style={{ top: `${20 + i * 15}%`, left: `${10 + i * 15}%` }} />
          ))}
        </div>
        <div className="flex h-full relative z-10">
          <div className="w-[55%] h-full p-2">
            <div className="w-full h-full rounded-xl overflow-hidden border-3 border-white">
              {renderMedia("w-full h-full")}
            </div>
          </div>
          <div className="w-[45%] p-3 flex flex-col justify-center">
            <h3 className="text-xs font-black text-white truncate">{title || 'Pop!'}</h3>
            <p className="text-[6px] text-white/80 truncate">{subtitle}</p>
            <div className="mt-2"><QRPreview color="#ffffff" /></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== GRADIENT BURST =====
  if (templateType === 'gradient_burst') {
    return (
      <div className="relative w-full h-full overflow-hidden pb-5" style={{ background: `linear-gradient(45deg, ${primaryColor}, ${primaryColor}dd, #f59e0b)` }}>
        <div className="flex h-full relative z-10">
          <div className="w-1/2 p-3 flex flex-col justify-center">
            <h3 className="text-xs font-black text-white truncate">{title || 'Burst!'}</h3>
            <p className="text-[6px] text-white/80 truncate">{subtitle}</p>
            <div className="mt-2"><QRPreview color="#ffffff" /></div>
          </div>
          <div className="w-1/2 flex items-center justify-center p-2">
            <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-white shadow-lg">
              {renderMedia("w-full h-full")}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== RETRO 70s =====
  if (templateType === 'retro_70s') {
    return (
      <div className="relative w-full h-full overflow-hidden pb-5" style={{ background: 'linear-gradient(180deg, #d97706 0%, #92400e 100%)' }}>
        <div className="flex h-full relative z-10">
          <div className="w-[55%] h-full p-2">
            <div className="w-full h-full rounded-xl overflow-hidden border-3 border-amber-300">
              {renderMedia("w-full h-full")}
            </div>
          </div>
          <div className="w-[45%] p-3 flex flex-col justify-center">
            <h3 className="text-xs font-bold text-amber-100 truncate">{title || 'Retro'}</h3>
            <p className="text-[6px] text-amber-200/80 truncate">{subtitle}</p>
            <div className="mt-2"><QRPreview color="#fbbf24" /></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== ART DECO =====
  if (templateType === 'art_deco') {
    return (
      <div className="relative w-full h-full bg-gray-900 overflow-hidden pb-5">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-1 h-full bg-amber-400" />
          <div className="absolute top-0 right-1/4 w-1 h-full bg-amber-400" />
        </div>
        <div className="flex h-full relative z-10">
          <div className="w-1/2 flex items-center justify-center p-3">
            <div className="w-20 h-20 overflow-hidden border-3 border-amber-400" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}>
              {renderMedia("w-full h-full")}
            </div>
          </div>
          <div className="w-1/2 p-3 flex flex-col justify-center">
            <h3 className="text-xs font-bold text-amber-400 truncate">{title || 'Deco'}</h3>
            <p className="text-[6px] text-gray-400 truncate">{subtitle}</p>
            <div className="mt-2"><QRPreview color="#fbbf24" /></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== RUSTIC WOOD =====
  if (templateType === 'rustic_wood') {
    return (
      <div className="relative w-full h-full overflow-hidden pb-5" style={{ background: 'linear-gradient(135deg, #78350f, #451a03)' }}>
        <div className="flex h-full relative z-10">
          <div className="w-[55%] h-full p-2">
            <div className="w-full h-full rounded-xl overflow-hidden border-3 border-amber-700">
              {renderMedia("w-full h-full")}
            </div>
          </div>
          <div className="w-[45%] p-3 flex flex-col justify-center">
            <h3 className="text-xs font-bold text-amber-100 truncate">{title || 'Rústico'}</h3>
            <p className="text-[6px] text-amber-200/80 truncate">{subtitle}</p>
            <div className="mt-2"><QRPreview color="#d97706" /></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== CHRISTMAS =====
  if (templateType === 'christmas') {
    return (
      <div className="relative w-full h-full overflow-hidden pb-5" style={{ backgroundColor: '#1a472a' }}>
        <div className="flex h-full relative z-10 items-center">
          <div className="w-1/2 p-3 flex flex-col justify-center">
            <span className="text-xl mb-1">🎄</span>
            <h3 className="text-xs font-bold text-white truncate">{title || 'Natal!'}</h3>
            <p className="text-[6px] text-green-100/80 truncate">{subtitle}</p>
            <div className="mt-2"><QRPreview color="#dc2626" /></div>
          </div>
          <div className="w-1/2 flex items-center justify-center p-2">
            <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-red-600">
              {renderMedia("w-full h-full")}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== VALENTINES =====
  if (templateType === 'valentines') {
    return (
      <div className="relative w-full h-full overflow-hidden pb-5" style={{ backgroundColor: '#fce7f3' }}>
        <div className="flex h-full relative z-10">
          <div className="w-[55%] h-full p-2">
            <div className="w-full h-full rounded-xl overflow-hidden border-3 border-pink-300">
              {renderMedia("w-full h-full")}
            </div>
          </div>
          <div className="w-[45%] p-3 flex flex-col justify-center">
            <span className="text-lg mb-1">💕</span>
            <h3 className="text-xs font-bold text-pink-600 truncate">{title || 'Com Amor'}</h3>
            <p className="text-[6px] text-pink-500/80 truncate">{subtitle}</p>
            <div className="mt-2"><QRPreview color="#db2777" /></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== SÃO JOÃO =====
  if (templateType === 'sao_joao') {
    return (
      <div className="relative w-full h-full overflow-hidden pb-5" style={{ backgroundColor: '#1e1b4b' }}>
        <div className="flex h-full relative z-10 items-center">
          <div className="w-1/2 p-3 flex flex-col justify-center">
            <span className="text-lg mb-1">🔥🎉</span>
            <h3 className="text-xs font-bold text-yellow-400 truncate">{title || 'Arraiá!'}</h3>
            <p className="text-[6px] text-yellow-100/80 truncate">{subtitle}</p>
            <div className="mt-2"><QRPreview color="#f59e0b" /></div>
          </div>
          <div className="w-1/2 flex items-center justify-center p-2">
            <div className="w-18 h-18 rounded-xl overflow-hidden border-3 border-yellow-400">
              {renderMedia("w-full h-full")}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== CARNIVAL =====
  if (templateType === 'carnival') {
    return (
      <div className="relative w-full h-full overflow-hidden pb-5" style={{ backgroundColor: '#7c3aed' }}>
        <div className="flex h-full relative z-10">
          <div className="w-[55%] h-full p-2">
            <div className="w-full h-full rounded-xl overflow-hidden border-3 border-yellow-400">
              {renderMedia("w-full h-full")}
            </div>
          </div>
          <div className="w-[45%] p-3 flex flex-col justify-center">
            <span className="text-lg mb-1">🎭✨</span>
            <h3 className="text-xs font-bold text-white truncate">{title || 'Carnaval!'}</h3>
            <p className="text-[6px] text-white/80 truncate">{subtitle}</p>
            <div className="mt-2"><QRPreview color="#facc15" /></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== HALLOWEEN =====
  if (templateType === 'halloween') {
    return (
      <div className="relative w-full h-full overflow-hidden bg-gray-900 pb-5">
        <div className="flex h-full relative z-10 items-center">
          <div className="w-1/2 p-3 flex flex-col justify-center">
            <span className="text-xl mb-1">🎃👻</span>
            <h3 className="text-xs font-bold text-orange-500 truncate">{title || 'Halloween!'}</h3>
            <p className="text-[6px] text-gray-300 truncate">{subtitle}</p>
            <div className="mt-2"><QRPreview color="#f97316" /></div>
          </div>
          <div className="w-1/2 flex items-center justify-center p-2">
            <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-orange-500">
              {renderMedia("w-full h-full")}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== BEACH TROPICAL =====
  if (templateType === 'beach_tropical') {
    return (
      <div className="relative w-full h-full overflow-hidden pb-5" style={{ backgroundColor: '#e0f2fe' }}>
        <div className="flex h-full relative z-10">
          <div className="w-[55%] h-full p-2">
            <div className="w-full h-full rounded-xl overflow-hidden border-3 border-cyan-400">
              {renderMedia("w-full h-full")}
            </div>
          </div>
          <div className="w-[45%] p-3 flex flex-col justify-center">
            <span className="text-lg mb-1">🏖️🌴</span>
            <h3 className="text-xs font-bold text-cyan-700 truncate">{title || 'Praia!'}</h3>
            <p className="text-[6px] text-cyan-600/80 truncate">{subtitle}</p>
            <div className="mt-2"><QRPreview color="#0891b2" /></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== SUNSET BEACH =====
  if (templateType === 'sunset_beach') {
    return (
      <div className="relative w-full h-full overflow-hidden pb-5" style={{ background: 'linear-gradient(to bottom, #f97316, #dc2626, #7c2d12)' }}>
        <div className="flex h-full relative z-10 items-center">
          <div className="w-1/2 p-3 flex flex-col justify-center">
            <h3 className="text-xs font-bold text-white truncate">{title || 'Pôr do Sol'}</h3>
            <p className="text-[6px] text-white/80 truncate">{subtitle}</p>
            <div className="mt-2"><QRPreview color="#fb923c" /></div>
          </div>
          <div className="w-1/2 flex items-center justify-center p-2">
            <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-white/50">
              {renderMedia("w-full h-full")}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== TROPICAL FRUITS =====
  if (templateType === 'tropical_fruits') {
    return (
      <div className="relative w-full h-full overflow-hidden pb-5" style={{ backgroundColor: '#fef3c7' }}>
        <div className="flex h-full relative z-10">
          <div className="w-[55%] h-full p-2">
            <div className="w-full h-full rounded-xl overflow-hidden border-3 border-orange-400">
              {renderMedia("w-full h-full")}
            </div>
          </div>
          <div className="w-[45%] p-3 flex flex-col justify-center">
            <span className="text-lg mb-1">🥭🍍🥥</span>
            <h3 className="text-xs font-bold text-orange-600 truncate">{title || 'Tropical!'}</h3>
            <p className="text-[6px] text-orange-500/80 truncate">{subtitle}</p>
            <div className="mt-2"><QRPreview color="#ea580c" /></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== NORDESTE RUSTIC =====
  if (templateType === 'nordeste_rustic') {
    return (
      <div className="relative w-full h-full overflow-hidden pb-5" style={{ backgroundColor: '#fef7ee' }}>
        <div className="flex h-full relative z-10">
          <div className="w-[55%] h-full p-2">
            <div className="w-full h-full rounded-xl overflow-hidden border-3 border-orange-300">
              {renderMedia("w-full h-full")}
            </div>
          </div>
          <div className="w-[45%] p-3 flex flex-col justify-center">
            <h3 className="text-xs font-bold text-orange-800 truncate">{title || 'Nordeste'}</h3>
            <p className="text-[6px] text-orange-700/80 truncate">{subtitle}</p>
            <div className="mt-2"><QRPreview color="#c2410c" /></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== MODERN CLASSIC =====
  if (templateType === 'modern_classic') {
    return (
      <div className="relative w-full h-full overflow-hidden pb-5" style={{ backgroundColor: `${primaryColor}08` }}>
        <div className="flex h-full relative z-10">
          <div className="w-[55%] h-full overflow-hidden rounded-r-2xl -ml-1">{renderMedia("w-full h-full")}</div>
          <div className="w-[45%] p-3 flex flex-col justify-center">
            <Logo size="sm" />
            <h3 className="text-xs font-bold truncate mt-2" style={{ color: primaryColor }}>{title || 'Clássico'}</h3>
            <p className="text-[6px] text-gray-600 line-clamp-2 mt-1">{subtitle}</p>
            <div className="mt-2"><QRPreview /></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== WARM COZY =====
  if (templateType === 'warm_cozy') {
    return (
      <div className="relative w-full h-full overflow-hidden pb-5" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
        <div className="flex h-full relative z-10">
          <div className="w-[55%] h-full p-2">
            <div className="w-full h-full rounded-xl overflow-hidden border-3 border-amber-200">
              {renderMedia("w-full h-full")}
            </div>
          </div>
          <div className="w-[45%] p-3 flex flex-col justify-center">
            <h3 className="text-xs font-bold text-amber-900 truncate">{title || 'Aconchego'}</h3>
            <p className="text-[6px] text-amber-800/80 truncate">{subtitle}</p>
            <div className="mt-2"><QRPreview color="#d97706" /></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== FRESH GREEN =====
  if (templateType === 'fresh_green') {
    return (
      <div className="relative w-full h-full overflow-hidden pb-5" style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
        <div className="flex h-full relative z-10">
          <div className="w-[55%] h-full p-2">
            <div className="w-full h-full rounded-xl overflow-hidden border-3 border-green-300">
              {renderMedia("w-full h-full")}
            </div>
          </div>
          <div className="w-[45%] p-3 flex flex-col justify-center">
            <span className="text-lg mb-1">🌿</span>
            <h3 className="text-xs font-bold text-green-800 truncate">{title || 'Fresco'}</h3>
            <p className="text-[6px] text-green-700/80 truncate">{subtitle}</p>
            <div className="mt-2"><QRPreview color="#16a34a" /></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== DEFAULT FALLBACK =====
  return (
    <div className="relative w-full h-full bg-muted overflow-hidden flex items-center justify-center pb-5">
      {imageUrl ? renderMedia("w-full h-full") : (
        <span className="text-muted-foreground text-xs">Selecione uma imagem</span>
      )}
      <Footer />
    </div>
  );
}
