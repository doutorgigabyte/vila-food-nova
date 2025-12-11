import { motion } from "framer-motion";

// ========== PADRÕES MINIMALISTAS ==========
export function CleanMinimalBackground({ color = "#ffffff" }: { color?: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: color }}>
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/5 to-transparent" />
    </div>
  );
}

export function ZenLines({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute h-[1px] w-full"
          style={{
            backgroundColor: color,
            top: `${20 + i * 15}%`,
          }}
        />
      ))}
    </div>
  );
}

// ========== PADRÕES VIBRANTES ==========
export function NeonGlow({ primaryColor, accentColor }: { primaryColor: string; accentColor: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden bg-gray-950">
      <motion.div
        className="absolute w-96 h-96 rounded-full blur-[120px] opacity-60"
        style={{ backgroundColor: primaryColor, left: '10%', top: '20%' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute w-80 h-80 rounded-full blur-[100px] opacity-50"
        style={{ backgroundColor: accentColor, right: '15%', bottom: '25%' }}
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
        transition={{ duration: 5, repeat: Infinity }}
      />
    </div>
  );
}

export function PopArtDots({ color }: { color: string }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-20"
      style={{
        backgroundImage: `radial-gradient(${color} 8px, transparent 8px)`,
        backgroundSize: '40px 40px',
      }}
    />
  );
}

export function GradientBurst({ colors }: { colors: string[] }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `conic-gradient(from 180deg at 50% 50%, ${colors.join(', ')})`,
          filter: 'blur(80px)',
          opacity: 0.4,
        }}
      />
    </div>
  );
}

export function DynamicSplash({ color }: { color: string }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 1920 1080" preserveAspectRatio="none">
      <path
        d="M0,400 Q300,200 600,400 T1200,350 T1920,450 L1920,1080 L0,1080 Z"
        fill={color}
        opacity={0.3}
      />
      <path
        d="M0,600 Q400,450 800,550 T1600,500 T1920,600 L1920,1080 L0,1080 Z"
        fill={color}
        opacity={0.2}
      />
    </svg>
  );
}

// ========== PADRÕES VINTAGE ==========
export function Retro70sPattern({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full border-[20px] opacity-10"
          style={{
            borderColor: color,
            width: `${200 + i * 150}px`,
            height: `${200 + i * 150}px`,
            left: `${-50 + i * 5}%`,
            top: `${50 - i * 10}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
}

export function VintageFilmGrain() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 via-transparent to-amber-900/20" />
    </div>
  );
}

export function ArtDecoPattern({ color }: { color: string }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15" viewBox="0 0 1920 1080" preserveAspectRatio="none">
      {/* Fan patterns */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${480 * i}, 0)`}>
          <path d="M240 0 L240 200 L0 0 Z" fill={color} />
          <path d="M240 0 L240 200 L480 0 Z" fill={color} />
          <path d="M240 1080 L240 880 L0 1080 Z" fill={color} />
          <path d="M240 1080 L240 880 L480 1080 Z" fill={color} />
        </g>
      ))}
    </svg>
  );
}

export function RusticWoodTexture() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            #8B4513 0px,
            #8B4513 2px,
            transparent 2px,
            transparent 20px
          )`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-amber-800/20 to-amber-950/30" />
    </div>
  );
}

// ========== PADRÕES DE DATAS COMEMORATIVAS ==========
export function ChristmasPattern() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Flocos de neve */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-white/30 text-4xl"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{ 
            y: [0, 20, 0], 
            rotate: [0, 180, 360],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ 
            duration: 4 + Math.random() * 3, 
            repeat: Infinity,
            delay: Math.random() * 2
          }}
        >
          ❄
        </motion.div>
      ))}
    </div>
  );
}

export function EasterPattern() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-4xl"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          initial={{ scale: 0, rotate: Math.random() * 30 - 15 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          {i % 3 === 0 ? '🥚' : i % 3 === 1 ? '🐰' : '🌸'}
        </motion.div>
      ))}
    </div>
  );
}

export function ValentinesPattern() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-red-400/40"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            fontSize: `${20 + Math.random() * 40}px`,
          }}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            duration: 2 + Math.random() * 2, 
            repeat: Infinity,
            delay: Math.random() * 2
          }}
        >
          ♥
        </motion.div>
      ))}
    </div>
  );
}

export function SaoJoaoPattern() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Bandeirinhas */}
      <svg className="absolute top-0 left-0 right-0 h-32 opacity-60" viewBox="0 0 1920 100" preserveAspectRatio="none">
        {[...Array(20)].map((_, i) => (
          <g key={i}>
            <path
              d={`M${i * 100} 20 L${i * 100 + 30} 80 L${i * 100 + 60} 20`}
              fill={i % 4 === 0 ? '#ef4444' : i % 4 === 1 ? '#22c55e' : i % 4 === 2 ? '#eab308' : '#3b82f6'}
            />
          </g>
        ))}
        <line x1="0" y1="20" x2="1920" y2="20" stroke="#78350f" strokeWidth="4" />
      </svg>
      {/* Estrelas */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-yellow-400/40 text-3xl"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${20 + Math.random() * 70}%`,
          }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 2 }}
        >
          ⭐
        </motion.div>
      ))}
    </div>
  );
}

export function CarnivalPattern() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Confetes */}
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-8 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: ['#ef4444', '#22c55e', '#eab308', '#3b82f6', '#a855f7', '#ec4899'][Math.floor(Math.random() * 6)],
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
          animate={{ 
            y: [0, 100],
            rotate: [0, 360],
            opacity: [0.8, 0]
          }}
          transition={{ 
            duration: 3 + Math.random() * 2, 
            repeat: Infinity,
            delay: Math.random() * 3
          }}
        />
      ))}
    </div>
  );
}

