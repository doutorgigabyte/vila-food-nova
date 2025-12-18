import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Tv, Play, Sparkles } from "lucide-react";

const mockSlides = [
  {
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=500&fit=crop",
    title: "Pizza Margherita",
    price: 45.90,
    template: "minimal"
  },
  {
    image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=500&fit=crop",
    title: "Brownie Especial",
    price: 18.90,
    template: "neon"
  },
  {
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=500&fit=crop",
    title: "Salada Caesar",
    price: 32.90,
    template: "gradient"
  }
];

export default function VilaTokTVSimulation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mockSlides.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isPlaying]);

  const slide = mockSlides[currentSlide];

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col relative overflow-hidden">
      {/* TV Frame Effect */}
      <div className="absolute inset-0 border-4 border-gray-700 rounded-lg pointer-events-none z-20" />
      
      {/* TV Header */}
      <div className="flex items-center justify-between p-2 bg-black/60 z-10">
        <div className="flex items-center gap-1.5">
          <Tv className="w-3.5 h-3.5 text-primary" />
          <span className="text-white text-[10px] font-bold">VilaTok TV</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-500 text-[8px]">AO VIVO</span>
        </div>
      </div>

      {/* Slide Content */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            {/* Background Image */}
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
            
            {/* Product Info */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-12 left-3 right-3"
            >
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-2.5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-900 font-bold text-sm">{slide.title}</h3>
                    <p className="text-primary font-bold text-base">
                      R$ {slide.price.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="bg-primary rounded-full p-2"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
            
            {/* QR Code */}
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-12 right-3 bg-white p-1.5 rounded-lg shadow-lg"
            >
              <QrCode className="w-10 h-10 text-gray-900" />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {mockSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'w-6 bg-primary' 
                : 'w-1.5 bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Play/Pause Button */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="absolute top-10 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center z-10"
      >
        <Play className={`w-3 h-3 text-white ${isPlaying ? 'opacity-50' : ''}`} />
      </button>

      {/* Scanlines Effect */}
      <div 
        className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
        }}
      />
    </div>
  );
}
