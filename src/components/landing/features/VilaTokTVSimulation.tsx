import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Play, Pause, Sparkles, Flame, Star } from "lucide-react";

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

// Template: Minimal - Clean and elegant
const MinimalTemplate = ({ slide }: { slide: typeof mockSlides[0] }) => (
  <>
    <motion.img
      src={slide.image}
      alt={slide.title}
      className="w-full h-full object-cover"
      initial={{ scale: 1.1 }}
      animate={{ scale: 1 }}
      transition={{ duration: 6 }}
    />
    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/40" />
    
    {/* Product Card - Bottom Left */}
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="absolute left-4 bottom-4 md:left-6 md:bottom-6"
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 md:p-4 shadow-2xl max-w-[200px]">
        <h3 className="text-gray-900 font-bold text-sm md:text-base leading-tight">{slide.title}</h3>
        <p className="text-gray-500 text-[9px] md:text-[10px] mt-0.5 line-clamp-1">{slide.description}</p>
        <div className="mt-2">
          <span className="text-emerald-600 font-bold text-base md:text-lg">
            R$ {slide.price.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>
    </motion.div>

    {/* QR Code - Bottom Right */}
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="absolute right-4 bottom-4 md:right-6 md:bottom-6"
    >
      <div className="bg-white p-2 md:p-2.5 rounded-lg shadow-xl">
        <QrCode className="w-10 h-10 md:w-12 md:h-12 text-gray-900" />
        <p className="text-gray-600 text-[7px] md:text-[8px] font-medium mt-1 text-center">Escaneie</p>
      </div>
    </motion.div>

    {/* Template Badge */}
    <div className="absolute top-3 left-3 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded text-[8px] text-white font-medium">
      MINIMAL
    </div>
  </>
);

// Template: Neon - Vibrant with glowing effects
const NeonTemplate = ({ slide }: { slide: typeof mockSlides[0] }) => (
  <>
    <motion.img
      src={slide.image}
      alt={slide.title}
      className="w-full h-full object-cover"
      initial={{ scale: 1.05 }}
      animate={{ scale: 1 }}
      transition={{ duration: 6 }}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-purple-900/90 via-purple-900/40 to-transparent" />
    
    {/* Neon Glow Border */}
    <div className="absolute inset-4 border-2 border-pink-500/50 rounded-xl shadow-[0_0_30px_rgba(236,72,153,0.3)]" />
    
    {/* Content - Center Bottom */}
    <motion.div 
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="absolute bottom-6 left-0 right-0 text-center px-4"
    >
      <motion.div
        animate={{ textShadow: ["0 0 10px #ec4899", "0 0 20px #ec4899", "0 0 10px #ec4899"] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <h3 className="text-white font-black text-lg md:text-2xl tracking-tight">{slide.title}</h3>
      </motion.div>
      <p className="text-pink-200 text-[10px] md:text-xs mt-1">{slide.description}</p>
      <div className="mt-2 inline-flex items-center gap-2 bg-pink-500 px-4 py-1.5 rounded-full">
        <Sparkles className="w-3 h-3 text-white" />
        <span className="text-white font-bold text-sm md:text-base">
          R$ {slide.price.toFixed(2).replace('.', ',')}
        </span>
      </div>
    </motion.div>

    {/* QR Code - Top Right with neon effect */}
    <motion.div 
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="absolute right-3 top-3"
    >
      <div className="bg-black/80 p-2 rounded-lg border border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.4)]">
        <QrCode className="w-8 h-8 md:w-10 md:h-10 text-pink-400" />
      </div>
    </motion.div>

    {/* Template Badge */}
    <div className="absolute top-3 left-3 px-2 py-0.5 bg-pink-500/80 rounded text-[8px] text-white font-bold">
      NEON
    </div>
  </>
);

// Template: Gradient - Modern gradient overlay
const GradientTemplate = ({ slide }: { slide: typeof mockSlides[0] }) => (
  <>
    <motion.img
      src={slide.image}
      alt={slide.title}
      className="w-full h-full object-cover"
      initial={{ scale: 1.1 }}
      animate={{ scale: 1 }}
      transition={{ duration: 6 }}
    />
    <div className="absolute inset-0 bg-gradient-to-br from-teal-600/80 via-transparent to-emerald-600/80" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
    
    {/* Split Layout - Left Side */}
    <div className="absolute inset-0 flex items-center">
      <motion.div 
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-1/2 p-4 md:p-6"
      >
        <div className="flex items-center gap-1 mb-1">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
        </div>
        <h3 className="text-white font-bold text-base md:text-xl leading-tight drop-shadow-lg">{slide.title}</h3>
        <p className="text-white/80 text-[9px] md:text-[11px] mt-1 line-clamp-2">{slide.description}</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="bg-white text-teal-600 font-bold text-sm md:text-lg px-3 py-1 rounded-lg">
            R$ {slide.price.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </motion.div>
    </div>

    {/* QR Code - Bottom Right */}
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="absolute right-3 bottom-3"
    >
      <div className="bg-white/95 p-2 rounded-xl shadow-lg">
        <QrCode className="w-10 h-10 md:w-12 md:h-12 text-teal-600" />
        <p className="text-teal-600 text-[7px] font-semibold mt-0.5 text-center">PEÇA JÁ</p>
      </div>
    </motion.div>

    {/* Template Badge */}
    <div className="absolute top-3 left-3 px-2 py-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded text-[8px] text-white font-bold">
      GRADIENT
    </div>
  </>
);

// Template: Bold - Strong and impactful
const BoldTemplate = ({ slide }: { slide: typeof mockSlides[0] }) => (
  <>
    <motion.img
      src={slide.image}
      alt={slide.title}
      className="w-full h-full object-cover"
      initial={{ scale: 1.15 }}
      animate={{ scale: 1 }}
      transition={{ duration: 6 }}
    />
    <div className="absolute inset-0 bg-gradient-to-r from-orange-600/90 via-orange-600/50 to-transparent" />
    
    {/* Full Left Side Content */}
    <motion.div 
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="absolute left-0 top-0 bottom-0 w-[55%] flex flex-col justify-center p-4 md:p-6"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Flame className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
        <span className="text-yellow-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">Destaque</span>
      </div>
      <h3 className="text-white font-black text-xl md:text-3xl leading-none uppercase tracking-tight">
        {slide.title}
      </h3>
      <p className="text-white/80 text-[10px] md:text-xs mt-2 max-w-[180px]">{slide.description}</p>
      <div className="mt-3">
        <div className="inline-block bg-yellow-400 text-orange-900 font-black text-lg md:text-2xl px-4 py-1.5 rounded-lg transform -rotate-2">
          R$ {slide.price.toFixed(2).replace('.', ',')}
        </div>
      </div>
    </motion.div>

    {/* QR Code - Bottom Right with badge */}
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="absolute right-3 bottom-3"
    >
      <div className="bg-white p-2 rounded-lg shadow-xl relative">
        <QrCode className="w-10 h-10 md:w-12 md:h-12 text-orange-600" />
        <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full">
          NOVO
        </div>
      </div>
    </motion.div>

    {/* Template Badge */}
    <div className="absolute top-3 left-3 px-2 py-0.5 bg-orange-500 rounded text-[8px] text-white font-black uppercase">
      BOLD
    </div>
  </>
);

const templateComponents: Record<string, React.FC<{ slide: typeof mockSlides[0] }>> = {
  minimal: MinimalTemplate,
  neon: NeonTemplate,
  gradient: GradientTemplate,
  bold: BoldTemplate,
};

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
  const TemplateComponent = templateComponents[slide.template] || MinimalTemplate;

  return (
    <div className="w-full h-full bg-black flex flex-col relative overflow-hidden">
      {/* TV Header Bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-1.5 bg-gradient-to-b from-black/80 to-transparent z-20">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-white/80 text-[9px] font-medium tracking-wide">VilaTok TV</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-red-500/90 px-1.5 py-0.5 rounded">
            <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
            <span className="text-white text-[8px] font-bold">AO VIVO</span>
          </div>
        </div>
      </div>

      {/* Main Content with Template */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <TemplateComponent slide={slide} />
        </motion.div>
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 flex gap-0.5 px-3 pb-1.5 z-20">
        {mockSlides.map((s, index) => (
          <div key={index} className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
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
        className="absolute top-1.5 right-10 w-5 h-5 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center z-20 transition-colors"
      >
        {isPlaying ? (
          <Pause className="w-2.5 h-2.5 text-white" />
        ) : (
          <Play className="w-2.5 h-2.5 text-white ml-0.5" />
        )}
      </button>

      {/* Template Indicator */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1 z-20">
        {mockSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              index === currentSlide ? "bg-white w-3" : "bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
