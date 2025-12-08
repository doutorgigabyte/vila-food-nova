import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProductsByMainCategory } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { getCategoryTheme } from "@/lib/categoryThemes";
// import { motion, AnimatePresence } from "framer-motion"; // Temporarily disabled - needs npm install

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

  // Check if mobile for simplified carousel and track viewport width
  const [isMobile, setIsMobile] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(1200);
  
  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setViewportWidth(width);
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Calculate spread factor based on viewport width (desktop only)
  // Much wider spread to fill horizontal space
  const getSpreadFactor = () => {
    if (isMobile) return 1;
    if (viewportWidth >= 1920) return 2.2;
    if (viewportWidth >= 1600) return 2.0;
    if (viewportWidth >= 1440) return 1.8;
    if (viewportWidth >= 1280) return 1.6;
    if (viewportWidth >= 1024) return 1.4;
    return 1.2;
  };

  // Get visible items - reduced on mobile for performance (3 items vs 5)
  const getVisibleItems = () => {
    const items = [];
    const range = isMobile ? 1 : 2; // Mobile: 3 items, Desktop: 5 items
    for (let offset = -range; offset <= range; offset++) {
      const index = (currentIndex + offset + carouselItems.length) % carouselItems.length;
      items.push({ ...carouselItems[index], offset, index });
    }
    return items;
  };

  const visibleItems = getVisibleItems();

  return (
    <section className={cn(
      "py-4 md:py-6",
      mainCategory && `bg-gradient-to-b ${theme.bgGradient}`
    )}>
      <div className="container mx-auto px-4 overflow-visible">
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
        <div 
          className="relative flex items-center justify-center h-64 md:h-[450px]" 
          style={{ 
            perspective: "1500px",
            willChange: "transform",
            transform: "translateZ(0)", // Force GPU acceleration
          }}
        >
          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 md:left-8 z-40 shadow-lg bg-card/90 backdrop-blur-sm hover:scale-110 transition-all border-0"
            onClick={handlePrev}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          {/* Carousel Stage */}
          <div className="relative w-full h-full flex items-center justify-center overflow-visible">
          {/* <AnimatePresence mode="popLayout" initial={false}> */}
              {visibleItems.map((item) => {
                const isCenter = item.offset === 0;
                const isLeft = item.offset === -1;
                const isRight = item.offset === 1;
                const isFarLeft = item.offset === -2;
                const isFarRight = item.offset === 2;

                // Calculate position and styling based on offset with dynamic spread
                const spread = getSpreadFactor();
                const getPosition = () => {
                  if (isCenter) return "0%";
                  if (isLeft) return `${-45 * spread}%`;
                  if (isRight) return `${45 * spread}%`;
                  if (isFarLeft) return `${-85 * spread}%`;
                  if (isFarRight) return `${85 * spread}%`;
                  return "0%";
                };

                const getScale = () => {
                  if (isCenter) return 1;
                  if (isLeft || isRight) return 0.8;
                  return 0.6;
                };

                const getOpacity = () => {
                  if (isCenter) return 1;
                  if (isLeft || isRight) return 0.7;
                  return 0.4;
                };

                const getRotation = () => {
                  if (isCenter) return 0;
                  if (isLeft) return 20;
                  if (isRight) return -20;
                  if (isFarLeft) return 35;
                  if (isFarRight) return -35;
                  return 0;
                };

                const getZIndex = () => {
                  if (isCenter) return 30;
                  if (isLeft || isRight) return 20;
                  return 10;
                };

                return (
                  <div
                    key={`${item.id}-${item.index}`}
                    className="absolute rounded-2xl overflow-hidden shadow-2xl cursor-pointer transition-all duration-500 ease-out"
                    style={{
                      width: isMobile 
                        ? (isCenter ? "200px" : "140px") 
                        : (isCenter ? "320px" : isLeft || isRight ? "260px" : "200px"),
                      height: isMobile 
                        ? (isCenter ? "250px" : "200px")
                        : (isCenter ? "380px" : isLeft || isRight ? "320px" : "260px"),
                      transform: `translateX(${getPosition()}) scale(${getScale()}) rotateY(${getRotation()}deg)`,
                      transformStyle: "preserve-3d",
                      zIndex: getZIndex(),
                      willChange: "transform",
                      backfaceVisibility: "hidden",
                      opacity: getOpacity(),
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCenter) {
                        navigate(`/produto/${item.id}`);
                      } else if (isLeft || isFarLeft) {
                        handlePrev();
                      } else {
                        handleNext();
                      }
                    }}
                  >
                    {/* Product Image */}
                    <div className="relative w-full h-full gpu-accelerated">
                      <img
                        src={item.image_url || ''}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        draggable={false}
                        style={{ 
                          objectFit: "cover",
                          height: "100%",
                          width: "100%"
                        }}
                      />
                      
                      {/* Gradient Overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
                      
                      {/* Add to cart button - Only on center item */}
                      {isCenter && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Add to cart functionality
                            navigate(`/produto/${item.id}`);
                          }}
                          className="absolute top-2 right-2 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform z-10"
                        >
                          <span className="text-xl font-bold">+</span>
                        </button>
                      )}
                      
                      {/* Product Info - Only on center item */}
                      {isCenter && (
                        <div 
                          className="absolute bottom-0 left-0 right-0 p-3 md:p-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
                        >
                          <p className="text-xs text-white/80 mb-1 truncate drop-shadow">
                            {item.establishment?.name}
                          </p>
                          <h3 className="font-bold text-white text-sm md:text-lg truncate drop-shadow-lg">
                            {item.name}
                          </h3>
                          <p className={cn("font-bold text-sm md:text-base drop-shadow whitespace-nowrap", theme.accentColor || "text-primary")}>
                            R$&nbsp;{(item.promotional_price || item.price).toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            {/* </AnimatePresence> */}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 md:right-8 z-40 shadow-lg bg-card/90 backdrop-blur-sm hover:scale-110 transition-all border-0"
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
