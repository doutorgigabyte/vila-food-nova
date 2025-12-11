import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChefHat, Clock, CheckCircle, AlertCircle, Utensils, Package, Cog, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

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

const getDisplayConfig = (segmentSlug: string | null) => {
  const kitchenSegments = ['restaurante', 'pizzaria', 'hamburgueria', 'lanchonete', 'churrascaria', 'japonesa', 'chinesa', 'italiana', 'arabe', 'brasileira', 'marmita', 'acai', 'sorvetes', 'pastel', 'saudavel', 'carnes', 'lanches'];
  const productionSegments = ['padaria', 'confeitaria', 'doces-e-bolos', 'salgados', 'artesanato'];
  
  if (!segmentSlug) return { title: "Display Produção", icon: Package, emptyText: "Nenhum pedido pendente" };
  if (kitchenSegments.includes(segmentSlug)) return { title: "Display Cozinha", icon: ChefHat, emptyText: "Nenhum pedido pendente" };
  if (productionSegments.includes(segmentSlug)) return { title: "Display Produção", icon: Package, emptyText: "Nenhum pedido em produção" };
  return { title: "Display Processos", icon: Cog, emptyText: "Nenhum pedido em processamento" };
};

export default function PublicKitchenDisplay() {
  const { token } = useParams<{ token: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [segmentSlug, setSegmentSlug] = useState<string | null>(null);
  const [establishmentName, setEstablishmentName] = useState<string>("");
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newOrderId, setNewOrderId] = useState<string | null>(null);
  const previousOrdersRef = useRef<string[]>([]);

  useEffect(() => {
    if (token) validateTokenAndFetch();
  }, [token]);

  useEffect(() => {
    if (!establishmentId) return;
    const channel = supabase.channel('public-kitchen-orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `establishment_id=eq.${establishmentId}` }, (payload) => {
      fetchOrders();
      if (payload.eventType === 'INSERT' || (payload.eventType === 'UPDATE' && (payload.new as any).status === 'confirmed')) {
        const newOrder = payload.new as any;
        if (!previousOrdersRef.current.includes(newOrder.id)) {
          setNewOrderId(newOrder.id);
          setTimeout(() => setNewOrderId(null), 5000);
        }
      }
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [establishmentId]);

  const validateTokenAndFetch = async () => {
    try {
      const { data: tokenData, error: tokenError } = await (supabase.from("public_display_tokens" as any).select("establishment_id, display_type, name").eq("token", token).eq("is_active", true).single() as any);
      if (tokenError || !tokenData) { setError("Token inválido ou expirado"); setLoading(false); return; }
      setEstablishmentId(tokenData.establishment_id);
      const { data: establishment } = await supabase.from("establishments").select("id, name, segment_id").eq("id", tokenData.establishment_id).single();
      if (establishment) {
        setEstablishmentName(establishment.name);
        if (establishment.segment_id) {
          const { data: segment } = await supabase.from("segments").select("slug").eq("id", establishment.segment_id).single();
          if (segment) setSegmentSlug(segment.slug);
        }
      }
      await fetchOrders(tokenData.establishment_id);
    } catch (err) { setError("Erro ao carregar dados"); } finally { setLoading(false); }
  };

  const fetchOrders = async (estId?: string) => {
    const targetId = estId || establishmentId;
    if (!targetId) return;
    try {
      const { data } = await supabase.from("orders").select("*").eq("establishment_id", targetId).in("status", ["confirmed", "preparing"]).order("created_at", { ascending: true });
      if (data) {
        previousOrdersRef.current = data.map(o => o.id);
        setOrders(data.map(o => ({ ...o, items: (o.items as unknown as OrderItem[]) || [] })));
      }
    } catch (error) { console.error("Error fetching orders:", error); }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus as any }).eq("id", orderId);
      if (error) throw error;
      if (newStatus === "ready") toast.success("Pedido pronto!");
      else if (newStatus === "preparing") toast.info("Pedido em preparo");
      fetchOrders();
    } catch (error) { toast.error("Erro ao atualizar status"); }
  };

  const getTimeElapsed = (createdAt: string) => { const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000); if (diff < 1) return "Agora"; if (diff < 60) return `${diff} min`; return `${Math.floor(diff / 60)}h ${diff % 60}min`; };
  const getTimeColor = (createdAt: string) => { const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000); if (diff < 15) return "text-green-500"; if (diff < 30) return "text-yellow-500"; return "text-red-500"; };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-pulse text-white text-2xl">Carregando...</div></div>;
  if (error) return <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white"><AlertCircle className="w-16 h-16 text-red-500 mb-4" /><h1 className="text-2xl font-bold mb-2">Acesso Negado</h1><p className="text-gray-400">{error}</p></div>;

  const displayConfig = getDisplayConfig(segmentSlug);
  const DisplayIcon = displayConfig.icon;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <DisplayIcon className="w-12 h-12 text-primary" />
          <div><h1 className="text-3xl font-bold">{displayConfig.title}</h1><p className="text-gray-400 text-lg">{establishmentName}</p></div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSoundEnabled(!soundEnabled)} className="text-white">{soundEnabled ? <Volume2 className="w-8 h-8" /> : <VolumeX className="w-8 h-8" />}</Button>
          <Badge variant="outline" className="text-2xl px-6 py-3 border-primary text-primary">{orders.length} pedidos</Badge>
        </div>
      </div>
      <AnimatePresence>
        {newOrderId && (
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 0.5 }} className="bg-primary rounded-3xl p-12 text-center"><ChefHat className="w-24 h-24 mx-auto mb-4" /><h2 className="text-4xl font-bold">NOVO PEDIDO!</h2></motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500"><Utensils className="w-32 h-32 mb-6 opacity-20" /><p className="text-3xl">{displayConfig.emptyText}</p></div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {orders.map((order) => (
            <motion.div key={order.id} layout initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <Card className={`bg-gray-900 border-2 ${order.status === "preparing" ? "border-yellow-500" : "border-gray-700"} ${order.id === newOrderId ? "ring-4 ring-primary" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between"><CardTitle className="text-4xl font-bold text-white">#{order.order_number}</CardTitle><div className={`flex items-center gap-2 ${getTimeColor(order.created_at)}`}><Clock className="w-6 h-6" /><span className="text-2xl font-bold">{getTimeElapsed(order.created_at)}</span></div></div>
                  <div className="flex items-center gap-2 mt-2"><Badge variant={order.delivery_type === "delivery" ? "default" : "secondary"} className="text-lg px-3 py-1">{order.delivery_type === "delivery" ? "Delivery" : order.delivery_type === "pickup" ? "Retirada" : `Mesa ${order.table_number}`}</Badge><Badge variant={order.status === "preparing" ? "default" : "outline"} className="text-lg px-3 py-1">{order.status === "preparing" ? "Preparando" : "Aguardando"}</Badge></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {order.items.map((item, idx) => (<div key={idx} className="p-3 bg-gray-800 rounded-lg"><div className="flex items-center gap-3"><span className="text-3xl font-bold text-primary">{item.quantity}x</span><span className="text-xl font-medium text-white">{item.name}</span></div>{item.observations && <p className="text-lg text-yellow-500 mt-2 flex items-center gap-2"><AlertCircle className="w-5 h-5" />{item.observations}</p>}</div>))}
                  </div>
                  <div className="flex gap-3">
                    {order.status === "confirmed" && <Button onClick={() => updateStatus(order.id, "preparing")} variant="outline" className="flex-1 text-lg py-6"><ChefHat className="w-6 h-6 mr-2" />Iniciar</Button>}
                    <Button onClick={() => updateStatus(order.id, "ready")} className="flex-1 text-lg py-6" variant={order.status === "preparing" ? "default" : "outline"}><CheckCircle className="w-6 h-6 mr-2" />Pronto</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}