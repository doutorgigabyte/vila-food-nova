import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const JustForYouCarousel = () => {
  const { products, loading } = useProducts(10);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Filter products with images
  const carouselItems = products
    .filter((p) => p.image_url)
    .slice(0, 5);

  useEffect(() => {
    if (carouselItems.length <= 1) return;

    const interval = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselItems.length, currentIndex]);

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => 
      prev === 0 ? carouselItems.length - 1 : prev - 1
    );
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
    setTimeout(() => setIsAnimating(false), 600);
  };

  if (loading || carouselItems.length < 3) {
    return null;
  }

  const getItemIndex = (offset: number) => {
    return (currentIndex + offset + carouselItems.length) % carouselItems.length;
  };

  // Calculate 3D transform values based on position
  const getTransformStyle = (offset: number) => {
    const isCenter = offset === 0;
    const isLeft = offset === -1;
    const isRight = offset === 1;
    
    if (isCenter) {
      return {
        transform: 'translateX(0) translateZ(0) rotateY(0deg) scale(1)',
        zIndex: 10,
        opacity: 1,
      };
    }
    
    if (isLeft) {
      return {
        transform: 'translateX(-70%) translateZ(-150px) rotateY(25deg) scale(0.8)',
        zIndex: 5,
        opacity: 0.7,
      };
    }
    
    if (isRight) {
      return {
        transform: 'translateX(70%) translateZ(-150px) rotateY(-25deg) scale(0.8)',
        zIndex: 5,
        opacity: 0.7,
      };
    }
    
    return {};
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

        {/* 3D Carousel Container */}
        <div 
          className="relative flex items-center justify-center h-64 md:h-80"
          style={{ perspective: '1000px' }}
        >
          {/* Navigation buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 z-20 shadow-lg bg-card hidden md:flex hover:scale-110 transition-transform"
            onClick={handlePrev}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          {/* 3D Carousel Stage */}
          <div 
            className="relative flex items-center justify-center w-full h-full"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {[-1, 0, 1].map((offset) => {
              const itemIndex = getItemIndex(offset);
              const item = carouselItems[itemIndex];
              const isCenter = offset === 0;
              const styles = getTransformStyle(offset);

              return (
                <div
                  key={`${item.id}-${offset}`}
                  className={cn(
                    "absolute transition-all duration-600 ease-out rounded-2xl overflow-hidden shadow-2xl",
                    "w-64 md:w-80 h-48 md:h-64",
                    isCenter && "cursor-pointer"
                  )}
                  style={{
                    ...styles,
                    transitionDuration: '600ms',
                    transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                    backfaceVisibility: 'hidden',
                  }}
                  onClick={() => {
                    if (!isCenter) {
                      if (offset === -1) handlePrev();
                      if (offset === 1) handleNext();
                    }
                  }}
                >
                  <Link
                    to={isCenter ? `/loja/${item.establishment?.slug || ''}` : '#'}
                    className="block w-full h-full"
                    onClick={(e) => !isCenter && e.preventDefault()}
                  >
                    <div className="relative w-full h-full">
                      <img
                        src={item.image_url || ''}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                      {/* Reflection effect */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
                      
                      {isCenter && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 transform transition-transform duration-300">
                          <p className="text-xs text-white/80 mb-1 drop-shadow">
                            {item.establishment?.name}
                          </p>
                          <h3 className="font-bold text-white text-lg truncate drop-shadow-lg">
                            {item.name}
                          </h3>
                          <p className="text-accent font-bold drop-shadow">
                            R$ {(item.promotional_price || item.price).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 z-20 shadow-lg bg-card hidden md:flex hover:scale-110 transition-transform"
            onClick={handleNext}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Touch swipe hint for mobile */}
        <div className="flex items-center justify-center gap-3 mt-2 md:hidden text-muted-foreground">
          <ChevronLeft className="w-4 h-4 animate-pulse" />
          <span className="text-xs">Deslize para navegar</span>
          <ChevronRight className="w-4 h-4 animate-pulse" />
        </div>

        {/* Dots indicator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {carouselItems.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsAnimating(true);
                setCurrentIndex(index);
                setTimeout(() => setIsAnimating(false), 600);
              }}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentIndex 
                  ? "bg-primary w-8" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default JustForYouCarousel;
