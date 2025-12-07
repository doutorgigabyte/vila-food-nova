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

  return (
    <Link 
      to={`/produto/${product.id}`}
      className={cn("block snap-center", className)}
    >
      <Card className={cn(
        "overflow-hidden hover:shadow-lg transition-all relative rounded-3xl border-0 shadow-md",
        variant === "large" ? "w-56 md:w-64" : variant === "compact" ? "w-40 md:w-44" : "w-44 md:w-52"
      )}>
        <div className={cn(
          "relative overflow-hidden bg-muted",
          variant === "large" ? "h-44 md:h-52" : variant === "compact" ? "h-32" : "h-36"
        )}>
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
              draggable={false}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <span className="text-4xl opacity-30">🍽️</span>
            </div>
          )}
          
          {/* Not available overlay */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <Clock className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm font-medium text-muted-foreground">Indisponível</span>
              <span className="text-xs text-muted-foreground">Abre às 18:00</span>
            </div>
          )}
          
          {/* Discount badge */}
          {discount && isAvailable && (
            <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground font-bold px-2.5 py-1 text-sm shadow-lg rounded-full">
              {discount}% OFF
            </Badge>
          )}
          
          {/* Favorite button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "absolute top-3 right-3 w-9 h-9 bg-card/80 backdrop-blur-sm hover:bg-card transition-all rounded-full shadow-md active:scale-95",
              isFavorite ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-destructive"
            )}
            onClick={handleFavoriteClick}
          >
            <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
          </Button>
          
          {/* Add button */}
          {isAvailable && (
            <Button 
              size="icon" 
              className="absolute bottom-3 right-3 w-10 h-10 rounded-full shadow-lg bg-primary hover:bg-primary/90 active:scale-95 transition-transform"
              onClick={handleAddToCart}
            >
              <Plus className="w-5 h-5" />
            </Button>
          )}
        </div>
        
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground truncate mb-1">
            {product.establishment?.name || 'Estabelecimento'}
          </p>
          <h3 className="font-semibold text-sm truncate">
            {product.name}
          </h3>
          
          <div className="mt-2">
            <PriceWithDiscount
              price={product.price}
              promotionalPrice={product.promotional_price}
              size={variant === "large" ? "base" : "sm"}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProductOfferCard;
