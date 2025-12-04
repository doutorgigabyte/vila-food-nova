import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Utensils, 
  Bell, 
  Settings, 
  Store, 
  Users, 
  DollarSign, 
  TrendingUp,
  Search,
  Menu,
  X,
  LayoutDashboard,
  Building2,
  UserCog,
  MapPin,
  Tag,
  CreditCard,
  Gift,
  BarChart3,
  Shield,
  LogOut,
  ChevronRight,
  Plus,
  MoreVertical,
  Eye
} from "lucide-react";

// Mock data
const stats = {
  totalEstablishments: 156,
  activeEstablishments: 142,
  totalUsers: 8543,
  monthRevenue: 125680.50,
  monthOrders: 3245,
  growthRate: 12.5,
};

const recentEstablishments = [
  { id: 1, name: "Pizza do Bairro", segment: "Pizzaria", city: "São Paulo", status: "active", date: "Hoje" },
  { id: 2, name: "Burger House", segment: "Hamburgueria", city: "São Paulo", status: "active", date: "Ontem" },
  { id: 3, name: "Sushi Master", segment: "Japonês", city: "Rio de Janeiro", status: "pending", date: "2 dias" },
  { id: 4, name: "Café & Cia", segment: "Cafeteria", city: "Belo Horizonte", status: "active", date: "3 dias" },
];

const topEstablishments = [
  { name: "Pizza do Bairro", orders: 456, revenue: 25680.50 },
  { name: "Burger House", orders: 389, revenue: 18450.90 },
  { name: "Sushi Master", orders: 312, revenue: 28900.00 },
  { name: "Açaí Point", orders: 278, revenue: 9870.30 },
];

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin", active: true },
  { icon: Building2, label: "Estabelecimentos", href: "/admin/estabelecimentos", badge: "156" },
  { icon: UserCog, label: "Usuários", href: "/admin/usuarios" },
  { icon: MapPin, label: "Localidades", href: "/admin/localidades" },
  { icon: Tag, label: "Categorias", href: "/admin/categorias" },
  { icon: CreditCard, label: "Planos", href: "/admin/planos" },
  { icon: Gift, label: "Vouchers", href: "/admin/vouchers" },
  { icon: BarChart3, label: "Relatórios", href: "/admin/relatorios" },
  { icon: Shield, label: "Segurança", href: "/admin/seguranca" },
  { icon: Settings, label: "Configurações", href: "/admin/configuracoes" },
];

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
              <div>
                <span className="font-bold">Vila<span className="text-primary">Food</span></span>
                <Badge className="ml-2 text-xs">Admin</Badge>
              </div>
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
                    <Badge variant="secondary" className="h-5 min-w-5 flex items-center justify-center text-xs">
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
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">Super Admin</p>
                <p className="text-xs text-muted-foreground truncate">admin@vilafood.com</p>
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
              <h1 className="text-lg font-semibold">Dashboard Administrativo</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar..." className="pl-10 w-64" />
              </div>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
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
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Store className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estabelecimentos</p>
                    <p className="text-xl font-bold">{stats.totalEstablishments}</p>
                    <p className="text-xs text-green-600">{stats.activeEstablishments} ativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Usuários</p>
                    <p className="text-xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Receita (mês)</p>
                    <p className="text-xl font-bold">R$ {(stats.monthRevenue / 1000).toFixed(1)}k</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Crescimento</p>
                    <p className="text-xl font-bold text-green-600">+{stats.growthRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Establishments */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Novos Estabelecimentos</CardTitle>
                  <Link to="/admin/estabelecimentos">
                    <Button variant="ghost" size="sm" className="gap-1">
                      Ver todos <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentEstablishments.map((est) => (
                    <div key={est.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Store className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{est.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {est.segment} • {est.city}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={est.status === "active" ? "outline" : "secondary"}>
                          {est.status === "active" ? "Ativo" : "Pendente"}
                        </Badge>
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4 gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar estabelecimento
                </Button>
              </CardContent>
            </Card>

            {/* Top Establishments */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Top Estabelecimentos</CardTitle>
                  <Link to="/admin/relatorios">
                    <Button variant="ghost" size="sm" className="gap-1">
                      Relatório <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topEstablishments.map((est, index) => (
                    <div key={est.name} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                        index === 1 ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" :
                        index === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{est.name}</p>
                        <p className="text-sm text-muted-foreground">{est.orders} pedidos</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">R$ {est.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Building2 className="w-5 h-5" />
                  <span>Novo Estabelecimento</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Gift className="w-5 h-5" />
                  <span>Criar Voucher</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Bell className="w-5 h-5" />
                  <span>Enviar Notificação</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Ver Relatórios</span>
                </Button>
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

export default AdminDashboard;
