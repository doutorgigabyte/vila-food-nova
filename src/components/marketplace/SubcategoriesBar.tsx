import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDragScroll } from "@/hooks/useDragScroll";
import { cn } from "@/lib/utils";
import { useSegments } from "@/hooks/useSegments";
import { segmentToCategoryMap } from "./MainCategoriesGrid";

interface SubcategoriesBarProps {
  mainCategory: string;
  selectedSubcategory: string | null;
  onSubcategorySelect: (subcategoryId: string | null) => void;
}

const SubcategoriesBar = ({ 
  mainCategory, 
  selectedSubcategory, 
  onSubcategorySelect 
}: SubcategoriesBarProps) => {
  const { scrollRef, isDragging, handlers, scroll } = useDragScroll();
  const { segments, loading } = useSegments();

  // Filtra segmentos que pertencem à categoria principal
  const filteredSegments = segments.filter(segment => {
    const segmentKey = segment.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return segmentToCategoryMap[segmentKey] === mainCategory;
  });

  if (loading) {
    return (
      <div className="bg-primary/5 py-3">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-20 bg-muted rounded-full animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (filteredSegments.length === 0) {
    return null;
  }

  return (
    <div className="bg-primary/5 py-3 sticky top-0 z-20">
      <div className="container mx-auto px-4">
        <div className="relative group">
          <Button
            variant="ghost"
            size="icon"
            className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-card shadow hidden md:flex"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div
            ref={scrollRef}
            {...handlers}
            className={cn(
              "flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth select-none",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <button
              onClick={() => !isDragging && onSubcategorySelect(null)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                selectedSubcategory === null
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card text-foreground hover:bg-muted border border-border"
              )}
            >
              Todos
            </button>
            
            {filteredSegments.map((segment) => (
              <button
                key={segment.id}
                onClick={() => !isDragging && onSubcategorySelect(segment.id)}
                className={cn(
                  "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  selectedSubcategory === segment.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card text-foreground hover:bg-muted border border-border"
                )}
              >
                {segment.name}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-card shadow hidden md:flex"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubcategoriesBar;
