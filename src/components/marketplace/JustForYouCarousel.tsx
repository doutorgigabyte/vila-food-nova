import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProductsByMainCategory } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { getCategoryTheme } from "@/lib/categoryThemes";
import { motion, AnimatePresence } from "framer-motion";

interface JustForYouCarouselProps {
  mainCategory?: string | null;
}

// Fallback products when no data is available
const fallbackProducts = [
  { id: "f1", name: "Pizza Margherita", image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500", price: 45.90, promotional_price: null, establishment: { name: "Pizzaria Italia", slug: "pizzaria-italia" } },
  { id: "f2", name: "Hambúrguer Artesanal", image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500", price: 32.90, promotional_price: 27.90, establishment: { name: "Burger House", slug: "burger-house" } },
  { id: "f3", name: "Açaí Tradicional", image_url: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=500", price: 22.00, promotional_price: null, establishment: { name: "Açaí Premium", slug: "acai-premium" } },
  { id: "f4", name: "Sushi Combo", image_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500", price: 89.90, promotional_price: 75.90, establishment: { name: "Sushi Bar", slug: "sushi-bar" } },
  { id: "f5", name: "Salada Caesar", image_url: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=500", price: 28.00, promotional_price: null, establishment: { name: "Green Life", slug: "green-life" } },
  { id: "f6", name: "Bolo de Chocolate", image_url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500", price: 35.00, promotional_price: 29.90, establishment: { name: "Doces e Tortas", slug: "doces-e-tortas" } },
  { id: "f7", name: "Sorvete Artesanal", image_url: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=500", price: 15.00, promotional_price: null, establishment: { name: "Gelateria", slug: "gelateria" } },
];

const JustForYouCarousel = ({ mainCategory }: JustForYouCarouselProps) => {
  const { products, loading } = useProductsByMainCategory(mainCategory || null, 10);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const theme = getCategoryTheme(mainCategory || null);
  const navigate = useNavigate();
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Filter products with images and use fallback if needed
  const productItems = products.filter((p) => p.image_url).slice(0, 7);
  const carouselItems = productItems.length >= 3 ? productItems : fallbackProducts;

  // Auto-rotate carousel
  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
    }, 4000);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [carouselItems.length]);

  const handlePrev = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    setDirection(-1);
    setCurrentIndex((prev) => 
      prev === 0 ? carouselItems.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
  };

  // Get visible items (left, center, right)
  const getVisibleItems = () => {
    const items = [];
    for (let offset = -1; offset <= 1; offset++) {
      const index = (currentIndex + offset + carouselItems.length) % carouselItems.length;
      items.push({ ...carouselItems[index], offset, index });
    }
    return items;
  };

  const visibleItems = getVisibleItems();

  return (
    <section className={cn(
      "py-8 md:py-12 overflow-hidden",
      mainCategory && `bg-gradient-to-b ${theme.bgGradient}`
    )}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/20 rounded-lg hidden md:flex">
              <Sparkles className={cn("w-5 h-5", theme.accentColor || "text-accent-foreground")} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                {theme.forYouTitle}
                <Sparkles className={cn("w-4 h-4 md:hidden", theme.accentColor || "text-accent")} />
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                {theme.forYouSubtitle}
              </p>
            </div>
          </div>
          <Link 
            to={`/produtos/recomendados${mainCategory ? `?categoria=${mainCategory}` : ''}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver todos
          </Link>
        </div>

        {/* 3D Carousel */}
        <div className="relative flex items-center justify-center h-72 md:h-96" style={{ perspective: "1200px" }}>
          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 md:left-4 z-30 shadow-lg bg-card/90 backdrop-blur-sm hover:scale-110 transition-all border-0"
            onClick={handlePrev}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          {/* Carousel Stage */}
          <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
            <AnimatePresence mode="popLayout" initial={false}>
              {visibleItems.map((item) => {
                const isCenter = item.offset === 0;
                const isLeft = item.offset === -1;
                const isRight = item.offset === 1;

                return (
                  <motion.div
                    key={`${item.id}-${item.index}`}
                    className={cn(
                      "absolute rounded-2xl overflow-hidden shadow-2xl cursor-pointer",
                      isCenter ? "z-20" : "z-10"
                    )}
                    initial={{
                      x: direction > 0 ? "100%" : "-100%",
                      scale: 0.7,
                      opacity: 0,
                      rotateY: direction > 0 ? -45 : 45,
                    }}
                    animate={{
                      x: isLeft ? "-55%" : isRight ? "55%" : "0%",
                      scale: isCenter ? 1 : 0.75,
                      opacity: isCenter ? 1 : 0.6,
                      rotateY: isLeft ? 25 : isRight ? -25 : 0,
                      z: isCenter ? 100 : -100,
                    }}
                    exit={{
                      x: direction > 0 ? "-100%" : "100%",
                      scale: 0.7,
                      opacity: 0,
                      rotateY: direction > 0 ? 45 : -45,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                    style={{
                      width: isCenter ? "280px" : "220px",
                      height: isCenter ? "340px" : "280px",
                      transformStyle: "preserve-3d",
                    }}
                    onClick={() => {
                      if (isCenter) {
                        navigate(`/loja/${item.establishment?.slug || ''}`);
                      } else if (isLeft) {
                        handlePrev();
                      } else {
                        handleNext();
                      }
                    }}
                    whileHover={isCenter ? { scale: 1.02 } : {}}
                  >
                    {/* Product Image */}
                    <div className="relative w-full h-full">
                      <img
                        src={item.image_url || ''}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                      
                      {/* Gradient Overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
                      
                      {/* Product Info - Only on center item */}
                      {isCenter && (
                        <motion.div 
                          className="absolute bottom-0 left-0 right-0 p-4"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <p className="text-xs text-white/80 mb-1 truncate drop-shadow">
                            {item.establishment?.name}
                          </p>
                          <h3 className="font-bold text-white text-base md:text-lg truncate drop-shadow-lg">
                            {item.name}
                          </h3>
                          <p className={cn("font-bold text-base drop-shadow", theme.accentColor || "text-primary")}>
                            R$ {(item.promotional_price || item.price).toFixed(2)}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 md:right-4 z-30 shadow-lg bg-card/90 backdrop-blur-sm hover:scale-110 transition-all border-0"
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
                setDirection(index > currentIndex ? 1 : -1);
                setCurrentIndex(index);
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