export function HalloweenPattern() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden bg-gradient-to-b from-orange-950/80 to-gray-950">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-5xl opacity-30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ 
            duration: 3 + Math.random() * 2, 
            repeat: Infinity,
            delay: Math.random() * 2
          }}
        >
          {i % 3 === 0 ? '🎃' : i % 3 === 1 ? '🦇' : '👻'}
        </motion.div>
      ))}
    </div>
  );
}

// ========== PADRÕES REGIONAIS NORDESTE ==========
export function BeachWaves({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.svg 
        className="absolute bottom-0 left-0 right-0 h-1/3" 
        viewBox="0 0 1920 400" 
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0,200 Q240,100 480,200 T960,200 T1440,200 T1920,200 L1920,400 L0,400 Z"
          fill={color}
          opacity={0.3}
          animate={{ d: [
            "M0,200 Q240,100 480,200 T960,200 T1440,200 T1920,200 L1920,400 L0,400 Z",
            "M0,200 Q240,300 480,200 T960,200 T1440,200 T1920,200 L1920,400 L0,400 Z",
            "M0,200 Q240,100 480,200 T960,200 T1440,200 T1920,200 L1920,400 L0,400 Z",
          ]}}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.path
          d="M0,250 Q240,150 480,250 T960,250 T1440,250 T1920,250 L1920,400 L0,400 Z"
          fill={color}
          opacity={0.5}
          animate={{ d: [
            "M0,250 Q240,150 480,250 T960,250 T1440,250 T1920,250 L1920,400 L0,400 Z",
            "M0,250 Q240,350 480,250 T960,250 T1440,250 T1920,250 L1920,400 L0,400 Z",
            "M0,250 Q240,150 480,250 T960,250 T1440,250 T1920,250 L1920,400 L0,400 Z",
          ]}}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        />
      </motion.svg>
    </div>
  );
}

export function PalmTrees() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg className="absolute bottom-0 left-0 h-2/3 opacity-20" viewBox="0 0 200 400" preserveAspectRatio="xMinYMax meet">
        <path d="M100,400 L100,200" stroke="#166534" strokeWidth="12" />
        <ellipse cx="60" cy="180" rx="50" ry="15" fill="#22c55e" transform="rotate(-30 60 180)" />
        <ellipse cx="140" cy="180" rx="50" ry="15" fill="#22c55e" transform="rotate(30 140 180)" />
        <ellipse cx="100" cy="160" rx="50" ry="15" fill="#22c55e" transform="rotate(-5 100 160)" />
        <ellipse cx="50" cy="200" rx="45" ry="12" fill="#22c55e" transform="rotate(-45 50 200)" />
        <ellipse cx="150" cy="200" rx="45" ry="12" fill="#22c55e" transform="rotate(45 150 200)" />
      </svg>
      <svg className="absolute bottom-0 right-0 h-1/2 opacity-15" viewBox="0 0 200 400" preserveAspectRatio="xMaxYMax meet">
        <path d="M100,400 L100,250" stroke="#166534" strokeWidth="10" />
        <ellipse cx="60" cy="230" rx="40" ry="12" fill="#22c55e" transform="rotate(-30 60 230)" />
        <ellipse cx="140" cy="230" rx="40" ry="12" fill="#22c55e" transform="rotate(30 140 230)" />
        <ellipse cx="100" cy="215" rx="40" ry="12" fill="#22c55e" transform="rotate(-5 100 215)" />
      </svg>
    </div>
  );
}

export function SunsetGradient() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-b from-orange-400/60 via-pink-500/40 to-purple-900/80" />
      {/* Sol */}
      <motion.div
        className="absolute w-48 h-48 rounded-full bg-gradient-to-b from-yellow-300 to-orange-500"
        style={{ left: '50%', bottom: '20%', transform: 'translateX(-50%)' }}
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </div>
  );
}

export function TropicalFruits() {
  const fruits = ['🥭', '🍍', '🥥', '🍋', '🍊', '🍌'];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-4xl opacity-40"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: Math.random() * 2 }}
        >
          {fruits[Math.floor(Math.random() * fruits.length)]}
        </motion.div>
      ))}
    </div>
  );
}

export function NordesteTexture({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Padrão de renda/bordado */}
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
        <pattern id="renda" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="8" fill="none" stroke={color} strokeWidth="1" />
          <circle cx="0" cy="0" r="4" fill="none" stroke={color} strokeWidth="0.5" />
          <circle cx="20" cy="0" r="4" fill="none" stroke={color} strokeWidth="0.5" />
          <circle cx="0" cy="20" r="4" fill="none" stroke={color} strokeWidth="0.5" />
          <circle cx="20" cy="20" r="4" fill="none" stroke={color} strokeWidth="0.5" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#renda)" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-br from-amber-100/30 to-orange-200/20" />
    </div>
  );
}

// ========== PADRÕES MEDIANOS/EQUILIBRADOS ==========
export function ModernCleanGradient({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${color}15 0%, transparent 50%, ${color}10 100%)`,
        }}
      />
    </div>
  );
}

export function WarmCozyGradient() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(251,191,36,0.15),transparent_60%)]" />
    </div>
  );
}

export function FreshGreenGradient() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(34,197,94,0.15),transparent_60%)]" />
    </div>
  );
}

export function GlassMorphism({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute top-1/4 -left-20 w-96 h-96 rounded-full blur-3xl opacity-30"
        style={{ backgroundColor: color }}
      />
      <div
        className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}
