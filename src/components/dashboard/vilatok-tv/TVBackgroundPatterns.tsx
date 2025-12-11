import { motion } from "framer-motion";

// Gradient background with multiple layers
export function GradientBackground({ 
  primaryColor, 
  secondaryColor = "#F5E6D3",
  variant = "radial"
}: { 
  primaryColor: string; 
  secondaryColor?: string;
  variant?: "radial" | "diagonal" | "mesh";
}) {
  if (variant === "mesh") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, ${primaryColor}40 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, ${primaryColor}30 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, ${primaryColor}20 0%, transparent 60%),
              linear-gradient(135deg, ${secondaryColor} 0%, ${secondaryColor}ee 100%)
            `
          }}
        />
      </div>
    );
  }

  if (variant === "diagonal") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(135deg, ${primaryColor}15 0%, transparent 50%),
              linear-gradient(-45deg, ${primaryColor}10 0%, transparent 50%),
              ${secondaryColor}
            `
          }}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 0%, ${primaryColor}25 0%, transparent 60%),
            radial-gradient(ellipse at 100% 100%, ${primaryColor}20 0%, transparent 50%),
            ${secondaryColor}
          `
        }}
      />
    </div>
  );
}

// Animated wave lines pattern
export function WaveLines({ 
  color, 
  opacity = 0.15,
  animated = true 
}: { 
  color: string; 
  opacity?: number;
  animated?: boolean;
}) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="none"
      style={{ opacity }}
    >
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <motion.path
          key={i}
          d={`M-100 ${120 + i * 120} Q 480 ${40 + i * 120} 960 ${120 + i * 120} T 2020 ${120 + i * 120}`}
          fill="none"
          stroke={color}
          strokeWidth={60 - i * 5}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={animated ? { 
            pathLength: 1,
            pathOffset: [0, 0.1, 0]
          } : { pathLength: 1 }}
          transition={animated ? {
            pathLength: { duration: 1.5, delay: i * 0.1 },
            pathOffset: { duration: 8, repeat: Infinity, ease: "easeInOut" }
          } : { duration: 0.5 }}
        />
      ))}
    </svg>
  );
}

// Geometric shapes pattern
export function GeometricShapes({ 
  color, 
  variant = "circles" 
}: { 
  color: string;
  variant?: "circles" | "diamonds" | "mixed";
}) {
  const shapes = variant === "circles" ? (
    <>
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full border-[40px] opacity-10" style={{ borderColor: color }} />
      <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full border-[60px] opacity-5" style={{ borderColor: color }} />
      <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full border-[20px] opacity-8" style={{ borderColor: color }} />
    </>
  ) : variant === "diamonds" ? (
    <>
      <div className="absolute -top-20 right-1/4 w-40 h-40 rotate-45 border-[15px] opacity-10" style={{ borderColor: color }} />
      <div className="absolute bottom-1/4 -left-20 w-60 h-60 rotate-45 border-[20px] opacity-5" style={{ borderColor: color }} />
      <div className="absolute top-1/2 right-1/3 w-32 h-32 rotate-45 border-[10px] opacity-8" style={{ borderColor: color }} />
    </>
  ) : (
    <>
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full border-[30px] opacity-10" style={{ borderColor: color }} />
      <div className="absolute bottom-1/4 -left-20 w-48 h-48 rotate-45 border-[15px] opacity-8" style={{ borderColor: color }} />
      <div className="absolute top-1/3 left-1/3 w-24 h-24 rounded-full bg-current opacity-5" style={{ color }} />
    </>
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {shapes}
    </div>
  );
}

// Noise/grain texture overlay
export function NoiseTexture({ opacity = 0.03 }: { opacity?: number }) {
  return (
    <div 
      className="absolute inset-0 pointer-events-none mix-blend-multiply"
      style={{
        opacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '128px 128px'
      }}
    />
  );
}

// Animated dots pattern
export function AnimatedDots({ 
  color, 
  count = 20 
}: { 
  color: string;
  count?: number;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            backgroundColor: color,
            width: 8 + Math.random() * 24,
            height: 8 + Math.random() * 24,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          initial={{ opacity: 0.05, scale: 1 }}
          animate={{
            opacity: [0.05, 0.15, 0.05],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}
    </div>
  );
}

// Blob shapes component
export function BlobShapes({ 
  color, 
  variant = "default" 
}: { 
  color: string;
  variant?: "default" | "large" | "scattered";
}) {
  const BlobSVG = ({ className }: { className: string }) => (
    <svg className={className} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <path fill={color} d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.1,73.1,42.1C64.8,55.1,53.8,66.4,40.4,74.4C27,82.4,13.5,87,-0.7,88.2C-14.9,89.4,-29.8,87.2,-42.8,79.8C-55.8,72.4,-66.9,59.8,-74.5,45.5C-82.1,31.2,-86.2,15.6,-86.8,-0.3C-87.4,-16.3,-84.4,-32.6,-76.4,-46C-68.4,-59.4,-55.3,-69.9,-41,-76.8C-26.7,-83.7,-13.3,-87,-0.2,-86.7C12.9,-86.4,25.8,-82.5,44.7,-76.4Z" transform="translate(100 100)" />
    </svg>
  );

  if (variant === "large") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <BlobSVG className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] opacity-15" />
        <BlobSVG className="absolute -bottom-1/3 -right-1/4 w-[900px] h-[900px] opacity-10" />
      </div>
    );
  }

  if (variant === "scattered") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <BlobSVG className="absolute -top-20 -left-20 w-64 h-64 opacity-20" />
        <BlobSVG className="absolute top-1/4 right-1/4 w-48 h-48 opacity-15" />
        <BlobSVG className="absolute -bottom-20 left-1/3 w-56 h-56 opacity-12" />
        <BlobSVG className="absolute bottom-1/4 -right-10 w-40 h-40 opacity-18" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <BlobSVG className="absolute -top-32 -left-32 w-96 h-96 opacity-20" />
      <BlobSVG className="absolute -bottom-48 -right-48 w-[600px] h-[600px] opacity-15" />
    </div>
  );
}

// Stripe lines pattern  
export function StripeLines({ 
  color,
  angle = 45,
  spacing = 60,
  thickness = 2
}: {
  color: string;
  angle?: number;
  spacing?: number;
  thickness?: number;
}) {
  return (
    <div 
      className="absolute inset-0 pointer-events-none opacity-[0.08]"
      style={{
        backgroundImage: `repeating-linear-gradient(
          ${angle}deg,
          ${color} 0px,
          ${color} ${thickness}px,
          transparent ${thickness}px,
          transparent ${spacing}px
        )`
      }}
    />
  );
}
