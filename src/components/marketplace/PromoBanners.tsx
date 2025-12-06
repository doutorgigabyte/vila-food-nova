import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDragScroll } from "@/hooks/useDragScroll";

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();
  const { scrollRef, isDragging, handlers } = useDragScroll();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [banners.length]);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <section className="py-4 md:py-6">
      <div className="container mx-auto px-4">
        <div className="relative group">
          {/* Desktop: Show 3 banners side by side */}
          <div className="hidden md:block">
            <div className="flex gap-4 overflow-hidden">
              {banners.map((banner, index) => (
                <div
                  key={banner.id}
                  className="flex-shrink-0 w-[calc(33.333%-1rem)] transition-transform duration-500 ease-out"
                  style={{
                    transform: `translateX(-${currentIndex * 100}%)`,
                  }}
                >
                  <BannerCard banner={banner} />
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: Horizontal scroll with drag */}
          <div 
            ref={scrollRef}
            {...handlers}
            className={cn(
              "flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory md:hidden select-none",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {banners.map((banner) => (
              <div key={banner.id} className="flex-shrink-0 w-[85%] snap-start">
                <BannerCard banner={banner} />
              </div>
            ))}
          </div>

          {/* Desktop Navigation */}
          <Button
            variant="outline"
            size="icon"
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 shadow-md bg-card hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={goToPrev}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 shadow-md bg-card hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={goToNext}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Dots - Desktop */}
        <div className="hidden md:flex justify-center gap-2 mt-4">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                index === currentIndex 
                  ? "w-6 bg-primary" 
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const BannerCard = ({ banner }: { banner: Banner }) => {
  return (
    <div 
      className={cn(
        "relative h-40 md:h-44 rounded-2xl overflow-hidden bg-gradient-to-r p-5 flex items-center group/banner transition-transform hover:scale-[1.02]",
        banner.bgColor
      )}
    >
      <div className="flex-1 text-white z-10">
        <h3 className="text-base md:text-lg font-bold mb-1 drop-shadow">{banner.title}</h3>
        <p className="text-sm opacity-90 mb-3 drop-shadow">{banner.subtitle}</p>
        <Button 
          size="sm" 
          variant="secondary"
          className="bg-card text-foreground hover:bg-card/90 shadow-md"
        >
          Pedir Agora
        </Button>
      </div>
      
      {banner.image && (
        <div className="absolute right-2 bottom-2 md:right-4 md:bottom-4 w-28 h-28 md:w-32 md:h-32">
          <img 
            src={banner.image} 
            alt={banner.title}
            className="w-full h-full object-cover rounded-full shadow-xl ring-4 ring-white/20 group-hover/banner:scale-110 transition-transform duration-300"
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
  );
};

export default PromoBanners;
