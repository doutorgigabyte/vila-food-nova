import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlatformBanner {
  id: string;
  title: string;
  subtitle: string;
  cta?: string;
  ctaLink?: string;
  bgGradient: string;
  image?: string;
  badge?: string;
}

const defaultBanners: PlatformBanner[] = [
  {
    id: "1",
    title: "Frete Grátis",
    subtitle: "Em pedidos acima de R$ 50",
    cta: "Peça Agora",
    bgGradient: "from-primary via-primary/90 to-primary/70",
    badge: "NOVO",
    image: "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=300&h=300&fit=crop",
  },
  {
    id: "2",
    title: "Seja um Parceiro",
    subtitle: "Cadastre seu restaurante e venda mais",
    cta: "Cadastrar",
    ctaLink: "/conheca",
    bgGradient: "from-emerald-600 via-emerald-500 to-teal-400",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop",
  },
  {
    id: "3",
    title: "Artesanato Local",
    subtitle: "1 ano grátis para artesãos",
    cta: "Saiba Mais",
    bgGradient: "from-purple-600 via-violet-500 to-fuchsia-400",
    badge: "GRÁTIS",
    image: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=300&h=300&fit=crop",
  },
  {
    id: "4",
    title: "Cashback 5%",
    subtitle: "Em todas as compras no app",
    cta: "Aproveitar",
    bgGradient: "from-amber-500 via-orange-500 to-red-500",
    image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=300&h=300&fit=crop",
  },
];

interface PlatformBannerSliderProps {
  banners?: PlatformBanner[];
}

const PlatformBannerSlider = ({ banners = defaultBanners }: PlatformBannerSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      nextSlide();
    }, 4000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  return (
    <section className="py-3">
      <div className="container mx-auto px-4">
        <div 
          className="relative overflow-hidden rounded-2xl"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Slides Container */}
          <div 
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {banners.map((banner) => (
              <div
                key={banner.id}
                className={cn(
                  "min-w-full h-32 md:h-40 relative overflow-hidden bg-gradient-to-r flex items-center",
                  banner.bgGradient
                )}
              >
                {/* Content */}
                <div className="flex-1 p-4 md:p-6 z-10">
                  {banner.badge && (
                    <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-2">
                      {banner.badge}
                    </span>
                  )}
                  <h3 className="text-lg md:text-2xl font-bold text-white drop-shadow-md">
                    {banner.title}
                  </h3>
                  <p className="text-white/90 text-sm md:text-base mt-1 drop-shadow">
                    {banner.subtitle}
                  </p>
                  {banner.cta && (
                    <button className="mt-3 bg-white text-foreground text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-white/90 transition-colors shadow-lg">
                      {banner.cta}
                    </button>
                  )}
                </div>

                {/* Image */}
                {banner.image && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-28 h-28 md:w-36 md:h-36 mr-4">
                    <div className="relative w-full h-full">
                      <div className="absolute inset-0 bg-white/10 rounded-full blur-xl" />
                      <img
                        src={banner.image}
                        alt={banner.title}
                        className="w-full h-full object-cover rounded-full shadow-2xl ring-4 ring-white/20"
                        draggable={false}
                      />
                    </div>
                  </div>
                )}

                {/* Decorative circles */}
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full" />
                <div className="absolute -left-5 -bottom-5 w-20 h-20 bg-white/5 rounded-full" />
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10 hidden md:flex"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10 hidden md:flex"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === currentIndex
                    ? "w-6 bg-white"
                    : "w-1.5 bg-white/50 hover:bg-white/70"
                )}
              />
            ))}
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20">
            <div 
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / banners.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformBannerSlider;
