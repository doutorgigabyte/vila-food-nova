import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChefHat, Clock, CheckCircle, AlertCircle, Utensils, Package, Cog, Bell, VolumeX, Volume2, ArrowLeft, Truck, Timer } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { useAuth } from "@/hooks/useAuth";

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
  const [loading, setLoading] = useState(true);
  const [segmentSlug, setSegmentSlug] = useState<string | null>(null);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [establishmentSlug, setEstablishmentSlug] = useState<string | null>(null);
  const [showNewOrderSplash, setShowNewOrderSplash] = useState(false);
  const [newOrderNumber, setNewOrderNumber] = useState<number | null>(null);
  const previousOrdersRef = useRef<string[]>([]);
  
  const { playNotification, stopSound, isPlaying } = useNotificationSound();

  // Stats for summary
  const confirmedOrders = orders.filter(o => o.status === 'confirmed');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const avgPrepTime = orders.length > 0 
    ? Math.round(orders.reduce((sum, o) => sum + Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000), 0) / orders.length)
    : 0;

  // Buscar estabelecimento considerando super admin
  const fetchEstablishment = useCallback(async () => {
    if (!user) return null;

    try {
      // Check if super_admin
      const { data: isSuperAdmin } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'super_admin'
      });

      let establishment = null;

      // Se super admin e tem slug, buscar pelo slug
      if (isSuperAdmin && slug) {
        const { data } = await supabase
          .from("establishments")
          .select("id, segment_id, slug")
          .eq("slug", slug)
          .single();
        establishment = data;
        if (data) setEstablishmentSlug(data.slug);
      } 
      // Se não é super admin ou não tem slug, buscar pelo owner_id
      else if (!isSuperAdmin) {
        const { data } = await supabase
          .from("establishments")
          .select("id, segment_id, slug")
          .eq("owner_id", user.id)
          .single();
        establishment = data;
        if (data) setEstablishmentSlug(data.slug);
      }
      // Se é super admin sem slug, tentar buscar via establishment_users
      else {
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
        
        // Buscar slug do segmento
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

  const fetchOrders = useCallback(async () => {
    if (!establishmentId) return;

    try {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("establishment_id", establishmentId)
        .in("status", ["confirmed", "preparing"])
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
          // Há novos pedidos - mostrar splash e tocar som
          const newOrder = newOrders.find(o => o.id === newIds[0]);
          if (newOrder) {
            setNewOrderNumber(newOrder.order_number);
            setShowNewOrderSplash(true);
            playNotification('new_order');
            
            // Criar notificação no banco
            await supabase.from('notifications').insert({
              establishment_id: establishmentId,
              type: 'new_order',
              priority: 'high',
              title: `Pedido #${newOrder.order_number} na cozinha!`,
              message: `Novo pedido para preparação`,
              target_roles: ['manager', 'kitchen'],
              data: { order_id: newOrder.id, order_number: newOrder.order_number }
            });
            
            // Fechar splash após 3 segundos
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

  // Buscar pedidos e configurar realtime quando tiver establishmentId
  useEffect(() => {
    if (!establishmentId) return;

    fetchOrders();
    
    // Real-time subscription com filtro de establishment_id
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
        (payload) => {
          console.log('Kitchen order change:', payload);
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [establishmentId, fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: "pending" | "confirmed" | "preparing" | "ready" | "delivering" | "delivered" | "cancelled") => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      if (newStatus === "ready") {
        toast.success("Pedido pronto para entrega!");
        
        // Criar notificação de pedido pronto
        await supabase.from('notifications').insert({
          establishment_id: establishmentId,
          type: 'order_ready',
          priority: 'high',
          title: `Pedido pronto!`,
          message: `Pedido está pronto para entrega/retirada`,
          target_roles: ['manager', 'cashier', 'waiter', 'delivery'],
          data: { order_id: orderId }
        });
      } else if (newStatus === "preparing") {
        toast.info("Pedido em preparo");
      }

      fetchOrders();
    } catch (error) {
      toast.error("Erro ao atualizar status");
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

      {/* Header com botão voltar */}
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
          <Badge variant="outline" className="text-lg px-4 py-2">
            {orders.length} pedidos
          </Badge>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Bell className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{confirmedOrders.length}</p>
              <p className="text-xs text-muted-foreground">Aguardando</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <ChefHat className="w-5 h-5 text-blue-600" />
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
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-xs text-muted-foreground">Total Ativos</p>
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
                  ? "border-yellow-500 border-2" 
                  : "border-border"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold">
                    #{order.order_number}
                  </CardTitle>
                  <div className={`flex items-center gap-1 ${getTimeColor(order.created_at)}`}>
                    <Clock className="w-4 h-4" />
                    <span className="font-bold">{getTimeElapsed(order.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={order.delivery_type === "delivery" ? "default" : "secondary"}>
                    {order.delivery_type === "delivery" ? "Delivery" : 
                     order.delivery_type === "pickup" ? "Retirada" : 
                     `Mesa ${order.table_number}`}
                  </Badge>
                  <Badge variant={order.status === "preparing" ? "default" : "outline"}>
                    {order.status === "preparing" ? "Preparando" : "Aguardando"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {order.items.map((item, idx) => (
                    <div key={idx} className={`p-2 rounded ${item.observations ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-muted/50'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xl bg-primary/10 px-2 py-0.5 rounded">{item.quantity}x</span>
                        <span className="font-medium flex-1 ml-2 text-base">{item.name}</span>
                      </div>
                      {item.observations && (
                        <p className="text-sm text-yellow-600 mt-2 flex items-start gap-1 font-medium bg-yellow-500/5 p-1.5 rounded">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          {item.observations}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  {order.status === "confirmed" && (
                    <Button
                      onClick={() => updateStatus(order.id, "preparing")}
                      variant="outline"
                      className="flex-1 h-12"
                    >
                      <ChefHat className="w-5 h-5 mr-2" />
                      Iniciar Preparo
                    </Button>
                  )}
                  <Button
                    onClick={() => updateStatus(order.id, "ready")}
                    className="flex-1 h-12"
                    variant={order.status === "preparing" ? "default" : "outline"}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Marcar Pronto
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default KitchenDisplay;
