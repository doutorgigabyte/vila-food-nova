import { useState, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, ChevronRight, Sparkles, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDragScroll } from "@/hooks/useDragScroll";

interface VideoHighlight {
  id: string;
  title: string;
  subtitle: string;
  videoUrl?: string;
  thumbnailUrl: string;
  ctaText?: string;
  ctaLink?: string;
  establishmentName?: string;
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
    establishmentName: "Premium Partner"
  },
  {
    id: "2",
    title: "Pizza Artesanal Premiada",
    subtitle: "As melhores pizzas da cidade com 20% OFF",
    thumbnailUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
    videoUrl: "",
    ctaText: "Pedir Agora",
    ctaLink: "/marketplace/pizzas",
    establishmentName: "Parceiro Destaque"
  },
  {
    id: "3",
    title: "Sabores do Nordeste",
    subtitle: "Experimente o melhor da culinária regional",
    thumbnailUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
    videoUrl: "",
    ctaText: "Explorar",
    ctaLink: "/marketplace/regional",
    establishmentName: "Premium Partner"
  }
];

interface VideoHighlightsSectionProps {
  highlights?: VideoHighlight[];
}

const VideoHighlightsSection = ({ highlights = defaultHighlights }: VideoHighlightsSectionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollRef, isDragging, handlers, scroll } = useDragScroll();

  const currentHighlight = highlights[currentIndex];

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

  return (
    <section className="py-6 md:py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/20 rounded-lg hidden md:flex">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                Destaques para Você
                <Sparkles className="w-4 h-4 text-accent md:hidden" />
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                Veja as ofertas especiais dos nossos parceiros
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-primary gap-1">
            Ver todos
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Main Video/Image Highlight */}
        <Card className="overflow-hidden mb-4 group">
          <div className="relative aspect-video md:aspect-[21/9] overflow-hidden bg-muted">
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
              />
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
              <div className="flex items-end justify-between">
                <div className="flex-1">
                  {currentHighlight.establishmentName && (
                    <span className="inline-flex items-center gap-1 text-xs text-accent font-medium mb-2">
                      <Sparkles className="w-3 h-3" />
                      {currentHighlight.establishmentName}
                    </span>
                  )}
                  <h3 className="text-lg md:text-2xl font-bold text-white mb-1 md:mb-2">
                    {currentHighlight.title}
                  </h3>
                  <p className="text-sm md:text-base text-white/80 mb-3 md:mb-4 max-w-md">
                    {currentHighlight.subtitle}
                  </p>
                  {currentHighlight.ctaText && (
                    <Button className="btn-yellow gap-2">
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
                      className="text-white hover:bg-white/20"
                      onClick={togglePlay}
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={toggleMute}
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 hidden md:flex"
                    >
                      <Maximize2 className="w-5 h-5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Progress Bar (for video) */}
              {currentHighlight.videoUrl && (
                <div className="mt-4 w-full bg-white/30 rounded-full h-1 overflow-hidden">
                  <div className="bg-primary h-full w-1/4 transition-all duration-300" />
                </div>
              )}
            </div>

            {/* Navigation Arrows */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setCurrentIndex((prev) => (prev - 1 + highlights.length) % highlights.length)}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setCurrentIndex((prev) => (prev + 1) % highlights.length)}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </Card>

        {/* Thumbnails Carousel */}
        <div className="relative group/scroll">
          <Button
            variant="outline"
            size="icon"
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 shadow-md opacity-0 group-hover/scroll:opacity-100 transition-opacity bg-card hidden md:flex"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div
            ref={scrollRef}
            {...handlers}
            className={`flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2 ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {highlights.map((highlight, index) => (
              <button
                key={highlight.id}
                onClick={() => !isDragging && setCurrentIndex(index)}
                className={`flex-shrink-0 relative rounded-xl overflow-hidden transition-all duration-300 ${
                  index === currentIndex 
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background" 
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <div className="w-24 md:w-32 aspect-video">
                  <img
                    src={highlight.thumbnailUrl}
                    alt={highlight.title}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
                {index === currentIndex && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 shadow-md opacity-0 group-hover/scroll:opacity-100 transition-opacity bg-card hidden md:flex"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mt-3">
          {highlights.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? "w-6 bg-primary" 
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default VideoHighlightsSection;
