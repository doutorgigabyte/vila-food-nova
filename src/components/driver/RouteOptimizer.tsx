import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Route, 
  Play, 
  Clock, 
  MapPin, 
  Package, 
  TrendingDown,
  Navigation,
  Loader2,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { useRouteOptimization, DeliveryStop, OptimizedRoute } from '@/hooks/useRouteOptimization';
import { cn } from '@/lib/utils';

interface RouteOptimizerProps {
  deliveries: Array<{
    id: string;
    orderId: string;
    pickupLat: number;
    pickupLng: number;
    pickupAddress: string;
    establishmentName: string;
    deliveryLat: number;
    deliveryLng: number;
    deliveryAddress: string;
    customerName: string;
  }>;
  driverLocation: { lat: number; lng: number } | null;
  onStartRoute?: (optimizedRoute: OptimizedRoute) => void;
  className?: string;
}

const RouteOptimizer = ({
  deliveries,
  driverLocation,
  onStartRoute,
  className
}: RouteOptimizerProps) => {
  const { optimizing, optimizedRoute, optimizeRoute, clearOptimization } = useRouteOptimization();
  const [activeStopIndex, setActiveStopIndex] = useState<number | null>(null);

  // Convert deliveries to stops
  const convertToStops = (): DeliveryStop[] => {
    const stops: DeliveryStop[] = [];
    
    for (const delivery of deliveries) {
      // Add pickup stop
      stops.push({
        id: `pickup-${delivery.id}`,
        orderId: delivery.orderId,
        type: 'pickup',
        lat: delivery.pickupLat,
        lng: delivery.pickupLng,
        address: delivery.pickupAddress,
        establishmentName: delivery.establishmentName
      });

      // Add delivery stop
      stops.push({
        id: `delivery-${delivery.id}`,
        orderId: delivery.orderId,
        type: 'delivery',
        lat: delivery.deliveryLat,
        lng: delivery.deliveryLng,
        address: delivery.deliveryAddress,
        customerName: delivery.customerName
      });
    }

    return stops;
  };

  const handleOptimize = async () => {
    if (!driverLocation || deliveries.length === 0) return;
    
    const stops = convertToStops();
    await optimizeRoute(stops, driverLocation);
  };

  const handleStartRoute = () => {
    if (optimizedRoute && onStartRoute) {
      onStartRoute(optimizedRoute);
    }
  };

  if (deliveries.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Route className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma entrega pendente para otimizar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Route className="w-5 h-5 text-primary" />
            Roteirização Inteligente
          </CardTitle>
          <Badge variant="secondary">
            {deliveries.length} {deliveries.length === 1 ? 'entrega' : 'entregas'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!optimizedRoute ? (
          // Pre-optimization view
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="w-4 h-4" />
                <span>{deliveries.length} coletas</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{deliveries.length} entregas</span>
              </div>
            </div>

            <Button 
              onClick={handleOptimize} 
              disabled={optimizing || !driverLocation}
              className="w-full gap-2"
            >
              {optimizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Calculando melhor rota...
                </>
              ) : (
                <>
                  <Route className="w-4 h-4" />
                  Otimizar Rota
                </>
              )}
            </Button>

            {!driverLocation && (
              <p className="text-xs text-center text-muted-foreground">
                Ative o GPS para otimizar a rota
              </p>
            )}
          </div>
        ) : (
          // Post-optimization view
          <div className="space-y-4">
            {/* Savings Summary */}
            {(optimizedRoute.savings.distanceSaved > 0 || optimizedRoute.savings.timeSaved > 0) && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <TrendingDown className="w-5 h-5 text-green-500" />
                <div className="text-sm">
                  <span className="font-medium text-green-600">Economia: </span>
                  {optimizedRoute.savings.distanceSaved > 0 && (
                    <span>{optimizedRoute.savings.distanceSaved} km</span>
                  )}
                  {optimizedRoute.savings.distanceSaved > 0 && optimizedRoute.savings.timeSaved > 0 && ' e '}
                  {optimizedRoute.savings.timeSaved > 0 && (
                    <span>{optimizedRoute.savings.timeSaved} min</span>
                  )}
                </div>
              </div>
            )}

            {/* Route Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <Navigation className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Distância</p>
                  <p className="font-semibold">{optimizedRoute.totalDistance} km</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <Clock className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Tempo estimado</p>
                  <p className="font-semibold">{optimizedRoute.totalDuration} min</p>
                </div>
              </div>
            </div>

            {/* Optimized Route Stops */}
            <ScrollArea className="h-[240px]">
              <div className="space-y-2 pr-4">
                {optimizedRoute.stops.map((stop, index) => (
                  <div
                    key={stop.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                      activeStopIndex === index 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'bg-muted/50 border-transparent hover:bg-muted'
                    )}
                    onClick={() => setActiveStopIndex(index)}
                  >
                    {/* Step Number */}
                    <div className={cn(
                      'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      stop.type === 'pickup' 
                        ? 'bg-amber-500 text-white' 
                        : 'bg-green-500 text-white'
                    )}>
                      {index + 1}
                    </div>

                    {/* Stop Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {stop.type === 'pickup' ? (
                          <Package className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 text-green-500" />
                        )}
                        <span className="text-xs font-medium uppercase text-muted-foreground">
                          {stop.type === 'pickup' ? 'Coleta' : 'Entrega'}
                        </span>
                      </div>
                      <p className="font-medium text-sm truncate">
                        {stop.type === 'pickup' ? stop.establishmentName : stop.customerName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {stop.address}
                      </p>
                    </div>

                    {/* ETA */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">ETA</p>
                      <p className="text-sm font-medium">{stop.estimatedTime} min</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={clearOptimization}
                className="flex-1"
              >
                Recalcular
              </Button>
              <Button 
                onClick={handleStartRoute}
                className="flex-1 gap-2"
              >
                <Play className="w-4 h-4" />
                Iniciar Rota
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RouteOptimizer;
