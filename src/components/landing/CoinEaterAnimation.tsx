/**
 * CoinEaterAnimation - Pac-Man style animation eating coins
 * Used in IFoodCalculator to illustrate iFood "eating" revenue
 */

const CoinEaterAnimation = () => {
  return (
    <div className="relative inline-flex items-center h-10 md:h-12 ml-1 overflow-visible">
      {/* Coins coming from the right (lower z-index - will be "eaten") */}
      <div className="absolute -right-2 md:-right-4 flex items-center z-10">
        {/* Coin 1 */}
        <span 
          className="absolute animate-coin-slide text-xl md:text-2xl"
          style={{ animationDelay: '0s' }}
        >
          💰
        </span>
        {/* Coin 2 - delayed */}
        <span 
          className="absolute animate-coin-slide text-xl md:text-2xl"
          style={{ animationDelay: '0.8s' }}
        >
          💰
        </span>
        {/* Coin 3 - more delayed */}
        <span 
          className="absolute animate-coin-slide text-xl md:text-2xl"
          style={{ animationDelay: '1.6s' }}
        >
          💰
        </span>
      </div>
      
      {/* Pac-Man SVG with animated mouth (higher z-index - eats the coins) */}
      <div className="relative z-20">
        <svg 
          viewBox="0 0 100 100" 
          className="w-10 h-10 md:w-12 md:h-12"
        >
          {/* Pac-Man body - semi-circle with animated mouth */}
          <g className="origin-center" style={{ transform: 'scaleX(-1) translateX(-100%)' }}>
            {/* Top jaw */}
            <path
              d="M50 50 L95 50 A45 45 0 0 0 50 5 Z"
              fill="hsl(var(--destructive))"
              className="animate-chomp-top origin-center"
              style={{ transformOrigin: '50px 50px' }}
            />
            {/* Bottom jaw */}
            <path
              d="M50 50 L95 50 A45 45 0 0 1 50 95 Z"
              fill="hsl(var(--destructive))"
              className="animate-chomp-bottom origin-center"
              style={{ transformOrigin: '50px 50px' }}
            />
            {/* Eye */}
            <circle cx="55" cy="25" r="6" fill="white" />
            <circle cx="57" cy="23" r="3" fill="hsl(220, 20%, 15%)" />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default CoinEaterAnimation;
