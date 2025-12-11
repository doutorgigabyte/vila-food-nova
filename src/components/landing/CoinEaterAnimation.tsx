/**
 * CoinEaterAnimation - Pac-Man style animation eating coins
 * Used in IFoodCalculator to illustrate iFood "eating" revenue
 */

const CoinEaterAnimation = () => {
  return (
    <div className="relative inline-flex items-center justify-center w-20 h-12 md:w-24 md:h-14 ml-2">
      {/* Coins coming from the right */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
        <svg className="absolute w-6 h-6 md:w-7 md:h-7 animate-coin-slide" viewBox="0 0 40 40" style={{ animationDelay: '0s' }}>
          <defs>
            <radialGradient id="coinGrad1">
              <stop offset="0%" stopColor="#ffd700" />
              <stop offset="100%" stopColor="#daa520" />
            </radialGradient>
          </defs>
          <circle cx="20" cy="20" r="18" fill="url(#coinGrad1)" stroke="#daa520" strokeWidth="2" />
          <text x="20" y="27" fontSize="18" fontWeight="bold" fill="#000" textAnchor="middle" fontFamily="Arial">$</text>
        </svg>
        <svg className="absolute w-6 h-6 md:w-7 md:h-7 animate-coin-slide" viewBox="0 0 40 40" style={{ animationDelay: '0.8s' }}>
          <circle cx="20" cy="20" r="18" fill="url(#coinGrad1)" stroke="#daa520" strokeWidth="2" />
          <text x="20" y="27" fontSize="18" fontWeight="bold" fill="#000" textAnchor="middle" fontFamily="Arial">$</text>
        </svg>
        <svg className="absolute w-6 h-6 md:w-7 md:h-7 animate-coin-slide" viewBox="0 0 40 40" style={{ animationDelay: '1.6s' }}>
          <circle cx="20" cy="20" r="18" fill="url(#coinGrad1)" stroke="#daa520" strokeWidth="2" />
          <text x="20" y="27" fontSize="18" fontWeight="bold" fill="#000" textAnchor="middle" fontFamily="Arial">$</text>
        </svg>
      </div>
      
      {/* Pac-Man with CSS clip-path animation */}
      <div className="relative z-20">
        <div 
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-destructive animate-pacman-chomp"
        >
          {/* Eye */}
          <div className="absolute top-2 left-1/2 w-2 h-2 bg-background rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default CoinEaterAnimation;
