import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bell, 
  Settings, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Printer,
  ChevronRight,
  Store,
  Menu,
  ShoppingBag,
  RefreshCw,
  Wifi,
  WifiOff
} from "lucide-react";
import { toast } from "sonner";
import { useDashboardData, useUserEstablishment } from "@/hooks/useDashboardData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useAutoStoreStatus } from "@/hooks/useAutoStoreStatus";

const EstablishmentDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { establishmentId, establishment, loading: estLoading, isSuperAdmin } = useUserEstablishment();
  const { stats, pendingOrders, recentOrders, loading, refetch, lastUpdate, isConnected } = useDashboardData(establishmentId);
  
  const [isOpen, setIsOpen] = useState(establishment?.is_open ?? false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const baseUrl = isSuperAdmin && establishment?.slug ? `/painel/${establishment.slug}` : '/painel';

  // Auto-update store status based on operating hours
  useAutoStoreStatus(establishmentId, establishment?.operating_hours, establishment?.is_open);

  useEffect(() => {
    if (establishment) {
      setIsOpen(establishment.is_open ?? false);
    }
  }, [establishment]);

  const handleToggleStore = async () => {
    if (!establishmentId) return;

    const newStatus = !isOpen;
    setIsOpen(newStatus);

    const { error } = await supabase
      .from('establishments')
      .update({ is_open: newStatus })
      .eq('id', establishmentId);

    if (error) {
      setIsOpen(!newStatus);
      toast.error("Erro ao atualizar status da loja");
    } else {
      toast.success(newStatus ? "Loja aberta!" : "Loja fechada!");
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('id', orderId);

    if (error) {
      toast.error("Erro ao aceitar pedido");
    } else {
      toast.success("Pedido aceito!");
      refetch();
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'cancelled',
        cancellation_reason: 'Recusado pelo estabelecimento',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      toast.error("Erro ao recusar pedido");
    } else {
      toast.error("Pedido recusado");
      refetch();
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const formatOrderTime = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), { 
      addSuffix: true, 
      locale: ptBR 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      case 'ready': return 'bg-blue-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      case 'ready': return 'Pronto';
      case 'preparing': return 'Preparando';
      case 'confirmed': return 'Confirmado';
      default: return 'Pendente';
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('[EstablishmentDashboard] Debug:', {
      user_id: user?.id,
      user_email: user?.email,
      estLoading,
      establishmentId,
      establishment_name: establishment?.name,
      isSuperAdmin
    });
  }, [user, estLoading, establishmentId, establishment, isSuperAdmin]);

  if (estLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!establishmentId) {
    console.log('[EstablishmentDashboard] No establishment found for user:', user?.id, user?.email);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Nenhum estabelecimento vinculado</h2>
            <p className="text-muted-foreground mb-4">
              Você não possui um estabelecimento cadastrado ou não tem permissão de acesso.
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              ID do usuário: {user?.id?.slice(0, 8)}...
            </p>
            <Button asChild>
              <Link to="/cadastrar-estabelecimento">Cadastrar estabelecimento</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        storeOpen={isOpen}
        onToggleStore={handleToggleStore}
        establishment={establishment}
      />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 overflow-x-hidden">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
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
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold truncate">Dashboard</h1>
                {isConnected ? (
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <Wifi className="w-3 h-3" />
                    <span className="hidden sm:inline">Ao vivo</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <WifiOff className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {lastUpdate && (
                <span className="text-xs text-muted-foreground hidden md:block">
                  Atualizado às {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <Button variant="ghost" size="icon" onClick={refetch}>
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {stats.pendingOrders > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link to={`${baseUrl}/configuracoes`}>
                  <Settings className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-6 overflow-x-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vendas hoje</p>
                    {loading ? (
                      <Skeleton className="h-7 w-24" />
                    ) : (
                      <p className="text-xl font-bold">R$ {stats.todaySales.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pedidos hoje</p>
                    {loading ? (
                      <Skeleton className="h-7 w-12" />
                    ) : (
                      <p className="text-xl font-bold">{stats.todayOrders}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                    {loading ? (
                      <Skeleton className="h-7 w-12" />
                    ) : (
                      <p className="text-xl font-bold">{stats.pendingOrders}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vendas mês</p>
                    {loading ? (
                      <Skeleton className="h-7 w-28" />
                    ) : (
                      <p className="text-xl font-bold">R$ {stats.monthSales.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Sources Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Origem dos Pedidos (Mês)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm">Cardápio Digital</span>
                    </div>
                    <span className="font-medium">{stats.ordersBySource.direct}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span className="text-sm">Marketplace</span>
                    </div>
                    <span className="font-medium">{stats.ordersBySource.marketplace}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm">PDV</span>
                    </div>
                    <span className="font-medium">{stats.ordersBySource.pdv}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-sm">WhatsApp</span>
                    </div>
                    <span className="font-medium">{stats.ordersBySource.whatsapp}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Taxas (Mês)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Taxa Marketplace (5%)</span>
                    {loading ? (
                      <Skeleton className="h-5 w-20" />
                    ) : (
                      <span className="font-medium text-primary">R$ {stats.platformFees.toFixed(2)}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pedidos do marketplace incluem taxa de 5% sobre o valor
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Pending Orders */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  Pedidos Pendentes
                  {stats.pendingOrders > 0 && (
                    <Badge variant="destructive">{stats.pendingOrders}</Badge>
                  )}
                </CardTitle>
                <Link to="/painel/pedidos">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Ver todos <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))
              ) : pendingOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum pedido pendente</p>
                </div>
              ) : (
                pendingOrders.map((order) => (
                  <div key={order.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">#{order.order_number}</span>
                          <Badge variant="outline">
                            {order.delivery_type === "delivery" ? "Delivery" : "Retirada"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatOrderTime(order.created_at)}
                          </span>
                        </div>
                        <p className="font-medium mt-1">
                          {order.customer?.name || 'Cliente'}
                        </p>
                      </div>
                      <span className="font-bold text-lg">R$ {order.total.toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      {(order.items as any[])?.map((item: any, idx: number) => (
                        <span key={idx}>
                          {idx > 0 && " • "}
                          {item.quantity}x {item.name}
                        </span>
                      ))}
                    </div>
                    {order.delivery_address && typeof order.delivery_address === 'object' && !Array.isArray(order.delivery_address) && (
                      <p className="text-sm text-muted-foreground mb-3">
                        📍 {(order.delivery_address as any).address}, {(order.delivery_address as any).number} - {(order.delivery_address as any).neighborhood}
                      </p>
                    )}
                    {order.observations && (
                      <p className="text-sm text-muted-foreground mb-3 italic">
                        💬 {order.observations}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleAcceptOrder(order.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aceitar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleRejectOrder(order.id)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Recusar
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Printer className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <Link to={`/painel/pedidos?order=${order.id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Pedidos Recentes</CardTitle>
                <Link to="/painel/pedidos">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Ver todos <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))
                ) : recentOrders.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>Nenhum pedido recente</p>
                  </div>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(order.status)}`} />
                        <div>
                          <p className="font-medium">#{order.order_number} - {order.customer?.name || 'Cliente'}</p>
                          <p className="text-sm text-muted-foreground">{formatOrderTime(order.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">R$ {order.total.toFixed(2)}</p>
                        <Badge 
                          variant={order.status === "delivered" ? "outline" : "destructive"} 
                          className="text-xs"
                        >
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default EstablishmentDashboard;
