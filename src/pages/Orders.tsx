import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Truck, ChefHat, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserOrders, UserOrder } from '@/hooks/useUserOrders';
import { useAuth } from '@/hooks/useAuth';
import MobileBottomNav from '@/components/marketplace/MobileBottomNav';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Price } from '@/components/ui/price';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-500', icon: <Clock className="h-4 w-4" /> },
  confirmed: { label: 'Confirmado', color: 'bg-blue-500', icon: <CheckCircle className="h-4 w-4" /> },
  preparing: { label: 'Preparando', color: 'bg-orange-500', icon: <ChefHat className="h-4 w-4" /> },
  ready: { label: 'Pronto', color: 'bg-green-500', icon: <Package className="h-4 w-4" /> },
  delivering: { label: 'Em entrega', color: 'bg-purple-500', icon: <Truck className="h-4 w-4" /> },
  delivered: { label: 'Entregue', color: 'bg-green-600', icon: <CheckCircle className="h-4 w-4" /> },
  cancelled: { label: 'Cancelado', color: 'bg-red-500', icon: <XCircle className="h-4 w-4" /> },
};

const Orders = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active');
  const { user } = useAuth();
  const { orders, activeOrders, completedOrders, cancelledOrders, loading, refetch } = useUserOrders();

  const getImageUrl = (url: string | null) => {
    if (!url) return '/placeholder.svg';
    if (url.startsWith('http')) return url;
    return `https://d2fhl3f70zfvod.cloudfront.net/${url}`;
  };

  const getOrderItems = (items: any) => {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    return [];
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 bg-background border-b p-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Meus Pedidos</h1>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Faça login para ver seus pedidos</h2>
          <p className="text-muted-foreground mb-6">
            Acompanhe o status dos seus pedidos em tempo real.
          </p>
          <Button onClick={() => navigate('/auth')}>
            Entrar ou Cadastrar
          </Button>
        </div>

        <MobileBottomNav />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderOrderCard = (order: UserOrder) => {
    const status = statusConfig[order.status] || statusConfig.pending;
    const items = getOrderItems(order.items);

    return (
      <Card key={order.id} className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <img
              src={getImageUrl(order.establishments?.logo_url || null)}
              alt={order.establishments?.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{order.establishments?.name || 'Estabelecimento'}</h3>
                  <p className="text-sm text-muted-foreground">
                    Pedido #{order.order_number}
                  </p>
                </div>
                <Badge className={`${status.color} text-white shrink-0`}>
                  <span className="flex items-center gap-1">
                    {status.icon}
                    {status.label}
                  </span>
                </Badge>
              </div>

              <div className="mt-2 text-sm text-muted-foreground">
                {items.slice(0, 2).map((item: any, idx: number) => (
                  <span key={idx}>
                    {item.quantity}x {item.name}
                    {idx < Math.min(items.length, 2) - 1 && ', '}
                  </span>
                ))}
                {items.length > 2 && ` +${items.length - 2} itens`}
              </div>

              <div className="flex items-center justify-between mt-3">
                <span className="text-sm text-muted-foreground">
                  {format(new Date(order.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                </span>
                <Price value={order.total} size="sm" className="text-primary" />
              </div>

              {order.status === 'delivering' && order.delivery_type === 'delivery' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 w-full"
                  onClick={() => navigate(`/pedidos/${order.id}/rastreamento`)}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Acompanhar Entrega
                </Button>
              )}

              {order.status === 'delivered' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 w-full"
                  onClick={() => navigate(`/loja/${order.establishments?.slug}`)}
                >
                  Pedir novamente
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const isEmpty = orders.length === 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 bg-background border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Meus Pedidos</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={refetch}>
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center p-8 text-center mt-12">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nenhum pedido ainda</h2>
          <p className="text-muted-foreground mb-6">
            Faça seu primeiro pedido e acompanhe aqui.
          </p>
          <Button onClick={() => navigate('/')}>
            Explorar Marketplace
          </Button>
        </div>
      ) : (
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="active" className="relative">
                Ativos
                {activeOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {activeOrders.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed">Concluídos</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelados</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum pedido ativo
                </div>
              ) : (
                activeOrders.map(renderOrderCard)
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum pedido concluído
                </div>
              ) : (
                completedOrders.map(renderOrderCard)
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {cancelledOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum pedido cancelado
                </div>
              ) : (
                cancelledOrders.map(renderOrderCard)
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      <MobileBottomNav />
    </div>
  );
};

export default Orders;
