import { useState, useEffect } from "react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { cn } from "@/lib/utils";

interface Banner {
  id: string;
  image_url: string;
  title?: string;
  link_url?: string;
}

interface StoreBannersProps {
  banners: Banner[];
  primaryColor?: string;
}

export const StoreBanners = ({ banners, primaryColor }: StoreBannersProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const { scrollRef, isDragging, handlers, wasClick } = useDragScroll({
    momentum: true,
    friction: 0.92,
  });

  // Track scroll position
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || banners.length <= 1) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const itemWidth = container.offsetWidth * 0.85 + 12; // width + gap
      const newIndex = Math.round(scrollLeft / itemWidth);
      setActiveIndex(Math.min(newIndex, banners.length - 1));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [banners.length, scrollRef]);

  // Auto-scroll
  useEffect(() => {
    if (banners.length <= 1) return;
    const container = scrollRef.current;
    if (!container) return;

    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % banners.length;
      const itemWidth = container.offsetWidth * 0.85 + 12;
      container.scrollTo({
        left: nextIndex * itemWidth,
        behavior: 'smooth',
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length, activeIndex, scrollRef]);

  const scrollToIndex = (index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const itemWidth = container.offsetWidth * 0.85 + 12;
    container.scrollTo({
      left: index * itemWidth,
      behavior: 'smooth',
    });
  };

  if (banners.length === 0) {
    // Show promotional placeholder
    return (
      <div className="mx-4 my-4">
        <div 
          className="relative h-36 md:h-48 rounded-3xl overflow-hidden shadow-lg"
          style={{ 
            background: primaryColor 
              ? `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`
              : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%)'
          }}
        >
          <div className="absolute inset-0 flex items-center justify-between p-6">
            <div className="text-white">
              <p className="text-xs uppercase tracking-wide opacity-80">Promoção Especial</p>
              <h3 className="text-2xl md:text-3xl font-bold mt-1">
                Confira nossas<br />ofertas!
              </h3>
              <p className="text-sm mt-2 opacity-90">
                Produtos selecionados com desconto
              </p>
            </div>
            <div className="text-white text-right">
              <span className="text-5xl md:text-6xl font-black">%</span>
              <p className="text-sm">OFF</p>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -top-5 -left-5 w-24 h-24 rounded-full bg-white/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 relative">
      {/* Native iOS-style scroll container with drag support */}
      <div
        ref={scrollRef}
        {...handlers}
        className={cn(
          "flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 select-none",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={cn(
              "relative flex-shrink-0 w-[85vw] max-w-lg h-36 md:h-48",
              "snap-center rounded-3xl overflow-hidden shadow-lg",
              "transition-all duration-300 ease-out",
              activeIndex === index ? 'scale-100 opacity-100' : 'scale-[0.95] opacity-70'
            )}
          >
            {banner.link_url ? (
              <a 
                href={banner.link_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block w-full h-full"
                onClick={(e) => !wasClick() && e.preventDefault()}
              >
                <img
                  src={banner.image_url}
                  alt={banner.title || "Banner"}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  draggable={false}
                />
              </a>
            ) : (
              <img
                src={banner.image_url}
                alt={banner.title || "Banner"}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                draggable={false}
              />
            )}
            
            {/* Title overlay */}
            {banner.title && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-semibold text-lg">{banner.title}</h3>
                </div>
              </>
            )}
          </div>
        ))}
        {/* End padding for last item */}
        <div className="flex-shrink-0 w-4" />
      </div>
      
      {/* iOS-style dot indicators */}
      {banners.length > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300 ease-out",
                activeIndex === index 
                  ? 'w-6 bg-primary' 
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
