import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChefHat, Clock, CheckCircle, AlertCircle, Utensils, Package, Cog, Bell, 
  VolumeX, ArrowLeft, Timer, TrendingUp, TrendingDown, History, RotateCcw, Eye, X, DollarSign
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { useAuth } from "@/hooks/useAuth";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PaymentConfirmationDialog } from "@/components/orders/PaymentConfirmationDialog";

interface OrderItem {
  name: string;
  quantity: number;
  observations?: string;
}

interface Order {
  id: string;
  order_number: number;
  items: OrderItem[];
  delivery_type: string;
  table_number?: string;
  created_at: string;
  status: string;
  observations?: string;
  payment_method?: string;
  total?: number;
  customer_name?: string;
  payment_confirmed_at?: string;
}

interface DailyStats {
  delivered: number;
  returned: number;
  cancelled: number;
  yesterdayDelivered: number;
}

// Mapeamento de segmentos para tipo de display
const getDisplayConfig = (segmentSlug: string | null) => {
  const kitchenSegments = [
    'restaurante', 'pizzaria', 'hamburgueria', 'lanchonete', 'churrascaria',
    'japonesa', 'chinesa', 'italiana', 'arabe', 'brasileira', 'marmita',
    'acai', 'sorvetes', 'pastel', 'saudavel', 'carnes', 'lanches'
  ];
  
  const productionSegments = [
    'padaria', 'confeitaria', 'doces-e-bolos', 'salgados', 'artesanato'
  ];
  
  const pharmacySegments = ['farmacia', 'pet-shop', 'cosmeticos'];
  
  if (!segmentSlug) {
    return { title: "Display Produção", icon: Package, emptyText: "Nenhum pedido pendente" };
  }
  
  if (kitchenSegments.includes(segmentSlug)) {
    return { title: "Display Cozinha", icon: ChefHat, emptyText: "Nenhum pedido pendente" };
  }
  
  if (productionSegments.includes(segmentSlug)) {
    return { title: "Display Produção", icon: Package, emptyText: "Nenhum pedido em produção" };
  }
  
  if (pharmacySegments.includes(segmentSlug)) {
    return { title: "Display Processos", icon: Cog, emptyText: "Nenhum pedido em processamento" };
  }
  
  return { title: "Display Produção", icon: Package, emptyText: "Nenhum pedido pendente" };
};

