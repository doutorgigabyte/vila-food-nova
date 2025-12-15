import { Phone, Globe, Instagram, Facebook, MessageCircle } from "lucide-react";
import { QrCode } from "lucide-react";
import { motion } from "framer-motion";
import { DOMAIN } from "@/lib/constants";
import { getContrastColor } from "@/lib/colorUtils";

interface SocialLinks {
  instagram_url?: string | null;
  facebook_url?: string | null;
  tiktok_url?: string | null;
  twitter_url?: string | null;
  youtube_url?: string | null;
  website_url?: string | null;
}

interface SlideFooterProps {
  primaryColor: string;
  slug: string;
  phone?: string | null;
  whatsapp?: string | null;
  socialLinks?: SocialLinks;
  variant?: 'default' | 'dark' | 'transparent';
}

// TikTok icon
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

// YouTube icon
const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

// Twitter/X icon
const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export function SlideFooter({ 
  primaryColor, 
  slug, 
  phone, 
  whatsapp,
  socialLinks,
  variant = 'default'
}: SlideFooterProps) {
  const storeUrl = `https://${slug}.${DOMAIN}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(storeUrl)}&color=333333&bgcolor=FFFFFF&margin=1`;
  
  const formatPhone = (phoneStr: string | null | undefined) => {
    if (!phoneStr) return null;
    const cleaned = phoneStr.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    return phoneStr;
  };

  const displayPhone = formatPhone(whatsapp || phone);
  
  // Check if any social links exist
  const hasSocialLinks = socialLinks && (
    socialLinks.instagram_url || 
    socialLinks.facebook_url || 
    socialLinks.tiktok_url ||
    socialLinks.twitter_url ||
    socialLinks.youtube_url
  );

  const bgStyles = {
    default: { backgroundColor: primaryColor },
    dark: { backgroundColor: '#1a1a1a' },
    transparent: { backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }
  };

  // Calculate text color based on background
  const textColor = variant === 'default' ? getContrastColor(primaryColor) : '#ffffff';
  const textOpacity = variant === 'default' ? (textColor === '#000000' ? 'text-black/90' : 'text-white/90') : 'text-white/90';

  return (
    <div 
      className="h-24 flex items-center justify-between px-12 z-50 relative"
      style={{ ...bgStyles[variant], color: textColor }}
    >
      {/* Left: Social Media Links */}
      <div className="flex items-center gap-6">
        {hasSocialLinks && (
          <div className="flex items-center gap-4">
            {socialLinks?.instagram_url && (
              <div className={`flex items-center gap-2 ${textOpacity} hover:opacity-100 transition-colors`}>
                <Instagram className="w-6 h-6" />
                <span className="text-sm font-medium">@{extractUsername(socialLinks.instagram_url)}</span>
              </div>
            )}
            {socialLinks?.facebook_url && (
              <div className={`flex items-center gap-2 ${textOpacity}`}>
                <Facebook className="w-6 h-6" />
              </div>
            )}
            {socialLinks?.tiktok_url && (
              <div className={`flex items-center gap-2 ${textOpacity}`}>
                <TikTokIcon className="w-6 h-6" />
              </div>
            )}
            {socialLinks?.twitter_url && (
              <div className={`flex items-center gap-2 ${textOpacity}`}>
                <TwitterIcon className="w-6 h-6" />
              </div>
            )}
            {socialLinks?.youtube_url && (
              <div className={`flex items-center gap-2 ${textOpacity}`}>
                <YouTubeIcon className="w-6 h-6" />
              </div>
            )}
          </div>
        )}
        
        {/* Phone / WhatsApp */}
        {displayPhone && (
          <div className="flex items-center gap-3" style={{ color: textColor }}>
            <Phone className="w-6 h-6" />
            <span className="text-xl font-semibold">{displayPhone}</span>
          </div>
        )}
      </div>

      {/* Center: Domain */}
      <div className="flex items-center gap-3" style={{ color: textColor }}>
        <Globe className="w-6 h-6" />
        <span className="text-xl font-medium tracking-wide">{slug}.{DOMAIN}</span>
      </div>

      {/* Right: QR Code for full menu */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end text-right" style={{ color: textColor }}>
          <span className="text-xs uppercase tracking-wider opacity-80">Cardápio Digital</span>
          <span className="text-sm font-bold">Acesse nosso menu completo</span>
        </div>
        <div 
          className="bg-white p-2 rounded-xl shadow-lg"
          style={{ boxShadow: `0 0 20px ${primaryColor}40` }}
        >
          <img src={qrCodeUrl} alt="QR Code Menu" className="w-16 h-16" />
        </div>
      </div>
    </div>
  );
}

// Helper to extract username from social URL
function extractUsername(url: string): string {
  if (!url) return '';
  // Remove trailing slashes and get last segment
  const cleaned = url.replace(/\/+$/, '');
  const parts = cleaned.split('/');
  return parts[parts.length - 1] || '';
}

// Preview version for the dashboard (smaller)
export function SlideFooterPreview({ 
  primaryColor, 
  slug,
  hasSocialLinks = false
}: { 
  primaryColor: string; 
  slug: string;
  hasSocialLinks?: boolean;
}) {
  const textColor = getContrastColor(primaryColor);
  
  return (
    <div 
      className="absolute bottom-0 left-0 right-0 h-5 z-50 flex items-center justify-between px-2"
      style={{ backgroundColor: primaryColor, color: textColor }}
    >
      <div className="flex items-center gap-1">
        {hasSocialLinks && (
          <>
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: `${textColor}99` }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: `${textColor}99` }} />
          </>
        )}
        <Phone className="w-1.5 h-1.5" style={{ color: `${textColor}cc` }} />
      </div>
      <span className="text-[3px] font-medium">{slug}.vilafood</span>
      <div className="bg-white/90 w-2 h-2 rounded-sm flex items-center justify-center">
        <QrCode className="w-1 h-1 text-gray-500" />
      </div>
    </div>
  );
}
