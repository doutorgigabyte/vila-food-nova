import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  discount?: string;
  bgColor: string;
  image?: string;
}

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
}

const PromoBanners = ({ banners = defaultBanners }: PromoBannersProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [banners.length]);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <section className="py-8 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="relative">
          <div className="flex gap-4 overflow-hidden">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`flex-shrink-0 w-full md:w-[calc(33.333%-1rem)] transition-transform duration-500 ease-in-out`}
                style={{
                  transform: `translateX(-${currentIndex * 100}%)`,
                }}
              >
                <div 
                  className={`relative h-48 rounded-2xl overflow-hidden bg-gradient-to-r ${banner.bgColor} p-6 flex items-center`}
                >
                  <div className="flex-1 text-primary-foreground z-10">
                    <h3 className="text-lg font-bold mb-1">{banner.title}</h3>
                    <p className="text-sm opacity-90 mb-3">{banner.subtitle}</p>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      className="bg-card text-foreground hover:bg-card/90"
                    >
                      Pedir Agora
                    </Button>
                  </div>
                  
                  {banner.image && (
                    <div className="absolute right-0 bottom-0 w-32 h-32">
                      <img 
                        src={banner.image} 
                        alt={banner.title}
                        className="w-full h-full object-cover rounded-full shadow-lg"
                      />
                    </div>
                  )}
                  
                  {banner.discount && (
                    <div className="absolute top-4 right-4 bg-card text-primary font-bold text-lg px-3 py-1 rounded-full">
                      {banner.discount} OFF
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Navigation */}
          <Button
            variant="outline"
            size="icon"
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 shadow-md bg-card hidden md:flex"
            onClick={goToPrev}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 shadow-md bg-card hidden md:flex"
            onClick={goToNext}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-4">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? "w-6 bg-primary" 
                    : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoBanners;
