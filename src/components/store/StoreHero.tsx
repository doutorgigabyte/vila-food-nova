import { MessageCircle, MapPin, Bike, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ShareButton } from "@/components/store/ShareButton";
import { FavoriteButton } from "@/components/store/FavoriteButton";
import { OperatingHoursPopover } from "@/components/store/OperatingHoursPopover";
import type { StoreEstablishment } from "@/hooks/useStoreData";

interface StoreHeroProps {
  establishment: StoreEstablishment;
  cashbackPercentage?: number;
  hasStories?: boolean;
  storiesCount?: number;
  onStoriesClick?: () => void;
}

export const StoreHero = ({ establishment, cashbackPercentage, hasStories = false, storiesCount = 0, onStoriesClick }: StoreHeroProps) => {
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
            {/* Logo - With story ring if has stories */}
            <div className="relative shrink-0">
              {hasStories ? (
                <button
                  onClick={onStoriesClick}
                  className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 cursor-pointer active:scale-95 transition-transform"
                  style={establishment.primary_color ? {
                    background: `linear-gradient(135deg, ${establishment.primary_color}, hsl(45 100% 50%), ${establishment.primary_color})`
                  } : undefined}
                >
                  <div className="w-full h-full rounded-full bg-background p-0.5">
                    {establishment.logo_url ? (
                      <img
                        src={establishment.logo_url}
                        alt={establishment.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                        {establishment.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  {/* Story count badge */}
                  {storiesCount > 1 && (
                    <div className="absolute -top-1 -left-1 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                      {storiesCount}
                    </div>
                  )}
                </button>
              ) : (
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-background shadow-lg bg-background">
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
              )}
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
              
              {/* Delivery Info Preview */}
              <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-muted-foreground">
                {establishment.accepts_delivery && (
                  <span className="flex items-center gap-1">
                    <Bike className="w-3.5 h-3.5" />
                    R$ {(establishment.delivery_base_fee || 5).toFixed(2)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {establishment.avg_delivery_time || 45} min
                </span>
                {establishment.min_order_value && establishment.min_order_value > 0 && (
                  <span>Mín: R$ {establishment.min_order_value.toFixed(2)}</span>
                )}
              </div>
              
              {cashbackPercentage && cashbackPercentage > 0 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-600 border-green-600 mt-1">
                  💰 Cashback de {cashbackPercentage.toFixed(0)}%
                </Badge>
              )}

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

              {/* Action Buttons */}
              <div className="flex items-center gap-1 mt-2">
                {/* Operating Hours Popover */}
                <OperatingHoursPopover 
                  operatingHours={establishment.operating_hours as any} 
                  isOpen={establishment.is_open ?? false}
                />
                {establishment.address && (
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(establishment.address)}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                    title="Ver no mapa"
                  >
                    <MapPin className="w-4 h-4" />
                  </a>
                )}
                <ShareButton 
                  title={establishment.name}
                  text={`Confira ${establishment.name} no VilaFood!`}
                  className="w-8 h-8 rounded-full"
                />
                <FavoriteButton 
                  id={establishment.id}
                  type="establishment"
                  name={establishment.name}
                  className="w-8 h-8 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
