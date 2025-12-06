import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const JustForYouCarousel = () => {
  const { products, loading } = useProducts(10);
  const [currentIndex, setCurrentIndex] = useState(1);

  // Filter products with images
  const carouselItems = products
    .filter((p) => p.image_url)
    .slice(0, 5);

  useEffect(() => {
    if (carouselItems.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselItems.length]);

  const goToPrev = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? carouselItems.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
  };

  if (loading || carouselItems.length < 3) {
    return null;
  }

  const getItemIndex = (offset: number) => {
    return (currentIndex + offset + carouselItems.length) % carouselItems.length;
  };

  return (
    <section className="py-8 md:py-12 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-accent/20 rounded-lg hidden md:flex">
            <Sparkles className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
              Só Pra Você
              <Sparkles className="w-4 h-4 text-accent md:hidden" />
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
              Recomendações personalizadas baseadas no seu gosto
            </p>
          </div>
        </div>

        <div className="relative flex items-center justify-center h-64 md:h-80">
          {/* Navigation buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 z-20 shadow-lg bg-card hidden md:flex"
            onClick={goToPrev}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          {/* Carousel items */}
          <div className="relative flex items-center justify-center w-full h-full">
            {[-1, 0, 1].map((offset) => {
              const itemIndex = getItemIndex(offset);
              const item = carouselItems[itemIndex];
              const isCenter = offset === 0;

              return (
                <Link
                  key={`${item.id}-${offset}`}
                  to={`/loja/${item.establishment?.slug || ''}`}
                  className={cn(
                    "absolute transition-all duration-500 ease-out rounded-2xl overflow-hidden shadow-lg",
                    isCenter 
                      ? "z-10 scale-100 opacity-100 w-64 md:w-80 h-48 md:h-64" 
                      : "z-0 scale-75 opacity-60 w-48 md:w-64 h-36 md:h-48",
                    offset === -1 && "-translate-x-[60%] md:-translate-x-[70%]",
                    offset === 1 && "translate-x-[60%] md:translate-x-[70%]"
                  )}
                  onClick={(e) => !isCenter && e.preventDefault()}
                >
                  <div className="relative w-full h-full">
                    <img
                      src={item.image_url || ''}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    
                    {isCenter && (
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-xs text-white/80 mb-1">
                          {item.establishment?.name}
                        </p>
                        <h3 className="font-bold text-white text-lg truncate">
                          {item.name}
                        </h3>
                        <p className="text-accent font-bold">
                          R$ {(item.promotional_price || item.price).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 z-20 shadow-lg bg-card hidden md:flex"
            onClick={goToNext}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Dots indicator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {carouselItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex 
                  ? "bg-primary w-6" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default JustForYouCarousel;
