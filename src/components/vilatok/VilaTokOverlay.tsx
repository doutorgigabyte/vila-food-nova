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
    <div className="absolute bottom-0 left-0 right-16 p-4 pb-20">
      {/* Establishment Info */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="w-10 h-10 border-2 border-white ring-2 ring-primary/50">
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
        <p className="text-white/90 text-sm drop-shadow-lg line-clamp-2 mb-4">
          {video.description}
        </p>
      )}

      {/* Enhanced Product Card */}
      {product && (
        <div className="bg-white rounded-2xl p-3 shadow-xl border-2 border-primary/20 max-w-[300px] relative overflow-hidden">
          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-primary text-white text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-xl flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              -{discountPercent}%
            </div>
          )}

          <div className="flex items-center gap-3">
            <img
              src={getImageUrl(product.image_url)}
              alt={product.name}
              className="w-16 h-16 rounded-xl object-cover ring-2 ring-primary/10"
            />
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-semibold text-sm line-clamp-1">
                {product.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
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

          {/* Prominent "Eu Quero" Button */}
          <Button
            onClick={onProductClick}
            className="w-full mt-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-bold py-5 text-base rounded-xl shadow-lg shadow-primary/30 transition-all duration-200 active:scale-[0.98]"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Eu Quero!
          </Button>
        </div>
      )}
    </div>
  );
}
