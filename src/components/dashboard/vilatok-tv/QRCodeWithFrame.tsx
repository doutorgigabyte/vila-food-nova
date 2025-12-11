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

// Tamanhos otimizados para visualização em TV
const sizeConfig = {
  sm: { qr: 100, padding: 10, border: 5, fontSize: 'text-lg', buttonPadding: 'px-8 py-3', buttonText: 'text-xl' },
  md: { qr: 140, padding: 14, border: 7, fontSize: 'text-xl', buttonPadding: 'px-10 py-4', buttonText: 'text-2xl' },
  lg: { qr: 180, padding: 18, border: 9, fontSize: 'text-2xl', buttonPadding: 'px-12 py-5', buttonText: 'text-3xl' },
  xl: { qr: 220, padding: 22, border: 11, fontSize: 'text-3xl', buttonPadding: 'px-14 py-6', buttonText: 'text-4xl' }
};

// QR Code do Produto com moldura colorida + Botão "Eu quero!" lado a lado
export function QRCodeWithFrame({
  url,
  primaryColor,
  label = "COMPRE AQUI",
  sublabel,
  size = 'lg',
  variant = 'product',
  showButton = true,
  buttonText = "Eu quero!"
}: QRCodeWithFrameProps) {
  const config = sizeConfig[size];
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}&color=333333&bgcolor=FFFFFF&margin=1`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="flex items-center gap-8"
    >
      {/* QR Code com moldura colorida */}
      <div className="flex flex-col items-center gap-3">
        <span 
          className={`${config.fontSize} font-bold uppercase tracking-wider`}
          style={{ color: primaryColor }}
        >
          {label}
        </span>
        <div 
          className="rounded-2xl shadow-2xl"
          style={{
            padding: config.border,
            backgroundColor: primaryColor,
            boxShadow: `0 15px 50px ${primaryColor}50, 0 0 80px ${primaryColor}25`
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
              style={{ imageRendering: 'crisp-edges' }}
            />
          </div>
        </div>
        {sublabel && (
          <span className="text-lg text-gray-500 text-center">{sublabel}</span>
        )}
      </div>

      {/* Botão "Eu quero!" */}
      {showButton && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className={`${config.buttonPadding} rounded-full text-white ${config.buttonText} font-black shadow-2xl cursor-pointer hover:scale-105 transition-transform`}
          style={{ 
            backgroundColor: primaryColor,
            boxShadow: `0 12px 40px ${primaryColor}50`
          }}
        >
          {buttonText}
        </motion.div>
      )}
    </motion.div>
  );
}

// Layout horizontal compacto para templates escuros
export function QRCodeCompact({
  url,
  primaryColor,
  buttonText = "Eu quero!",
  size = 'md'
}: {
  url: string;
  primaryColor: string;
  buttonText?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = {
    sm: { qr: 80, button: 'text-xl px-6 py-3' },
    md: { qr: 110, button: 'text-2xl px-10 py-4' },
    lg: { qr: 140, button: 'text-3xl px-12 py-5' }
  };
  const cfg = sizes[size];
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&color=333333&bgcolor=FFFFFF&margin=1`;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
      className="flex items-center gap-6"
    >
      <div 
        className={`${cfg.button} rounded-full text-white font-black shadow-xl`}
        style={{ backgroundColor: primaryColor }}
      >
        {buttonText}
      </div>
      <div 
        className="bg-white p-3 rounded-xl shadow-xl border-4"
        style={{ borderColor: primaryColor }}
      >
        <img src={qrCodeUrl} alt="QR Code" width={cfg.qr} height={cfg.qr} />
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
