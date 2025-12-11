import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/s3";
import { QrCode } from "lucide-react";

interface TVSlidePreviewProps {
  imageUrl: string;
  title: string;
  subtitle: string;
  templateType: string;
  badgeText?: string;
  primaryColor?: string;
  logoUrl?: string;
  establishmentName?: string;
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

  // QR Code placeholder with label
  const QRPlaceholder = ({ size = "md", label }: { size?: "sm" | "md"; label?: string }) => (
    <div className="bg-white rounded shadow flex flex-col items-center p-0.5">
      <div className={cn(
        "bg-gray-100 flex items-center justify-center rounded-sm",
        size === "sm" ? "w-4 h-4" : "w-6 h-6"
      )}>
        <QrCode className={cn(size === "sm" ? "w-2 h-2" : "w-3 h-3", "text-gray-400")} />
      </div>
      {label && <span className="text-[3px] text-gray-500 mt-0.5">{label}</span>}
    </div>
  );

  // Minimal template
  if (templateType === 'minimal') {
    return (
      <div className="relative w-full h-full bg-black overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          {renderMedia("w-full h-full")}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
        {logoUrl && (
          <div className="absolute top-2 left-2 w-5 h-5 bg-white/90 rounded-full p-0.5 shadow">
            <img src={getImageUrl(logoUrl)} alt="" className="w-full h-full object-contain rounded-full" />
          </div>
        )}
        {title && (
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
            <span className="text-[6px] font-bold text-white">{title}</span>
          </div>
        )}
        <div className="absolute bottom-2 right-2">
          <QRPlaceholder size="md" label={productId ? "Compre" : "Menu"} />
        </div>
      </div>
    );
  }

