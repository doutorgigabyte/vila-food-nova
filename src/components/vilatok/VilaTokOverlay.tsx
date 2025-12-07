import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getImageUrl } from '@/lib/s3';
import { ShoppingBag, Sparkles } from 'lucide-react';

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

  const hasDiscount = product?.promotional_price && product.promotional_price < product.price;
  const discountPercent = hasDiscount 
    ? Math.round((1 - (product.promotional_price! / product.price)) * 100)
    : 0;

  return (
    <div className="absolute bottom-0 left-0 right-20 p-4 pb-6 z-10">
      {/* Establishment Info - Avatar com borda vermelha */}
      <div className="flex items-center gap-3 mb-2">
        <Avatar className="w-12 h-12 border-[3px] border-primary shadow-lg">
          <AvatarImage src={getImageUrl(establishment.logo_url)} />
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
            {establishment.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <span className="text-white font-semibold text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          @{establishment.slug}
        </span>
      </div>

      {/* Video Title - Bold e grande */}
      {video.title && (
        <h3 className="text-white font-bold text-xl mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-2">
          {video.title}
        </h3>
      )}
      
      {/* Video Description */}
      {video.description && (
        <p className="text-white/90 text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-3 mb-4 leading-relaxed">
          {video.description}
        </p>
      )}

      {/* Product Card - Layout exato do reference */}
      {product && (
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-2xl max-w-[320px] relative overflow-hidden">
          {/* Discount Badge - Canto superior direito */}
          {hasDiscount && (
            <div className="absolute top-2 right-2 bg-gradient-to-r from-primary to-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-md">
              <Sparkles className="w-3 h-3" />
              -{discountPercent}%
            </div>
          )}

          <div className="flex items-center gap-3">
            {/* Product Image */}
            <img
              src={getImageUrl(product.image_url)}
              alt={product.name}
              className="w-16 h-16 rounded-xl object-cover shadow-md flex-shrink-0"
            />
            
            {/* Product Info */}
            <div className="flex-1 min-w-0 pr-8">
              <p className="text-foreground font-semibold text-sm line-clamp-1 mb-1">
                {product.name}
              </p>
              <div className="flex items-baseline gap-2">
                {hasDiscount ? (
                  <>
                    <span className="text-primary font-bold text-lg">
                      {formatPrice(product.promotional_price!)}
                    </span>
                    <span className="text-muted-foreground text-xs line-through">
                      {formatPrice(product.price)}
                    </span>
                  </>
                ) : (
                  <span className="text-primary font-bold text-lg">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* "Eu Quero!" Button - Vermelho com ícone */}
          <Button
            onClick={onProductClick}
            className="w-full mt-3 bg-primary hover:bg-primary/90 text-white font-bold py-4 text-base rounded-xl shadow-lg transition-all duration-200 active:scale-[0.98]"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Eu Quero!
          </Button>
        </div>
      )}
    </div>
  );
}
