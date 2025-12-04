import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Search,
  Bell,
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Printer,
  ChevronRight,
  Menu,
  X,
  Utensils,
  ChefHat,
  Truck,
  Package,
  RefreshCw,
  Filter,
  ArrowLeft
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
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
    fetchOrders();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
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
  }, []);

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
      
      toast.success(`Pedido atualizado para: ${statusConfig[newStatus].label}`);
      setShowOrderModal(false);
      setShowRejectModal(false);
      setRejectReason("");
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erro ao atualizar pedido');
    }
  };

  const printOrder = (order: Order) => {
    const printContent = `
      <html>
        <head>
          <title>Pedido #${order.order_number}</title>
          <style>
            body { font-family: monospace; font-size: 12px; width: 280px; margin: 0; padding: 10px; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>PEDIDO #${order.order_number}</h2>
            <p>${new Date(order.created_at).toLocaleString('pt-BR')}</p>
            <p>${order.delivery_type === 'delivery' ? 'DELIVERY' : order.delivery_type === 'pickup' ? 'RETIRADA' : 'MESA ' + order.table_number}</p>
          </div>
          <div class="items">
            ${Array.isArray(order.items) ? order.items.map((item: any) => `
              <div class="item">
                <span>${item.quantity}x ${item.name}</span>
                <span>R$ ${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `).join('') : ''}
          </div>
          <div class="total">
            <div class="item"><span>Subtotal:</span><span>R$ ${order.subtotal.toFixed(2)}</span></div>
            ${order.delivery_fee > 0 ? `<div class="item"><span>Taxa de entrega:</span><span>R$ ${order.delivery_fee.toFixed(2)}</span></div>` : ''}
            ${order.discount > 0 ? `<div class="item"><span>Desconto:</span><span>-R$ ${order.discount.toFixed(2)}</span></div>` : ''}
            <div class="item"><span>TOTAL:</span><span>R$ ${order.total.toFixed(2)}</span></div>
          </div>
          ${order.observations ? `<p><strong>Obs:</strong> ${order.observations}</p>` : ''}
          ${order.delivery_address ? `<p><strong>Endereço:</strong> ${typeof order.delivery_address === 'object' ? JSON.stringify(order.delivery_address) : order.delivery_address}</p>` : ''}
          <div class="footer">
            <p>Obrigado pela preferência!</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/painel">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Gestão de Pedidos</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchOrders}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
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
        {loading ? (
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
                          <StatusIcon className="w-4 h-4 mr-1" />
                          {statusConfig[nextStatus].label}
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => printOrder(order)}
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Order Details Modal */}
      <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Pedido #{selectedOrder.order_number}
                  <Badge className={statusConfig[selectedOrder.status].color}>
                    {statusConfig[selectedOrder.status].label}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {new Date(selectedOrder.created_at).toLocaleString('pt-BR')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Order Type */}
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">
                    {selectedOrder.delivery_type === 'delivery' ? '🚚 Delivery' : 
                     selectedOrder.delivery_type === 'pickup' ? '🏪 Retirada' : 
                     `🍽️ Mesa ${selectedOrder.table_number}`}
                  </p>
                  {selectedOrder.delivery_address && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {typeof selectedOrder.delivery_address === 'object' 
                        ? JSON.stringify(selectedOrder.delivery_address) 
                        : selectedOrder.delivery_address}
                    </p>
                  )}
                </div>

                {/* Items */}
                <div>
                  <h4 className="font-medium mb-2">Itens do Pedido</h4>
                  <div className="space-y-2">
                    {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between p-2 bg-muted/50 rounded">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>R$ {selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedOrder.delivery_fee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Taxa de entrega:</span>
                      <span>R$ {selectedOrder.delivery_fee.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto:</span>
                      <span>-R$ {selectedOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>R$ {selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment */}
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">
                    💳 {selectedOrder.payment_method === 'cash' ? 'Dinheiro' : 
                        selectedOrder.payment_method === 'pix' ? 'PIX' : 
                        selectedOrder.payment_method === 'credit_card' ? 'Cartão de Crédito' : 
                        selectedOrder.payment_method === 'debit_card' ? 'Cartão de Débito' : 'Online'}
                  </p>
                </div>

                {/* Observations */}
                {selectedOrder.observations && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">Observações:</p>
                    <p className="text-sm">{selectedOrder.observations}</p>
                  </div>
                )}

                {/* Update Status */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Alterar Status</label>
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
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => printOrder(selectedOrder)}>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
                <Button onClick={() => setShowOrderModal(false)}>Fechar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Order Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar Pedido #{selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>
              Informe o motivo da recusa do pedido.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo da recusa..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancelar</Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedOrder && updateOrderStatus(selectedOrder.id, 'cancelled', rejectReason)}
            >
              Confirmar Recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersManagement;
