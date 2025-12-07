import { useMemo } from "react";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { useProductsByMainCategory } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { getCategoryTheme } from "@/lib/categoryThemes";
import { ThreeDPhotoCarousel, CarouselCard } from "@/components/ui/3d-carousel";

interface JustForYouCarouselProps {
  mainCategory?: string | null;
}

const JustForYouCarousel = ({ mainCategory }: JustForYouCarouselProps) => {
  const { products, loading } = useProductsByMainCategory(mainCategory || null, 10);
  const theme = getCategoryTheme(mainCategory || null);
  const navigate = useNavigate();

  // Convert products to carousel cards
  const carouselCards: CarouselCard[] = useMemo(() => {
    return products
      .filter((p) => p.image_url)
      .slice(0, 8)
      .map((product) => ({
        id: product.id,
        imageUrl: product.image_url || "",
        title: product.name,
        subtitle: product.establishment?.name || "",
        price: product.promotional_price || product.price,
        link: `/loja/${product.establishment?.slug || ""}`,
      }));
  }, [products]);

  const handleCardClick = (card: CarouselCard) => {
    if (card.link) {
      navigate(card.link);
    }
  };

  const renderProductCard = (card: CarouselCard) => (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg group">
      <img
        src={card.imageUrl}
        alt={card.title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        draggable={false}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      {/* Product info */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-xs text-white/80 mb-1 truncate drop-shadow">
          {card.subtitle}
        </p>
        <h3 className="font-bold text-white text-sm md:text-base truncate drop-shadow-lg">
          {card.title}
        </h3>
        {card.price && (
          <p className={cn("font-bold text-sm md:text-base drop-shadow", theme.accentColor || "text-primary")}>
            R$ {card.price.toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );

  if (loading || carouselCards.length < 3) {
    return null;
  }

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
        <ThreeDPhotoCarousel 
          cards={carouselCards}
          onCardClick={handleCardClick}
          renderCard={renderProductCard}
          height="320px"
        />

        {/* Touch swipe hint for mobile */}
        <div className="flex items-center justify-center gap-3 mt-4 md:hidden text-muted-foreground">
          <ChevronLeft className="w-4 h-4 animate-pulse" />
          <span className="text-xs">Deslize para navegar</span>
          <ChevronRight className="w-4 h-4 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default JustForYouCarousel;
