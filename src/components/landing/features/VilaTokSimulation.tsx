import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, ShoppingBag, Play, Pause, Volume2 } from "lucide-react";

const MOCK_STORIES = [
  {
    id: 1,
    establishment: "Pizzaria do Mário",
    avatar: "🍕",
    video: "bg-gradient-to-br from-orange-500 via-red-500 to-yellow-500",
    likes: 234,
    comments: 18,
    caption: "Pizza artesanal saindo do forno! 🔥",
    product: "Pizza Margherita",
    price: "R$ 45,00",
  },
  {
    id: 2,
    establishment: "Açaí da Vila",
    avatar: "🫐",
    video: "bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500",
    likes: 456,
    comments: 32,
    caption: "Açaí cremoso com frutas frescas 😋",
    product: "Açaí 500ml",
    price: "R$ 28,00",
  },
  {
    id: 3,
    establishment: "Burger House",
    avatar: "🍔",
    video: "bg-gradient-to-br from-amber-600 via-orange-500 to-red-600",
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
  const [showFinger, setShowFinger] = useState(true);
  const [fingerPosition, setFingerPosition] = useState({ x: 50, y: 70 });

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

  // Finger swipe animation
  useEffect(() => {
    const fingerInterval = setInterval(() => {
      setFingerPosition((prev) => {
        if (prev.y <= 30) {
          setShowFinger(false);
          setTimeout(() => {
            setShowFinger(true);
            setFingerPosition({ x: 50, y: 70 });
          }, 500);
          return prev;
        }
        return { ...prev, y: prev.y - 5 };
      });
    }, 100);

    return () => clearInterval(fingerInterval);
  }, []);

  // Auto like animation
  useEffect(() => {
    const likeTimeout = setTimeout(() => {
      setIsLiked(true);
    }, 2000);

    return () => clearTimeout(likeTimeout);
  }, [currentIndex]);

  return (
    <div className="relative w-full h-full">
      {/* Story background */}
      <div className={`absolute inset-0 ${currentStory.video} transition-all duration-500`}>
        {/* Animated food illustration */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-8xl animate-pulse">{currentStory.avatar}</span>
        </div>
      </div>

      {/* Progress bars */}
      <div className="absolute top-10 left-3 right-3 flex gap-1 z-10">
        {MOCK_STORIES.map((_, i) => (
          <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
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
      <div className="absolute top-14 left-3 right-3 flex items-center gap-3 z-10">
        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-xl">
          {currentStory.avatar}
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">{currentStory.establishment}</p>
          <p className="text-white/70 text-xs">há 2h</p>
        </div>
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-white/80" />
          <Play className="w-5 h-5 text-white/80" />
        </div>
      </div>

      {/* Right side actions */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 z-10">
        <button
          className={`flex flex-col items-center transition-transform ${isLiked ? "scale-125" : ""}`}
        >
          <div className={`p-2 rounded-full ${isLiked ? "bg-red-500" : "bg-white/20 backdrop-blur"}`}>
            <Heart className={`w-6 h-6 ${isLiked ? "text-white fill-white" : "text-white"}`} />
          </div>
          <span className="text-white text-xs mt-1">{isLiked ? currentStory.likes + 1 : currentStory.likes}</span>
        </button>
        <button className="flex flex-col items-center">
          <div className="p-2 rounded-full bg-white/20 backdrop-blur">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs mt-1">{currentStory.comments}</span>
        </button>
        <button className="flex flex-col items-center">
          <div className="p-2 rounded-full bg-white/20 backdrop-blur">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs mt-1">Enviar</span>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-4 left-3 right-16 z-10">
        <p className="text-white text-sm mb-3">{currentStory.caption}</p>
        
        {/* Product CTA */}
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full">
          <ShoppingBag className="w-4 h-4 text-zinc-900" />
          <span className="text-zinc-900 text-sm font-semibold">{currentStory.product}</span>
          <span className="text-zinc-600 text-sm">{currentStory.price}</span>
        </button>
      </div>

      {/* Animated finger */}
      {showFinger && (
        <div
          className="absolute z-20 transition-all duration-100 pointer-events-none"
          style={{
            left: `${fingerPosition.x}%`,
            top: `${fingerPosition.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="relative">
            {/* Touch ripple */}
            <div className="absolute inset-0 w-12 h-12 -translate-x-1/4 -translate-y-1/4 rounded-full bg-white/30 animate-ping" />
            {/* Finger icon */}
            <svg
              className="w-10 h-10 text-white drop-shadow-lg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C10.9 2 10 2.9 10 4V9.5C9.4 9.2 8.7 9 8 9C5.8 9 4 10.8 4 13C4 14.5 5.2 15.8 6.5 16.5L5 22H19L17.5 16.5C18.8 15.8 20 14.5 20 13C20 10.8 18.2 9 16 9C15.3 9 14.6 9.2 14 9.5V4C14 2.9 13.1 2 12 2Z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default VilaTokSimulation;
