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

// Cores de fundo para os cards das subcategorias
const subcategoryColors = [
  "bg-rose-100 dark:bg-rose-900/30",
  "bg-amber-100 dark:bg-amber-900/30",
  "bg-lime-100 dark:bg-lime-900/30",
  "bg-cyan-100 dark:bg-cyan-900/30",
  "bg-violet-100 dark:bg-violet-900/30",
  "bg-pink-100 dark:bg-pink-900/30",
  "bg-orange-100 dark:bg-orange-900/30",
  "bg-teal-100 dark:bg-teal-900/30",
  "bg-indigo-100 dark:bg-indigo-900/30",
  "bg-emerald-100 dark:bg-emerald-900/30",
];

const SubcategoriesCarousel = ({ 
  mainCategory, 
  selectedSubcategory, 
  onSubcategoryClick 
}: SubcategoriesCarouselProps) => {
  const { scrollRef, isDragging, handlers, scroll, wasClick } = useDragScroll();
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
          <button
            onClick={handleViewAll}
            className="text-xs md:text-sm text-primary hover:underline touch-feedback"
          >
            Ver todas
          </button>
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
            {/* "Todos" card */}
            <button
              onClick={() => wasClick() && onSubcategoryClick?.(null)}
              style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
              className={cn(
                "flex-shrink-0 flex flex-col items-center justify-center transition-all duration-200 touch-feedback",
                "w-16 h-20 md:w-20 md:h-24 rounded-xl active:scale-95",
                !selectedSubcategory 
                  ? `${mainCategoryConfig?.bgColor || 'bg-primary/10'} ring-2 ring-primary shadow-md`
                  : "bg-muted/60 hover:bg-muted"
              )}
            >
              <div className="text-2xl md:text-3xl mb-1">🏠</div>
              <span className={cn(
                "text-[10px] md:text-xs font-medium text-center leading-tight",
                !selectedSubcategory 
                  ? mainCategoryConfig?.iconColor || "text-primary"
                  : "text-foreground"
              )}>
                Todos
              </span>
            </button>

            {visibleSubcategories.map((subcategory, index) => {
              const isSelected = selectedSubcategory === subcategory.id;
              const bgColor = subcategoryColors[index % subcategoryColors.length];
              
              return (
                <button
                  key={subcategory.id}
                  onClick={() => wasClick() && onSubcategoryClick?.(
                    isSelected ? null : subcategory.id
                  )}
                  style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
                  className={cn(
                    "flex-shrink-0 flex flex-col items-center justify-center transition-all duration-200 touch-feedback",
                    "w-16 h-20 md:w-20 md:h-24 rounded-xl active:scale-95",
                    isSelected 
                      ? `${bgColor} ring-2 ring-primary shadow-md`
                      : `${bgColor} hover:shadow-md`
                  )}
                >
                  <div className="text-2xl md:text-3xl mb-1">{subcategory.icon}</div>
                  <span className={cn(
                    "text-[10px] md:text-xs font-medium text-center leading-tight px-1 line-clamp-2",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {subcategory.name}
                  </span>
                </button>
              );
            })}

            {/* "Ver todas" card at the end */}
            {hasMore && (
              <button
                onClick={handleViewAll}
                className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 md:w-20 md:h-24 rounded-xl bg-muted/80 hover:bg-muted transition-all touch-feedback scroll-card"
              >
                <MoreHorizontal className="w-6 h-6 md:w-7 md:h-7 mb-1 text-muted-foreground" />
                <span className="text-[10px] md:text-xs font-medium text-muted-foreground text-center">
                  Ver todas
                </span>
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
