import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Clock, Truck, Package, CheckCircle, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeliveryTrackerProps {
  orderId: string;
  deliveryTrackingId?: string;
}

interface DeliveryData {
  id: string;
  status: string;
  current_lat: number | null;
  current_lng: number | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  estimated_minutes: number | null;
  driver_name?: string;
  is_priority?: boolean;
}

interface BatchInfo {
  total_orders: number;
  current_position: number;
}

const statusMessages = {
  assigned: { 
    label: 'Pedido Atribuído', 
    description: 'Seu pedido foi atribuído a um entregador',
    icon: Package,
    color: 'bg-blue-500'
  },
  accepted: { 
    label: 'Entregador a Caminho', 
    description: 'O entregador está indo buscar seu pedido',
    icon: Truck,
    color: 'bg-orange-500'
  },
  picked_up: { 
    label: 'Pedido Coletado', 
    description: 'Seu pedido saiu para entrega',
    icon: Navigation,
    color: 'bg-purple-500'
  },
  in_transit: { 
    label: 'Em Rota de Entrega', 
    description: 'O entregador está a caminho do seu endereço',
    icon: Truck,
    color: 'bg-primary'
  },
  arrived: { 
    label: 'Entregador Chegou', 
    description: 'O entregador está no seu endereço',
    icon: MapPin,
    color: 'bg-green-500'
  },
  delivered: { 
    label: 'Entregue', 
    description: 'Seu pedido foi entregue com sucesso!',
    icon: CheckCircle,
    color: 'bg-green-600'
  },
};

export const CustomerDeliveryTracker = ({ orderId, deliveryTrackingId }: DeliveryTrackerProps) => {
  const [delivery, setDelivery] = useState<DeliveryData | null>(null);
  const [batchInfo, setBatchInfo] = useState<BatchInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeliveryData = async () => {
      try {
        // Fetch delivery tracking data
        const query = deliveryTrackingId 
          ? supabase.from('delivery_tracking').select('*, delivery_drivers(name)').eq('id', deliveryTrackingId).single()
          : supabase.from('delivery_tracking').select('*, delivery_drivers(name)').eq('order_id', orderId).single();

        const { data, error } = await query;
        
        if (error) {
          console.log('No delivery tracking found:', error);
          setLoading(false);
          return;
        }

        if (data) {
          setDelivery({
            ...data,
            driver_name: (data.delivery_drivers as any)?.name,
          });

          // Note: Batch info will be available after delivery_batches table types are generated
          // For now, we'll skip batch position display
        }
      } catch (err) {
        console.error('Error fetching delivery:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`delivery-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_tracking',
          filter: deliveryTrackingId 
            ? `id=eq.${deliveryTrackingId}` 
            : `order_id=eq.${orderId}`
        },
        (payload) => {
          if (payload.new) {
            setDelivery(prev => ({
              ...prev,
              ...(payload.new as DeliveryData),
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, deliveryTrackingId]);

  // Calculate ETA
  useEffect(() => {
    if (delivery?.estimated_minutes) {
      const minutes = delivery.estimated_minutes;
      if (minutes < 60) {
        setEta(`${minutes} minutos`);
      } else {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        setEta(`${hours}h ${mins}min`);
      }
    }
  }, [delivery?.estimated_minutes]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-6 bg-muted rounded w-1/3 mb-4" />
          <div className="h-20 bg-muted rounded mb-4" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (!delivery) {
    return null;
  }

  const currentStatus = statusMessages[delivery.status as keyof typeof statusMessages] || statusMessages.assigned;
  const StatusIcon = currentStatus.icon;
  const isDelivering = ['picked_up', 'in_transit', 'arrived'].includes(delivery.status);

  // If order is in a batch and not the current delivery, show "a caminho" message
  const showWaitingMessage = batchInfo && batchInfo.current_position > 1 && delivery.status !== 'delivered';

  return (
    <Card className="overflow-hidden border-2 border-primary/20">
      <CardHeader className={`${currentStatus.color} text-white py-4`}>
        <CardTitle className="flex items-center gap-3 text-lg">
          <StatusIcon className="w-6 h-6" />
          <span>{currentStatus.label}</span>
          {delivery.is_priority && (
            <Badge variant="secondary" className="ml-auto bg-yellow-400 text-yellow-900">
              ⚡ Turbo
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={delivery.status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center py-3"
          >
            <p className="text-muted-foreground">{currentStatus.description}</p>
            
            {showWaitingMessage && (
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium">
                  <Truck className="w-5 h-5" />
                  <span>Entregador a caminho</span>
                </div>
                <p className="text-sm text-amber-600 dark:text-amber-500 mt-2">
                  O entregador está realizando {batchInfo.current_position - 1} entrega(s) antes da sua. 
                  Você é o {batchInfo.current_position}º de {batchInfo.total_orders} pedidos nesta rota.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Driver Info */}
        {delivery.driver_name && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Entregador</p>
              <p className="font-medium">{delivery.driver_name}</p>
            </div>
          </div>
        )}

        {/* ETA */}
        {eta && isDelivering && !showWaitingMessage && (
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
            <Clock className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-green-600 dark:text-green-400">Tempo estimado</p>
              <p className="font-bold text-green-700 dark:text-green-300">{eta}</p>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="relative pt-4">
          <div className="flex justify-between items-center">
            {['assigned', 'picked_up', 'in_transit', 'delivered'].map((step, index) => {
              const stepStatus = statusMessages[step as keyof typeof statusMessages];
              const StepIcon = stepStatus.icon;
              const isActive = Object.keys(statusMessages).indexOf(delivery.status) >= Object.keys(statusMessages).indexOf(step);
              const isCurrent = delivery.status === step;
              
              return (
                <div key={step} className="flex flex-col items-center z-10">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCurrent 
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/30 scale-110' 
                        : isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <StepIcon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs mt-2 text-center max-w-[60px] ${
                    isCurrent ? 'font-bold text-primary' : isActive ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {stepStatus.label.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Progress Line */}
          <div className="absolute top-9 left-5 right-5 h-1 bg-muted -z-0 rounded-full">
            <motion.div 
              className="h-full bg-primary rounded-full"
              initial={{ width: '0%' }}
              animate={{ 
                width: delivery.status === 'delivered' ? '100%' 
                  : delivery.status === 'in_transit' || delivery.status === 'arrived' ? '66%'
                  : delivery.status === 'picked_up' ? '33%'
                  : '0%'
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerDeliveryTracker;
