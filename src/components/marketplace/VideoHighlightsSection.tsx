import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, ChevronRight, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDragScroll } from "@/hooks/useDragScroll";
import { cn } from "@/lib/utils";

interface VideoHighlight {
  id: string;
  title: string;
  subtitle: string;
  videoUrl?: string;
  thumbnailUrl: string;
  ctaText?: string;
  ctaLink?: string;
  establishmentName?: string;
  discount?: string;
}

// Category-specific highlights
const highlightsByCategory: Record<string, VideoHighlight[]> = {
  comida: [
    {
      id: "1",
      title: "Delícias Asiáticas para Você",
      subtitle: "Peça R$100+ em culinária asiática e ganhe frete grátis!",
      thumbnailUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800",
      ctaText: "Ver Ofertas",
      establishmentName: "Premium Partner",
      discount: "Frete Grátis"
    },
    {
      id: "2",
      title: "Pizza Artesanal Premiada",
      subtitle: "As melhores pizzas da cidade com 20% OFF",
      thumbnailUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
      ctaText: "Pedir Agora",
      establishmentName: "Parceiro Destaque",
      discount: "20% OFF"
    },
    {
      id: "3",
      title: "Burger Week Especial",
      subtitle: "Hambúrgueres artesanais com desconto exclusivo",
      thumbnailUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
      ctaText: "Aproveitar",
      establishmentName: "Top Partner",
      discount: "25% OFF"
    }
  ],
  farmacia: [
    {
      id: "1",
      title: "Saúde em Primeiro Lugar",
      subtitle: "Medicamentos essenciais com até 30% de desconto",
      thumbnailUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800",
      ctaText: "Ver Ofertas",
      establishmentName: "Farmácia Premium",
      discount: "30% OFF"
    },
    {
      id: "2",
      title: "Vitaminas e Bem-Estar",
      subtitle: "Fortaleça sua imunidade com os melhores suplementos",
      thumbnailUrl: "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=800",
      ctaText: "Comprar Agora",
      establishmentName: "Saúde Partner",
      discount: "20% OFF"
    },
    {
      id: "3",
      title: "Cuidados Pessoais",
      subtitle: "Produtos de higiene e beleza com preços especiais",
      thumbnailUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800",
      ctaText: "Explorar",
      establishmentName: "Beleza Partner",
      discount: "15% OFF"
    }
  ],
  mercado: [
    {
      id: "1",
      title: "Feira Fresca Todo Dia",
      subtitle: "Frutas, verduras e legumes direto do produtor",
      thumbnailUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
      ctaText: "Ver Ofertas",
      establishmentName: "Mercado Premium",
      discount: "25% OFF"
    },
    {
      id: "2",
      title: "Compras da Semana",
      subtitle: "Tudo que você precisa em um só lugar",
      thumbnailUrl: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800",
      ctaText: "Comprar Agora",
      establishmentName: "Super Partner",
      discount: "Frete Grátis"
    },
    {
      id: "3",
      title: "Bebidas Geladas",
      subtitle: "Refrigerantes, sucos e cervejas com desconto",
      thumbnailUrl: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800",
      ctaText: "Pedir Agora",
      establishmentName: "Bebidas Express",
      discount: "30% OFF"
    }
  ],
  compras: [
    {
      id: "1",
      title: "Moda em Alta",
      subtitle: "As últimas tendências com preços incríveis",
      thumbnailUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
      ctaText: "Ver Coleção",
      establishmentName: "Fashion Partner",
      discount: "40% OFF"
    },
    {
      id: "2",
      title: "Tech Week",
      subtitle: "Eletrônicos e gadgets com super desconto",
      thumbnailUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800",
      ctaText: "Comprar Agora",
      establishmentName: "Tech Partner",
      discount: "35% OFF"
    },
    {
      id: "3",
      title: "Casa & Decoração",
      subtitle: "Transforme seu lar com peças exclusivas",
      thumbnailUrl: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800",
      ctaText: "Explorar",
      establishmentName: "Decor Partner",
      discount: "25% OFF"
    }
  ],
  artesanato: [
    {
      id: "1",
      title: "Arte Feita à Mão",
      subtitle: "Peças únicas de artesãos locais",
      thumbnailUrl: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800",
      ctaText: "Ver Artesãos",
      establishmentName: "Artesão Premium",
      discount: "Exclusivo"
    },
    {
      id: "2",
      title: "Decoração Artesanal",
      subtitle: "Dê personalidade ao seu ambiente",
      thumbnailUrl: "https://images.unsplash.com/photo-1528396518501-b53b655eb9b3?w=800",
      ctaText: "Explorar",
      establishmentName: "Craft Partner",
      discount: "20% OFF"
    },
    {
      id: "3",
      title: "Presentes Especiais",
      subtitle: "Surpreenda com presentes feitos com amor",
      thumbnailUrl: "https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=800",
      ctaText: "Ver Mais",
      establishmentName: "Gift Partner",
      discount: "15% OFF"
    }
  ],
  servicos: [
    {
      id: "1",
      title: "Profissionais Qualificados",
      subtitle: "Encontre o especialista ideal para você",
      thumbnailUrl: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800",
      ctaText: "Buscar Serviço",
      establishmentName: "Pro Partner",
      discount: "Verificado"
    },
    {
      id: "2",
      title: "Manutenção Express",
      subtitle: "Resolva problemas em casa rapidamente",
      thumbnailUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800",
      ctaText: "Contratar",
      establishmentName: "Service Partner",
      discount: "10% OFF"
    },
    {
      id: "3",
      title: "Delivery Premium",
      subtitle: "Entregas rápidas e seguras para você",
      thumbnailUrl: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800",
      ctaText: "Pedir Agora",
      establishmentName: "Express Partner",
      discount: "Frete Grátis"
    }
  ]
};

