import { QRCode } from 'react-qrcode-logo';

interface StyledQRCodeProps {
  url: string;
  size?: number;
  logoUrl?: string;
  primaryColor?: string;
  bgColor?: string;
  variant?: 'product' | 'menu';
  logoSize?: number;
  useThemedLogo?: boolean;
}

// Função para detectar se a cor é clara
export function isLightColor(color: string): boolean {
  // Tratar cores inválidas
  if (!color || typeof color !== 'string') return false;
  
  const hex = color.replace('#', '');
  if (hex.length < 6) return false;
  
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  if (isNaN(r) || isNaN(g) || isNaN(b)) return false;
  
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}

// Gera SVG data URL com a cor do tema
export function generateThemedLogoDataUrl(color: string): string {
  const safeColor = color || '#333333';
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23.04 23.18"><path fill="${safeColor}" d="M12.63 1.75l0.28 -0.43c0.64,-1.59 -1.06,-0.93 -1.45,0.54 -0.2,-0.15 -2.08,-3.32 -1.33,-0.13 -0.5,-0.34 -2.4,-2.81 -2.4,-0.93 0,0.43 1.56,1.68 1.86,2.13 -0.24,0.33 -0.84,0.64 -1.23,0.9 -1.62,1.09 -8.36,6.12 -8.36,7.22l0 0.53 2.4 0.13c0,2.29 -0.35,9.81 0,11.32 0.26,0.06 0.9,0.1 1.79,0.13l15.66 0c0.49,0 0.64,-0.21 0.93,-0.4 0,-3.82 -0.27,-7.27 -0.27,-11.19 0.74,0.17 2.53,0.39 2.53,-0.53 0,-0.62 -6.24,-5.52 -7.14,-6.18 -0.48,-0.36 -0.8,-0.62 -1.31,-0.96 -0.46,-0.31 -1.01,-0.58 -1.28,-0.98l0.89 -0.97c0.95,-0.85 1.27,-1.15 0.84,-1.96 -0.75,0.06 -1.86,1.27 -2.26,1.86l-0.16 -0.11zm-2.29 1.92l0.12 0.06 -0.53 0.59 -0.59 0.88 -0.59 1.11 0.64 -0.35 0.99 -0.76 1.05 -0.76 0.35 0.12 0.7 0.53 0.29 0.35 0.7 0.53 0.59 0.23 -0.23 -0.64 -0.35 -0.59 -0.41 -0.53 -0.53 -0.59 0.12 -0.06 0.99 0.59 1.29 0.88 1.05 0.76 1.11 0.82 1.05 0.82 0.76 0.59 0.82 0.7 0.59 0.53 0.47 0.41 0.53 0.7 0 0.12 -1.29 0 -0.59 -0.29 -0.59 -0.53 -0.47 -0.41 -1.05 -1.05 -0.99 -0.76 -0.7 -0.41 0.76 0.94 1.4 1.64 0.59 0.82 0 0.12 -1.52 0 -0.47 -0.64 -0.53 -0.76 -0.64 -0.76 -0.41 -0.47 -0.82 -0.64 0.47 1.05 0.76 1.23 0.53 0.88 0 0.12 -1.7 -0.06 -0.29 -0.23 -0.47 -0.88 -0.53 -1.23 -0.29 -0.47 0.06 0.53 0.18 1.05 0.12 0.88 0.06 0.41 -2.93 0 0 -0.64 0.35 -1.87 0 -0.23 -0.47 0.82 -0.59 1.23 -0.29 0.53 -0.06 0.06 -0.76 0.06 -1.05 0 0.12 -0.29 1.4 -2.46 0.23 -0.47 -0.59 0.47 -0.47 0.41 -0.53 0.64 -0.64 0.82 -0.53 0.64 -0.29 0.23 -0.23 0.06 -0.82 0 -0.29 -0.06 0.41 -0.64 0.59 -0.64 0.41 -0.47 0.59 -0.64 0.64 -0.82 0.06 -0.12 -0.94 0.59 -1.05 0.82 -0.88 0.82 -0.94 0.94 -0.47 0.23 -0.82 0 -0.53 -0.06 0.12 -0.23 0.94 -0.94 0.64 -0.53 0.82 -0.76 0.64 -0.53 0.64 -0.59 1.64 -1.29 1.17 -0.88 1.05 -0.7 0.94 -0.53 0.18 -0.06 0 -0zm-6.5 7.96l15.22 0 0.35 0.23 0.12 0.23 0 9.66 -0.29 0.35 -0.12 0.06 -6.91 0 -0.06 -1.23 0 -1.58 0.7 -0.29 0.29 -0.23 0.12 0 0.41 -0.82 0.12 -0.47 0 -1.05 -0.18 -1.81 -0.18 -1.17 -0.18 -0.64 -0.18 -0.18 -0.41 0 -0.18 0.23 0.06 1.46 0.12 1.4 0 0.94 -0.23 0.18 -0.41 -0.06 -0.12 -0.18 -0.06 -3.75 -0.18 -0.23 -0.41 0 -0.18 0.29 -0.06 3.75 -0.18 0.18 -0.35 0 -0.18 -0.18 0 -1.46 0.12 -1.64 0 -0.76 -0.18 -0.18 -0.41 0 -0.18 0.23 -0.23 1.05 -0.23 1.93 0 1.87 0.29 0.7 0.35 0.41 0.35 0.23 0.59 0.18 0 1.76 -0.06 1.11 -6.97 0 -0.29 -0.23 -0.12 -0.29 0 -9.54 0.18 -0.29 0.29 -0.18 0 0z"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
}

export function StyledQRCode({ 
  url, 
  size = 200, 
  logoUrl,
  primaryColor = '#333333',
  bgColor = '#ffffff',
  logoSize,
  useThemedLogo = true
}: StyledQRCodeProps) {
  // Logo ocupa 25% do QR por padrão
  const calculatedLogoSize = logoSize || size * 0.25;
  
  // Garantir que temos uma URL válida
  const safeUrl = url || 'https://vilafood.delivery';
  
  // Se a cor primária for muito clara para fundo branco, usar cor escura para QR code
  const isVeryLight = isLightColor(primaryColor || '#333333');
  const qrFgColor = isVeryLight ? '#333333' : (primaryColor || '#333333');
  const safeBgColor = bgColor || '#ffffff';
  
  // Usar cor original para logo mesmo se QR for diferente
  const logoColor = primaryColor || '#333333';
  
  // Usa logo temática por padrão
  const finalLogoUrl = useThemedLogo 
    ? generateThemedLogoDataUrl(logoColor)
    : (logoUrl || '/images/qrcode-logo.svg');
  
  return (
    <QRCode
      value={safeUrl}
      size={size}
      logoImage={finalLogoUrl}
      logoWidth={calculatedLogoSize}
      logoHeight={calculatedLogoSize}
      logoPadding={5}
      logoPaddingStyle="circle"
      qrStyle="dots"
      eyeRadius={[
        [10, 10, 0, 10], // top-left
        [10, 10, 10, 0], // top-right
        [10, 0, 10, 10], // bottom-left
      ]}
      eyeColor={qrFgColor}
      fgColor={qrFgColor}
      bgColor={safeBgColor}
      removeQrCodeBehindLogo={true}
      ecLevel="H"
    />
  );
}
