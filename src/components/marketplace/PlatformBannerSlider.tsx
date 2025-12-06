import { useState, useEffect, useRef } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Track scroll position for iOS-style snap
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
    }, 4000);

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
    <section className="py-3">
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
              "relative flex-shrink-0 w-[85vw] max-w-md h-32 md:h-40 snap-center rounded-3xl overflow-hidden bg-gradient-to-r transition-all duration-300 ease-out",
              banner.bgGradient,
              activeIndex === index ? 'scale-100 opacity-100' : 'scale-[0.95] opacity-70'
            )}
          >
            {/* Content */}
            <div className="absolute inset-0 flex items-center p-4 md:p-6 z-10">
              <div className="flex-1">
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
                  <button className="mt-3 bg-white text-foreground text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-white/90 transition-colors shadow-lg active:scale-95">
                    {banner.cta}
                  </button>
                )}
              </div>
            </div>

            {/* Image */}
            {banner.image && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32">
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
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
            <div className="absolute -left-5 -bottom-5 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />
          </div>
        ))}
        {/* End padding */}
        <div className="flex-shrink-0 w-4" />
      </div>

      {/* iOS-style dot indicators with progress */}
      <div className="flex justify-center items-center gap-2 mt-3">
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

export default PlatformBannerSlider;
