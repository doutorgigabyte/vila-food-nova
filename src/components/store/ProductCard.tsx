import { useState, memo, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Wrench, Download, Leaf, Clock } from "lucide-react";
import { PriceWithDiscount } from "@/components/ui/price";
import type { StoreProduct } from "@/hooks/useStoreData";

interface ProductCardProps {
  product: StoreProduct;
  onClick: () => void;
}

export const ProductCard = memo(({ product, onClick }: ProductCardProps) => {
  const [imageError, setImageError] = useState(false);
  
  // Memoized discount calculation
  const { hasPromo, displayPrice, discount } = useMemo(() => {
    const promo = Boolean(
      product.promotional_price && 
      product.promotional_price > 0 && 
      product.promotional_price < product.price
    );
    return {
      hasPromo: promo,
      displayPrice: promo ? product.promotional_price! : product.price,
      discount: promo 
        ? Math.round(((product.price - product.promotional_price!) / product.price) * 100) 
        : 0
    };
  }, [product.price, product.promotional_price]);

  const showImage = product.image_url && !imageError;

  // Memoized category badge
  const categoryBadge = useMemo(() => {
    const productCategory = (product as any).product_category;
    const productType = (product as any).product_type;
    
    if (productCategory === 'service' || productType === 'service') {
      return (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0 gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          <Wrench className="w-2.5 h-2.5" />
          Serviço
        </Badge>
      );
    }
    if (productCategory === 'digital' || productType === 'digital') {
      return (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0 gap-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
          <Download className="w-2.5 h-2.5" />
          Digital
        </Badge>
      );
    }
    if (productCategory === 'perishable' || productType === 'perishable') {
      return (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0 gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <Leaf className="w-2.5 h-2.5" />
          Perecível
        </Badge>
      );
    }
    return null;
  }, [product]);

  const serviceDuration = (product as any).service_duration;

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden group"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex gap-3 p-3">
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex items-start gap-2 flex-wrap">
                <h3 className="font-semibold text-sm leading-tight">{product.name}</h3>
                {hasPromo && discount > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shrink-0">
                    -{discount}%
                  </Badge>
                )}
                {product.is_featured && !hasPromo && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-amber-500 shrink-0">
                    Destaque
                  </Badge>
                )}
                {categoryBadge}
              </div>
              {product.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {product.description}
                </p>
              )}
              {serviceDuration && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{serviceDuration} min</span>
                </div>
              )}
            </div>
            <div className="mt-2">
              <PriceWithDiscount
                price={product.price}
                promotionalPrice={product.promotional_price}
                size="sm"
                className="text-primary"
              />
            </div>
          </div>
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
            {showImage ? (
              <img
                src={product.image_url!}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <Package className="w-8 h-8 text-muted-foreground/50" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ProductCard.displayName = "ProductCard";
