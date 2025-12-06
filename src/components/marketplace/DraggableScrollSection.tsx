import { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDragScroll } from "@/hooks/useDragScroll";

interface DraggableScrollSectionProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  showViewAll?: boolean;
  viewAllLink?: string;
  viewAllText?: string;
  onViewAllClick?: () => void;
}

const DraggableScrollSection = ({
  title,
  subtitle,
  icon,
  children,
  className,
  showViewAll = false,
  viewAllLink,
  viewAllText = "Ver todos",
  onViewAllClick,
}: DraggableScrollSectionProps) => {
  const { scrollRef, isDragging, handlers, scroll } = useDragScroll();

  return (
    <section className={cn("py-6 md:py-8", className)}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2 bg-primary/10 rounded-lg hidden md:flex">
                {icon}
              </div>
            )}
            <div>
              <h2 className="text-lg md:text-xl font-bold">{title}</h2>
              {subtitle && (
                <p className="text-xs md:text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          
          {showViewAll && (
            viewAllLink ? (
              <a 
                href={viewAllLink}
                className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
              >
                {viewAllText} <ChevronRight className="w-4 h-4" />
              </a>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary gap-1"
                onClick={onViewAllClick}
              >
                {viewAllText}
                <ChevronRight className="w-4 h-4" />
              </Button>
            )
          )}
        </div>

        {/* Content with drag scroll */}
        <div className="relative group">
          {/* Left scroll button - hidden on mobile */}
          <Button
            variant="outline"
            size="icon"
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 shadow-md opacity-0 group-hover:opacity-100 transition-opacity bg-card hidden md:flex"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          {/* Scrollable container with drag */}
          <div
            ref={scrollRef}
            {...handlers}
            className={cn(
              "flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2 select-none",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {children}
          </div>

          {/* Right scroll button - hidden on mobile */}
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

export default DraggableScrollSection;
