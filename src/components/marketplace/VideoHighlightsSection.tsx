import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, ChevronRight, Sparkles, ChevronLeft, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

const defaultHighlights: VideoHighlight[] = [
  {
    id: "1",
    title: "Delícias Asiáticas para Você",
    subtitle: "Peça R$100+ em culinária asiática e ganhe frete grátis!",
    thumbnailUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800",
    videoUrl: "",
    ctaText: "Ver Ofertas",
    ctaLink: "/marketplace/ofertas",
    establishmentName: "Premium Partner",
    discount: "Frete Grátis"
  },
  {
    id: "2",
    title: "Pizza Artesanal Premiada",
    subtitle: "As melhores pizzas da cidade com 20% OFF",
    thumbnailUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
    videoUrl: "",
    ctaText: "Pedir Agora",
    ctaLink: "/marketplace/pizzas",
    establishmentName: "Parceiro Destaque",
    discount: "20% OFF"
  },
  {
    id: "3",
    title: "Sabores do Nordeste",
    subtitle: "Experimente o melhor da culinária regional",
    thumbnailUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
    videoUrl: "",
    ctaText: "Explorar",
    ctaLink: "/marketplace/regional",
    establishmentName: "Premium Partner",
    discount: "15% OFF"
  },
  {
    id: "4",
    title: "Burger Week Especial",
    subtitle: "Hambúrgueres artesanais com desconto exclusivo",
    thumbnailUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
    videoUrl: "",
    ctaText: "Aproveitar",
    ctaLink: "/marketplace/burgers",
    establishmentName: "Top Partner",
    discount: "25% OFF"
  }
];

interface VideoHighlightsSectionProps {
  highlights?: VideoHighlight[];
}

const VideoHighlightsSection = ({ highlights = defaultHighlights }: VideoHighlightsSectionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollRef, isDragging, handlers, scroll } = useDragScroll();

  const currentHighlight = highlights[currentIndex];

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
        setCurrentIndex((prev) => (prev + 1) % highlights.length);
        elapsed = 0;
        setProgress(0);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [highlights.length, isPlaying, currentIndex]);

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
                Destaques Premium
                <Crown className="w-4 h-4 text-accent md:hidden" />
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                Ofertas exclusivas dos nossos melhores parceiros
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
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 pb-8 md:pb-12">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="flex-1 max-w-lg">
                  {currentHighlight.establishmentName && (
                    <span className="inline-flex items-center gap-1.5 text-xs md:text-sm text-accent font-semibold mb-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                      <Sparkles className="w-3 h-3" />
                      {currentHighlight.establishmentName}
                    </span>
                  )}
                  <h3 className="text-xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg [text-shadow:_0_2px_12px_rgba(0,0,0,0.8)]">
                    {currentHighlight.title}
                  </h3>
                  <p className="text-sm md:text-base text-white/90 mb-4 drop-shadow-md [text-shadow:_0_1px_8px_rgba(0,0,0,0.6)]">
                    {currentHighlight.subtitle}
                  </p>
                  {currentHighlight.ctaText && (
                    <Button className="btn-yellow gap-2 shadow-lg hover:shadow-yellow relative z-10">
                      {currentHighlight.ctaText}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Video Controls */}
                {currentHighlight.videoUrl && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 bg-black/40 backdrop-blur-md"
                      onClick={togglePlay}
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 bg-black/40 backdrop-blur-md"
                      onClick={toggleMute}
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Arrows */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 bg-black/40 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleSlideChange((currentIndex - 1 + highlights.length) % highlights.length)}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 bg-black/40 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleSlideChange((currentIndex + 1) % highlights.length)}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>

            {/* Progress Bar - Mobile */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 md:hidden">
              <div 
                className="h-full bg-primary transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Thumbnails Carousel */}
        <div className="relative group/scroll hidden md:block">
          <Button
            variant="outline"
            size="icon"
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 shadow-md opacity-0 group-hover/scroll:opacity-100 transition-opacity bg-card"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div
            ref={scrollRef}
            {...handlers}
            className={cn(
              "flex gap-3 overflow-x-auto pb-2 select-none scrollbar-hide",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
          >
            {highlights.map((highlight, index) => (
              <button
                key={highlight.id}
                onClick={() => !isDragging && handleSlideChange(index)}
                className={cn(
                  "flex-shrink-0 relative rounded-xl overflow-hidden transition-all duration-300",
                  index === currentIndex 
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105" 
                    : "opacity-60 hover:opacity-100 hover:scale-102"
                )}
              >
                <div className="w-28 md:w-36 aspect-video relative">
                  <img
                    src={highlight.thumbnailUrl}
                    alt={highlight.title}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  {highlight.discount && (
                    <Badge className="absolute bottom-1 left-1 bg-destructive text-[10px] px-1.5 py-0.5">
                      {highlight.discount}
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 shadow-md opacity-0 group-hover/scroll:opacity-100 transition-opacity bg-card"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress Dots with Active Progress - Desktop */}
        <div className="hidden md:flex justify-center gap-2 mt-4">
          {highlights.map((_, index) => (
            <button
              key={index}
              onClick={() => handleSlideChange(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300 overflow-hidden",
                index === currentIndex 
                  ? "w-12 bg-muted" 
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
