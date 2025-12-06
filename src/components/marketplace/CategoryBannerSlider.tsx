import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getCategoryTheme } from "@/lib/categoryThemes";

interface CategoryBanner {
  id: string;
  title: string;
  subtitle: string;
  discount?: string;
  cta: string;
  ctaLink?: string;
  bgImage: string;
  overlayColor: string;
}

// Banners específicos por categoria com imagens reais
const bannersByCategory: Record<string, CategoryBanner[]> = {
  comida: [
    {
      id: "comida-1",
      title: "Aproveite! Itens por R$ 0,99",
      subtitle: "Tempo limitado",
      cta: "Clique aqui para resgatar",
      bgImage: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=400&fit=crop",
      overlayColor: "from-pink-600/90 via-pink-500/80 to-orange-400/70"
    },
    {
      id: "comida-2",
      title: "Seu lanche da tarde",
      subtitle: "Com até 50% OFF",
      discount: "50%",
      cta: "Pedir agora",
      bgImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=400&fit=crop",
      overlayColor: "from-yellow-500/90 via-amber-500/80 to-orange-500/70"
    },
    {
      id: "comida-3",
      title: "Até 40% OFF",
      subtitle: "Em restaurantes selecionados",
      discount: "40%",
      cta: "Ver ofertas",
      bgImage: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=400&fit=crop",
      overlayColor: "from-orange-500/90 via-red-500/80 to-pink-500/70"
    },
  ],
  mercado: [
    {
      id: "mercado-1",
      title: "Feira em Casa",
      subtitle: "Frutas e Verduras fresquinhas",
      discount: "25%",
      cta: "Comprar agora",
      bgImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=400&fit=crop",
      overlayColor: "from-emerald-600/90 via-green-500/80 to-teal-400/70"
    },
    {
      id: "mercado-2",
      title: "Ofertas da Semana",
      subtitle: "Economize nas suas compras",
      discount: "30%",
      cta: "Ver ofertas",
      bgImage: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&h=400&fit=crop",
      overlayColor: "from-blue-500/90 via-cyan-500/80 to-teal-400/70"
    },
    {
      id: "mercado-3",
      title: "Bebidas Geladas",
      subtitle: "Tudo para refrescar o dia",
      cta: "Conferir",
      bgImage: "https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=800&h=400&fit=crop",
      overlayColor: "from-cyan-500/90 via-blue-500/80 to-indigo-500/70"
    },
  ],
  farmacia: [
    {
      id: "farmacia-1",
      title: "Cuide da sua Saúde",
      subtitle: "Medicamentos com desconto",
      discount: "20%",
      cta: "Ver produtos",
      bgImage: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&h=400&fit=crop",
      overlayColor: "from-red-500/90 via-rose-500/80 to-pink-400/70"
    },
    {
      id: "farmacia-2",
      title: "Vitaminas e Suplementos",
      subtitle: "Fortaleça sua imunidade",
      cta: "Comprar",
      bgImage: "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=800&h=400&fit=crop",
      overlayColor: "from-green-500/90 via-emerald-500/80 to-teal-400/70"
    },
    {
      id: "farmacia-3",
      title: "Higiene & Beleza",
      subtitle: "Cuide de você",
      discount: "15%",
      cta: "Ver ofertas",
      bgImage: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=400&fit=crop",
      overlayColor: "from-pink-500/90 via-purple-500/80 to-violet-400/70"
    },
  ],
  compras: [
    {
      id: "compras-1",
      title: "Moda & Estilo",
      subtitle: "Renove seu guarda-roupa",
      discount: "40%",
      cta: "Comprar agora",
      bgImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop",
      overlayColor: "from-pink-500/90 via-rose-500/80 to-red-400/70"
    },
    {
      id: "compras-2",
      title: "Eletrônicos",
      subtitle: "Tecnologia com preços incríveis",
      cta: "Ver produtos",
      bgImage: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=400&fit=crop",
      overlayColor: "from-blue-500/90 via-indigo-500/80 to-purple-400/70"
    },
  ],
  artesanato: [
    {
      id: "artesanato-1",
      title: "Arte Local",
      subtitle: "Peças únicas e exclusivas",
      cta: "Descobrir",
      bgImage: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&h=400&fit=crop",
      overlayColor: "from-purple-500/90 via-violet-500/80 to-fuchsia-400/70"
    },
    {
      id: "artesanato-2",
      title: "Feito à Mão",
      subtitle: "Apoie artesãos locais",
      discount: "15%",
      cta: "Ver produtos",
      bgImage: "https://images.unsplash.com/photo-1528396518501-b53b655eb9b3?w=800&h=400&fit=crop",
      overlayColor: "from-amber-500/90 via-yellow-500/80 to-orange-400/70"
    },
  ],
  servicos: [
    {
      id: "servicos-1",
      title: "Serviços Profissionais",
      subtitle: "Encontre o especialista ideal",
      cta: "Buscar",
      bgImage: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=400&fit=crop",
      overlayColor: "from-blue-500/90 via-cyan-500/80 to-teal-400/70"
    },
    {
      id: "servicos-2",
      title: "Manutenção & Reparos",
      subtitle: "Soluções para sua casa",
      discount: "10%",
      cta: "Ver serviços",
      bgImage: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=400&fit=crop",
      overlayColor: "from-orange-500/90 via-amber-500/80 to-yellow-400/70"
    },
  ],
};

