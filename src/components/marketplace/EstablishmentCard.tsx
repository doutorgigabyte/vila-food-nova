import { Link } from "react-router-dom";
import { Star, Clock, Heart, MapPin, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Establishment } from "@/hooks/useEstablishment";
import { useFavorites } from "@/hooks/useFavorites";
import { Price } from "@/components/ui/price";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface EstablishmentCardProps {
  establishment: Establishment;
  variant?: "default" | "featured" | "compact";
  showVisitButton?: boolean;
  isNew?: boolean;
  className?: string;
}

const EstablishmentCard = ({
  establishment,
  variant = "default",
  showVisitButton = false,
  isNew = false,
  className,
}: EstablishmentCardProps) => {
  const est = establishment;
  const { isEstablishmentFavorite, toggleFavoriteEstablishment } = useFavorites();
  const isFavorite = isEstablishmentFavorite(est.id);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoriteEstablishment(est.id);
  };

  const FavoriteButton = () => (
    <Button 
      variant="ghost" 
      size="icon" 
      className={cn(
        "absolute top-2 right-2 w-8 h-8 bg-card/80 backdrop-blur-sm hover:bg-card rounded-full shadow-md btn-press touch-target",
        isFavorite ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-destructive"
      )}
      onClick={handleFavoriteClick}
    >
      <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
    </Button>
  );

  const ImageWithSkeleton = ({ src, alt, className: imgClass }: { src?: string | null; alt: string; className?: string }) => (
    <div className="relative w-full h-full">
      {!imageLoaded && src && <div className="absolute inset-0 skeleton-shimmer" />}
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            imageLoaded ? "opacity-100" : "opacity-0",
            imgClass
          )}
          draggable={false}
          onLoad={() => setImageLoaded(true)}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <span className="text-4xl opacity-50">🍴</span>
        </div>
      )}
    </div>
  );

  if (variant === "compact") {
    return (
      <Link to={`/loja/${est.slug}`} className={cn("block snap-center scroll-card", className)}>
        <Card className="overflow-hidden hover:shadow-lg transition-all h-full rounded-2xl border-0 shadow-soft card-hover">
          <div className="relative h-28 md:h-32 bg-muted overflow-hidden">
            <ImageWithSkeleton src={est.banner_url} alt={est.name} />
            
            {!est.is_open && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <Badge variant="secondary" className="text-xs rounded-full">Fechado</Badge>
              </div>
            )}
            
            {est.is_open && (
              <Badge className="absolute top-2 left-2 bg-green-500 text-xs rounded-full shadow-md px-2 py-0.5">Aberto</Badge>
            )}
            
            {isNew && (
              <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs font-bold rounded-full shadow-md px-2 py-0.5">
                NOVO
              </Badge>
            )}
            
            <FavoriteButton />
          </div>
          
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-xs">4.5</span>
              <span className="text-xs text-muted-foreground">(0)</span>
            </div>
            <h3 className="font-semibold text-sm truncate">{est.name}</h3>
            {est.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{est.description}</p>
            )}
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link to={`/loja/${est.slug}`} className={cn("block snap-center scroll-card", className)}>
        <Card className="overflow-hidden hover:shadow-lg transition-all h-full rounded-2xl border-0 shadow-soft card-hover">
          <div className="relative h-32 md:h-44 bg-muted overflow-hidden">
            <ImageWithSkeleton src={est.banner_url} alt={est.name} />
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            
            {/* Logo */}
            <div className="absolute bottom-2 left-2 w-11 h-11 md:w-14 md:h-14 rounded-xl border-2 border-card bg-card shadow-lg overflow-hidden">
              {est.logo_url ? (
                <img src={est.logo_url} alt={est.name} className="w-full h-full object-cover" loading="lazy" draggable={false} />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg">🏪</span>
                </div>
              )}
            </div>
            
            {/* Slogan on banner */}
            <div className="absolute bottom-2 left-14 md:left-[4.5rem] right-2">
              <h3 className="font-bold text-card text-sm md:text-lg truncate drop-shadow-md">{est.name}</h3>
              {est.description && (
                <p className="text-xs text-card/80 truncate drop-shadow hidden md:block">{est.description}</p>
              )}
            </div>
            
            {isNew && (
              <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs font-bold shadow-md rounded-full px-2 py-0.5">
                NOVO
              </Badge>
            )}
            
            <FavoriteButton />
          </div>
          
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-sm">4.5</span>
                </div>
                {est.avg_delivery_time && (
                  <div className="flex items-center gap-1 text-muted-foreground text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{est.avg_delivery_time} min</span>
                  </div>
                )}
              </div>
              
              {showVisitButton && (
                <Button size="sm" className="gap-1 shadow-md rounded-full btn-press text-xs h-7 px-2">
                  Visitar <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 mt-2">
              {est.accepts_delivery && (
                <Badge variant="outline" className="text-xs rounded-full px-2 py-0">Delivery</Badge>
              )}
              {est.accepts_pickup && (
                <Badge variant="outline" className="text-xs rounded-full px-2 py-0">Retirada</Badge>
              )}
              {est.is_open ? (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs ml-auto rounded-full px-2 py-0">
                  Aberto
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs ml-auto rounded-full px-2 py-0">Fechado</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Default variant
  return (
    <Link to={`/loja/${est.slug}`} className={cn("block snap-center scroll-card", className)}>
      <Card className="overflow-hidden hover:shadow-lg transition-all h-full rounded-2xl border-0 shadow-soft card-hover">
        <div className="relative h-32 md:h-40 bg-muted overflow-hidden">
          <ImageWithSkeleton src={est.banner_url} alt={est.name} />
          
          {!est.is_open && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <Badge variant="secondary" className="text-xs rounded-full">Fechado</Badge>
            </div>
          )}
          
          <FavoriteButton />

          {est.is_open && (
            <Badge className="absolute top-2 left-2 bg-green-500 rounded-full shadow-md text-xs px-2 py-0.5">Aberto</Badge>
          )}
          
          {isNew && (
            <Badge className="absolute top-2 left-[4rem] bg-accent text-accent-foreground font-bold rounded-full shadow-md text-xs px-2 py-0.5">
              NOVO
            </Badge>
          )}
        </div>
        
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl border-2 border-background -mt-6 relative z-10 shadow-lg overflow-hidden bg-card flex-shrink-0">
              {est.logo_url ? (
                <img src={est.logo_url} alt={est.name} className="w-full h-full object-cover" loading="lazy" draggable={false} />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm md:text-lg">🏪</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{est.name}</h3>
              {est.neighborhood && (
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  {est.neighborhood}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2 text-xs">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">4.5</span>
              <span className="text-muted-foreground">(0)</span>
            </div>
            {est.avg_delivery_time && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>{est.avg_delivery_time} min</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
            {est.min_order_value && est.min_order_value > 0 && (
              <span className="whitespace-nowrap flex items-center gap-1">
                Mín: <Price value={est.min_order_value} size="xs" variant="muted" />
              </span>
            )}
            <div className="flex gap-1 ml-auto">
              {est.accepts_delivery && (
                <Badge variant="outline" className="text-xs py-0 px-1.5 rounded-full">Delivery</Badge>
              )}
              {est.accepts_pickup && (
                <Badge variant="outline" className="text-xs py-0 px-1.5 rounded-full">Retirada</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default EstablishmentCard;
