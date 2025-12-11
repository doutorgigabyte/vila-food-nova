import { QrCode } from "lucide-react";
import { motion } from "framer-motion";

interface QRCodeWithFrameProps {
  url: string;
  primaryColor: string;
  label?: string;
  sublabel?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'product' | 'menu';
  showButton?: boolean;
  buttonText?: string;
}

const sizeConfig = {
  sm: { qr: 80, padding: 8, border: 4, fontSize: 'text-sm' },
  md: { qr: 120, padding: 12, border: 6, fontSize: 'text-base' },
  lg: { qr: 160, padding: 16, border: 8, fontSize: 'text-lg' },
  xl: { qr: 200, padding: 20, border: 10, fontSize: 'text-xl' }
};

export function QRCodeWithFrame({
  url,
  primaryColor,
  label = "Compre pelo QR Code",
  sublabel,
  size = 'lg',
  variant = 'product',
  showButton = true,
  buttonText = "Eu quero!"
}: QRCodeWithFrameProps) {
  const config = sizeConfig[size];
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&color=333333&bgcolor=FFFFFF&margin=1`;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 }}
      className="flex flex-col items-center gap-4"
    >
      {/* QR Code with colored frame */}
      <div 
        className="relative rounded-2xl shadow-2xl"
        style={{
          padding: config.border,
          backgroundColor: primaryColor,
          boxShadow: `0 10px 40px ${primaryColor}50, 0 0 60px ${primaryColor}30`
        }}
      >
        {/* Inner white container */}
        <div 
          className="bg-white rounded-xl overflow-hidden"
          style={{ padding: config.padding }}
        >
          <img 
            src={qrCodeUrl} 
            alt="QR Code" 
            width={config.qr}
            height={config.qr}
            className="block"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </div>
        
        {/* Decorative corner accents */}
        <div 
          className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 rounded-tl-lg"
          style={{ borderColor: 'white' }}
        />
        <div 
          className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 rounded-tr-lg"
          style={{ borderColor: 'white' }}
        />
        <div 
          className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 rounded-bl-lg"
          style={{ borderColor: 'white' }}
        />
        <div 
          className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 rounded-br-lg"
          style={{ borderColor: 'white' }}
        />
      </div>

      {/* Label */}
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-1">
          <QrCode className="w-5 h-5" style={{ color: primaryColor }} />
          <span className={`font-bold ${config.fontSize}`} style={{ color: primaryColor }}>
            {label}
          </span>
        </div>
        {sublabel && (
          <span className="text-sm text-gray-500">{sublabel}</span>
        )}
      </div>

      {/* Optional CTA Button */}
      {showButton && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="px-10 py-4 rounded-full text-white text-2xl font-bold shadow-xl cursor-pointer hover:scale-105 transition-transform"
          style={{ 
            backgroundColor: primaryColor,
            boxShadow: `0 8px 25px ${primaryColor}50`
          }}
        >
          {buttonText}
        </motion.div>
      )}
    </motion.div>
  );
}

// Horizontal layout variant
export function QRCodeWithFrameHorizontal({
  url,
  primaryColor,
  label = "Compre pelo QR Code",
  size = 'md',
  showButton = true,
  buttonText = "Eu quero!"
}: QRCodeWithFrameProps) {
  const config = sizeConfig[size];
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&color=333333&bgcolor=FFFFFF&margin=1`;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
      className="flex items-center gap-6"
    >
      {/* CTA Button */}
      {showButton && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="px-10 py-5 rounded-full text-white text-2xl font-bold shadow-xl"
          style={{ 
            backgroundColor: primaryColor,
            boxShadow: `0 8px 25px ${primaryColor}50`
          }}
        >
          {buttonText}
        </motion.div>
      )}

      {/* QR Code with frame */}
      <div className="flex items-center gap-4">
        <div 
          className="rounded-2xl shadow-2xl"
          style={{
            padding: config.border,
            backgroundColor: primaryColor,
            boxShadow: `0 10px 30px ${primaryColor}40`
          }}
        >
          <div 
            className="bg-white rounded-xl overflow-hidden"
            style={{ padding: config.padding }}
          >
            <img 
              src={qrCodeUrl} 
              alt="QR Code" 
              width={config.qr}
              height={config.qr}
              className="block"
            />
          </div>
        </div>
        
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-gray-500">Escaneie</span>
          <span className={`font-bold ${config.fontSize}`} style={{ color: primaryColor }}>
            {label}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// Preview version for dashboard (smaller)
export function QRCodePreview({ 
  primaryColor, 
  label = "Compre",
  size = 'sm'
}: { 
  primaryColor: string;
  label?: string;
  size?: 'xs' | 'sm';
}) {
  const sizes = {
    xs: { container: 'w-5 h-5', icon: 'w-2 h-2', padding: 'p-0.5', border: 2, text: 'text-[3px]' },
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4', padding: 'p-1', border: 3, text: 'text-[4px]' }
  };
  const cfg = sizes[size];

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div 
        className={`rounded-md ${cfg.padding}`}
        style={{ 
          border: `${cfg.border}px solid ${primaryColor}`,
          backgroundColor: 'white'
        }}
      >
        <div className={`${cfg.container} bg-gray-100 rounded flex items-center justify-center`}>
          <QrCode className={`${cfg.icon} text-gray-400`} />
        </div>
      </div>
      <span className={`${cfg.text} font-bold text-center`} style={{ color: primaryColor }}>
        {label}
      </span>
    </div>
  );
}
