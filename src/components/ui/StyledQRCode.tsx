import { QRCode } from 'react-qrcode-logo';

interface StyledQRCodeProps {
  url: string;
  size?: number;
  logoUrl?: string;
  primaryColor?: string;
  bgColor?: string;
  variant?: 'product' | 'menu';
  logoSize?: number;
}

// Função para detectar se a cor é clara
function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}

export function StyledQRCode({ 
  url, 
  size = 200, 
  logoUrl = '/images/qrcode-logo.png',
  primaryColor = '#333333',
  bgColor = '#ffffff',
  logoSize
}: StyledQRCodeProps) {
  // Logo ocupa 25% do QR por padrão
  const calculatedLogoSize = logoSize || size * 0.25;
  
  return (
    <QRCode
      value={url}
      size={size}
      logoImage={logoUrl}
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
      eyeColor={primaryColor}
      fgColor={primaryColor}
      bgColor={bgColor}
      removeQrCodeBehindLogo={true}
      ecLevel="H"
    />
  );
}

export { isLightColor };
