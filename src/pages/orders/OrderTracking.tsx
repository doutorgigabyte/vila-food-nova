import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MessageCircle, MapPin, Clock, CheckCircle, Package, ChefHat, Truck, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Price } from '@/components/ui/price';
import MobileBottomNav from '@/components/marketplace/MobileBottomNav';

interface OrderData {
  id: string;
  order_number: number;
  status: string;
  total: number;
  delivery_fee: number;
  delivery_type: string;
  delivery_address: any;
  items: any;
  created_at: string;
  estimated_delivery_time: string | null;
  establishments: {
    name: string;
    logo_url: string | null;
    phone: string | null;
    whatsapp: string | null;
    address: string | null;
  } | null;
  delivery_tracking: {
    status: string;
    current_lat: number | null;
    current_lng: number | null;
    estimated_minutes: number | null;
    delivery_drivers: {
      name: string;
      phone: string;
    } | null;
  }[] | null;
}

const statusTimeline = [
  { key: 'pending', label: 'Pedido Recebido', icon: Clock },
  { key: 'confirmed', label: 'Confirmado', icon: CheckCircle },
  { key: 'preparing', label: 'Preparando', icon: ChefHat },
  { key: 'ready', label: 'Pronto', icon: Package },
  { key: 'delivering', label: 'Saiu para Entrega', icon: Truck },
  { key: 'delivered', label: 'Entregue', icon: CheckCircle },
];

const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered'];

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total,
          delivery_fee,
          delivery_type,
          delivery_address,
          items,
          created_at,
          estimated_delivery_time,
          establishments (
            name,
            logo_url,
            phone,
            whatsapp,
            address
          ),
          delivery_tracking (
            status,
            current_lat,
            current_lng,
            estimated_minutes,
            delivery_drivers (
              name,
              phone
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;
      setOrder(data as any);
    } catch (err: any) {
      console.error('Error fetching order:', err);
      setError('Pedido não encontrado');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        () => {
          fetchOrder();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const getStatusIndex = (status: string) => {
    return statusOrder.indexOf(status);
  };

  const isStatusCompleted = (statusKey: string) => {
    if (!order) return false;
    if (order.status === 'cancelled') return false;
    const currentIndex = getStatusIndex(order.status);
    const statusKeyIndex = getStatusIndex(statusKey);
    return statusKeyIndex <= currentIndex;
  };

  const isCurrentStatus = (statusKey: string) => {
    return order?.status === statusKey;
  };

  const getImageUrl = (url: string | null) => {
    if (!url) return '/placeholder.svg';
    if (url.startsWith('http')) return url;
    return `https://d2fhl3f70zfvod.cloudfront.net/${url}`;
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 bg-background border-b p-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Rastreamento</h1>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <XCircle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">{error || 'Pedido não encontrado'}</h2>
          <Button onClick={() => navigate('/meus-pedidos')}>
            Voltar para Meus Pedidos
          </Button>
        </div>

        <MobileBottomNav />
      </div>
    );
  }

  const tracking = order.delivery_tracking?.[0];
  const driver = tracking?.delivery_drivers;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Pedido #{order.order_number}</h1>
              <p className="text-xs text-muted-foreground">
                {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchOrder}>
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Status Badge */}
        {order.status === 'cancelled' ? (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="h-8 w-8 text-destructive" />
              <div>
                <h3 className="font-semibold text-destructive">Pedido Cancelado</h3>
                <p className="text-sm text-muted-foreground">Este pedido foi cancelado</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Estimated Time */}
            {tracking?.estimated_minutes && order.status === 'delivering' && (
              <Card className="border-primary bg-primary/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <Clock className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-primary">
                      Chegando em ~{tracking.estimated_minutes} min
                    </h3>
                    <p className="text-sm text-muted-foreground">O entregador está a caminho</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Status do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {statusTimeline.map((status, index) => {
                    const Icon = status.icon;
                    const completed = isStatusCompleted(status.key);
                    const current = isCurrentStatus(status.key);
                    
                    return (
                      <div key={status.key} className="flex items-start gap-3 pb-4 last:pb-0">
                        {/* Line */}
                        {index < statusTimeline.length - 1 && (
                          <div 
                            className={`absolute left-[14px] top-8 w-0.5 h-[calc(100%-2rem)] 
                              ${completed ? 'bg-primary' : 'bg-muted'}`}
                            style={{ top: `${index * 48 + 32}px`, height: '32px' }}
                          />
                        )}
                        
                        {/* Icon */}
                        <div className={`
                          relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0
                          ${completed ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                          ${current ? 'ring-2 ring-primary ring-offset-2' : ''}
                        `}>
                          <Icon className="h-4 w-4" />
                        </div>
                        
                        {/* Text */}
                        <div className={`pt-0.5 ${!completed ? 'opacity-50' : ''}`}>
                          <p className={`text-sm font-medium ${current ? 'text-primary' : ''}`}>
                            {status.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Driver Info */}
        {driver && order.status === 'delivering' && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Entregador</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{driver.name}</p>
                  <p className="text-sm text-muted-foreground">{driver.phone}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => window.open(`tel:${driver.phone}`)}>
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => openWhatsApp(driver.phone)}>
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delivery Address */}
        {order.delivery_type === 'delivery' && order.delivery_address && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Endereço de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {typeof order.delivery_address === 'object' 
                  ? `${order.delivery_address.street || ''}, ${order.delivery_address.number || ''} - ${order.delivery_address.neighborhood || ''}, ${order.delivery_address.city || ''}`
                  : order.delivery_address}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Establishment Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <img
                src={getImageUrl(order.establishments?.logo_url || null)}
                alt={order.establishments?.name}
                className="w-14 h-14 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold">{order.establishments?.name}</h3>
                {order.establishments?.address && (
                  <p className="text-xs text-muted-foreground">{order.establishments.address}</p>
                )}
              </div>
              {order.establishments?.whatsapp && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openWhatsApp(order.establishments!.whatsapp!)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contato
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
                <Price value={item.total || item.price * item.quantity} size="sm" />
              </div>
            ))}
            
            <div className="border-t pt-2 mt-2 space-y-1">
              {order.delivery_fee > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Taxa de entrega</span>
                  <Price value={order.delivery_fee} size="sm" />
                </div>
              )}
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <Price value={order.total} className="text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default OrderTracking;
