import { QrCode } from "lucide-react";
import { motion } from "framer-motion";
import { StyledQRCode, isLightColor } from "@/components/ui/StyledQRCode";

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
  const safeColor = primaryColor || '#ea580c';
  
  // Calcular cor do texto baseado no contraste - garantir sempre visibilidade
  const isLightBg = isLightColor(safeColor);
  const buttonTextColor = isLightBg ? '#1f2937' : '#ffffff';
  // Para label e moldura em templates escuros, manter a cor original
  // Para QR code que aparece em fundo branco, StyledQRCode já faz a inversão se necessário
  const labelColor = isLightBg ? '#1f2937' : safeColor;
  const frameColor = isLightBg ? '#333333' : safeColor;

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
          style={{ color: labelColor }}
        >
          {label}
        </span>
        <div 
          className="rounded-2xl shadow-2xl"
          style={{
            padding: config.border,
            backgroundColor: frameColor,
            boxShadow: isLightBg ? '0 15px 50px rgba(0,0,0,0.2)' : `0 15px 50px ${safeColor}50, 0 0 80px ${safeColor}25`
          }}
        >
          <div 
            className="bg-white rounded-xl overflow-hidden flex items-center justify-center"
            style={{ padding: config.padding }}
          >
            <StyledQRCode 
              url={url}
              size={config.qr}
              primaryColor={safeColor}
            />
          </div>
        </div>
        {sublabel && (
          <span className="text-lg text-gray-500 text-center">{sublabel}</span>
        )}
      </div>

      {/* Botão "Eu quero!" - Sempre visível com contraste garantido */}
      {showButton && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className={`${config.buttonPadding} rounded-full ${config.buttonText} font-black shadow-2xl cursor-pointer hover:scale-105 transition-transform whitespace-nowrap`}
          style={{ 
            backgroundColor: safeColor,
            color: buttonTextColor,
            boxShadow: `0 12px 40px ${safeColor}50`
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
  const safeColor = primaryColor || '#ea580c';
  
  // Calcular cor do texto baseado no contraste - garantir sempre visibilidade
  const isLightBg = isLightColor(safeColor);
  const buttonTextColor = isLightBg ? '#1f2937' : '#ffffff';
  const borderColor = isLightBg ? '#333333' : safeColor;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
      className="flex items-center gap-6"
    >
      <div 
        className={`${cfg.button} rounded-full font-black shadow-xl whitespace-nowrap`}
        style={{ backgroundColor: isLightBg ? '#333333' : safeColor, color: isLightBg ? '#ffffff' : buttonTextColor }}
      >
        {buttonText}
      </div>
      <div 
        className="bg-white p-3 rounded-xl shadow-xl border-4 flex items-center justify-center"
        style={{ borderColor: borderColor }}
      >
        <StyledQRCode 
          url={url}
          size={cfg.qr}
          primaryColor={safeColor}
        />
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
