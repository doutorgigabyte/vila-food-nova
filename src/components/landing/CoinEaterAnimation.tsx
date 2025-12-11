/**
 * CoinEaterAnimation - Pac-Man style animation eating coins
 * Used in IFoodCalculator to illustrate iFood "eating" revenue
 */

const CoinEaterAnimation = () => {
  return (
    <div className="relative inline-flex items-center justify-center w-16 h-10 md:w-20 md:h-12 ml-1">
      {/* Coins coming from the right (lower z-index - will be "eaten") */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
        <span 
          className="absolute animate-coin-slide text-lg md:text-xl"
          style={{ animationDelay: '0s' }}
        >
          🪙
        </span>
        <span 
          className="absolute animate-coin-slide text-lg md:text-xl"
          style={{ animationDelay: '0.8s' }}
        >
          🪙
        </span>
        <span 
          className="absolute animate-coin-slide text-lg md:text-xl"
          style={{ animationDelay: '1.6s' }}
        >
          🪙
        </span>
      </div>
      
      {/* Pac-Man using conic-gradient - guaranteed to work */}
      <div className="relative z-20">
        <div 
          className="w-10 h-10 md:w-12 md:h-12 rounded-full animate-pacman"
          style={{
            background: `conic-gradient(
              hsl(var(--destructive)) 0deg,
              hsl(var(--destructive)) 30deg,
              transparent 30deg,
              transparent 330deg,
              hsl(var(--destructive)) 330deg
            )`
          }}
        />
        {/* Eye */}
        <div className="absolute top-1.5 md:top-2 left-1/2 w-2 h-2 md:w-2.5 md:h-2.5 bg-white rounded-full">
          <div className="absolute top-0.5 right-0 w-1 h-1 bg-[hsl(220,20%,15%)] rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default CoinEaterAnimation;
