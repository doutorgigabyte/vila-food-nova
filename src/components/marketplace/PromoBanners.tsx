import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  discount?: string;
  bgColor: string;
  image?: string;
}

const defaultBanners: Banner[] = [
  {
    id: "1",
    title: "Saboreie Cada Mordida",
    subtitle: "Experimente o Puro Prazer",
    discount: "10%",
    bgColor: "from-pink-500 to-rose-400",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400"
  },
  {
    id: "2",
    title: "Mordidas Suculentas",
    subtitle: "Explosão de Sabor, Pura Felicidade!",
    bgColor: "from-purple-500 to-violet-400",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400"
  },
  {
    id: "3",
    title: "Fatia Deliciosa",
    subtitle: "Perfeita para Indulgência",
    discount: "10%",
    bgColor: "from-red-500 to-orange-400",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400"
  },
];

interface PromoBannersProps {
  banners?: Banner[];
}

const PromoBanners = ({ banners = defaultBanners }: PromoBannersProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Track scroll for iOS-style snap
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const itemWidth = container.offsetWidth * 0.85 + 12;
      const newIndex = Math.round(scrollLeft / itemWidth);
      setActiveIndex(Math.min(newIndex, banners.length - 1));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [banners.length]);

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
  }, [banners.length, activeIndex]);

  const scrollToIndex = (index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const itemWidth = container.offsetWidth * 0.85 + 12;
    container.scrollTo({
      left: index * itemWidth,
      behavior: 'smooth',
    });
  };

  return (
    <section className="py-4 md:py-6">
      {/* iOS-style horizontal scroll with snap */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4"
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
              "relative flex-shrink-0 w-[85vw] max-w-md h-40 md:h-44 snap-center rounded-3xl overflow-hidden bg-gradient-to-r p-5 transition-all duration-300 ease-out",
              banner.bgColor,
              activeIndex === index ? 'scale-100 opacity-100' : 'scale-[0.95] opacity-70'
            )}
          >
            <div className="flex-1 text-white z-10 relative">
              <h3 className="text-base md:text-lg font-bold mb-1 drop-shadow">{banner.title}</h3>
              <p className="text-sm opacity-90 mb-3 drop-shadow">{banner.subtitle}</p>
              <Button 
                size="sm" 
                variant="secondary"
                className="bg-card text-foreground hover:bg-card/90 shadow-md active:scale-95 transition-transform"
              >
                Pedir Agora
              </Button>
            </div>
            
            {banner.image && (
              <div className="absolute right-2 bottom-2 md:right-4 md:bottom-4 w-28 h-28 md:w-32 md:h-32">
                <img 
                  src={banner.image} 
                  alt={banner.title}
                  className="w-full h-full object-cover rounded-full shadow-xl ring-4 ring-white/20 transition-transform duration-300"
                  draggable={false}
                />
              </div>
            )}
            
            {banner.discount && (
              <div className="absolute top-3 right-3 bg-card text-primary font-bold text-base px-3 py-1 rounded-full shadow-lg">
                {banner.discount} OFF
              </div>
            )}
          </div>
        ))}
        {/* End padding */}
        <div className="flex-shrink-0 w-4" />
      </div>

      {/* iOS-style dot indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToIndex(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-300 ease-out",
              activeIndex === index 
                ? "w-6 bg-primary" 
                : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default PromoBanners;
