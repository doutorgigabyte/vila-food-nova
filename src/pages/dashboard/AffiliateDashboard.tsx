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
  DollarSign, 
  TrendingUp,
  Copy,
  Menu,
  X,
  LayoutDashboard,
  Building2,
  CreditCard,
  Gift,
  BarChart3,
  LogOut,
  ChevronRight,
  ExternalLink,
  CheckCircle,
  Clock,
  Users
} from "lucide-react";
import { toast } from "sonner";

// Mock data
const stats = {
  totalEarnings: 4580.50,
  pendingEarnings: 890.00,
  totalReferrals: 12,
  activeReferrals: 10,
  conversionRate: 83.3,
};

const referrals = [
  { id: 1, name: "Pizza Express", plan: "Pro", status: "active", commission: 159.00, date: "15/11/2024" },
  { id: 2, name: "Burger King Local", plan: "Basic", status: "active", commission: 79.00, date: "12/11/2024" },
  { id: 3, name: "Sushi House", plan: "Pro", status: "pending", commission: 159.00, date: "10/11/2024" },
  { id: 4, name: "Café Premium", plan: "Enterprise", status: "active", commission: 399.00, date: "05/11/2024" },
];

const commissionHistory = [
  { id: 1, description: "Comissão - Pizza Express (Renovação)", amount: 63.60, date: "01/12/2024", status: "paid" },
  { id: 2, description: "Comissão - Burger King Local", amount: 31.60, date: "28/11/2024", status: "paid" },
  { id: 3, description: "Comissão - Sushi House", amount: 63.60, date: "25/11/2024", status: "pending" },
  { id: 4, description: "Comissão - Café Premium", amount: 159.60, date: "20/11/2024", status: "paid" },
];

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/afiliado", active: true },
  { icon: Building2, label: "Indicações", href: "/afiliado/indicacoes", badge: "12" },
  { icon: CreditCard, label: "Comissões", href: "/afiliado/comissoes" },
  { icon: Gift, label: "Vouchers", href: "/afiliado/vouchers" },
  { icon: BarChart3, label: "Relatórios", href: "/afiliado/relatorios" },
  { icon: Settings, label: "Configurações", href: "/afiliado/configuracoes" },
];

const AffiliateDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const affiliateLink = "https://vilafood.com/r/joao123";

  const copyLink = () => {
    navigator.clipboard.writeText(affiliateLink);
    toast.success("Link copiado!");
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
              <div>
                <span className="font-bold">Vila<span className="text-primary">Food</span></span>
                <Badge variant="secondary" className="ml-2 text-xs">Afiliado</Badge>
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
                <span className="text-primary font-medium">JD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">João Silva</p>
                <p className="text-xs text-muted-foreground truncate">joao@email.com</p>
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
              <h1 className="text-lg font-semibold">Painel do Afiliado</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-6">
          {/* Affiliate Link */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-2">Seu link de indicação</p>
              <div className="flex gap-2">
                <Input 
                  value={affiliateLink} 
                  readOnly 
                  className="bg-background"
                />
                <Button onClick={copyLink} className="gap-2">
                  <Copy className="w-4 h-4" />
                  Copiar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Compartilhe este link e ganhe 40% de comissão em cada venda!
              </p>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Ganho</p>
                    <p className="text-xl font-bold">R$ {stats.totalEarnings.toFixed(2)}</p>
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
                    <p className="text-sm text-muted-foreground">Pendente</p>
                    <p className="text-xl font-bold">R$ {stats.pendingEarnings.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Indicações</p>
                    <p className="text-xl font-bold">{stats.totalReferrals}</p>
                    <p className="text-xs text-green-600">{stats.activeReferrals} ativos</p>
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
                    <p className="text-sm text-muted-foreground">Conversão</p>
                    <p className="text-xl font-bold">{stats.conversionRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Referrals */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Indicações Recentes</CardTitle>
                  <Link to="/afiliado/indicacoes">
                    <Button variant="ghost" size="sm" className="gap-1">
                      Ver todas <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {referrals.map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{referral.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{referral.plan}</span>
                            <span>•</span>
                            <span>{referral.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">+R$ {referral.commission.toFixed(2)}</p>
                        <Badge variant={referral.status === "active" ? "outline" : "secondary"}>
                          {referral.status === "active" ? "Ativo" : "Pendente"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Commission History */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Histórico de Comissões</CardTitle>
                  <Link to="/afiliado/comissoes">
                    <Button variant="ghost" size="sm" className="gap-1">
                      Ver todas <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {commissionHistory.map((commission) => (
                    <div key={commission.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        {commission.status === "paid" ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-500" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{commission.description}</p>
                          <p className="text-xs text-muted-foreground">{commission.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">R$ {commission.amount.toFixed(2)}</p>
                        <Badge variant={commission.status === "paid" ? "outline" : "secondary"} className="text-xs">
                          {commission.status === "paid" ? "Pago" : "Pendente"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Commission Structure */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estrutura de Comissões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Plano Basic</p>
                  <p className="text-2xl font-bold text-primary">40%</p>
                  <p className="text-sm text-muted-foreground">R$ 31,60 por venda</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Plano Pro</p>
                  <p className="text-2xl font-bold text-primary">40%</p>
                  <p className="text-sm text-muted-foreground">R$ 63,60 por venda</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Plano Enterprise</p>
                  <p className="text-2xl font-bold text-primary">40%</p>
                  <p className="text-sm text-muted-foreground">R$ 159,60 por venda</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center mt-4">
                Você também ganha 40% em todas as renovações dos seus indicados!
              </p>
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

export default AffiliateDashboard;