const defaultHighlights: VideoHighlight[] = [
  {
    id: "1",
    title: "Delícias Asiáticas para Você",
    subtitle: "Peça R$100+ em culinária asiática e ganhe frete grátis!",
    thumbnailUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800",
    ctaText: "Ver Ofertas",
    establishmentName: "Premium Partner",
    discount: "Frete Grátis"
  },
  {
    id: "2",
    title: "Pizza Artesanal Premiada",
    subtitle: "As melhores pizzas da cidade com 20% OFF",
    thumbnailUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
    ctaText: "Pedir Agora",
    establishmentName: "Parceiro Destaque",
    discount: "20% OFF"
  },
  {
    id: "3",
    title: "Sabores do Nordeste",
    subtitle: "Experimente o melhor da culinária regional",
    thumbnailUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
    ctaText: "Explorar",
    establishmentName: "Premium Partner",
    discount: "15% OFF"
  },
  {
    id: "4",
    title: "Burger Week Especial",
    subtitle: "Hambúrgueres artesanais com desconto exclusivo",
    thumbnailUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
    ctaText: "Aproveitar",
    establishmentName: "Top Partner",
    discount: "25% OFF"
  }
];

// Category-specific titles
const categoryTitles: Record<string, { title: string; subtitle: string }> = {
  comida: { title: "Sabores Imperdíveis", subtitle: "Ofertas exclusivas dos melhores restaurantes" },
  farmacia: { title: "Saúde e Bem-Estar", subtitle: "Cuide de você com nossas farmácias parceiras" },
  mercado: { title: "Ofertas do Mercado", subtitle: "As melhores promoções para sua despensa" },
  compras: { title: "Shopping em Casa", subtitle: "As melhores ofertas das nossas lojas" },
  artesanato: { title: "Arte Local", subtitle: "Peças únicas feitas por artesãos da região" },
  servicos: { title: "Serviços Premium", subtitle: "Profissionais qualificados à sua disposição" }
};

interface VideoHighlightsSectionProps {
  highlights?: VideoHighlight[];
  mainCategory?: string | null;
  subcategory?: string | null;
}

