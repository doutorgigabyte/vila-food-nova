import { ReactNode, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDragScroll } from "@/hooks/useDragScroll";

interface HorizontalScrollSectionProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  showViewAll?: boolean;
  viewAllLink?: string;
  viewAllText?: string;
  showIndicators?: boolean;
}

const HorizontalScrollSection = ({
  title,
  subtitle,
  icon,
  children,
  className,
  showViewAll = false,
  viewAllLink,
  viewAllText = "Ver todos",
  showIndicators = false,
}: HorizontalScrollSectionProps) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Use drag scroll hook for mouse + touch drag support
  const { scrollRef, isDragging, handlers, scroll } = useDragScroll({
    momentum: true,
    friction: 0.92,
  });

  // Update scroll button visibility
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const checkScroll = () => {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    };

    checkScroll();
    container.addEventListener('scroll', checkScroll, { passive: true });
    return () => container.removeEventListener('scroll', checkScroll);
  }, [children, scrollRef]);

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
          
          {showViewAll && viewAllLink && (
            <a 
              href={viewAllLink}
              className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
            >
              {viewAllText} <ChevronRight className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Content with iOS-style horizontal scroll and drag support */}
        <div className="relative group">
          {/* Left scroll button - hidden on mobile */}
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "absolute -left-4 top-1/2 -translate-y-1/2 z-10 shadow-md transition-opacity bg-card hidden md:flex",
              canScrollLeft ? "opacity-0 group-hover:opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={() => scroll("left", 320)}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          {/* iOS-style scrollable container with drag support */}
          <div
            ref={scrollRef}
            {...handlers}
            className={cn(
              "flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory pb-2 select-none",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {children}
          </div>

          {/* Right scroll button - hidden on mobile */}
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "absolute -right-4 top-1/2 -translate-y-1/2 z-10 shadow-md transition-opacity bg-card hidden md:flex",
              canScrollRight ? "opacity-0 group-hover:opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={() => scroll("right", 320)}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HorizontalScrollSection;
