import { Link, useNavigate } from "react-router-dom";
import { Heart, Plus, ChevronLeft, ChevronRight, Clock, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductsByMainCategory } from "@/hooks/useProducts";
import { useEstablishments } from "@/hooks/useEstablishment";
import { useDragScroll } from "@/hooks/useDragScroll";
import { cn } from "@/lib/utils";
import { getCategoryTheme } from "@/lib/categoryThemes";

interface TrendingProductsProps {
  mainCategory?: string | null;
}

const TrendingProducts = ({ mainCategory }: TrendingProductsProps) => {
  const { scrollRef, isDragging, handlers, scroll } = useDragScroll();
  const { products, loading: productsLoading } = useProductsByMainCategory(mainCategory || null, 12);
  const { establishments, loading: establishmentsLoading } = useEstablishments();
  const theme = getCategoryTheme(mainCategory || null);

  const loading = productsLoading || establishmentsLoading;
  const hasProducts = products.length > 0;
  const trending = hasProducts ? [] : establishments.slice(0, 8);

  const getDiscount = (price: number, promoPrice: number | null) => {
    if (!promoPrice || promoPrice >= price) return null;
    const discount = Math.round(((price - promoPrice) / price) * 100);
    return `${discount}%`;
  };

  if (loading) {
    return (
      <section className="py-6 md:py-8 bg-muted/30">
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

  // Se tem produtos, mostrar produtos
  if (hasProducts) {
    return (
      <section className={cn(
        "py-6 md:py-8",
        mainCategory ? `bg-gradient-to-b ${theme.bgGradient}` : "bg-muted/30"
      )}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl hidden md:flex">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                {theme.trendingTitle}
                <Flame className="w-4 h-4 text-orange-500 md:hidden" />
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                {theme.trendingSubtitle}
              </p>
            </div>
          </div>
          <Link 
            to={`/produtos/trending${mainCategory ? `?categoria=${mainCategory}` : ''}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver todos
          </Link>
        </div>

          <div className="relative group">
            <Button
              variant="outline"
              size="icon"
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 shadow-md opacity-0 group-hover:opacity-100 transition-opacity bg-card hidden md:flex"
              onClick={() => scroll("left")}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div
              ref={scrollRef}
              {...handlers}
              className={cn(
                "flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2 select-none",
                isDragging ? "cursor-grabbing" : "cursor-grab"
              )}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {products.map((product) => {
                const discount = getDiscount(product.price, product.promotional_price);
                const currentPrice = product.promotional_price || product.price;
                
                return (
                  <Link
                    key={product.id}
                    to={`/produto/${product.id}`}
                    className="flex-shrink-0 snap-start"
                    onClick={(e) => isDragging && e.preventDefault()}
                  >
                    <Card className="w-48 md:w-52 overflow-hidden group/card hover:shadow-elevated transition-all duration-300 border-0 shadow-soft bg-card">
                      <div className="relative h-40 overflow-hidden bg-muted">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                            draggable={false}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                            <span className="text-4xl opacity-30">{theme.icon}</span>
                          </div>
                        )}
                        
                        {discount && (
                          <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground font-bold text-sm shadow-md">
                            {discount} OFF
                          </Badge>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2 w-8 h-8 bg-card/80 backdrop-blur-sm hover:bg-card text-muted-foreground hover:text-destructive transition-colors"
                          onClick={(e) => e.preventDefault()}
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                        
                        <Button 
                          size="icon" 
                          className="absolute bottom-2 right-2 w-9 h-9 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-transform active:scale-95"
                          onClick={(e) => e.preventDefault()}
                        >
                          <Plus className="w-5 h-5" />
                        </Button>
                      </div>
                      
                      <CardContent className="p-3">
                        <p className="text-xs text-muted-foreground truncate">
                          {product.establishment?.name || 'Estabelecimento'}
                        </p>
                        <h3 className="font-semibold text-sm truncate mt-0.5">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          {product.promotional_price && product.promotional_price < product.price && (
                            <span className="text-xs text-muted-foreground line-through">
                              R$ {product.price.toFixed(2)}
                            </span>
                          )}
                          <span className={cn(
                            "font-bold text-base",
                            discount && "text-destructive"
                          )}>
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
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 shadow-md opacity-0 group-hover:opacity-100 transition-opacity bg-card hidden md:flex"
              onClick={() => scroll("right")}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // Se não tem produtos, mostrar estabelecimentos
  if (trending.length === 0) {
    return null;
  }

  return (
    <section className="py-6 md:py-8 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl hidden md:flex">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                {theme.trendingTitle}
                <Flame className="w-4 h-4 text-orange-500 md:hidden" />
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                {theme.trendingSubtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="relative group">
          <Button
            variant="outline"
            size="icon"
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 shadow-md opacity-0 group-hover:opacity-100 transition-opacity bg-card hidden md:flex"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div
            ref={scrollRef}
            {...handlers}
            className={cn(
              "flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2 select-none",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {trending.map((est) => (
              <Link 
                key={est.id} 
                to={`/loja/${est.slug}`}
                className="flex-shrink-0 snap-start"
                onClick={(e) => isDragging && e.preventDefault()}
              >
                <Card className="w-44 md:w-52 overflow-hidden group/card hover:shadow-elevated transition-all duration-300 border-0 shadow-soft">
                  <div className="relative h-36 md:h-40 overflow-hidden bg-muted">
                    {est.banner_url ? (
                      <img
                        src={est.banner_url}
                        alt={est.name}
                        className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                        draggable={false}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <span className="text-4xl opacity-50">🍽️</span>
                      </div>
                    )}
                    
                    {est.is_open ? (
                      <Badge className="absolute top-2 left-2 bg-green-500 text-xs shadow-md">Aberto</Badge>
                    ) : (
                      <Badge variant="secondary" className="absolute top-2 left-2 text-xs shadow-md">Fechado</Badge>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 w-8 h-8 bg-card/80 backdrop-blur-sm hover:bg-card text-muted-foreground hover:text-destructive transition-colors"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                    
                    <Button 
                      size="icon" 
                      className="absolute bottom-2 right-2 w-9 h-9 rounded-full shadow-lg"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground truncate">
                      {est.neighborhood || 'Estabelecimento'}
                    </p>
                    <h3 className="font-semibold text-sm truncate mt-0.5">
                      {est.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      {est.min_order_value && est.min_order_value > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Mín: R$ {est.min_order_value.toFixed(2)}
                        </span>
                      )}
                      {est.avg_delivery_time && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {est.avg_delivery_time}min
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 shadow-md opacity-0 group-hover:opacity-100 transition-opacity bg-card hidden md:flex"
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