const VideoHighlightsSection = ({ highlights, mainCategory, subcategory }: VideoHighlightsSectionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollRef, isDragging, handlers, scroll } = useDragScroll();

  // Get category-specific highlights or defaults
  const displayHighlights = highlights || (mainCategory && highlightsByCategory[mainCategory]) || defaultHighlights;
  
  // Get category-specific title
  const categoryTitle = (mainCategory && categoryTitles[mainCategory]) || {
    title: "Destaques Premium",
    subtitle: "Ofertas exclusivas dos nossos melhores parceiros"
  };

  const currentHighlight = displayHighlights[currentIndex];

  // Reset to first highlight when category changes
  useEffect(() => {
    setCurrentIndex(0);
    setProgress(0);
  }, [mainCategory]);

  // Auto-advance carousel with progress bar
  useEffect(() => {
    if (isPlaying) return;
    
    const duration = 6000;
    const interval = 50;
    let elapsed = 0;
    
    const timer = setInterval(() => {
      elapsed += interval;
      setProgress((elapsed / duration) * 100);
      
      if (elapsed >= duration) {
        setCurrentIndex((prev) => (prev + 1) % displayHighlights.length);
        elapsed = 0;
        setProgress(0);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [displayHighlights.length, isPlaying, currentIndex]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSlideChange = (index: number) => {
    setCurrentIndex(index);
    setProgress(0);
  };

  return (
    <section className="py-6 md:py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-accent/30 to-primary/20 rounded-xl hidden md:flex">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                {categoryTitle.title}
                <Crown className="w-4 h-4 text-accent md:hidden" />
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                {categoryTitle.subtitle}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-primary gap-1">
            Ver todos
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Main Video/Image Highlight */}
        <Card className="overflow-hidden mb-4 group border-0 shadow-elevated">
          <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-muted">
            {currentHighlight.videoUrl ? (
              <video
                ref={videoRef}
                src={currentHighlight.videoUrl}
                className="w-full h-full object-cover"
                loop
                muted={isMuted}
                playsInline
                poster={currentHighlight.thumbnailUrl}
              />
            ) : (
              <img
                src={currentHighlight.thumbnailUrl}
                alt={currentHighlight.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                draggable={false}
              />
            )}

            {/* Gradient Overlay - Enhanced for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            {/* Discount Badge - Repositioned to avoid overlap */}
            {currentHighlight.discount && (
              <Badge className="absolute top-4 right-4 md:top-6 md:right-6 bg-destructive text-destructive-foreground font-bold text-sm md:text-base px-3 py-1.5 shadow-lg z-20">
                {currentHighlight.discount}
              </Badge>
            )}

            {/* Content - Enhanced spacing and layout */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 flex flex-col">
              {/* Partner Badge */}
              {currentHighlight.establishmentName && (
                <span className="inline-flex items-center gap-1.5 text-xs md:text-sm text-accent font-semibold mb-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 w-fit">
                  <Sparkles className="w-3 h-3" />
                  {currentHighlight.establishmentName}
                </span>
              )}
              
              {/* Title and Subtitle - Prominent */}
              <h3 className="text-2xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg [text-shadow:_0_2px_12px_rgba(0,0,0,0.8)]">
                {currentHighlight.title}
              </h3>
              <p className="text-sm md:text-lg text-white/95 mb-5 max-w-md drop-shadow-md [text-shadow:_0_1px_8px_rgba(0,0,0,0.6)]">
                {currentHighlight.subtitle}
              </p>
              
              {/* Buttons Row - Primary CTA prominent, secondary subtle */}
              <div className="flex items-center gap-3">
                {currentHighlight.ctaText && (
                  <Button className="btn-yellow gap-2 shadow-lg hover:shadow-yellow text-base px-6 py-2.5">
                    {currentHighlight.ctaText}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white/80 hover:text-white hover:bg-white/10 text-sm"
                >
                  Saiba mais
                </Button>
              </div>
            </div>

            {/* Video Controls - Small corner placement */}
            {currentHighlight.videoUrl && (
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 bg-black/40 backdrop-blur-md w-8 h-8"
                  onClick={togglePlay}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 bg-black/40 backdrop-blur-md w-8 h-8"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </div>
            )}

            {/* Progress Bar - Bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div 
                className="h-full bg-primary transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Progress Dots - No arrows, auto-advance only */}
        <div className="flex justify-center gap-2 mt-4">
          {displayHighlights.map((_, index) => (
            <button
              key={index}
              onClick={() => handleSlideChange(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300 overflow-hidden",
                index === currentIndex 
                  ? "w-10 bg-muted" 
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            >
              {index === currentIndex && (
                <div 
                  className="h-full bg-primary transition-all duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VideoHighlightsSection;