  // Product Showcase template
  if (templateType === 'product_showcase') {
    return (
      <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: `${primaryColor}08` }}>
        {/* Gradient background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 20% 20%, ${primaryColor}15 0%, transparent 50%)`
          }}
        />
        {/* Wave lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 60" preserveAspectRatio="none">
          {[0,1,2,3].map(i => (
            <path key={i} d={`M0 ${10+i*12} Q 25 ${5+i*12} 50 ${10+i*12} T 100 ${10+i*12}`} fill="none" stroke={primaryColor} strokeWidth="2" />
          ))}
        </svg>
        
        <div className="flex h-full relative z-10">
          {/* Image side - 55% width, bleeds left */}
          <div className="w-[55%] h-full overflow-hidden rounded-r-xl -ml-1">
            {renderMedia("w-full h-full")}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
          </div>
          {/* Info side */}
          <div className="w-[45%] p-2 flex flex-col justify-center">
            {logoUrl && (
              <img src={getImageUrl(logoUrl)} alt="" className="w-4 h-4 object-contain mb-1" />
            )}
            <h3 className="text-[8px] font-bold truncate" style={{ color: primaryColor }}>
              {title || 'Título do Produto'}
            </h3>
            <p className="text-[5px] text-muted-foreground line-clamp-2 mt-0.5">
              {subtitle || 'Descrição do produto'}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[5px] px-1 py-0.5 rounded-full text-white font-bold" style={{ backgroundColor: primaryColor }}>
                Eu quero!
              </span>
              <QRPlaceholder size="sm" />
            </div>
          </div>
        </div>
        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 h-2.5" style={{ backgroundColor: primaryColor }}>
          <div className="flex items-center justify-center gap-2 h-full">
            <span className="text-[4px] text-white font-bold">PEÇA O SEU!</span>
          </div>
        </div>
      </div>
    );
  }

  // Promo template
  if (templateType === 'promo') {
    return (
      <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: `${primaryColor}08` }}>
        {/* Gradient and circles */}
        <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full opacity-10" style={{ backgroundColor: primaryColor }} />
        <div className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full opacity-5" style={{ backgroundColor: primaryColor }} />
        
        <div className="flex h-full relative z-10">
          {/* Info side */}
          <div className="w-2/5 p-2 flex flex-col justify-center">
            {badgeText && (
              <span className="text-[5px] px-1 py-0.5 rounded-full bg-amber-400 text-amber-900 w-fit mb-1 font-bold">
                ⭐ {badgeText}
              </span>
            )}
            <h3 className="text-[8px] font-bold" style={{ color: primaryColor }}>
              {title || 'Promoção'}
            </h3>
            <p className="text-[5px] text-muted-foreground mt-0.5">
              {subtitle || 'Descrição'}
            </p>
            <div className="mt-2">
              <QRPlaceholder size="sm" label="Compre" />
            </div>
          </div>
          {/* Image side - bleeds right */}
          <div className="w-3/5 h-full overflow-hidden rounded-l-xl -mr-1">
            {renderMedia("w-full h-full")}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-2" style={{ backgroundColor: primaryColor }} />
      </div>
    );
  }

  // Full Image template
  if (templateType === 'full_image') {
    return (
      <div className="relative w-full h-full bg-black overflow-hidden">
        {renderMedia("w-full h-full")}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        {title && (
          <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded">
            <span className="text-[6px] font-bold text-white">{title}</span>
          </div>
        )}
        <div className="absolute bottom-2 right-2">
          <QRPlaceholder size="md" label="Compre" />
        </div>
      </div>
    );
  }

  // Blob Modern template
  if (templateType === 'blob_modern') {
    return (
      <div className="relative w-full h-full bg-gray-900 overflow-hidden">
        {/* Blobs - larger */}
        <div 
          className="absolute -top-4 -left-4 w-16 h-16 rounded-full blur-xl opacity-30"
          style={{ backgroundColor: primaryColor }}
        />
        <div 
          className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-20"
          style={{ backgroundColor: primaryColor }}
        />
        {/* Center image - larger circle */}
        <div className="absolute inset-0 flex items-center p-2">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-lg">
            {renderMedia("w-full h-full")}
          </div>
          <div className="ml-2 flex-1">
            <h3 className="text-[7px] font-bold text-white truncate">
              {title || 'Título'}
            </h3>
            <p className="text-[5px] text-white/70 truncate">
              {subtitle || 'Subtítulo'}
            </p>
          </div>
        </div>
        <div className="absolute bottom-1 right-1">
          <QRPlaceholder size="sm" />
        </div>
      </div>
    );
  }

  // Polaroid template
  if (templateType === 'polaroid') {
    return (
      <div className="relative w-full h-full bg-gray-800 overflow-hidden flex items-center justify-center">
        {/* Dots pattern */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-1 h-1 rounded-full opacity-20"
              style={{ 
                backgroundColor: primaryColor,
                left: `${20 + i * 15}%`,
                top: `${10 + (i % 3) * 30}%`
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {/* Polaroid - larger */}
          <div className="w-10 h-12 bg-white p-0.5 pb-2 shadow-lg transform -rotate-3">
            <div className="w-full h-8 overflow-hidden bg-gray-100">
              {renderMedia("w-full h-full")}
            </div>
            <p className="text-[3px] text-center mt-0.5 truncate text-gray-600">{title || 'Título'}</p>
          </div>
          <div className="flex flex-col max-w-[40%]">
            <h3 className="text-[6px] font-bold text-white truncate">{title || 'Novidade'}</h3>
            <QRPlaceholder size="sm" />
          </div>
        </div>
      </div>
    );
  }

  // Diamond template
  if (templateType === 'diamond') {
    return (
      <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: `${primaryColor}05` }}>
        {/* Animated dots */}
        {[...Array(6)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-1 h-1 rounded-full opacity-10"
            style={{ 
              backgroundColor: primaryColor,
              left: `${10 + i * 18}%`,
              top: `${20 + (i % 2) * 40}%`
            }}
          />
        ))}
        {/* Large Diamond */}
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-14 h-14 transform rotate-45 overflow-hidden rounded-lg" style={{ backgroundColor: primaryColor }}>
          {renderMedia("w-full h-full -rotate-45 scale-150")}
        </div>
        {/* Text */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 max-w-[40%]">
          <h3 className="text-[7px] font-bold" style={{ color: primaryColor }}>{title || 'Título'}</h3>
          <p className="text-[4px] text-muted-foreground truncate">{subtitle || 'Subtítulo'}</p>
          <div className="mt-1">
            <QRPlaceholder size="sm" label="Compre" />
          </div>
        </div>
        {badgeText && (
          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-[4px] text-white font-bold">{badgeText}</span>
          </div>
        )}
      </div>
    );
  }

  // Diagonal template
  if (templateType === 'diagonal') {
    return (
      <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: `${primaryColor}08` }}>
        {/* Stripe pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(-15deg, ${primaryColor} 0px, ${primaryColor} 1px, transparent 1px, transparent 20px)`
          }}
        />
        {/* Diagonal image - 65% width */}
        <div 
          className="absolute inset-0 w-[65%]"
          style={{ clipPath: 'polygon(0 0, 100% 0, 75% 100%, 0 100%)' }}
        >
          {renderMedia("w-full h-full")}
        </div>
        {/* Text */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 max-w-[35%]">
          <h3 className="text-[7px] font-bold" style={{ color: primaryColor }}>{title || 'Título'}</h3>
          <p className="text-[4px] text-muted-foreground truncate">{subtitle || 'Subtítulo'}</p>
          <div className="mt-1">
            <QRPlaceholder size="sm" />
          </div>
        </div>
        {badgeText && (
          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-[4px] text-white font-bold text-center leading-tight">{badgeText}</span>
          </div>
        )}
      </div>
    );
  }

  // Menu Grid template
  if (templateType === 'menu_grid') {
    return (
      <div className="relative w-full h-full bg-gray-900 overflow-hidden">
        {/* Blob */}
        <div 
          className="absolute -top-4 -left-4 w-14 h-14 rounded-full blur-lg opacity-20"
          style={{ backgroundColor: primaryColor }}
        />
        {/* Title */}
        <div className="absolute top-1 right-2 left-2 flex items-center justify-between">
          <h3 className="text-[6px] text-white font-bold">{title || 'Menu'}</h3>
          <QRPlaceholder size="sm" />
        </div>
        {/* Main image - large circle */}
        <div className="absolute inset-0 flex items-center justify-center pt-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white">
            {renderMedia("w-full h-full")}
          </div>
        </div>
      </div>
    );
  }

  // Special Day template
  if (templateType === 'special_day') {
    return (
      <div 
        className="relative w-full h-full overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primaryColor}cc, ${primaryColor})` }}
      >
        {/* Blob shapes */}
        <div className="absolute -top-4 right-0 w-10 h-10 rounded-full bg-amber-400 opacity-30 blur-lg" />
        <div className="absolute -bottom-4 -left-4 w-14 h-14 rounded-full bg-white opacity-10 blur-xl" />
        
        <div className="flex h-full p-2">
          <div className="w-1/2 flex flex-col justify-center">
            <h3 className="text-[7px] text-white font-bold">{title || 'Especial'}</h3>
            <p className="text-[4px] text-white/80 mt-0.5">{subtitle}</p>
          </div>
          {/* Circle with image - larger */}
          <div className="w-1/2 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-white/90 shadow border-2 border-white">
              {renderMedia("w-full h-full")}
            </div>
          </div>
        </div>
        <div className="absolute bottom-1 right-1">
          <QRPlaceholder size="sm" />
        </div>
      </div>
    );
  }

  // Catering template
  if (templateType === 'catering') {
    return (
      <div className="relative w-full h-full overflow-hidden bg-gray-100">
        <div className="flex h-full">
          {/* Image side - 65% */}
          <div className="w-[65%] h-full overflow-hidden">
            {renderMedia("w-full h-full")}
          </div>
          {/* Info panel */}
          <div 
            className="w-[35%] flex flex-col items-center justify-center p-2"
            style={{ backgroundColor: primaryColor }}
          >
            <h3 className="text-[6px] text-white font-bold text-center">{title || 'Evento'}</h3>
            <p className="text-[4px] text-white/80 text-center mt-0.5">{subtitle || 'Descrição'}</p>
            <div className="mt-1">
              <QRPlaceholder size="sm" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Circles template
  if (templateType === 'circles') {
    return (
      <div 
        className="relative w-full h-full overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primaryColor}aa, ${primaryColor}ee)` }}
      >
        {/* Geometric circles in background */}
        <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full border-4 border-white opacity-10" />
        <div className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full border-4 border-white opacity-5" />
        
        {/* Circles - larger */}
        <div className="absolute top-1/2 -translate-y-1/2 left-2 flex items-center gap-1">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-400 bg-white shadow">
            {renderMedia("w-full h-full")}
          </div>
          <div className="w-10 h-10 -mt-4 rounded-full overflow-hidden border border-amber-400 bg-white shadow">
            {renderMedia("w-full h-full")}
          </div>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-400 bg-white shadow">
            {renderMedia("w-full h-full")}
          </div>
        </div>
        {/* Text */}
        <div className="absolute top-1 right-2">
          <h3 className="text-[6px] text-white font-bold">{title || 'Destaques'}</h3>
        </div>
        <div className="absolute bottom-1 right-1">
          <QRPlaceholder size="sm" />
        </div>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="relative w-full h-full bg-muted overflow-hidden flex items-center justify-center">
      {imageUrl ? renderMedia("w-full h-full") : (
        <span className="text-muted-foreground text-[8px]">Selecione uma imagem</span>
      )}
    </div>
  );
}
