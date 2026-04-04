import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, CheckCircle, XCircle, Eye, DollarSign, Package } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface ScheduledOrder {
  id: string;
  scheduled_for: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_type: string;
  delivery_address: any;
  payment_method: string;
  status: string;
  notes: string | null;
  created_at: string;
  customers?: { name: string; phone: string };
}

const ScheduledOrdersManagement = () => {
  const [orders, setOrders] = useState<ScheduledOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ScheduledOrder | null>(null);

  useEffect(() => {
    fetchOrders();
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
        .from("scheduled_orders")
        .select("*")
        .eq("establishment_id", establishment.id)
        .in("status", ["pending", "confirmed"])
        .order("scheduled_for", { ascending: true });

      if (data) {
        // Buscar dados dos clientes pelos customer_id (que são user_ids)
        const customerIds = data.map(o => o.customer_id).filter(Boolean);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .in("id", customerIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        setOrders(data.map(o => ({
          ...o,
          items: (o.items as unknown as OrderItem[]) || [],
          customers: profileMap.get(o.customer_id) ? {
            name: profileMap.get(o.customer_id)?.full_name || "Cliente",
            phone: profileMap.get(o.customer_id)?.phone || ""
          } : undefined
        })));
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await supabase
        .from("scheduled_orders")
        .update({ status })
        .eq("id", orderId);

      toast.success(status === "confirmed" ? "Pedido confirmado!" : "Pedido cancelado");
      fetchOrders();
    } catch (error) {
      toast.error("Erro ao atualizar");
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Hoje";
    if (isTomorrow(date)) return "Amanhã";
    return format(date, "dd/MM", { locale: ptBR });
  };

  const todayOrders = orders.filter(o => isToday(parseISO(o.scheduled_for)));
  const totalToday = todayOrders.reduce((acc, o) => acc + o.total, 0);

  return (
    <DashboardLayout title="Pedidos Agendados">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Agendados</p>
                <p className="text-xl font-bold">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Para Hoje</p>
                <p className="text-xl font-bold">{todayOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Hoje</p>
                <p className="text-xl font-bold">R$ {totalToday.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Pedidos Agendados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum pedido agendado
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={isToday(parseISO(order.scheduled_for)) ? "default" : "outline"}>
                          {getDateLabel(order.scheduled_for)}
                        </Badge>
                        <span className="text-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(parseISO(order.scheduled_for), "HH:mm")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{order.customers?.name || "Cliente"}</p>
                      <p className="text-sm text-muted-foreground">{order.customers?.phone}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{order.items.length} itens</span>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      R$ {order.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.status === "confirmed" ? "default" : "secondary"}>
                        {order.status === "confirmed" ? "Confirmado" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {order.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(order.id, "confirmed")}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateStatus(order.id, "cancelled")}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido Agendado</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Agendado para</p>
                <p className="font-bold text-lg">
                  {format(parseISO(selectedOrder.scheduled_for), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              <div>
                <p className="font-medium mb-2">Itens:</p>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1">
                    <span>{item.quantity}x {item.name}</span>
                    <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>R$ {selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                {selectedOrder.delivery_fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Entrega</span>
                    <span>R$ {selectedOrder.delivery_fee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>R$ {selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm font-medium">Observações:</p>
                  <p className="text-sm">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ScheduledOrdersManagement;
