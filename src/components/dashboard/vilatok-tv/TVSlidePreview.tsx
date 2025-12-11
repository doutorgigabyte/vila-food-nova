import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/s3";

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
  mediaType = 'image'
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

  // Minimal template
  if (templateType === 'minimal') {
    return (
      <div className="relative w-full h-full bg-black overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          {renderMedia("w-full h-full")}
        </div>
        {/* Logo */}
        {logoUrl && (
          <div className="absolute top-2 left-2 w-6 h-6 bg-white rounded-full p-0.5 shadow">
            <img src={getImageUrl(logoUrl)} alt="" className="w-full h-full object-contain rounded-full" />
          </div>
        )}
        {/* QR placeholder */}
        <div className="absolute bottom-2 right-2 w-6 h-6 bg-white rounded shadow flex items-center justify-center">
          <span className="text-[6px] text-muted-foreground">QR</span>
        </div>
      </div>
    );
  }

  // Product Showcase template
  if (templateType === 'product_showcase') {
    return (
      <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: `${primaryColor}10` }}>
        <div className="flex h-full">
          {/* Image side */}
          <div className="w-1/2 h-full overflow-hidden">
            {renderMedia("w-full h-full")}
          </div>
          {/* Info side */}
          <div className="w-1/2 p-2 flex flex-col justify-center">
            {logoUrl && (
              <img src={getImageUrl(logoUrl)} alt="" className="w-4 h-4 object-contain mb-1" />
            )}
            <h3 className="text-[8px] font-bold truncate" style={{ color: primaryColor }}>
              {title || 'Título do Produto'}
            </h3>
            <p className="text-[6px] text-muted-foreground line-clamp-2">
              {subtitle || 'Descrição do produto'}
            </p>
          </div>
        </div>
        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 h-3" style={{ backgroundColor: primaryColor }}>
          <div className="flex items-center justify-between px-2 h-full">
            <span className="text-[6px] text-white font-bold">Eu quero!</span>
            <div className="w-3 h-3 bg-white rounded-sm flex items-center justify-center">
              <span className="text-[4px]">QR</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Promo template
  if (templateType === 'promo') {
    return (
      <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: `${primaryColor}10` }}>
        <div className="flex h-full">
          {/* Info side */}
          <div className="w-2/5 p-2 flex flex-col justify-center">
            {badgeText && (
              <span className="text-[6px] px-1 py-0.5 rounded-full bg-amber-400 text-amber-900 w-fit mb-1">
                {badgeText}
              </span>
            )}
            <h3 className="text-[8px] font-bold" style={{ color: primaryColor }}>
              {title || 'Promoção'}
            </h3>
            <p className="text-[6px] text-muted-foreground">
              {subtitle || 'Descrição'}
            </p>
          </div>
          {/* Image side */}
          <div className="w-3/5 h-full overflow-hidden">
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
      </div>
    );
  }

  // Blob Modern template
  if (templateType === 'blob_modern') {
    return (
      <div className="relative w-full h-full bg-gray-900 overflow-hidden">
        {/* Blobs */}
        <div 
          className="absolute top-0 left-0 w-8 h-8 rounded-full blur-lg opacity-40"
          style={{ backgroundColor: primaryColor }}
        />
        <div 
          className="absolute bottom-0 right-0 w-12 h-12 rounded-full blur-xl opacity-30"
          style={{ backgroundColor: primaryColor }}
        />
        {/* Center image */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg">
            {renderMedia("w-full h-full")}
          </div>
        </div>
        {/* Text */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-right">
          <h3 className="text-[7px] font-bold text-white truncate max-w-[40px]">
            {title || 'Título'}
          </h3>
          <p className="text-[5px] text-white/70">
            {subtitle || 'Subtítulo'}
          </p>
        </div>
      </div>
    );
  }

  // Polaroid template
  if (templateType === 'polaroid') {
    return (
      <div className="relative w-full h-full bg-gray-800 overflow-hidden flex items-center justify-center">
        <div className="relative">
          {/* Photo 1 */}
          <div className="absolute -left-2 top-0 w-8 h-10 bg-white p-0.5 shadow-lg transform -rotate-6">
            <div className="w-full h-7 overflow-hidden bg-gray-100">
              {renderMedia("w-full h-full")}
            </div>
          </div>
          {/* Photo 2 */}
          <div className="w-8 h-10 bg-white p-0.5 shadow-lg transform rotate-3 ml-3">
            <div className="w-full h-7 overflow-hidden bg-gray-100">
              {renderMedia("w-full h-full")}
            </div>
            <p className="text-[4px] text-center mt-0.5 truncate">{title || 'Título'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Diamond template
  if (templateType === 'diamond') {
    return (
      <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: `${primaryColor}05` }}>
        {/* Diamonds */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-10 h-10 transform rotate-45 overflow-hidden opacity-50" style={{ backgroundColor: `${primaryColor}30` }}>
          {renderMedia("w-full h-full -rotate-45 scale-150")}
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 transform rotate-45 overflow-hidden" style={{ backgroundColor: primaryColor }}>
          {renderMedia("w-full h-full -rotate-45 scale-150")}
        </div>
        {/* Text */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <h3 className="text-[7px] font-bold" style={{ color: primaryColor }}>{title || 'Título'}</h3>
          <p className="text-[5px] text-muted-foreground">{subtitle || 'Subtítulo'}</p>
        </div>
        {/* Badge */}
        {badgeText && (
          <div className="absolute top-1 right-1 px-1 py-0.5 bg-red-500 rounded-full">
            <span className="text-[5px] text-white font-bold">{badgeText}</span>
          </div>
        )}
      </div>
    );
  }

  // Diagonal template
  if (templateType === 'diagonal') {
    return (
      <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: `${primaryColor}10` }}>
        {/* Diagonal image */}
        <div 
          className="absolute inset-0 w-3/5"
          style={{ clipPath: 'polygon(0 0, 100% 0, 70% 100%, 0 100%)' }}
        >
          {renderMedia("w-full h-full")}
        </div>
        {/* Text */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <h3 className="text-[8px] font-bold" style={{ color: primaryColor }}>{title || 'Título'}</h3>
          <p className="text-[5px] text-muted-foreground">{subtitle || 'Subtítulo'}</p>
        </div>
        {/* Badge */}
        {badgeText && (
          <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
            <span className="text-[4px] text-white font-bold">{badgeText}</span>
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
          className="absolute top-0 left-0 w-8 h-8 rounded-full blur-lg opacity-30"
          style={{ backgroundColor: primaryColor }}
        />
        {/* Main image */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full overflow-hidden border-2 border-white">
          {renderMedia("w-full h-full")}
        </div>
        {/* Grid at bottom */}
        <div className="absolute bottom-1 left-1 flex gap-0.5">
          {[1,2,3,4].map(i => (
            <div key={i} className="w-4 h-4 rounded-full bg-white/80 overflow-hidden">
              {i === 1 && renderMedia("w-full h-full")}
            </div>
          ))}
        </div>
        {/* Title */}
        <div className="absolute top-2 right-2">
          <h3 className="text-[6px] text-white font-bold">{title || 'Menu'}</h3>
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
        {/* Circles with images */}
        <div className="absolute top-3 left-3 w-8 h-8 rounded-full overflow-hidden bg-white/90 shadow">
          {renderMedia("w-full h-full")}
        </div>
        <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full overflow-hidden bg-white/90 shadow">
          {renderMedia("w-full h-full")}
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shadow">
          <span className="text-[6px] font-bold">⭐</span>
        </div>
        {/* Text */}
        <div className="absolute top-1 right-2">
          <h3 className="text-[7px] text-white font-bold">{title || 'Especial'}</h3>
        </div>
      </div>
    );
  }

  // Catering template
  if (templateType === 'catering') {
    return (
      <div className="relative w-full h-full overflow-hidden bg-gray-100">
        <div className="flex h-full">
          {/* Image side */}
          <div className="w-3/5 h-full overflow-hidden">
            {renderMedia("w-full h-full")}
          </div>
          {/* Info panel */}
          <div 
            className="w-2/5 flex flex-col items-center justify-center p-2"
            style={{ backgroundColor: primaryColor }}
          >
            <h3 className="text-[7px] text-white font-bold text-center">{title || 'Evento'}</h3>
            <p className="text-[5px] text-white/80 text-center">{subtitle || 'Descrição'}</p>
          </div>
        </div>
        {/* Bottom strip */}
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-white flex items-center justify-center gap-1 px-1">
          {[1,2,3,4].map(i => (
            <div key={i} className="w-4 h-2 rounded-sm bg-gray-200 overflow-hidden">
              {renderMedia("w-full h-full")}
            </div>
          ))}
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
        {/* Circles */}
        <div className="absolute top-1/2 -translate-y-1/2 left-3 w-8 h-8 rounded-full overflow-hidden border-2 border-amber-400 bg-white shadow">
          {renderMedia("w-full h-full")}
        </div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full overflow-hidden border-2 border-amber-400 bg-white shadow">
          {renderMedia("w-full h-full")}
        </div>
        <div className="absolute bottom-1/3 right-3 w-8 h-8 rounded-full overflow-hidden border-2 border-amber-400 bg-white shadow">
          {renderMedia("w-full h-full")}
        </div>
        {/* Text */}
        <div className="absolute top-1 right-2">
          <h3 className="text-[7px] text-white font-bold">{title || 'Destaques'}</h3>
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