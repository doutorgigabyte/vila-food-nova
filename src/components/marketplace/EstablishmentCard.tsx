import { Link } from "react-router-dom";
import { Star, Clock, Heart, MapPin, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Establishment } from "@/hooks/useEstablishment";
import { cn } from "@/lib/utils";

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

  if (variant === "compact") {
    return (
      <Link to={`/loja/${est.slug}`} className={cn("block", className)}>
        <Card className="overflow-hidden hover:shadow-elevated transition-all group h-full">
          <div className="relative h-32 bg-muted">
            {est.banner_url ? (
              <img
                src={est.banner_url}
                alt={est.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <span className="text-4xl opacity-50">🍴</span>
              </div>
            )}
            
            {!est.is_open && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <Badge variant="secondary" className="text-sm">Fechado</Badge>
                <span className="text-xs text-muted-foreground mt-1">Abre às 18:00</span>
              </div>
            )}
            
            {est.is_open && (
              <Badge className="absolute top-2 left-2 bg-green-500 text-xs">Aberto</Badge>
            )}
            
            {isNew && (
              <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs font-bold">
                NOVO
              </Badge>
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 w-8 h-8 bg-card/80 backdrop-blur-sm hover:bg-card text-muted-foreground hover:text-destructive"
              onClick={(e) => e.preventDefault()}
            >
              <Heart className="w-4 h-4" />
            </Button>
          </div>
          
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-sm">4.5</span>
              <span className="text-xs text-muted-foreground">(0)</span>
            </div>
            <h3 className="font-semibold truncate">{est.name}</h3>
            {est.description && (
              <p className="text-xs text-muted-foreground truncate mt-1">{est.description}</p>
            )}
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link to={`/loja/${est.slug}`} className={cn("block", className)}>
        <Card className="overflow-hidden hover:shadow-elevated transition-all group h-full border-2 border-transparent hover:border-primary/20">
          <div className="relative h-36 md:h-44 bg-muted">
            {est.banner_url ? (
              <img
                src={est.banner_url}
                alt={est.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <span className="text-5xl opacity-50">🍴</span>
              </div>
            )}
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            
            {/* Logo */}
            <div className="absolute bottom-3 left-3 w-14 h-14 rounded-xl border-2 border-card bg-card shadow-lg overflow-hidden">
              {est.logo_url ? (
                <img src={est.logo_url} alt={est.name} className="w-full h-full object-cover" draggable={false} />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl">🏪</span>
                </div>
              )}
            </div>
            
            {/* Slogan on banner */}
            <div className="absolute bottom-3 left-20 right-3">
              <h3 className="font-bold text-card text-lg truncate drop-shadow-md">{est.name}</h3>
              {est.description && (
                <p className="text-xs text-card/80 truncate drop-shadow">{est.description}</p>
              )}
            </div>
            
            {isNew && (
              <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground text-xs font-bold shadow-md">
                NOVO
              </Badge>
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-3 right-3 w-8 h-8 bg-card/80 backdrop-blur-sm hover:bg-card text-muted-foreground hover:text-destructive"
              onClick={(e) => e.preventDefault()}
            >
              <Heart className="w-4 h-4" />
            </Button>
          </div>
          
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">4.5</span>
                </div>
                {est.avg_delivery_time && (
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{est.avg_delivery_time} min</span>
                  </div>
                )}
              </div>
              
              {showVisitButton && (
                <Button size="sm" className="gap-1 shadow-md">
                  Visitar <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-3">
              {est.accepts_delivery && (
                <Badge variant="outline" className="text-xs">Delivery</Badge>
              )}
              {est.accepts_pickup && (
                <Badge variant="outline" className="text-xs">Retirada</Badge>
              )}
              {est.is_open ? (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs ml-auto">
                  Aberto agora
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs ml-auto">Fechado</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Default variant
  return (
    <Link to={`/loja/${est.slug}`} className={cn("block", className)}>
      <Card className="overflow-hidden hover:shadow-elevated transition-all group h-full">
        <div className="relative h-40 bg-muted">
          {est.banner_url ? (
            <img
              src={est.banner_url}
              alt={est.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-6xl opacity-50">🍴</span>
            </div>
          )}
          
          {!est.is_open && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <Badge variant="secondary" className="text-sm">Fechado</Badge>
            </div>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 w-8 h-8 bg-card/80 backdrop-blur-sm hover:bg-card text-muted-foreground hover:text-destructive"
            onClick={(e) => e.preventDefault()}
          >
            <Heart className="w-4 h-4" />
          </Button>

          {est.is_open && (
            <Badge className="absolute top-2 left-2 bg-green-500">Aberto</Badge>
          )}
          
          {isNew && (
            <Badge className="absolute top-2 left-16 bg-accent text-accent-foreground font-bold">
              NOVO
            </Badge>
          )}
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-background -mt-8 relative z-10 shadow-md overflow-hidden bg-card flex-shrink-0">
              {est.logo_url ? (
                <img src={est.logo_url} alt={est.name} className="w-full h-full object-cover" draggable={false} />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg">🏪</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{est.name}</h3>
              {est.neighborhood && (
                <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  {est.neighborhood}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">4.5</span>
              <span className="text-muted-foreground">(0)</span>
            </div>
            {est.avg_delivery_time && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{est.avg_delivery_time} min</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            {est.min_order_value && est.min_order_value > 0 && (
              <span>Pedido mín: R$ {est.min_order_value.toFixed(2)}</span>
            )}
            <div className="flex gap-1 ml-auto">
              {est.accepts_delivery && (
                <Badge variant="outline" className="text-xs py-0">Delivery</Badge>
              )}
              {est.accepts_pickup && (
                <Badge variant="outline" className="text-xs py-0">Retirada</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default EstablishmentCard;
