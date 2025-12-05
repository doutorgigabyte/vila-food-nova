import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  id: string;
  image_url: string;
  title?: string;
  link_url?: string;
}

interface StoreBannersProps {
  banners: Banner[];
  primaryColor?: string;
}

export const StoreBanners = ({ banners, primaryColor }: StoreBannersProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto slide
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (banners.length === 0) {
    // Show promotional placeholder
    return (
      <div className="mx-4 my-4">
        <div 
          className="relative h-36 md:h-48 rounded-xl overflow-hidden shadow-lg"
          style={{ 
            background: primaryColor 
              ? `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`
              : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%)'
          }}
        >
          <div className="absolute inset-0 flex items-center justify-between p-6">
            <div className="text-white">
              <p className="text-xs uppercase tracking-wide opacity-80">Promoção Especial</p>
              <h3 className="text-2xl md:text-3xl font-bold mt-1">
                Confira nossas<br />ofertas!
              </h3>
              <p className="text-sm mt-2 opacity-90">
                Produtos selecionados com desconto
              </p>
            </div>
            <div className="text-white text-right">
              <span className="text-5xl md:text-6xl font-black">%</span>
              <p className="text-sm">OFF</p>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -top-5 -left-5 w-24 h-24 rounded-full bg-white/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 my-4 relative">
      <div className="relative h-36 md:h-48 rounded-xl overflow-hidden shadow-lg">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            {banner.link_url ? (
              <a href={banner.link_url} target="_blank" rel="noopener noreferrer">
                <img
                  src={banner.image_url}
                  alt={banner.title || "Banner"}
                  className="w-full h-full object-cover"
                />
              </a>
            ) : (
              <img
                src={banner.image_url}
                alt={banner.title || "Banner"}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        ))}
        
        {/* Navigation */}
        {banners.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            
            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex ? "bg-white w-4" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
