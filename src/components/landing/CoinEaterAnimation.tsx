/**
 * CoinEaterAnimation - Pac-Man style animation eating coins
 * Used in IFoodCalculator to illustrate iFood "eating" revenue
 */

const CoinEaterAnimation = () => {
  return (
    <div className="relative inline-flex items-center h-8 md:h-10 ml-2">
      {/* Coins coming from the right (lower z-index) */}
      <div className="absolute right-0 flex items-center">
        {/* Coin 1 */}
        <span className="absolute animate-coin-slide text-lg md:text-2xl" style={{ animationDelay: '0s' }}>
          🪙
        </span>
        {/* Coin 2 - delayed */}
        <span className="absolute animate-coin-slide text-lg md:text-2xl" style={{ animationDelay: '0.8s' }}>
          🪙
        </span>
        {/* Coin 3 - more delayed */}
        <span className="absolute animate-coin-slide text-lg md:text-2xl" style={{ animationDelay: '1.6s' }}>
          🪙
        </span>
      </div>
      
      {/* Pac-Man SVG (higher z-index - eats the coins) */}
      <div className="relative z-20 animate-chomp">
        <svg 
          viewBox="0 0 100 100" 
          className="w-8 h-8 md:w-10 md:h-10"
          style={{ transform: 'scaleX(-1)' }} // Face right to eat coins
        >
          {/* Pac-Man body */}
          <path
            d="M50 10
               A40 40 0 1 1 50 90
               A40 40 0 1 1 50 10
               L50 50
               L85 30
               A40 40 0 0 0 85 70
               L50 50
               Z"
            fill="hsl(var(--destructive))"
            className="origin-center"
          />
          {/* Eye */}
          <circle cx="45" cy="30" r="6" fill="white" />
          <circle cx="47" cy="28" r="3" fill="hsl(220, 20%, 10%)" />
        </svg>
      </div>
    </div>
  );
};

export default CoinEaterAnimation;
