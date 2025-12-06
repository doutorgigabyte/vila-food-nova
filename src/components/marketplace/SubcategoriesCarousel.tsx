import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDragScroll } from "@/hooks/useDragScroll";
import { cn } from "@/lib/utils";
import { categoryConfigs } from "@/lib/categoryConfig";
import { useNavigate } from "react-router-dom";
import { mainCategories } from "./MainCategoriesGrid";

interface SubcategoriesCarouselProps {
  mainCategory: string | null;
  selectedSubcategory?: string | null;
  onSubcategoryClick?: (subcategoryId: string | null) => void;
}

const SubcategoriesCarousel = ({ 
  mainCategory, 
  selectedSubcategory, 
  onSubcategoryClick 
}: SubcategoriesCarouselProps) => {
  const { scrollRef, isDragging, handlers, scroll } = useDragScroll();
  const navigate = useNavigate();

  // Get subcategories for the selected main category
  const categoryConfig = mainCategory ? categoryConfigs[mainCategory] : null;
  const subcategories = categoryConfig?.subcategories || [];
  
  // Get main category config for theming
  const mainCategoryConfig = mainCategories.find(c => c.id === mainCategory);

  // Limit to 8 subcategories + "Ver todas" button
  const visibleSubcategories = subcategories.slice(0, 8);
  const hasMore = subcategories.length > 8;

  const handleViewAll = () => {
    if (mainCategory) {
      navigate(`/categoria/${mainCategory}`);
    }
  };

  if (!mainCategory || subcategories.length === 0) {
    return null;
  }

  return (
    <section className={cn(
      "py-3 md:py-4 transition-colors duration-300",
      mainCategoryConfig 
        ? mainCategoryConfig.bgColor.replace('100', '50').replace('900/40', '950/20')
        : "bg-card"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <h3 className={cn(
            "text-sm md:text-base font-semibold",
            mainCategoryConfig ? mainCategoryConfig.iconColor : "text-muted-foreground"
          )}>
            {categoryConfig?.name || "Subcategorias"}
          </h3>
          {hasMore && (
            <button
              onClick={handleViewAll}
              className="text-xs md:text-sm text-primary hover:underline touch-feedback"
            >
              Ver todas
            </button>
          )}
        </div>
        
        <div className="relative group">
          <Button
            variant="outline"
            size="icon"
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 shadow-md opacity-0 group-hover:opacity-100 transition-opacity bg-card hidden md:flex h-8 w-8"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div
            ref={scrollRef}
            {...handlers}
            className={cn(
              "flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide pb-2 select-none",
              "touch-pan-y will-change-scroll overscroll-x-contain",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: isDragging ? 'none' : 'x proximity',
            }}
          >
            {/* "Todos" button */}
            <button
              onClick={() => !isDragging && onSubcategoryClick?.(null)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full transition-all duration-200 touch-feedback scroll-card",
                "text-sm font-medium whitespace-nowrap",
                !selectedSubcategory 
                  ? `${mainCategoryConfig?.bgColor || 'bg-primary/10'} ${mainCategoryConfig?.iconColor || 'text-primary'} shadow-sm`
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              Todos
            </button>

            {visibleSubcategories.map((subcategory) => {
              const isSelected = selectedSubcategory === subcategory.id;
              
              return (
                <button
                  key={subcategory.id}
                  onClick={() => !isDragging && onSubcategoryClick?.(
                    isSelected ? null : subcategory.id
                  )}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-200 touch-feedback scroll-card",
                    "text-sm font-medium whitespace-nowrap active:scale-95",
                    isSelected 
                      ? `${mainCategoryConfig?.bgColor || 'bg-primary/10'} ${mainCategoryConfig?.iconColor || 'text-primary'} shadow-sm`
                      : "bg-muted/60 text-foreground hover:bg-muted"
                  )}
                >
                  <span className="text-base">{subcategory.icon}</span>
                  <span>{subcategory.name}</span>
                </button>
              );
            })}

            {/* "Ver todas" button at the end */}
            {hasMore && (
              <button
                onClick={handleViewAll}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-muted/80 text-muted-foreground hover:bg-muted transition-all touch-feedback scroll-card"
              >
                <MoreHorizontal className="w-4 h-4" />
                <span className="text-sm font-medium">Ver todas</span>
              </button>
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 shadow-md opacity-0 group-hover:opacity-100 transition-opacity bg-card hidden md:flex h-8 w-8"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default SubcategoriesCarousel;
