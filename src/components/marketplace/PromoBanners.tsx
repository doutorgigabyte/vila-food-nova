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

// Category-specific banners
const bannersByCategory: Record<string, Banner[]> = {
  comida: [
    {
      id: "1",
      title: "Saboreie Cada Mordida",
      subtitle: "Experimente o Puro Prazer",
      discount: "10%",
      bgColor: "from-amber-500 to-orange-400",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400"
    },
    {
      id: "2",
      title: "Mordidas Suculentas",
      subtitle: "Explosão de Sabor, Pura Felicidade!",
      bgColor: "from-red-500 to-rose-400",
      image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400"
    },
    {
      id: "3",
      title: "Fatia Deliciosa",
      subtitle: "Perfeita para Indulgência",
      discount: "15%",
      bgColor: "from-orange-500 to-yellow-400",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400"
    },
  ],
  farmacia: [
    {
      id: "1",
      title: "Cuide da Sua Saúde",
      subtitle: "Medicamentos com Preços Especiais",
      discount: "20%",
      bgColor: "from-red-500 to-rose-400",
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400"
    },
    {
      id: "2",
      title: "Vitaminas e Suplementos",
      subtitle: "Fortaleça sua Imunidade",
      bgColor: "from-green-500 to-emerald-400",
      image: "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400"
    },
    {
      id: "3",
      title: "Cuidados Pessoais",
      subtitle: "Higiene e Beleza com Desconto",
      discount: "15%",
      bgColor: "from-pink-500 to-purple-400",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400"
    },
  ],
  mercado: [
    {
      id: "1",
      title: "Feira em Casa",
      subtitle: "Frutas e Verduras Fresquinhas",
      discount: "25%",
      bgColor: "from-emerald-500 to-green-400",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400"
    },
    {
      id: "2",
      title: "Despensa Completa",
      subtitle: "Tudo que você precisa",
      bgColor: "from-blue-500 to-cyan-400",
      image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400"
    },
    {
      id: "3",
      title: "Ofertas da Semana",
      subtitle: "Economize nas Compras",
      discount: "30%",
      bgColor: "from-yellow-500 to-amber-400",
      image: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=400"
    },
  ],
  compras: [
    {
      id: "1",
      title: "Moda & Estilo",
      subtitle: "Renove seu Guarda-Roupa",
      discount: "40%",
      bgColor: "from-pink-500 to-rose-400",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400"
    },
    {
      id: "2",
      title: "Eletrônicos",
      subtitle: "Tecnologia com Preços Incríveis",
      bgColor: "from-blue-500 to-indigo-400",
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400"
    },
    {
      id: "3",
      title: "Casa & Decoração",
      subtitle: "Transforme seu Lar",
      discount: "20%",
      bgColor: "from-amber-500 to-orange-400",
      image: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400"
    },
  ],
  artesanato: [
    {
      id: "1",
      title: "Arte Local",
      subtitle: "Peças Únicas e Exclusivas",
      bgColor: "from-purple-500 to-violet-400",
      image: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400"
    },
    {
      id: "2",
      title: "Feito à Mão",
      subtitle: "Apoie Artesãos Locais",
      discount: "15%",
      bgColor: "from-amber-500 to-yellow-400",
      image: "https://images.unsplash.com/photo-1528396518501-b53b655eb9b3?w=400"
    },
    {
      id: "3",
      title: "Decoração Artesanal",
      subtitle: "Dê Vida ao Seu Ambiente",
      bgColor: "from-teal-500 to-emerald-400",
      image: "https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=400"
    },
  ],
  servicos: [
    {
      id: "1",
      title: "Serviços Profissionais",
      subtitle: "Encontre o Especialista Ideal",
      bgColor: "from-blue-500 to-cyan-400",
      image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400"
    },
    {
      id: "2",
      title: "Manutenção & Reparos",
      subtitle: "Soluções para sua Casa",
      discount: "10%",
      bgColor: "from-orange-500 to-amber-400",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400"
    },
    {
      id: "3",
      title: "Delivery Expresso",
      subtitle: "Entregas Rápidas e Seguras",
      bgColor: "from-green-500 to-emerald-400",
      image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400"
    },
  ],
};

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
  mainCategory?: string | null;
}

const PromoBanners = ({ banners, mainCategory }: PromoBannersProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Get category-specific banners or defaults
  const displayBanners = banners || (mainCategory && bannersByCategory[mainCategory]) || defaultBanners;

  // Track scroll for iOS-style snap
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const itemWidth = container.offsetWidth * 0.85 + 12;
      const newIndex = Math.round(scrollLeft / itemWidth);
      setActiveIndex(Math.min(newIndex, displayBanners.length - 1));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [displayBanners.length]);

  // Reset to first banner when category changes
  useEffect(() => {
    setActiveIndex(0);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [mainCategory]);

  // Auto-scroll
  useEffect(() => {
    if (displayBanners.length <= 1) return;
    const container = scrollRef.current;
    if (!container) return;

    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % displayBanners.length;
      const itemWidth = container.offsetWidth * 0.85 + 12;
      container.scrollTo({
        left: nextIndex * itemWidth,
        behavior: 'smooth',
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [displayBanners.length, activeIndex]);

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
        {displayBanners.map((banner, index) => (
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
        {displayBanners.map((_, index) => (
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