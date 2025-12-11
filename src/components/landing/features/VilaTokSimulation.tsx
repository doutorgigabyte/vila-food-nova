import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, ShoppingBag, Volume2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const MOCK_STORIES = [
  {
    id: 1,
    establishment: "Pizzaria do Mário",
    avatar: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100&h=100&fit=crop",
    video: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=700&fit=crop",
    likes: 234,
    comments: 18,
    caption: "Pizza artesanal saindo do forno! 🔥",
    product: "Pizza Margherita",
    price: "R$ 45,00",
  },
  {
    id: 2,
    establishment: "Açaí da Vila",
    avatar: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=100&h=100&fit=crop",
    video: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=700&fit=crop",
    likes: 456,
    comments: 32,
    caption: "Açaí cremoso com frutas frescas 😋",
    product: "Açaí 500ml",
    price: "R$ 28,00",
  },
  {
    id: 3,
    establishment: "Burger House",
    avatar: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop",
    video: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=700&fit=crop",
    likes: 789,
    comments: 45,
    caption: "Smash burger suculento! 🤤",
    product: "Smash Duplo",
    price: "R$ 38,00",
  },
];

const VilaTokSimulation = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<'vertical' | 'horizontal'>('vertical');

  const currentStory = MOCK_STORIES[currentIndex];

  // Auto-progress stories
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentIndex((i) => (i + 1) % MOCK_STORIES.length);
          setIsLiked(false);
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Auto like animation
  useEffect(() => {
    const likeTimeout = setTimeout(() => {
      setIsLiked(true);
    }, 2000);

    return () => clearTimeout(likeTimeout);
  }, [currentIndex]);

  // Alternate swipe hint direction
  useEffect(() => {
    const hintInterval = setInterval(() => {
      setSwipeDirection(prev => prev === 'vertical' ? 'horizontal' : 'vertical');
    }, 3000);

    return () => clearInterval(hintInterval);
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Story background image */}
      <div className="absolute inset-0">
        <img 
          src={currentStory.video} 
          alt={currentStory.establishment}
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
      </div>

      {/* Progress bars */}
      <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
        {MOCK_STORIES.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width: i < currentIndex ? "100%" : i === currentIndex ? `${progress}%` : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-6 left-3 right-3 flex items-center gap-2 z-10">
        <img 
          src={currentStory.avatar} 
          alt={currentStory.establishment}
          className="w-8 h-8 rounded-full object-cover border border-white/50"
        />
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-xs truncate">{currentStory.establishment}</p>
          <p className="text-white/70 text-[10px]">há 2h</p>
        </div>
        <Volume2 className="w-4 h-4 text-white/80" />
      </div>

      {/* Swipe Navigation Hint Overlay */}
      {showSwipeHint && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          {/* Vertical swipe indicator */}
          <div className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 transition-opacity duration-500 ${swipeDirection === 'vertical' ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex flex-col items-center animate-bounce">
              <ChevronUp className="w-6 h-6 text-white drop-shadow-lg" />
              <ChevronUp className="w-6 h-6 text-white drop-shadow-lg -mt-4" />
            </div>
            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 mt-1">
              <p className="text-white text-[10px] font-medium text-center">Deslize ↕️</p>
              <p className="text-white/80 text-[8px] text-center">Trocar estabelecimento</p>
            </div>
            <div className="flex flex-col items-center animate-bounce mt-1">
              <ChevronDown className="w-6 h-6 text-white drop-shadow-lg" />
              <ChevronDown className="w-6 h-6 text-white drop-shadow-lg -mt-4" />
            </div>
          </div>

          {/* Horizontal swipe indicator */}
          <div className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-opacity duration-500 ${swipeDirection === 'horizontal' ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center animate-pulse">
              <ChevronLeft className="w-6 h-6 text-white drop-shadow-lg" />
              <ChevronLeft className="w-6 h-6 text-white drop-shadow-lg -ml-4" />
            </div>
            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 mx-1">
              <p className="text-white text-[10px] font-medium text-center">Deslize ↔️</p>
              <p className="text-white/80 text-[8px] text-center">Próximo vídeo da loja</p>
            </div>
            <div className="flex items-center animate-pulse">
              <ChevronRight className="w-6 h-6 text-white drop-shadow-lg" />
              <ChevronRight className="w-6 h-6 text-white drop-shadow-lg -ml-4" />
            </div>
          </div>
        </div>
      )}

      {/* Navigation explanation badges */}
      <div className="absolute top-14 left-2 right-2 z-10 flex justify-between">
        <div className="bg-black/50 backdrop-blur-sm rounded px-1.5 py-0.5">
          <p className="text-white/90 text-[7px]">↕️ Lojas</p>
        </div>
        <div className="bg-black/50 backdrop-blur-sm rounded px-1.5 py-0.5">
          <p className="text-white/90 text-[7px]">↔️ Vídeos</p>
        </div>
      </div>

      {/* Right side actions */}
      <div className="absolute right-2 bottom-24 flex flex-col items-center gap-4 z-10">
        <button
          className={`flex flex-col items-center transition-transform ${isLiked ? "scale-110" : ""}`}
        >
          <div className={`p-1.5 rounded-full ${isLiked ? "bg-red-500" : "bg-white/20 backdrop-blur"}`}>
            <Heart className={`w-5 h-5 ${isLiked ? "text-white fill-white" : "text-white"}`} />
          </div>
          <span className="text-white text-[10px] mt-0.5">{isLiked ? currentStory.likes + 1 : currentStory.likes}</span>
        </button>
        <button className="flex flex-col items-center">
          <div className="p-1.5 rounded-full bg-white/20 backdrop-blur">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-[10px] mt-0.5">{currentStory.comments}</span>
        </button>
        <button className="flex flex-col items-center">
          <div className="p-1.5 rounded-full bg-white/20 backdrop-blur">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-[10px] mt-0.5">Enviar</span>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-3 left-3 right-14 z-10">
        <p className="text-white text-xs mb-2">{currentStory.caption}</p>
        
        {/* Product CTA */}
        <button className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-full">
          <ShoppingBag className="w-3.5 h-3.5 text-zinc-900" />
          <span className="text-zinc-900 text-xs font-semibold">{currentStory.product}</span>
          <span className="text-zinc-600 text-[10px]">{currentStory.price}</span>
        </button>
      </div>
    </div>
  );
};

export default VilaTokSimulation;
