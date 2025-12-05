import { useRef } from "react";
import { Link } from "react-router-dom";
import { Heart, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/hooks/useProducts";

interface TrendingProductsProps {
  title?: string;
  subtitle?: string;
}

const TrendingProducts = ({ 
  title = "Tendências do Dia",
  subtitle = "Aqui está o que você pode gostar de provar"
}: TrendingProductsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { products, loading } = useProducts(10);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const getDiscount = (price: number, promoPrice: number | null) => {
    if (!promoPrice || promoPrice >= price) return null;
    const discount = Math.round(((price - promoPrice) / price) * 100);
    return `${discount}%`;
  };

  if (loading) {
    return (
      <section className="py-8 bg-card">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="flex-shrink-0 w-48 overflow-hidden">
                <Skeleton className="h-36 w-full" />
                <CardContent className="p-3">
                  <Skeleton className="h-3 w-20 mb-2" />
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-8 bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-primary">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <div className="relative group">
          <Button
            variant="outline"
            size="icon"
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 shadow-md opacity-0 group-hover:opacity-100 transition-opacity bg-card"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product) => {
              const discount = getDiscount(product.price, product.promotional_price);
              const currentPrice = product.promotional_price || product.price;
              
              return (
                <Link 
                  key={product.id} 
                  to={`/loja/${product.establishment?.slug || ''}`}
                  className="flex-shrink-0"
                >
                  <Card className="w-48 overflow-hidden group/card hover:shadow-lg transition-all">
                    <div className="relative h-36 overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-4xl opacity-30">🍽️</span>
                        </div>
                      )}
                      
                      {discount && (
                        <Badge className="absolute top-2 left-2 bg-destructive text-xs">
                          {discount} OFF
                        </Badge>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 w-7 h-7 bg-card/80 backdrop-blur-sm hover:bg-card text-muted-foreground hover:text-destructive"
                        onClick={(e) => e.preventDefault()}
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                      
                      <Button 
                        size="icon" 
                        className="absolute bottom-2 right-2 w-7 h-7 rounded-full shadow-md"
                        onClick={(e) => e.preventDefault()}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground truncate">
                        {product.establishment?.name || 'Estabelecimento'}
                      </p>
                      <h3 className="font-medium text-sm truncate">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {product.promotional_price && product.promotional_price < product.price && (
                          <span className="text-xs text-muted-foreground line-through">
                            R$ {product.price.toFixed(2)}
                          </span>
                        )}
                        <span className="font-bold text-sm">
                          R$ {currentPrice.toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 shadow-md opacity-0 group-hover:opacity-100 transition-opacity bg-card"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TrendingProducts;