const KitchenDisplay = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [segmentSlug, setSegmentSlug] = useState<string | null>(null);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [establishmentSlug, setEstablishmentSlug] = useState<string | null>(null);
  const [showNewOrderSplash, setShowNewOrderSplash] = useState(false);
  const [newOrderNumber, setNewOrderNumber] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats>({ 
    delivered: 0, returned: 0, cancelled: 0, yesterdayDelivered: 0 
  });
  const [orderToConfirmPayment, setOrderToConfirmPayment] = useState<Order | null>(null);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const previousOrdersRef = useRef<string[]>([]);
  
  const { playNotification, stopSound, isPlaying } = useNotificationSound();

  // Stats for summary
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const avgPrepTime = orders.length > 0 
    ? Math.round(orders.reduce((sum, o) => sum + Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000), 0) / orders.length)
    : 0;
  
  const deliveredDiff = dailyStats.delivered - dailyStats.yesterdayDelivered;

  // Buscar estabelecimento considerando super admin
  const fetchEstablishment = useCallback(async () => {
    if (!user) return null;

    try {
      const { data: isSuperAdmin } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'super_admin'
      });

      let establishment = null;

      if (isSuperAdmin && slug) {
        const { data } = await supabase
          .from("establishments")
          .select("id, segment_id, slug")
          .eq("slug", slug)
          .single();
        establishment = data;
        if (data) setEstablishmentSlug(data.slug);
      } else if (!isSuperAdmin) {
        const { data } = await supabase
          .from("establishments")
          .select("id, segment_id, slug")
          .eq("owner_id", user.id)
          .single();
        establishment = data;
        if (data) setEstablishmentSlug(data.slug);
      } else {
        const { data: estUsers } = await supabase
          .from("establishment_users")
          .select("establishment_id, establishments(id, segment_id, slug)")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .limit(1)
          .single();
        
        if (estUsers?.establishments) {
          establishment = estUsers.establishments as { id: string; segment_id: string | null; slug: string };
          setEstablishmentSlug(establishment.slug);
        }
      }

      if (establishment) {
        setEstablishmentId(establishment.id);
        
        if (establishment.segment_id) {
          const { data: segment } = await supabase
            .from("segments")
            .select("slug")
            .eq("id", establishment.segment_id)
            .single();
          
          if (segment) {
            setSegmentSlug(segment.slug);
          }
        }
      }

      return establishment;
    } catch (error) {
      console.error("Error fetching establishment:", error);
      return null;
    }
  }, [user, slug]);

  // Buscar estatísticas do dia
  const fetchDailyStats = useCallback(async () => {
    if (!establishmentId) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    try {
      // Pedidos entregues hoje
      const { count: deliveredToday } = await supabase
        .from("orders")
        .select("*", { count: 'exact', head: true })
        .eq("establishment_id", establishmentId)
        .eq("status", "delivered")
        .gte("created_at", today.toISOString());

      // Pedidos cancelados hoje
      const { count: cancelledToday } = await supabase
        .from("orders")
        .select("*", { count: 'exact', head: true })
        .eq("establishment_id", establishmentId)
        .eq("status", "cancelled")
        .gte("created_at", today.toISOString());

      // Pedidos entregues ontem
      const { count: deliveredYesterday } = await supabase
        .from("orders")
        .select("*", { count: 'exact', head: true })
        .eq("establishment_id", establishmentId)
        .eq("status", "delivered")
        .gte("created_at", yesterday.toISOString())
        .lt("created_at", today.toISOString());

      // Buscar últimos pedidos entregues para histórico
      const { data: recentDelivered } = await supabase
        .from("orders")
        .select("*")
        .eq("establishment_id", establishmentId)
        .in("status", ["delivered", "cancelled"])
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false })
        .limit(20);

      setDailyStats({
        delivered: deliveredToday || 0,
        returned: 0,
        cancelled: cancelledToday || 0,
        yesterdayDelivered: deliveredYesterday || 0
      });

      if (recentDelivered) {
        setDeliveredOrders(recentDelivered.map(o => ({
          ...o,
          items: (o.items as unknown as OrderItem[]) || []
        })));
      }
    } catch (error) {
      console.error("Error fetching daily stats:", error);
    }
  }, [establishmentId]);

  const fetchOrders = useCallback(async () => {
    if (!establishmentId) return;

    try {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("establishment_id", establishmentId)
        .in("status", ["preparing", "ready"])
        .order("created_at", { ascending: true });

      if (data) {
        const newOrders = data.map(o => ({
          ...o,
          items: (o.items as unknown as OrderItem[]) || []
        }));

        // Detectar novos pedidos
        const currentIds = newOrders.map(o => o.id);
        const newIds = currentIds.filter(id => !previousOrdersRef.current.includes(id));
        
        if (newIds.length > 0 && previousOrdersRef.current.length > 0) {
          const newOrder = newOrders.find(o => o.id === newIds[0]);
          if (newOrder) {
            setNewOrderNumber(newOrder.order_number);
            setShowNewOrderSplash(true);
            playNotification('new_order');
            
            await supabase.from('notifications').insert({
              establishment_id: establishmentId,
              type: 'new_order',
              priority: 'high',
              title: `Pedido #${newOrder.order_number} na cozinha!`,
              message: `Novo pedido para preparação`,
              target_roles: ['manager', 'kitchen'],
              data: { order_id: newOrder.id, order_number: newOrder.order_number }
            });
            
            setTimeout(() => {
              setShowNewOrderSplash(false);
              setNewOrderNumber(null);
              stopSound();
            }, 3000);
          }
        }

        previousOrdersRef.current = currentIds;
        setOrders(newOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, [establishmentId, playNotification, stopSound]);

  // Inicialização
  useEffect(() => {
    fetchEstablishment();
  }, [fetchEstablishment]);

  // Buscar pedidos e estatísticas quando tiver establishmentId
  useEffect(() => {
    if (!establishmentId) return;

    fetchOrders();
    fetchDailyStats();
    
    const channel = supabase
      .channel(`kitchen-orders-${establishmentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `establishment_id=eq.${establishmentId}`
        },
        () => {
          fetchOrders();
          fetchDailyStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [establishmentId, fetchOrders, fetchDailyStats]);

  const updateStatus = async (orderId: string, newStatus: "preparing" | "ready" | "delivered") => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      if (newStatus === "ready") {
        toast.success("Pedido pronto para entrega!");
        
        await supabase.from('notifications').insert({
          establishment_id: establishmentId,
          type: 'order_ready',
          priority: 'high',
          title: `Pedido pronto!`,
          message: `Pedido está pronto para entrega/retirada`,
          target_roles: ['manager', 'cashier', 'waiter', 'delivery'],
          data: { order_id: orderId }
        });
      }

      if (newStatus === "delivered") {
        toast.success("Pedido entregue!");
        
        // Send WhatsApp notification with review link
        try {
          await supabase.functions.invoke('whatsapp-order-notifications', {
            body: { order_id: orderId, status: 'delivered' }
          });
        } catch (notifError) {
          console.log("WhatsApp notification skipped:", notifError);
        }
      }

      fetchOrders();
      fetchDailyStats();
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  // Handle delivery with payment confirmation for cash/card_on_delivery/pix_on_delivery
  const handleMarkDelivered = (order: Order) => {
    const needsPaymentConfirmation = ['cash', 'card_on_delivery', 'pix_on_delivery'].includes(order.payment_method || '');
    
    if (needsPaymentConfirmation) {
      setOrderToConfirmPayment(order);
    } else {
      updateStatus(order.id, 'delivered');
    }
  };

  // Confirm payment and mark as delivered
  const confirmPaymentAndDeliver = async (orderId: string, amount: number) => {
    if (!user || !establishmentId) return;
    
    setIsConfirmingPayment(true);
    try {
      const order = orderToConfirmPayment;
      if (!order) throw new Error("Pedido não encontrado");

      // 1. Update order status and payment confirmation
      const { error: orderError } = await supabase
        .from("orders")
        .update({ 
          status: 'delivered',
          payment_confirmed_at: new Date().toISOString(),
          payment_confirmed_by: user.id
        })
        .eq("id", orderId);

      if (orderError) throw orderError;

      // 2. Register in cash_flow
      const { error: cashFlowError } = await supabase
        .from("cash_flow")
        .insert({
          establishment_id: establishmentId,
          type: 'income',
          category: 'vendas',
          description: `Pedido #${order.order_number}`,
          amount: amount,
          payment_method: order.payment_method,
          reference_id: orderId
        });

      if (cashFlowError) {
        console.error("Cash flow error:", cashFlowError);
      }

      // 3. Send WhatsApp notification with review link
      try {
        await supabase.functions.invoke('whatsapp-order-notifications', {
          body: { order_id: orderId, status: 'delivered' }
        });
      } catch (notifError) {
        console.log("WhatsApp notification skipped:", notifError);
      }

      toast.success("Pagamento confirmado e pedido finalizado!");
      setOrderToConfirmPayment(null);
      fetchOrders();
      fetchDailyStats();
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast.error("Erro ao confirmar pagamento");
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  // Manual payment confirmation for already delivered orders
  const confirmManualPayment = async (order: Order) => {
    if (!user || !establishmentId || !order.total) return;

    try {
      const { error: orderError } = await supabase
        .from("orders")
        .update({ 
          payment_confirmed_at: new Date().toISOString(),
          payment_confirmed_by: user.id
        })
        .eq("id", order.id);

      if (orderError) throw orderError;

      const { error: cashFlowError } = await supabase
        .from("cash_flow")
        .insert({
          establishment_id: establishmentId,
          type: 'income',
          category: 'vendas',
          description: `Pedido #${order.order_number}`,
          amount: order.total,
          payment_method: order.payment_method,
          reference_id: order.id
        });

      if (cashFlowError) console.error("Cash flow error:", cashFlowError);

      toast.success("Pagamento confirmado!");
      fetchDailyStats();
    } catch (error) {
      toast.error("Erro ao confirmar pagamento");
    }
  };

  const getTimeElapsed = (createdAt: string) => {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (diff < 1) return "Agora";
    if (diff < 60) return `${diff} min`;
    return `${Math.floor(diff / 60)}h ${diff % 60}min`;
  };

  const getTimeColor = (createdAt: string) => {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (diff < 15) return "text-green-500";
    if (diff < 30) return "text-yellow-500";
    return "text-red-500";
  };

  const displayConfig = getDisplayConfig(segmentSlug);
  const DisplayIcon = displayConfig.icon;

  return (
    <div className="min-h-screen bg-background p-4 relative">
      {/* Splash Screen para novo pedido */}
      {showNewOrderSplash && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/95 animate-pulse cursor-pointer"
          onClick={() => {
            setShowNewOrderSplash(false);
            stopSound();
          }}
        >
          <div className="text-center text-primary-foreground">
            <Bell className="w-24 h-24 mx-auto mb-6 animate-bounce" />
            <h1 className="text-6xl font-bold mb-4">NOVO PEDIDO!</h1>
            <p className="text-4xl font-semibold">#{newOrderNumber}</p>
            <p className="text-xl mt-6 opacity-80">Toque para fechar</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(establishmentSlug ? `/painel/${establishmentSlug}` : '/painel')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <DisplayIcon className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">{displayConfig.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {isPlaying && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={stopSound}
              className="text-destructive"
            >
              <VolumeX className="w-5 h-5" />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              fetchOrders();
              fetchDailyStats();
            }}
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {orders.length} pedidos
          </Badge>
        </div>
      </div>

      {/* Stats Summary - Métricas do Dia */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <ChefHat className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{preparingOrders.length}</p>
              <p className="text-xs text-muted-foreground">Preparando</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{readyOrders.length}</p>
              <p className="text-xs text-muted-foreground">Prontos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{dailyStats.delivered}</p>
              <p className="text-xs text-muted-foreground">Entregues Hoje</p>
            </div>
          </CardContent>
        </Card>
        <Card className={deliveredDiff >= 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${deliveredDiff >= 0 ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
              {deliveredDiff >= 0 ? (
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div>
              <p className="text-2xl font-bold">{deliveredDiff >= 0 ? `+${deliveredDiff}` : deliveredDiff}</p>
              <p className="text-xs text-muted-foreground">vs Ontem</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Timer className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgPrepTime}min</p>
              <p className="text-xs text-muted-foreground">Tempo Médio</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando pedidos...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Utensils className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-xl">{displayConfig.emptyText}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orders.map((order) => (
            <Card 
              key={order.id} 
              className={`${
                order.status === "preparing" 
                  ? "border-orange-500 border-2" 
                  : order.status === "ready"
                    ? "border-green-500 border-2"
                    : "border-border"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-3xl font-bold">
                    #{order.order_number}
                  </CardTitle>
                  <div className={`flex items-center gap-1 ${getTimeColor(order.created_at)}`}>
                    <Clock className="w-5 h-5" />
                    <span className="font-bold text-lg">{getTimeElapsed(order.created_at)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={order.delivery_type === "delivery" ? "default" : "secondary"}>
                    {order.delivery_type === "delivery" ? "🚚 Delivery" : 
                     order.delivery_type === "pickup" ? "🏪 Retirada" : 
                     `🍽️ Mesa ${order.table_number}`}
                  </Badge>
                  <Badge variant={order.status === "preparing" ? "default" : "secondary"} 
                    className={order.status === "ready" ? "bg-green-500 text-white" : ""}>
                    {order.status === "preparing" ? "Preparando" : "Pronto"}
                  </Badge>
                  {order.payment_method && (
                    <Badge variant="outline" className="text-xs">
                      {order.payment_method === "pix" ? "💳 PIX" :
                       order.payment_method === "credit_card" ? "💳 Crédito" :
                       order.payment_method === "debit_card" ? "💳 Débito" :
                       order.payment_method === "cash" ? "💵 Dinheiro" :
                       order.payment_method === "card_on_delivery" ? "💳 Cartão Entrega" :
                       order.payment_method}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Observação geral do pedido em destaque */}
                {order.observations && (
                  <div className="p-3 rounded-lg bg-yellow-500/20 border-2 border-yellow-500/50">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-yellow-700 dark:text-yellow-400 text-sm">OBSERVAÇÃO DO CLIENTE:</p>
                        <p className="text-base font-medium">{order.observations}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Itens do pedido */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {order.items.map((item, idx) => (
                    <div key={idx} className={`p-3 rounded-lg ${item.observations ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-muted/50'}`}>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-2xl bg-primary/10 px-3 py-1 rounded">{item.quantity}x</span>
                        <span className="font-medium text-lg flex-1">{item.name}</span>
                      </div>
                      {item.observations && (
                        <p className="text-sm text-yellow-600 mt-2 flex items-start gap-2 font-medium bg-yellow-500/5 p-2 rounded">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          {item.observations}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  {order.status === "preparing" && (
                    <Button
                      onClick={() => updateStatus(order.id, "ready")}
                      className="flex-1 h-14 text-lg"
                    >
                      <CheckCircle className="w-6 h-6 mr-2" />
                      Marcar Pronto
                    </Button>
                  )}
                  {order.status === "ready" && (
                    <Button
                      onClick={() => handleMarkDelivered(order)}
                      variant="outline"
                      className="flex-1 h-14 text-lg border-green-500 text-green-600 hover:bg-green-500/10"
                    >
                      <CheckCircle className="w-6 h-6 mr-2" />
                      Entregue
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Histórico de Entregas do Dia */}
      <Collapsible open={showHistory} onOpenChange={setShowHistory} className="mt-8">
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span>Histórico do Dia ({dailyStats.delivered + dailyStats.cancelled} pedidos)</span>
            </div>
            <Badge variant="secondary">
              ✅ {dailyStats.delivered} entregues | ❌ {dailyStats.cancelled} cancelados
            </Badge>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <Card>
            <CardContent className="p-4">
              {deliveredOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum pedido finalizado hoje
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {deliveredOrders.map((order) => {
                    const needsPaymentConfirmation = ['cash', 'card_on_delivery', 'pix_on_delivery'].includes(order.payment_method || '');
                    const isPaid = !!order.payment_confirmed_at || !needsPaymentConfirmation;
                    
                    return (
                      <div 
                        key={order.id} 
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          order.status === 'delivered' ? 'bg-green-500/10' : 'bg-red-500/10'
                        }`}
                      >
                        <div 
                          className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <span className="text-lg font-bold">#{order.order_number}</span>
                          <Badge variant={order.status === 'delivered' ? 'default' : 'destructive'}>
                            {order.status === 'delivered' ? '✅ Entregue' : '❌ Cancelado'}
                          </Badge>
                          {order.status === 'delivered' && (
                            <Badge variant={isPaid ? 'outline' : 'secondary'} className={isPaid ? 'text-green-600' : 'text-orange-600'}>
                              {isPaid ? '💰 Pago' : '⏳ Pag. Pendente'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {order.status === 'delivered' && !isPaid && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-500 text-green-600 hover:bg-green-500/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmManualPayment(order);
                              }}
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              Confirmar
                            </Button>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <Eye 
                            className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" 
                            onClick={() => setSelectedOrder(order)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Pedido #{selectedOrder?.order_number}</span>
              <Badge variant={selectedOrder?.status === 'delivered' ? 'default' : 'destructive'}>
                {selectedOrder?.status === 'delivered' ? '✅ Entregue' : '❌ Cancelado'}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>
                  {new Date(selectedOrder.created_at).toLocaleString('pt-BR', { 
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit' 
                  })}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {selectedOrder.delivery_type === "delivery" ? "🚚 Delivery" : 
                   selectedOrder.delivery_type === "pickup" ? "🏪 Retirada" : 
                   `🍽️ Mesa ${selectedOrder.table_number}`}
                </Badge>
                {selectedOrder.payment_method && (
                  <Badge variant="outline">
                    {selectedOrder.payment_method === "pix" ? "💳 PIX" :
                     selectedOrder.payment_method === "credit_card" ? "💳 Crédito" :
                     selectedOrder.payment_method === "debit_card" ? "💳 Débito" :
                     selectedOrder.payment_method === "cash" ? "💵 Dinheiro" :
                     selectedOrder.payment_method}
                  </Badge>
                )}
              </div>

              {selectedOrder.observations && (
                <div className="p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/50">
                  <p className="font-bold text-yellow-700 dark:text-yellow-400 text-sm mb-1">OBSERVAÇÃO:</p>
                  <p className="text-sm">{selectedOrder.observations}</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="font-semibold">Itens do Pedido:</p>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className={`p-3 rounded-lg ${item.observations ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-muted/50'}`}>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg bg-primary/10 px-2 py-1 rounded">{item.quantity}x</span>
                      <span className="font-medium flex-1">{item.name}</span>
                    </div>
                    {item.observations && (
                      <p className="text-sm text-yellow-600 mt-2 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        {item.observations}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setSelectedOrder(null)}
              >
                <X className="w-4 h-4 mr-2" />
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Confirmation Dialog */}
      <PaymentConfirmationDialog
        order={orderToConfirmPayment}
        open={!!orderToConfirmPayment}
        onOpenChange={(open) => !open && setOrderToConfirmPayment(null)}
        onConfirm={confirmPaymentAndDeliver}
        isLoading={isConfirmingPayment}
      />
    </div>
  );
};

export default KitchenDisplay;
