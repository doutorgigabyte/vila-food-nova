import { useState, useEffect } from 'react';
import { useDriverDeliveries, DeliveryTracking } from '@/hooks/useDriverDeliveries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  CheckCircle2, 
  XCircle, 
  Clock,
  DollarSign,
  MapPin,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DriverHistory = () => {
  const { fetchDeliveryHistory, driverProfile } = useDriverDeliveries();
  const [history, setHistory] = useState<DeliveryTracking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      const data = await fetchDeliveryHistory(50);
      setHistory(data as DeliveryTracking[]);
      setIsLoading(false);
    };

    if (driverProfile) {
      loadHistory();
    }
  }, [driverProfile, fetchDeliveryHistory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">Sem histórico</h2>
        <p className="text-muted-foreground">
          Suas entregas concluídas aparecerão aqui
        </p>
      </div>
    );
  }

  // Group by date
  const groupedHistory = history.reduce((acc, delivery) => {
    const date = format(
      new Date(delivery.delivered_at || delivery.cancelled_at || delivery.created_at),
      'yyyy-MM-dd'
    );
    if (!acc[date]) acc[date] = [];
    acc[date].push(delivery);
    return acc;
  }, {} as Record<string, DeliveryTracking[]>);

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      {Object.entries(groupedHistory).map(([date, deliveries]) => (
        <div key={date} className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {format(new Date(date), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h3>
          
          {deliveries.map((delivery) => (
            <Card key={delivery.id} className="mb-3">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={(delivery.establishment as any)?.logo_url || ''} />
                      <AvatarFallback>
                        {(delivery.establishment as any)?.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{(delivery.establishment as any)?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Pedido #{(delivery.order as any)?.order_number}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={delivery.status === 'delivered' ? 'default' : 'destructive'}
                    className={delivery.status === 'delivered' ? 'bg-green-500' : ''}
                  >
                    {delivery.status === 'delivered' ? (
                      <><CheckCircle2 className="w-3 h-3 mr-1" /> Entregue</>
                    ) : (
                      <><XCircle className="w-3 h-3 mr-1" /> Cancelado</>
                    )}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      R$ {(delivery.order as any)?.total?.toFixed(2)}
                    </span>
                    {delivery.distance_km && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {delivery.distance_km.toFixed(1)} km
                      </span>
                    )}
                  </div>
                  <span>
                    {format(
                      new Date(delivery.delivered_at || delivery.cancelled_at || delivery.created_at),
                      'HH:mm'
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </ScrollArea>
  );
};

export default DriverHistory;