const defaultBanners: CategoryBanner[] = [
  {
    id: "default-1",
    title: "Bem-vindo ao VilaFood",
    subtitle: "Os melhores produtos perto de você",
    cta: "Explorar",
    bgImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop",
    overlayColor: "from-primary/90 via-primary/80 to-accent/70"
  },
  {
    id: "default-2",
    title: "Entrega Rápida",
    subtitle: "Receba em minutos",
    cta: "Pedir agora",
    bgImage: "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800&h=400&fit=crop",
    overlayColor: "from-emerald-500/90 via-green-500/80 to-teal-400/70"
  },
  {
    id: "default-3",
    title: "Ofertas Exclusivas",
    subtitle: "Descontos incríveis todo dia",
    discount: "30%",
    cta: "Ver ofertas",
    bgImage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop",
    overlayColor: "from-orange-500/90 via-red-500/80 to-pink-400/70"
  },
];

interface CategoryBannerSliderProps {
  mainCategory?: string | null;
}

const CategoryBannerSlider = ({ mainCategory }: CategoryBannerSliderProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const banners = (mainCategory && bannersByCategory[mainCategory]) || defaultBanners;

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const itemWidth = container.offsetWidth * 0.9 + 12;
      const newIndex = Math.round(scrollLeft / itemWidth);
      setActiveIndex(Math.min(newIndex, banners.length - 1));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [banners.length]);

  useEffect(() => {
    setActiveIndex(0);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [mainCategory]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const container = scrollRef.current;
    if (!container) return;

    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % banners.length;
      const itemWidth = container.offsetWidth * 0.9 + 12;
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
    const itemWidth = container.offsetWidth * 0.9 + 12;
    container.scrollTo({
      left: index * itemWidth,
      behavior: 'smooth',
    });
  };

  return (
    <section className="py-4 md:py-6">
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
              "relative flex-shrink-0 w-[90vw] max-w-2xl h-44 md:h-52 snap-center rounded-3xl overflow-hidden transition-all duration-300 ease-out",
              activeIndex === index ? 'scale-100 opacity-100' : 'scale-[0.98] opacity-80'
            )}
          >
            {/* Background image */}
            <img
              src={banner.bgImage}
              alt={banner.title}
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
            
            {/* Gradient overlay */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-r",
              banner.overlayColor
            )} />

            {/* Content */}
            <div className="absolute inset-0 flex items-center p-5 md:p-8 z-10">
              <div className="flex-1 max-w-[60%]">
                <h3 className="text-xl md:text-3xl font-bold text-white drop-shadow-lg leading-tight">
                  {banner.title}
                </h3>
                <p className="text-white/90 text-sm md:text-base mt-2 drop-shadow">
                  {banner.subtitle}
                </p>
                <Button 
                  size="sm" 
                  className="mt-4 bg-card text-foreground hover:bg-card/90 shadow-lg active:scale-95 transition-transform font-semibold"
                >
                  {banner.cta} →
                </Button>
              </div>
            </div>
            
            {banner.discount && (
              <div className="absolute top-4 right-4 bg-card text-destructive font-bold text-lg px-4 py-2 rounded-full shadow-xl">
                -{banner.discount} OFF
              </div>
            )}
          </div>
        ))}
        <div className="flex-shrink-0 w-4" />
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToIndex(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-300 ease-out",
              activeIndex === index 
                ? "w-8 bg-primary" 
                : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default CategoryBannerSlider;
