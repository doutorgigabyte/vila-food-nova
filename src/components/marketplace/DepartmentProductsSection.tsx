import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Layers, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductsByMainCategory } from "@/hooks/useProductsByCategory";
import ProductOfferCard from "./ProductOfferCard";
import { getCategoryTheme } from "@/lib/categoryThemes";
import { Link } from "react-router-dom";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useMainCategories } from "@/hooks/useMainCategories";

interface DepartmentProductsSectionProps {
  mainCategory?: string | null;
}

// Departamento individual com produtos
const DepartmentRow = ({ 
  department, 
  mainCategory 
}: { 
  department: { slug: string; name: string; icon?: string };
  mainCategory?: string | null;
}) => {
  const { products, loading } = useProductsByMainCategory(department.slug, 12);
  const theme = getCategoryTheme(department.slug);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { scrollRef, isDragging, handlers, scroll } = useDragScroll({
    momentum: true,
    friction: 0.92,
  });

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, [products.length, scrollRef]);

  if (loading) {
    return (
      <div className="py-4">
        <Skeleton className="h-6 w-48 mb-3" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="flex-shrink-0 w-44 h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            theme.iconBg || "bg-primary/10"
          )}>
            <Package className={cn("w-4 h-4", theme.iconColor || "text-primary")} />
          </div>
          <h3 className="font-bold text-base">{department.name}</h3>
        </div>
        <Link 
          to={`/categoria/${department.slug}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          Ver todos
        </Link>
      </div>

      <div className="relative group">
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "absolute -left-3 top-1/2 -translate-y-1/2 z-10 shadow-md transition-opacity bg-card hidden md:flex w-8 h-8",
            canScrollLeft ? "opacity-0 group-hover:opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => scroll("left", 280)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div
          ref={scrollRef}
          {...handlers}
          className={cn(
            "flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 overscroll-x-contain select-none",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {products.map((product) => (
            <div 
              key={product.id} 
              className="flex-shrink-0 snap-center"
              style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
            >
              <ProductOfferCard product={product} variant="compact" />
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          className={cn(
            "absolute -right-3 top-1/2 -translate-y-1/2 z-10 shadow-md transition-opacity bg-card hidden md:flex w-8 h-8",
            canScrollRight ? "opacity-0 group-hover:opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => scroll("right", 280)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const DepartmentProductsSection = ({ mainCategory }: DepartmentProductsSectionProps) => {
  const { categories, loading } = useMainCategories();

  // Se tem uma categoria principal selecionada, não mostrar por departamento
  if (mainCategory) return null;

  if (loading) {
    return (
      <section className="py-6 md:py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-64 mb-6" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-6">
              <Skeleton className="h-6 w-48 mb-3" />
              <div className="flex gap-3 overflow-hidden">
                {[1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} className="flex-shrink-0 w-44 h-48 rounded-2xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 md:py-8 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-xl hidden md:flex">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
              Explore por Departamento
              <Layers className="w-4 h-4 text-primary md:hidden" />
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
              Produtos organizados por categoria
            </p>
          </div>
        </div>

        {categories.map((cat) => (
          <DepartmentRow 
            key={cat.id} 
            department={{ 
              slug: cat.slug, 
              name: cat.name, 
              icon: cat.icon || undefined 
            }} 
            mainCategory={mainCategory}
          />
        ))}
      </div>
    </section>
  );
};

export default DepartmentProductsSection;
