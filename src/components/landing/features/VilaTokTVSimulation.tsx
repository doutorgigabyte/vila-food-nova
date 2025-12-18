import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Tv, Play, Pause } from "lucide-react";

const mockSlides = [
  {
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=450&fit=crop",
    title: "Pizza Margherita",
    price: 45.90,
    description: "Massa artesanal, molho pomodoro e queijo fresco",
    template: "minimal"
  },
  {
    image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&h=450&fit=crop",
    title: "Brownie Especial",
    price: 18.90,
    description: "Chocolate belga com sorvete artesanal",
    template: "neon"
  },
  {
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=450&fit=crop",
    title: "Salada Caesar",
    price: 32.90,
    description: "Alface romana, croutons e parmesão",
    template: "gradient"
  },
  {
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=450&fit=crop",
    title: "Hambúrguer Artesanal",
    price: 38.90,
    description: "Blend especial 180g com queijo cheddar",
    template: "bold"
  }
];

export default function VilaTokTVSimulation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mockSlides.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [isPlaying]);

  const slide = mockSlides[currentSlide];

  return (
    <div className="w-full h-full bg-black flex flex-col relative overflow-hidden">
      {/* TV Header Bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 bg-gradient-to-b from-black/80 to-transparent z-20">
        <div className="flex items-center gap-2">
          <Tv className="w-4 h-4 text-primary" />
          <span className="text-white text-xs font-bold tracking-wide">VilaTok TV</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-red-500/90 px-2 py-0.5 rounded">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-white text-[10px] font-bold">AO VIVO</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <motion.img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 5 }}
          />
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-black/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
          
          {/* Left Side - Product Info */}
          <motion.div 
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute left-4 bottom-4 md:left-6 md:bottom-6 max-w-[60%]"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white/95 backdrop-blur-sm rounded-xl p-3 md:p-4 shadow-2xl"
            >
              <h3 className="text-gray-900 font-bold text-sm md:text-lg leading-tight">{slide.title}</h3>
              <p className="text-gray-600 text-[10px] md:text-xs mt-0.5 line-clamp-1">{slide.description}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-primary font-bold text-base md:text-xl">
                  R$ {slide.price.toFixed(2).replace('.', ',')}
                </span>
                <span className="bg-primary/10 text-primary text-[8px] md:text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  PEDIDO FÁCIL
                </span>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Right Side - QR Code */}
          <motion.div 
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="absolute right-4 bottom-4 md:right-6 md:bottom-6"
          >
            <div className="bg-white p-2 md:p-3 rounded-xl shadow-2xl text-center">
              <QrCode className="w-12 h-12 md:w-16 md:h-16 text-gray-900 mx-auto" />
              <p className="text-gray-600 text-[8px] md:text-[10px] font-medium mt-1">Escaneie e peça</p>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 flex gap-1 px-4 pb-2 z-20">
        {mockSlides.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ 
                width: index === currentSlide ? "100%" : index < currentSlide ? "100%" : "0%" 
              }}
              transition={{ 
                duration: index === currentSlide ? 4 : 0,
                ease: "linear"
              }}
            />
          </div>
        ))}
      </div>

      {/* Play/Pause Button */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="absolute top-2 right-2 md:top-3 md:right-16 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center z-20 transition-colors"
      >
        {isPlaying ? (
          <Pause className="w-3 h-3 text-white" />
        ) : (
          <Play className="w-3 h-3 text-white ml-0.5" />
        )}
      </button>

      {/* Scanlines Effect */}
      <div 
        className="absolute inset-0 pointer-events-none z-10 opacity-[0.02]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
        }}
      />
    </div>
  );
}
