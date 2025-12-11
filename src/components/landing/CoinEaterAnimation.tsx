/**
 * CoinEaterAnimation - Pac-Man style animation eating coins
 * Used in IFoodCalculator to illustrate iFood "eating" revenue
 */

const CoinEaterAnimation = () => {
  return (
    <svg viewBox="150 150 700 100" xmlns="http://www.w3.org/2000/svg" className="w-44 h-8 md:w-56 md:h-10 inline-block ml-2">
      <defs>
        <radialGradient id="coinGradient">
          <stop offset="0%" style={{ stopColor: '#ffd700', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#daa520', stopOpacity: 1 }} />
        </radialGradient>
      </defs>
      
      {/* Pac-Man */}
      <g id="pacman">
        <circle cx="200" cy="200" r="40" fill="#ea0000"/>
        <path d="M 200,200 L 240,160 A 40,40 0 0,0 240,240 Z" fill="#1a1a1a">
          <animate 
            attributeName="d" 
            dur="0.3s" 
            repeatCount="indefinite"
            values="M 200,200 L 240,200 A 40,40 0 0,0 240,200 Z;
                    M 200,200 L 240,160 A 40,40 0 0,0 240,240 Z;
                    M 200,200 L 240,200 A 40,40 0 0,0 240,200 Z" 
          />
        </path>
      </g>
      
      {/* Moedas com cifrão */}
      <g id="coins">
        {/* Moeda 1 */}
        <g className="coin">
          <circle cx="800" cy="200" r="20" fill="url(#coinGradient)" stroke="#daa520" strokeWidth="2">
            <animate attributeName="cx" from="800" to="200" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.95;1" dur="3s" repeatCount="indefinite"/>
          </circle>
          <text x="800" y="208" fontSize="24" fontWeight="bold" fill="#000" textAnchor="middle" fontFamily="Arial">$
            <animate attributeName="x" from="800" to="200" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.95;1" dur="3s" repeatCount="indefinite"/>
          </text>
        </g>
        
        {/* Moeda 2 */}
        <g className="coin">
          <circle cx="800" cy="200" r="20" fill="url(#coinGradient)" stroke="#daa520" strokeWidth="2">
            <animate attributeName="cx" from="800" to="200" dur="3s" repeatCount="indefinite" begin="1s"/>
            <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.95;1" dur="3s" repeatCount="indefinite" begin="1s"/>
          </circle>
          <text x="800" y="208" fontSize="24" fontWeight="bold" fill="#000" textAnchor="middle" fontFamily="Arial">$
            <animate attributeName="x" from="800" to="200" dur="3s" repeatCount="indefinite" begin="1s"/>
            <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.95;1" dur="3s" repeatCount="indefinite" begin="1s"/>
          </text>
        </g>
        
        {/* Moeda 3 */}
        <g className="coin">
          <circle cx="800" cy="200" r="20" fill="url(#coinGradient)" stroke="#daa520" strokeWidth="2">
            <animate attributeName="cx" from="800" to="200" dur="3s" repeatCount="indefinite" begin="2s"/>
            <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.95;1" dur="3s" repeatCount="indefinite" begin="2s"/>
          </circle>
          <text x="800" y="208" fontSize="24" fontWeight="bold" fill="#000" textAnchor="middle" fontFamily="Arial">$
            <animate attributeName="x" from="800" to="200" dur="3s" repeatCount="indefinite" begin="2s"/>
            <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.95;1" dur="3s" repeatCount="indefinite" begin="2s"/>
          </text>
        </g>
        
        {/* Moeda 4 */}
        <g className="coin">
          <circle cx="800" cy="180" r="20" fill="url(#coinGradient)" stroke="#daa520" strokeWidth="2">
            <animate attributeName="cx" from="800" to="200" dur="2.8s" repeatCount="indefinite" begin="0.5s"/>
            <animate attributeName="cy" from="180" to="200" dur="2.8s" repeatCount="indefinite" begin="0.5s"/>
            <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.95;1" dur="2.8s" repeatCount="indefinite" begin="0.5s"/>
          </circle>
          <text x="800" y="188" fontSize="24" fontWeight="bold" fill="#000" textAnchor="middle" fontFamily="Arial">$
            <animate attributeName="x" from="800" to="200" dur="2.8s" repeatCount="indefinite" begin="0.5s"/>
            <animate attributeName="y" from="188" to="208" dur="2.8s" repeatCount="indefinite" begin="0.5s"/>
            <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.95;1" dur="2.8s" repeatCount="indefinite" begin="0.5s"/>
          </text>
        </g>
        
        {/* Moeda 5 */}
        <g className="coin">
          <circle cx="800" cy="220" r="20" fill="url(#coinGradient)" stroke="#daa520" strokeWidth="2">
            <animate attributeName="cx" from="800" to="200" dur="3.2s" repeatCount="indefinite" begin="1.5s"/>
            <animate attributeName="cy" from="220" to="200" dur="3.2s" repeatCount="indefinite" begin="1.5s"/>
            <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.95;1" dur="3.2s" repeatCount="indefinite" begin="1.5s"/>
          </circle>
          <text x="800" y="228" fontSize="24" fontWeight="bold" fill="#000" textAnchor="middle" fontFamily="Arial">$
            <animate attributeName="x" from="800" to="200" dur="3.2s" repeatCount="indefinite" begin="1.5s"/>
            <animate attributeName="y" from="228" to="208" dur="3.2s" repeatCount="indefinite" begin="1.5s"/>
            <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.95;1" dur="3.2s" repeatCount="indefinite" begin="1.5s"/>
          </text>
        </g>
      </g>
    </svg>
  );
};

export default CoinEaterAnimation;
