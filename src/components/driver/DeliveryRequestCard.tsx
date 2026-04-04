import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  MapPin, 
  Clock, 
  DollarSign, 
  Navigation,
  Store,
  User,
  X,
  Check
} from 'lucide-react';
import { DeliveryRequest } from '@/hooks/useDeliveryRequests';
import { cn } from '@/lib/utils';

interface DeliveryRequestCardProps {
  request: DeliveryRequest;
  onAccept: (id: string) => Promise<boolean>;
  onReject: (id: string) => void;
}

export const DeliveryRequestCard = ({ 
  request, 
  onAccept, 
  onReject 
}: DeliveryRequestCardProps) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [accepting, setAccepting] = useState(false);

  const isTurbo = request.delivery_type === 'turbo';

  useEffect(() => {
    const updateTimer = () => {
      const expiresAt = new Date(request.expires_at).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [request.expires_at]);

  const handleAccept = async () => {
    setAccepting(true);
    await onAccept(request.id);
    setAccepting(false);
  };

  const progressPercentage = (timeLeft / 60) * 100;

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300",
      isTurbo 
        ? "border-2 border-yellow-500 bg-gradient-to-br from-yellow-500/10 to-orange-500/10" 
        : "border-border bg-card"
    )}>
      {/* Timer Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
        <div 
          className={cn(
            "h-full transition-all duration-1000",
            timeLeft <= 15 ? "bg-destructive" : isTurbo ? "bg-yellow-500" : "bg-primary"
          )}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="p-4 pt-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {request.establishment?.logo_url ? (
              <img 
                src={request.establishment.logo_url} 
                alt="" 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Store className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="font-semibold text-sm">
                {request.establishment?.name || 'Estabelecimento'}
              </p>
              {isTurbo && (
                <Badge variant="default" className="bg-yellow-500 text-yellow-950 text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  TURBO
                </Badge>
              )}
            </div>
          </div>
          
          <div className={cn(
            "text-2xl font-bold",
            timeLeft <= 15 ? "text-destructive animate-pulse" : "text-foreground"
          )}>
            {timeLeft}s
          </div>
        </div>

        {/* Earnings - Highlighted */}
        <div className={cn(
          "rounded-lg p-3 mb-3 text-center",
          isTurbo ? "bg-yellow-500/20" : "bg-primary/10"
        )}>
          <p className="text-xs text-muted-foreground mb-1">Você vai receber</p>
          <p className={cn(
            "text-3xl font-bold",
            isTurbo ? "text-yellow-600" : "text-primary"
          )}>
            R$ {request.driver_earnings.toFixed(2)}
          </p>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Navigation className="w-4 h-4 text-muted-foreground" />
            <span>{request.estimated_distance_km?.toFixed(1) || '?'} km</span>
            <span className="text-muted-foreground">•</span>
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{request.estimated_duration_minutes || '?'} min</span>
            {request.stops_count > 1 && (
              <>
                <span className="text-muted-foreground">•</span>
                <Badge variant="secondary" className="text-xs">
                  {request.stops_count} paradas
                </Badge>
              </>
            )}
          </div>

          {request.customer_name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{request.customer_name}</span>
            </div>
          )}

          {request.delivery_address && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{request.delivery_address}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onReject(request.id)}
            disabled={accepting}
          >
            <X className="w-4 h-4 mr-1" />
            Recusar
          </Button>
          <Button
            className={cn(
              "flex-1",
              isTurbo && "bg-yellow-500 hover:bg-yellow-600 text-yellow-950"
            )}
            onClick={handleAccept}
            disabled={accepting || timeLeft === 0}
          >
            {accepting ? (
              <span className="animate-pulse">Aceitando...</span>
            ) : (
              <>
                <Check className="w-4 h-4 mr-1" />
                Aceitar
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};
