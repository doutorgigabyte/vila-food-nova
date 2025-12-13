import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { ShoppingCart, Search, Eye, Clock, CheckCircle, XCircle, Truck, ChefHat, Package, RotateCcw, UserX, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  awaiting_payment: { label: 'Aguardando Pgto', color: 'bg-amber-500', icon: CreditCard },
  pending: { label: 'Pendente', color: 'bg-yellow-500', icon: Clock },
  confirmed: { label: 'Confirmado', color: 'bg-blue-500', icon: CheckCircle },
  preparing: { label: 'Preparando', color: 'bg-orange-500', icon: ChefHat },
  ready: { label: 'Pronto', color: 'bg-green-500', icon: Package },
  delivering: { label: 'Em Entrega', color: 'bg-purple-500', icon: Truck },
  delivered: { label: 'Entregue', color: 'bg-green-700', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-500', icon: XCircle },
  refunded: { label: 'Reembolsado', color: 'bg-blue-600', icon: RotateCcw },
  returned: { label: 'Devolvido', color: 'bg-amber-600', icon: RotateCcw },
  customer_absent: { label: 'Cliente Ausente', color: 'bg-red-400', icon: UserX },
};

const AdminOrdersManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstablishment, setFilterEstablishment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch all orders with establishment info
  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          establishments (id, name, slug),
          customers (id, name, phone)
        `)
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch establishments for filter
  const { data: establishments } = useQuery({
    queryKey: ['admin-establishments-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('establishments')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, order }: { id: string; status: string; order?: any }) => {
      const updateData: any = { status };
      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      } else if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;

      // Criar notificações quando status muda
      if (status === 'confirmed' && order?.establishment_id) {
        await supabase.from('notifications').insert({
          establishment_id: order.establishment_id,
          type: 'order_confirmed',
          priority: 'high',
          title: `Pedido #${order.order_number} confirmado!`,
          message: 'Novo pedido para preparação na cozinha',
          target_roles: ['manager', 'kitchen'],
          data: { order_id: id, order_number: order.order_number }
        });
      }

      if (status === 'ready' && order?.establishment_id) {
        await supabase.from('notifications').insert({
          establishment_id: order.establishment_id,
          type: 'order_ready',
          priority: 'high',
          title: `Pedido #${order.order_number} pronto!`,
          message: 'Pedido pronto para entrega/retirada',
          target_roles: ['manager', 'cashier', 'waiter', 'delivery'],
          data: { order_id: id, order_number: order.order_number }
        });

        // Se for delivery, criar solicitação de entrega para motoristas
        if (order.delivery_type === 'delivery') {
          const expiresAt = new Date();
          expiresAt.setMinutes(expiresAt.getMinutes() + 5);

          await supabase.from('delivery_requests').insert({
            order_id: id,
            establishment_id: order.establishment_id,
            status: 'pending',
            calculated_fee: order.delivery_fee || 0,
            driver_earnings: order.delivery_fee || 0,
            expires_at: expiresAt.toISOString(),
            pickup_address: order.establishments?.address || '',
            delivery_address: order.delivery_address 
              ? `${order.delivery_address.street}, ${order.delivery_address.number} - ${order.delivery_address.neighborhood}`
              : '',
            customer_name: order.delivery_address?.name || 'Cliente'
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Status atualizado!');
    }
  });

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = 
      order.order_number?.toString().includes(searchTerm) ||
      order.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customers?.phone?.includes(searchTerm);
    const matchesEstablishment = filterEstablishment === 'all' || order.establishment_id === filterEstablishment;
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesEstablishment && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const viewOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  return (
    <AdminLayout title="Gerenciar Pedidos" icon={ShoppingCart} breadcrumb="Pedidos">
      <Card>
        <CardHeader>
          <CardTitle>Todos os Pedidos ({orders?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, cliente ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterEstablishment} onValueChange={setFilterEstablishment}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Filtrar por estabelecimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estabelecimentos</SelectItem>
                {establishments?.map(est => (
                  <SelectItem key={est.id} value={est.id}>{est.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Estabelecimento</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders?.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-bold">#{order.order_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.establishments?.name || '-'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customers?.name || 'Cliente não identificado'}</p>
                          <p className="text-xs text-muted-foreground">{order.customers?.phone || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {order.delivery_type === 'delivery' ? 'Entrega' : 
                           order.delivery_type === 'pickup' ? 'Retirada' : 
                           order.delivery_type === 'table' ? 'Mesa' : order.delivery_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(order.total)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => viewOrderDetails(order)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredOrders?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        Nenhum pedido encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pedido #{selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6 py-4">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Estabelecimento</p>
                  <p className="font-medium">{selectedOrder.establishments?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedOrder.customers?.name || '-'}</p>
                  <p className="text-sm">{selectedOrder.customers?.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <Badge variant="secondary">
                    {selectedOrder.delivery_type === 'delivery' ? 'Entrega' : 
                     selectedOrder.delivery_type === 'pickup' ? 'Retirada' : 
                     selectedOrder.delivery_type === 'table' ? `Mesa ${selectedOrder.table_number}` : selectedOrder.delivery_type}
                  </Badge>
                </div>
              </div>

              {/* Delivery Address */}
              {selectedOrder.delivery_address && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Endereço de Entrega</p>
                  <p className="text-sm bg-muted p-2 rounded">
                    {typeof selectedOrder.delivery_address === 'string' 
                      ? selectedOrder.delivery_address 
                      : JSON.stringify(selectedOrder.delivery_address)}
                  </p>
                </div>
              )}

              {/* Items */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Itens do Pedido</p>
                <div className="space-y-2">
                  {(selectedOrder.items as any[])?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-muted p-2 rounded">
                      <div>
                        <span className="font-medium">{item.quantity}x</span> {item.name}
                        {item.observations && <p className="text-xs text-muted-foreground">Obs: {item.observations}</p>}
                      </div>
                      <span>{formatCurrency(item.total || item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.delivery_fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Taxa de entrega</span>
                    <span>{formatCurrency(selectedOrder.delivery_fee)}</span>
                  </div>
                )}
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto</span>
                    <span>-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Status Update */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Alterar Status</p>
                <Select 
                  value={selectedOrder.status} 
                  onValueChange={(status) => {
                    updateStatusMutation.mutate({ id: selectedOrder.id, status, order: selectedOrder });
                    setSelectedOrder({ ...selectedOrder, status });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminOrdersManagement;
