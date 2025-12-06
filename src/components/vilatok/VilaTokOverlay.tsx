import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getImageUrl } from '@/lib/s3';

interface VilaTokOverlayProps {
  establishment: {
    name: string;
    slug: string;
    logo_url: string | null;
  };
  video: {
    title: string | null;
    description: string | null;
  };
  product?: {
    name: string;
    price: number;
    promotional_price: number | null;
    image_url: string | null;
  } | null;
  onProductClick?: () => void;
}

export function VilaTokOverlay({
  establishment,
  video,
  product,
  onProductClick,
}: VilaTokOverlayProps) {
  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="absolute bottom-0 left-0 right-16 p-4 pb-20">
      {/* Establishment Info */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="w-10 h-10 border-2 border-white">
          <AvatarImage src={getImageUrl(establishment.logo_url)} />
          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
            {establishment.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <span className="text-white font-bold text-base drop-shadow-lg">
          @{establishment.slug}
        </span>
      </div>

      {/* Video Title & Description */}
      {video.title && (
        <h3 className="text-white font-semibold text-lg mb-1 drop-shadow-lg line-clamp-1">
          {video.title}
        </h3>
      )}
      {video.description && (
        <p className="text-white/90 text-sm drop-shadow-lg line-clamp-2 mb-3">
          {video.description}
        </p>
      )}

      {/* Product Card */}
      {product && (
        <button
          onClick={onProductClick}
          className="flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-xl p-2 pr-4 w-full max-w-xs transition-transform active:scale-95"
        >
          <img
            src={getImageUrl(product.image_url)}
            alt={product.name}
            className="w-14 h-14 rounded-lg object-cover"
          />
          <div className="flex-1 text-left">
            <p className="text-foreground font-medium text-sm line-clamp-1">
              {product.name}
            </p>
            <div className="flex items-center gap-2">
              {product.promotional_price ? (
                <>
                  <span className="text-primary font-bold text-sm">
                    {formatPrice(product.promotional_price)}
                  </span>
                  <span className="text-muted-foreground text-xs line-through">
                    {formatPrice(product.price)}
                  </span>
                </>
              ) : (
                <span className="text-primary font-bold text-sm">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
          </div>
          <Badge className="bg-primary text-primary-foreground text-xs">
            + Carrinho
          </Badge>
        </button>
      )}
    </div>
  );
}
