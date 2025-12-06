import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
}

interface NativeGalleryProps {
  images: GalleryImage[];
  showIndicators?: boolean;
  showNavigation?: boolean;
  className?: string;
}

const NativeGallery: React.FC<NativeGalleryProps> = ({
  images,
  showIndicators = true,
  showNavigation = false,
  className = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Track scroll position to update active indicator
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const itemWidth = container.offsetWidth * 0.85 + 16; // width + gap
      const newIndex = Math.round(scrollLeft / itemWidth);
      setActiveIndex(Math.min(newIndex, images.length - 1));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [images.length]);

  const scrollToIndex = (index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    
    const itemWidth = container.offsetWidth * 0.85 + 16;
    container.scrollTo({
      left: index * itemWidth,
      behavior: 'smooth',
    });
  };

  const handlePrev = () => {
    if (activeIndex > 0) scrollToIndex(activeIndex - 1);
  };

  const handleNext = () => {
    if (activeIndex < images.length - 1) scrollToIndex(activeIndex + 1);
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Main Gallery Container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 py-2 -mx-4"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {images.map((image, index) => (
          <div
            key={image.id}
            className={`
              relative flex-shrink-0 w-[85vw] max-w-md aspect-[4/3] 
              snap-center rounded-3xl overflow-hidden
              transition-all duration-300 ease-out
              ${activeIndex === index ? 'scale-100 opacity-100' : 'scale-[0.95] opacity-80'}
            `}
          >
            {/* Image with parallax-like effect */}
            <img
              src={image.src}
              alt={image.alt}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out hover:scale-110"
              loading="lazy"
            />
            
            {/* Gradient overlay for text */}
            {(image.title || image.subtitle) && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            )}
            
            {/* Text content */}
            {(image.title || image.subtitle) && (
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                {image.title && (
                  <h3 className="text-lg font-semibold tracking-tight">{image.title}</h3>
                )}
                {image.subtitle && (
                  <p className="text-sm text-white/80 mt-1">{image.subtitle}</p>
                )}
              </div>
            )}
          </div>
        ))}
        
        {/* End padding for last item centering */}
        <div className="flex-shrink-0 w-[7.5vw]" />
      </div>

      {/* Navigation Arrows (optional) */}
      {showNavigation && images.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            disabled={activeIndex === 0}
            className={`
              absolute left-2 top-1/2 -translate-y-1/2 z-10
              w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm
              flex items-center justify-center shadow-lg
              transition-all duration-200
              ${activeIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-background'}
            `}
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={handleNext}
            disabled={activeIndex === images.length - 1}
            className={`
              absolute right-2 top-1/2 -translate-y-1/2 z-10
              w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm
              flex items-center justify-center shadow-lg
              transition-all duration-200
              ${activeIndex === images.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-background'}
            `}
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {showIndicators && images.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`
                h-2 rounded-full transition-all duration-300 ease-out
                ${activeIndex === index 
                  ? 'w-6 bg-primary' 
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }
              `}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NativeGallery;

// Demo component with placeholder images
export const NativeGalleryDemo: React.FC = () => {
  const demoImages: GalleryImage[] = [
    {
      id: '1',
      src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
      alt: 'Delicious food platter',
      title: 'Culinária Artesanal',
      subtitle: 'Sabores únicos da nossa região',
    },
    {
      id: '2',
      src: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80',
      alt: 'Fresh ingredients',
      title: 'Ingredientes Frescos',
      subtitle: 'Direto do produtor para sua mesa',
    },
    {
      id: '3',
      src: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
      alt: 'Colorful salad',
      title: 'Opções Saudáveis',
      subtitle: 'Alimentação balanceada e saborosa',
    },
    {
      id: '4',
      src: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
      alt: 'Pizza',
      title: 'Pizzas Artesanais',
      subtitle: 'Massa feita na hora',
    },
    {
      id: '5',
      src: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=800&q=80',
      alt: 'Nature landscape',
      title: 'Ambiente Acolhedor',
      subtitle: 'Vista para a natureza',
    },
  ];

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold px-4 mb-4">Destaques</h2>
      <NativeGallery images={demoImages} showIndicators={true} />
    </div>
  );
};
