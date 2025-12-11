/**
 * CoinEaterAnimation - Pac-Man style animation eating coins
 * Used in IFoodCalculator to illustrate iFood "eating" revenue
 */

const CoinEaterAnimation = () => {
  return (
    <div className="relative inline-flex items-center h-12 md:h-14 ml-2">
      {/* Pac-Man - positioned left */}
      <div className="relative z-20 flex-shrink-0">
        <div 
          className="w-10 h-10 md:w-12 md:h-12 bg-destructive rounded-full animate-pacman-chomp"
          style={{
            clipPath: 'polygon(100% 50%, 75% 15%, 0% 0%, 0% 100%, 75% 85%)'
          }}
        />
        {/* Eye */}
        <div className="absolute top-1.5 md:top-2 left-4 md:left-5 w-1.5 h-1.5 md:w-2 md:h-2 bg-background rounded-full" />
      </div>
      
      {/* Coins coming from the right - aligned in a row */}
      <div className="relative flex items-center gap-1 ml-1 z-10">
        <div className="animate-coin-slide" style={{ animationDelay: '0s' }}>
          <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 40 40">
            <defs>
              <radialGradient id="coinGrad">
                <stop offset="0%" stopColor="#ffd700" />
                <stop offset="100%" stopColor="#daa520" />
              </radialGradient>
            </defs>
            <circle cx="20" cy="20" r="18" fill="url(#coinGrad)" stroke="#b8860b" strokeWidth="2" />
            <text x="20" y="27" fontSize="18" fontWeight="bold" fill="#8b6914" textAnchor="middle" fontFamily="Arial">$</text>
          </svg>
        </div>
        <div className="animate-coin-slide" style={{ animationDelay: '0.8s' }}>
          <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" fill="url(#coinGrad)" stroke="#b8860b" strokeWidth="2" />
            <text x="20" y="27" fontSize="18" fontWeight="bold" fill="#8b6914" textAnchor="middle" fontFamily="Arial">$</text>
          </svg>
        </div>
        <div className="animate-coin-slide" style={{ animationDelay: '1.6s' }}>
          <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" fill="url(#coinGrad)" stroke="#b8860b" strokeWidth="2" />
            <text x="20" y="27" fontSize="18" fontWeight="bold" fill="#8b6914" textAnchor="middle" fontFamily="Arial">$</text>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default CoinEaterAnimation;
