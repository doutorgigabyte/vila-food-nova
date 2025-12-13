import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useUserEstablishment } from "@/hooks/useDashboardData";
import { 
  Search,
  Bell,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Printer,
  Menu,
  ChefHat,
  Truck,
  Package,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  order_number: number;
  customer_id: string | null;
  establishment_id: string;
  status: OrderStatus;
  delivery_type: string;
  payment_method: string;
  items: any[];
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  delivery_address: any;
  observations: string | null;
  created_at: string;
  estimated_time: number | null;
  table_number: string | null;
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendente", color: "bg-yellow-500", icon: Clock },
  confirmed: { label: "Confirmado", color: "bg-blue-500", icon: CheckCircle },
  preparing: { label: "Preparando", color: "bg-orange-500", icon: ChefHat },
  ready: { label: "Pronto", color: "bg-green-500", icon: Package },
  delivering: { label: "Em Entrega", color: "bg-purple-500", icon: Truck },
  delivered: { label: "Entregue", color: "bg-green-600", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "bg-red-500", icon: XCircle },
};

const OrdersManagement = () => {
  const { slug } = useParams();
  const { establishmentId, establishment, loading: estLoading } = useUserEstablishment();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const baseUrl = slug ? `/painel/${slug}` : '/painel';

  // Fetch orders filtered by establishment
  const fetchOrders = async () => {
    if (!establishmentId) return;
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data as Order[] || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (establishmentId) {
      fetchOrders();

      // Subscribe to realtime updates for this establishment only
      const channel = supabase
        .channel('orders-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `establishment_id=eq.${establishmentId}`
          },
          (payload) => {
            console.log('Order change:', payload);
            if (payload.eventType === 'INSERT') {
              setOrders(prev => [payload.new as Order, ...prev]);
              toast.info(`Novo pedido #${(payload.new as Order).order_number}!`, {
                action: {
                  label: "Ver",
                  onClick: () => {
                    setSelectedOrder(payload.new as Order);
                    setShowOrderModal(true);
                  }
                }
              });
              // Play notification sound
              const audio = new Audio('/notification.mp3');
              audio.play().catch(() => {});
            } else if (payload.eventType === 'UPDATE') {
              setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o));
            } else if (payload.eventType === 'DELETE') {
              setOrders(prev => prev.filter(o => o.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [establishmentId]);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, reason?: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (reason) {
        updateData.cancellation_reason = reason;
        updateData.cancelled_at = new Date().toISOString();
      }
      if (newStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      // Buscar o pedido atualizado para obter order_number
      const order = orders.find(o => o.id === orderId);
      
      // Criar notificação quando status muda para confirmed (pedido aceito vai para cozinha)
      if (newStatus === 'confirmed' && establishmentId) {
        await supabase.from('notifications').insert({
          establishment_id: establishmentId,
          type: 'order_confirmed',
          priority: 'high',
          title: `Pedido #${order?.order_number || ''} confirmado!`,
          message: 'Novo pedido para preparação na cozinha',
          target_roles: ['manager', 'kitchen'],
          data: { order_id: orderId, order_number: order?.order_number }
        });
      }

      // Criar notificação quando status muda para ready
      if (newStatus === 'ready' && establishmentId && order) {
        // Criar notificação interna
        await supabase.from('notifications').insert({
          establishment_id: establishmentId,
          type: 'order_ready',
          priority: 'high',
          title: `Pedido #${order?.order_number || ''} pronto!`,
          message: 'Pedido pronto para entrega/retirada',
          target_roles: ['manager', 'cashier', 'waiter', 'delivery'],
          data: { order_id: orderId, order_number: order?.order_number }
        });

        // Se for delivery, criar solicitação de entrega para motoristas
        if (order.delivery_type === 'delivery') {
          const expiresAt = new Date();
          expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 min para aceitar

          await supabase.from('delivery_requests').insert({
            order_id: orderId,
            establishment_id: establishmentId,
            status: 'pending',
            calculated_fee: order.delivery_fee || 0,
            driver_earnings: order.delivery_fee || 0,
            expires_at: expiresAt.toISOString(),
            pickup_address: establishment?.address || '',
            delivery_address: order.delivery_address 
              ? `${order.delivery_address.street}, ${order.delivery_address.number} - ${order.delivery_address.neighborhood}`
              : '',
            customer_name: order.delivery_address?.name || 'Cliente'
          });
        }
      }
      
      toast.success(`Pedido atualizado para: ${statusConfig[newStatus].label}`);
      setShowOrderModal(false);
      setShowRejectModal(false);
      setRejectReason("");
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erro ao atualizar pedido');
    }
  };

  const printOrder = async (order: Order) => {
    // Dynamic import to reduce initial bundle
    const { printOrderReceipt } = await import('@/components/orders/OrderReceiptPrint');
    
    printOrderReceipt({
      order: {
        order_number: order.order_number,
        created_at: order.created_at,
        delivery_type: order.delivery_type,
        table_number: order.table_number,
        items: order.items,
        subtotal: order.subtotal,
        delivery_fee: order.delivery_fee,
        discount: order.discount,
        total: order.total,
        payment_method: order.payment_method,
        observations: order.observations,
        delivery_address: order.delivery_address,
      },
      establishment: {
        name: establishment?.name || 'Estabelecimento',
        phone: establishment?.phone,
        whatsapp: establishment?.whatsapp,
        address: establishment?.address,
        logo_url: establishment?.logo_url,
      },
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toString().includes(searchTerm);
    if (activeTab === "all") return matchesSearch;
    return order.status === activeTab && matchesSearch;
  });

  const orderCounts = {
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    delivering: orders.filter(o => o.status === 'delivering').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const flow: Record<OrderStatus, OrderStatus | null> = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'delivering',
      delivering: 'delivered',
      delivered: null,
      cancelled: null,
    };
    return flow[currentStatus];
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background overflow-hidden">
        <DashboardSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          establishment={establishment}
        />

        <div className="flex-1 lg:ml-64 overflow-x-hidden">
          {/* Header */}
          <header className="sticky top-0 z-40 bg-card border-b border-border">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="lg:hidden shrink-0"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </Button>
                <h1 className="text-lg font-semibold truncate">Gestão de Pedidos</h1>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={fetchOrders} className="hidden sm:inline-flex">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  <span className="hidden md:inline">Atualizar</span>
                </Button>
                <Button variant="outline" size="icon" onClick={fetchOrders} className="sm:hidden">
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  {orderCounts.pending > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                      {orderCounts.pending}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="px-4 pb-3 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número do pedido..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Status Tabs */}
            <div className="px-4 pb-2 overflow-x-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full justify-start h-auto flex-wrap gap-1">
                  <TabsTrigger value="pending" className="gap-1">
                    <Clock className="w-4 h-4" />
                    Pendentes
                    {orderCounts.pending > 0 && <Badge variant="destructive" className="ml-1">{orderCounts.pending}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="confirmed" className="gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Confirmados
                    {orderCounts.confirmed > 0 && <Badge className="ml-1">{orderCounts.confirmed}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="preparing" className="gap-1">
                    <ChefHat className="w-4 h-4" />
                    Preparando
                    {orderCounts.preparing > 0 && <Badge className="ml-1">{orderCounts.preparing}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="ready" className="gap-1">
                    <Package className="w-4 h-4" />
                    Prontos
                    {orderCounts.ready > 0 && <Badge className="ml-1">{orderCounts.ready}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="delivering" className="gap-1">
                    <Truck className="w-4 h-4" />
                    Em Entrega
                    {orderCounts.delivering > 0 && <Badge className="ml-1">{orderCounts.delivering}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="all" className="gap-1">
                    Todos
                    <Badge variant="outline" className="ml-1">{orders.length}</Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </header>

          {/* Orders Grid */}
          <main className="p-4">
            {loading || estLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                      <div className="h-6 bg-muted rounded w-2/3 mb-4" />
                      <div className="h-20 bg-muted rounded mb-4" />
                      <div className="h-10 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Nenhum pedido encontrado</h3>
                <p className="text-muted-foreground">
                  {activeTab === "pending" ? "Não há pedidos pendentes no momento" : "Não há pedidos nesta categoria"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map(order => {
                  const StatusIcon = statusConfig[order.status].icon;
                  const nextStatus = getNextStatus(order.status);
                  
                  return (
                    <Card key={order.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg">#{order.order_number}</span>
                              <Badge className={statusConfig[order.status].color}>
                                {statusConfig[order.status].label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {order.delivery_type === 'delivery' ? '🚚 Delivery' : 
                             order.delivery_type === 'pickup' ? '🏪 Retirada' : 
                             `🍽️ Mesa ${order.table_number}`}
                          </Badge>
                        </div>

                        {/* Items */}
                        <div className="bg-muted/50 rounded-lg p-3 mb-3 text-sm">
                          {Array.isArray(order.items) && order.items.slice(0, 3).map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between">
                              <span>{item.quantity}x {item.name}</span>
                              <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          {Array.isArray(order.items) && order.items.length > 3 && (
                            <p className="text-muted-foreground mt-1">
                              +{order.items.length - 3} itens...
                            </p>
                          )}
                        </div>

                        {/* Total */}
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-muted-foreground">Total:</span>
                          <span className="font-bold text-xl">R$ {order.total.toFixed(2)}</span>
                        </div>

                        {/* Payment Method */}
                        <div className="text-sm text-muted-foreground mb-4">
                          💳 {order.payment_method === 'cash' ? 'Dinheiro' : 
                              order.payment_method === 'pix' ? 'PIX' : 
                              order.payment_method === 'credit_card' ? 'Cartão de Crédito' : 
                              order.payment_method === 'debit_card' ? 'Cartão de Débito' : 'Online'}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {order.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                className="flex-1"
                                onClick={() => updateOrderStatus(order.id, 'confirmed')}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Aceitar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowRejectModal(true);
                                }}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {nextStatus && order.status !== 'pending' && (
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={() => updateOrderStatus(order.id, nextStatus)}
                            >
                              Avançar para {statusConfig[nextStatus].label}
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => printOrder(order)}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Order Detail Modal */}
      <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pedido #{selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>
              {selectedOrder && new Date(selectedOrder.created_at).toLocaleString('pt-BR')}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={statusConfig[selectedOrder.status].color}>
                  {statusConfig[selectedOrder.status].label}
                </Badge>
                <Badge variant="outline">
                  {selectedOrder.delivery_type === 'delivery' ? 'Delivery' : 
                   selectedOrder.delivery_type === 'pickup' ? 'Retirada' : 
                   `Mesa ${selectedOrder.table_number}`}
                </Badge>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium">Itens do Pedido</h4>
                {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                {selectedOrder.delivery_fee > 0 && (
                  <div className="flex justify-between">
                    <span>Taxa de entrega:</span>
                    <span>R$ {selectedOrder.delivery_fee.toFixed(2)}</span>
                  </div>
                )}
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto:</span>
                    <span>-R$ {selectedOrder.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span>R$ {selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {selectedOrder.observations && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <p className="text-sm font-medium">Observações:</p>
                  <p className="text-sm">{selectedOrder.observations}</p>
                </div>
              )}

              {selectedOrder.delivery_address && (
                <div className="space-y-1">
                  <p className="font-medium">Endereço de entrega:</p>
                  <p className="text-sm text-muted-foreground">
                    {typeof selectedOrder.delivery_address === 'object' 
                      ? `${(selectedOrder.delivery_address as any).street}, ${(selectedOrder.delivery_address as any).number} - ${(selectedOrder.delivery_address as any).neighborhood}`
                      : selectedOrder.delivery_address}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => updateOrderStatus(selectedOrder.id, value as OrderStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="preparing">Preparando</SelectItem>
                      <SelectItem value="ready">Pronto</SelectItem>
                      <SelectItem value="delivering">Em Entrega</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Button variant="outline" onClick={() => printOrder(selectedOrder)}>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Pedido</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição do pedido #{selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder="Motivo da rejeição..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedOrder && updateOrderStatus(selectedOrder.id, 'cancelled', rejectReason)}
            >
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default OrdersManagement;