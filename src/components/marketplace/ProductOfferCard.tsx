import { Link } from "react-router-dom";
import { Heart, Plus, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";
import { PriceWithDiscount } from "@/components/ui/price";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  promotional_price?: number | null;
  image_url?: string | null;
  is_active?: boolean | null;
  establishment?: {
    name: string;
    slug: string;
    is_open?: boolean | null;
  } | null;
}

interface ProductOfferCardProps {
  product: Product;
  variant?: "default" | "large" | "compact";
  className?: string;
}

const ProductOfferCard = ({ product, variant = "default", className }: ProductOfferCardProps) => {
  const { isProductFavorite, toggleFavoriteProduct } = useFavorites();
  const { addToCart } = useCart();
  const isFavorite = isProductFavorite(product.id);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const discount = product.promotional_price && product.promotional_price < product.price
    ? Math.round(((product.price - product.promotional_price) / product.price) * 100)
    : null;
  
  const isAvailable = product.is_active !== false && product.establishment?.is_open !== false;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoriteProduct(product.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product.establishment) {
      toast.error("Estabelecimento não encontrado");
      return;
    }
    
    const cartProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      promotional_price: product.promotional_price,
      image_url: product.image_url,
      establishment_id: product.establishment.slug,
    };
    
    const establishmentInfo = {
      id: product.establishment.slug,
      name: product.establishment.name,
      slug: product.establishment.slug,
      logo_url: null,
      vila_id: null,
      delivery_base_fee: 0,
      min_order_value: 0,
      accepts_pickup: true,
      accepts_delivery: true,
    };
    
    addToCart(cartProduct, establishmentInfo);
    toast.success(`${product.name} adicionado ao carrinho`);
  };

  // When used in a grid, cards should fill the grid cell (no fixed width)
  const isGridContext = !className?.includes('scroll-card') && variant === 'large';

  // Hero variant for category page - visual cards in carousel
  if (variant === "large") {
    return (
      <Link 
        to={`/produto/${product.id}`}
        className={cn("block group snap-center", className)}
      >
        <Card className="overflow-hidden hover:shadow-elevated transition-all relative border-0 shadow-soft w-56 md:w-64 rounded-2xl">
          <div className="relative overflow-hidden bg-muted aspect-[3/4]">
            {/* Skeleton while loading */}
            {!imageLoaded && !imageError && product.image_url && (
              <div className="absolute inset-0 skeleton-shimmer" />
            )}
            
            {product.image_url && !imageError ? (
              <img
                src={product.image_url}
                alt={product.name}
                loading="lazy"
                decoding="async"
                className={cn(
                  "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                draggable={false}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <span className="text-4xl opacity-30">🍽️</span>
              </div>
            )}
            
            {/* Not available overlay */}
            {!isAvailable && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <Clock className="w-6 h-6 text-muted-foreground mb-1" />
                <span className="text-xs font-medium text-muted-foreground">Indisponível</span>
              </div>
            )}
            
            {/* Discount badge */}
            {discount && isAvailable && (
              <Badge className="absolute top-2.5 left-2.5 bg-destructive text-destructive-foreground font-bold px-2.5 py-1 text-xs shadow-lg rounded-lg">
                {discount}% OFF
              </Badge>
            )}
            
            {/* Favorite button */}
            <button 
              type="button"
              className={cn(
                "absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center bg-card/90 backdrop-blur-sm hover:bg-card rounded-full shadow-md transition-all z-10",
                isFavorite ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-destructive"
              )}
              onClick={handleFavoriteClick}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavoriteProduct(product.id);
              }}
            >
              <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
            </button>
            
            {/* Gradient overlay for text */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            
            {/* Content overlay */}
            <div className="absolute inset-x-0 bottom-0 p-3 text-white">
              <p className="text-[10px] text-white/70 truncate">
                {product.establishment?.name || 'Estabelecimento'}
              </p>
              <h3 className="font-bold text-sm truncate leading-tight drop-shadow-sm">
                {product.name}
              </h3>
              <div className="mt-1 flex items-center justify-between">
                <PriceWithDiscount
                  price={product.price}
                  promotionalPrice={product.promotional_price}
                  size="xs"
                  className="text-white"
                />
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  // Default/compact variants
  return (
    <Link 
      to={`/produto/${product.id}`}
      className={cn("block", className)}
    >
      <Card className={cn(
        "overflow-hidden hover:shadow-lg transition-all relative rounded-2xl border-0 shadow-soft card-hover",
        variant === "compact" ? "w-36 md:w-44" : "w-40 md:w-52"
      )}>
        <div className={cn(
          "relative overflow-hidden bg-muted",
          variant === "compact" ? "h-28" : "h-32 md:h-36"
        )}>
          {/* Skeleton while loading */}
          {!imageLoaded && !imageError && product.image_url && (
            <div className="absolute inset-0 skeleton-shimmer" />
          )}
          
          {product.image_url && !imageError ? (
            <img
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className={cn(
                "w-full h-full object-cover transition-all duration-500",
                imageLoaded ? "opacity-100 hover:scale-105" : "opacity-0"
              )}
              draggable={false}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <span className="text-3xl md:text-4xl opacity-30">🍽️</span>
            </div>
          )}
          
          {/* Not available overlay */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <Clock className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground mb-1" />
              <span className="text-xs md:text-sm font-medium text-muted-foreground">Indisponível</span>
            </div>
          )}
          
          {/* Discount badge */}
          {discount && isAvailable && (
            <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground font-bold px-2 py-0.5 text-xs shadow-lg rounded-full">
              {discount}% OFF
            </Badge>
          )}
          
          {/* Favorite button */}
          <button 
            type="button"
            className={cn(
              "absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-card/80 backdrop-blur-sm hover:bg-card rounded-full shadow-md transition-colors z-10",
              isFavorite ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-destructive"
            )}
            onClick={handleFavoriteClick}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavoriteProduct(product.id);
            }}
          >
            <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
          </button>
          
          {/* Add button */}
          {isAvailable && (
            <button 
              type="button"
              className="absolute bottom-2 right-2 w-9 h-9 flex items-center justify-center rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors z-10"
              onClick={handleAddToCart}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddToCart(e as any);
              }}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground truncate mb-0.5">
            {product.establishment?.name || 'Estabelecimento'}
          </p>
          <h3 className="font-semibold text-sm truncate leading-tight">
            {product.name}
          </h3>
          
          <div className="mt-1.5">
            <PriceWithDiscount
              price={product.price}
              promotionalPrice={product.promotional_price}
              size="xs"
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProductOfferCard;
