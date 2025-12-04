import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChefHat, Clock, CheckCircle, AlertCircle, Utensils } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

const KitchenDisplay = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    
    // Real-time subscription
    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: establishment } = await supabase
        .from("establishments")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!establishment) return;

      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("establishment_id", establishment.id)
        .in("status", ["confirmed", "preparing"])
        .order("created_at", { ascending: true });

      if (data) {
        setOrders(data.map(o => ({
          ...o,
          items: (o.items as unknown as OrderItem[]) || []
        })));
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: "pending" | "confirmed" | "preparing" | "ready" | "delivering" | "delivered" | "cancelled") => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      if (newStatus === "ready") {
        toast.success("Pedido pronto para entrega!");
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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">Display Cozinha</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-4 py-2">
            {orders.length} pedidos
          </Badge>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando pedidos...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Utensils className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-xl">Nenhum pedido pendente</p>
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
                    <div key={idx} className="p-2 bg-muted/50 rounded">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">{item.quantity}x</span>
                        <span className="font-medium flex-1 ml-2">{item.name}</span>
                      </div>
                      {item.observations && (
                        <p className="text-sm text-yellow-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {item.observations}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  {order.status === "confirmed" && (
                    <Button
                      onClick={() => updateStatus(order.id, "preparing")}
                      variant="outline"
                      className="flex-1"
                    >
                      <ChefHat className="w-4 h-4 mr-2" />
                      Iniciar
                    </Button>
                  )}
                  <Button
                    onClick={() => updateStatus(order.id, "ready")}
                    className="flex-1"
                    variant={order.status === "preparing" ? "default" : "outline"}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Pronto
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
