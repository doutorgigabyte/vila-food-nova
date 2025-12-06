import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Utensils, 
  Bell, 
  Settings, 
  Menu,
  X,
  LayoutDashboard,
  Building2,
  CreditCard,
  Gift,
  BarChart3,
  LogOut,
  Ticket,
  Calendar,
  Percent
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/afiliado" },
  { icon: Building2, label: "Indicações", href: "/afiliado/indicacoes" },
  { icon: CreditCard, label: "Comissões", href: "/afiliado/comissoes" },
  { icon: Gift, label: "Vouchers", href: "/afiliado/vouchers", active: true },
  { icon: BarChart3, label: "Relatórios", href: "/afiliado/relatorios" },
  { icon: Settings, label: "Configurações", href: "/afiliado/configuracoes" },
];

const AffiliateVouchers = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  // Vouchers de exemplo - em produção viriam do banco
  const vouchers = [
    {
      id: '1',
      code: 'AFILIADO10',
      discount: 10,
      type: 'percentage',
      validUntil: '2025-01-31',
      usageCount: 5,
      maxUsage: 50,
      status: 'active'
    },
    {
      id: '2',
      code: 'PROMO20OFF',
      discount: 20,
      type: 'fixed',
      validUntil: '2025-02-28',
      usageCount: 12,
      maxUsage: 100,
      status: 'active'
    }
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
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
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-medium">AF</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">Afiliado</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
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
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-semibold">Meus Vouchers</h1>
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-6">
          {/* Info Card */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Gift className="w-6 h-6 text-primary mt-1" />
                <div>
                  <p className="font-medium">Vouchers Exclusivos</p>
                  <p className="text-sm text-muted-foreground">
                    Compartilhe vouchers exclusivos com seus indicados para aumentar suas conversões.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vouchers Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {vouchers.map((voucher) => (
              <Card key={voucher.id} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full" />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={voucher.status === 'active' ? 'default' : 'secondary'}>
                      {voucher.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Ticket className="w-5 h-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-2xl font-bold font-mono">{voucher.code}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Percent className="w-4 h-4 text-green-600" />
                        <span className="text-lg font-semibold text-green-600">
                          {voucher.type === 'percentage' 
                            ? `${voucher.discount}% OFF` 
                            : `R$ ${voucher.discount} OFF`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Até {new Date(voucher.validUntil).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <span>{voucher.usageCount}/{voucher.maxUsage} usos</span>
                    </div>

                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${(voucher.usageCount / voucher.maxUsage) * 100}%` }}
                      />
                    </div>

                    <Button variant="outline" className="w-full" onClick={() => {
                      navigator.clipboard.writeText(voucher.code);
                    }}>
                      Copiar Código
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Coming Soon */}
          <Card>
            <CardContent className="p-8 text-center">
              <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Mais vouchers em breve!</h3>
              <p className="text-sm text-muted-foreground">
                Continue indicando para desbloquear vouchers exclusivos com descontos ainda maiores.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AffiliateVouchers;
