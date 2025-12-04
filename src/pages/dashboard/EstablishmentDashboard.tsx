import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Utensils, 
  Bell, 
  Settings, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Printer,
  MoreVertical,
  ChevronRight,
  Store,
  Menu,
  X,
  LayoutDashboard,
  ShoppingBag,
  Tag,
  Truck,
  MessageSquare,
  BarChart3,
  QrCode,
  LogOut
} from "lucide-react";
import { toast } from "sonner";

// Mock data
const stats = {
  todaySales: 1250.90,
  todayOrders: 28,
  pendingOrders: 3,
  monthSales: 15680.50,
};

const pendingOrders = [
  {
    id: 1245,
    customer: "João Silva",
    items: ["2x Pizza Margherita", "1x Refrigerante 2L"],
    total: 110.69,
    time: "2 min",
    type: "delivery",
    address: "Rua das Flores, 123 - Centro",
  },
  {
    id: 1244,
    customer: "Maria Santos",
    items: ["1x Pizza Calabresa"],
    total: 47.89,
    time: "5 min",
    type: "pickup",
    address: null,
  },
  {
    id: 1243,
    customer: "Pedro Oliveira",
    items: ["1x Combo Família", "2x Refrigerante 2L"],
    total: 159.70,
    time: "8 min",
    type: "delivery",
    address: "Av. Brasil, 456 - Jardim América",
  },
];

const recentOrders = [
  { id: 1242, customer: "Ana Costa", total: 89.90, status: "delivered", time: "15 min atrás" },
  { id: 1241, customer: "Carlos Lima", total: 125.80, status: "delivered", time: "32 min atrás" },
  { id: 1240, customer: "Lucia Ferreira", total: 67.50, status: "cancelled", time: "45 min atrás" },
];

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/painel", active: true },
  { icon: ShoppingBag, label: "Pedidos", href: "/painel/pedidos", badge: "3" },
  { icon: Package, label: "Produtos", href: "/painel/produtos" },
  { icon: Tag, label: "Categorias", href: "/painel/categorias" },
  { icon: Truck, label: "Frete", href: "/painel/frete" },
  { icon: MessageSquare, label: "WhatsApp IA", href: "/painel/whatsapp" },
  { icon: BarChart3, label: "Relatórios", href: "/painel/relatorios" },
  { icon: QrCode, label: "QR Code", href: "/painel/qrcode" },
  { icon: Settings, label: "Configurações", href: "/painel/configuracoes" },
];

const EstablishmentDashboard = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggleStore = () => {
    setIsOpen(!isOpen);
    toast.success(isOpen ? "Loja fechada" : "Loja aberta");
  };

  const handleAcceptOrder = (orderId: number) => {
    toast.success(`Pedido #${orderId} aceito!`);
  };

  const handleRejectOrder = (orderId: number) => {
    toast.error(`Pedido #${orderId} recusado`);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Utensils className="w-5 h-5 text-primary" />
              </div>
              <span className="font-bold">
                Vila<span className="text-primary">Food</span>
              </span>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Store Status */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Status da loja</span>
              </div>
              <Switch checked={isOpen} onCheckedChange={handleToggleStore} />
            </div>
            <Badge className={`mt-2 ${isOpen ? "bg-green-500" : "bg-red-500"}`}>
              {isOpen ? "Aberta" : "Fechada"}
            </Badge>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    item.active 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-medium">PB</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">Pizza do Bairro</p>
                <p className="text-xs text-muted-foreground truncate">admin@pizzadobairro.com</p>
              </div>
              <Button variant="ghost" size="icon">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-6">
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
                    <p className="text-xl font-bold">R$ {stats.todaySales.toFixed(2)}</p>
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
                    <p className="text-xl font-bold">{stats.todayOrders}</p>
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
                    <p className="text-xl font-bold">{stats.pendingOrders}</p>
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
                    <p className="text-xl font-bold">R$ {stats.monthSales.toFixed(2)}</p>
                  </div>
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
                  <Badge variant="destructive">{pendingOrders.length}</Badge>
                </CardTitle>
                <Link to="/painel/pedidos">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Ver todos <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingOrders.map((order) => (
                <div key={order.id} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">#{order.id}</span>
                        <Badge variant="outline">
                          {order.type === "delivery" ? "Delivery" : "Retirada"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{order.time}</span>
                      </div>
                      <p className="font-medium mt-1">{order.customer}</p>
                    </div>
                    <span className="font-bold text-lg">R$ {order.total.toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {order.items.join(" • ")}
                  </div>
                  {order.address && (
                    <p className="text-sm text-muted-foreground mb-3">
                      📍 {order.address}
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
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
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
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        order.status === "delivered" ? "bg-green-500" : "bg-red-500"
                      }`} />
                      <div>
                        <p className="font-medium">#{order.id} - {order.customer}</p>
                        <p className="text-sm text-muted-foreground">{order.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">R$ {order.total.toFixed(2)}</p>
                      <Badge variant={order.status === "delivered" ? "outline" : "destructive"} className="text-xs">
                        {order.status === "delivered" ? "Entregue" : "Cancelado"}
                      </Badge>
                    </div>
                  </div>
                ))}
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
