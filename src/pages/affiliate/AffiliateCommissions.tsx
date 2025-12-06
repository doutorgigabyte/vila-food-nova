import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Wallet
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Payout {
  id: string;
  amount: number;
  status: string;
  pix_key: string;
  created_at: string;
  paid_at: string | null;
  establishment_name?: string;
  error_message?: string;
}

interface Affiliate {
  id: string;
  code: string;
  commission_rate: number;
  total_earnings: number;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/afiliado" },
  { icon: Building2, label: "Indicações", href: "/afiliado/indicacoes" },
  { icon: CreditCard, label: "Comissões", href: "/afiliado/comissoes", active: true },
  { icon: Gift, label: "Vouchers", href: "/afiliado/vouchers" },
  { icon: BarChart3, label: "Relatórios", href: "/afiliado/relatorios" },
  { icon: Settings, label: "Configurações", href: "/afiliado/configuracoes" },
];

const AffiliateCommissions = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPayouts();
    }
  }, [user]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);

      const { data: affiliateData, error: affiliateError } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (affiliateError) {
        console.error('Affiliate error:', affiliateError);
        return;
      }

      setAffiliate(affiliateData);

      const { data: payoutsData, error: payoutsError } = await supabase
        .from('affiliate_payouts')
        .select(`
          *,
          affiliate_referrals(establishments(name))
        `)
        .eq('affiliate_id', affiliateData.id)
        .order('created_at', { ascending: false });

      if (payoutsError) {
        console.error('Payouts error:', payoutsError);
        return;
      }

      const formattedPayouts: Payout[] = (payoutsData || []).map((p: any) => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        pix_key: p.pix_key,
        created_at: p.created_at,
        paid_at: p.paid_at,
        establishment_name: p.affiliate_referrals?.establishments?.name,
        error_message: p.error_message,
      }));

      setPayouts(formattedPayouts);
    } catch (error) {
      console.error('Error fetching payouts:', error);
      toast.error('Erro ao carregar comissões');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const filteredPayouts = payouts.filter(p => 
    statusFilter === "all" || p.status === statusFilter
  );

  const stats = {
    total: affiliate?.total_earnings || 0,
    pending: payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    paid: payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    commissionRate: affiliate?.commission_rate || 0,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-100 text-green-800">Pago</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'failed': return <Badge className="bg-red-100 text-red-800">Falhou</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

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
              <h1 className="text-lg font-semibold">Minhas Comissões</h1>
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Ganho</p>
                    <p className="text-xl font-bold">{formatCurrency(stats.total)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pendente</p>
                    <p className="text-xl font-bold">{formatCurrency(stats.pending)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pago</p>
                    <p className="text-xl font-bold">{formatCurrency(stats.paid)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Wallet className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa Comissão</p>
                    <p className="text-xl font-bold">{stats.commissionRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <div className="flex justify-end">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
                <SelectItem value="failed">Falhos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payouts List */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredPayouts.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum pagamento encontrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPayouts.map((payout) => (
                    <div 
                      key={payout.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/30 rounded-lg gap-4"
                    >
                      <div className="flex items-center gap-4">
                        {getStatusIcon(payout.status)}
                        <div>
                          <p className="font-medium">{formatCurrency(payout.amount)}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {payout.establishment_name && (
                              <>
                                <span>{payout.establishment_name}</span>
                                <span>•</span>
                              </>
                            )}
                            <span>PIX: {payout.pix_key.substring(0, 20)}...</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {payout.paid_at ? `Pago em ${formatDate(payout.paid_at)}` : formatDate(payout.created_at)}
                          </p>
                          {getStatusBadge(payout.status)}
                          {payout.error_message && (
                            <p className="text-xs text-red-600 mt-1">{payout.error_message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Commission Info */}
          <Card>
            <CardHeader>
              <CardTitle>Como funciona a comissão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Você recebe <strong className="text-foreground">{stats.commissionRate}%</strong> de comissão 
                  sobre cada assinatura paga pelos estabelecimentos que você indicar.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Comissões são processadas automaticamente após confirmação do pagamento</li>
                  <li>Pagamentos são realizados via PIX diariamente às 10h</li>
                  <li>Valor mínimo para saque: R$ 10,00</li>
                  <li>Comissões ficam disponíveis por 12 meses</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AffiliateCommissions;
