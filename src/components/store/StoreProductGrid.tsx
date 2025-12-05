import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Package, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StoreProduct } from "@/hooks/useStoreData";

interface StoreProductGridProps {
  title: string;
  products: StoreProduct[];
  onProductClick: (product: StoreProduct) => void;
  onQuickAdd: (product: StoreProduct) => void;
  viewMode?: "grid" | "scroll";
}

export const StoreProductGrid = ({
  title,
  products,
  onProductClick,
  onQuickAdd,
  viewMode = "scroll",
}: StoreProductGridProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (products.length === 0) return null;

  return (
    <div className="my-6">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-lg font-bold">{title}</h2>
        {viewMode === "scroll" && products.length > 2 && (
          <div className="hidden md:flex gap-1">
            <button
              onClick={() => scroll("left")}
              className="w-8 h-8 bg-muted rounded-full flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-8 h-8 bg-muted rounded-full flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Products */}
      {viewMode === "scroll" ? (
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => onProductClick(product)}
              onQuickAdd={() => onQuickAdd(product)}
              variant="scroll"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => onProductClick(product)}
              onQuickAdd={() => onQuickAdd(product)}
              variant="grid"
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface ProductCardProps {
  product: StoreProduct;
  onClick: () => void;
  onQuickAdd: () => void;
  variant: "scroll" | "grid";
}

const ProductCard = ({ product, onClick, onQuickAdd, variant }: ProductCardProps) => {
  const [imageError, setImageError] = useState(false);
  
  // Safe discount calculation
  const hasPromo = Boolean(
    product.promotional_price && 
    product.promotional_price > 0 && 
    product.promotional_price < product.price
  );
  const displayPrice = hasPromo ? product.promotional_price! : product.price;
  const discount = hasPromo
    ? Math.round(((product.price - product.promotional_price!) / product.price) * 100)
    : 0;

  const showImage = product.image_url && !imageError;

  return (
    <div
      className={`bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group shrink-0 border ${
        variant === "scroll" ? "w-[160px] md:w-[200px]" : ""
      }`}
      style={{ scrollSnapAlign: "start" }}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {showImage ? (
          <img
            src={product.image_url!}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Package className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Discount Badge */}
        {hasPromo && discount > 0 && (
          <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 shadow-lg">
            -{discount}%
          </Badge>
        )}

        {/* Featured Badge */}
        {product.is_featured && !hasPromo && (
          <Badge className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 shadow-lg">
            ⭐ Destaque
          </Badge>
        )}

        {/* Quick Add Button - Visible on mobile, hover on desktop */}
        <Button
          size="icon"
          className="absolute bottom-2 right-2 w-9 h-9 rounded-full shadow-lg md:opacity-0 md:group-hover:opacity-100 transition-all bg-primary hover:bg-primary/90"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd();
          }}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 leading-tight min-h-[2.5rem]">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {product.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="font-bold text-primary text-base">
            R$ {displayPrice.toFixed(2)}
          </span>
          {hasPromo && (
            <span className="text-xs text-muted-foreground line-through">
              R$ {product.price.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};