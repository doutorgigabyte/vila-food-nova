import { MessageCircle, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StoreEstablishment } from "@/hooks/useStoreData";

interface StoreHeroProps {
  establishment: StoreEstablishment;
  cashbackPercentage?: number;
}

export const StoreHero = ({ establishment, cashbackPercentage }: StoreHeroProps) => {
  const whatsappLink = establishment.whatsapp 
    ? `https://wa.me/${establishment.whatsapp.replace(/\D/g, '')}` 
    : null;

  return (
    <div className="relative">
      {/* Banner */}
      <div className="h-36 md:h-48 overflow-hidden bg-muted">
        {establishment.banner_url ? (
          <img
            src={establishment.banner_url}
            alt={establishment.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to gradient on error
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.style.background = establishment.primary_color 
                  ? `linear-gradient(135deg, ${establishment.primary_color} 0%, ${establishment.primary_color}99 100%)`
                  : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)';
              }
            }}
          />
        ) : (
          <div 
            className="w-full h-full"
            style={{ 
              background: establishment.primary_color 
                ? `linear-gradient(135deg, ${establishment.primary_color} 0%, ${establishment.primary_color}99 100%)`
                : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)'
            }}
          />
        )}
      </div>

      {/* Establishment Info Card */}
      <div className="mx-4 -mt-12 relative z-10">
        <div className="bg-card rounded-xl shadow-xl p-4 border">
          <div className="flex gap-4">
            {/* Logo */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-xl overflow-hidden border-4 border-background shadow-lg bg-background">
                {establishment.logo_url ? (
                  <img
                    src={establishment.logo_url}
                    alt={establishment.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                    {establishment.name.charAt(0)}
                  </div>
                )}
              </div>
              {/* WhatsApp Button */}
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute -bottom-2 -right-2 w-9 h-9 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors hover:scale-110"
                >
                  <MessageCircle className="w-5 h-5 text-white fill-white" />
                </a>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-lg leading-tight truncate">{establishment.name}</h1>
              
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {establishment.min_order_value && establishment.min_order_value > 0 && (
                  <span className="text-xs text-muted-foreground">
                    <span className="text-primary font-semibold">$</span> Pedido Min: R$ {establishment.min_order_value.toFixed(2)}
                  </span>
                )}
                {cashbackPercentage && cashbackPercentage > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-600 border-green-600">
                    💰 Cashback de {cashbackPercentage.toFixed(0)}%
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1 mt-2">
                {establishment.is_open ? (
                  <Badge className="bg-green-500 hover:bg-green-500 text-xs px-2">
                    ABERTO AGORA
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs px-2">
                    FECHADO
                  </Badge>
                )}
              </div>

              {/* Social Links - only show if establishment has the URL */}
              <div className="flex items-center gap-2 mt-2">
                {establishment.address && (
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(establishment.address)}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title="Ver no mapa"
                  >
                    <MapPin className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
