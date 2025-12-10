import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  CheckCircle,
  Clock,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Profile {
  full_name: string | null;
}

interface AffiliateStats {
  totalEarnings: number;
  pendingEarnings: number;
  totalReferrals: number;
  activeReferrals: number;
  conversionRate: number;
  affiliateCode: string;
}

interface Referral {
  id: string;
  establishment_name: string;
  plan_name: string;
  status: string;
  commission_earned: number;
  created_at: string;
}

interface PayoutHistory {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  establishment_name?: string;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/afiliado", active: true },
  { icon: Building2, label: "Indicações", href: "/afiliado/indicacoes" },
  { icon: CreditCard, label: "Comissões", href: "/afiliado/comissoes" },
  { icon: Gift, label: "Vouchers", href: "/afiliado/vouchers" },
  { icon: BarChart3, label: "Relatórios", href: "/afiliado/relatorios" },
  { icon: Settings, label: "Configurações", href: "/afiliado/configuracoes" },
];

const AffiliateDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AffiliateStats>({
    totalEarnings: 0,
    pendingEarnings: 0,
    totalReferrals: 0,
    activeReferrals: 0,
    conversionRate: 0,
    affiliateCode: '',
  });
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [payouts, setPayouts] = useState<PayoutHistory[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAffiliateData();
    }
  }, [user]);

  const fetchAffiliateData = async () => {
    try {
      setLoading(true);

      // Buscar profile do usuário
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();
      
      setProfile(profileData);

      // Buscar dados do afiliado
      const { data: affiliate, error: affiliateError } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (affiliateError) {
        console.error('Affiliate error:', affiliateError);
        return;
      }

      // Buscar indicações
      const { data: referralsData, error: referralsError } = await supabase
        .from('affiliate_referrals')
        .select(`
          *,
          establishments(name, plan_id, plans(name))
        `)
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (referralsError) {
        console.error('Referrals error:', referralsError);
      }

      // Buscar payouts
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('affiliate_payouts')
        .select(`
          *,
          affiliate_referrals(establishments(name))
        `)
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (payoutsError) {
        console.error('Payouts error:', payoutsError);
      }

      // Calcular estatísticas
      const totalReferrals = referralsData?.length || 0;
      const activeReferrals = referralsData?.filter(r => r.status === 'active').length || 0;
      const totalEarnings = affiliate.total_earnings || 0;
      const pendingPayouts = payoutsData?.filter(p => p.status === 'pending') || [];
      const pendingEarnings = pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0);

      setStats({
        totalEarnings,
        pendingEarnings,
        totalReferrals,
        activeReferrals,
        conversionRate: totalReferrals > 0 ? (activeReferrals / totalReferrals) * 100 : 0,
        affiliateCode: affiliate.code,
      });

      // Formatar referrals
      const formattedReferrals: Referral[] = (referralsData || []).map((r: any) => ({
        id: r.id,
        establishment_name: r.establishments?.name || 'Estabelecimento',
        plan_name: r.establishments?.plans?.name || 'Plano',
        status: r.status,
        commission_earned: r.commission_earned || 0,
        created_at: r.created_at,
      }));
      setReferrals(formattedReferrals);

      // Formatar payouts
      const formattedPayouts: PayoutHistory[] = (payoutsData || []).map((p: any) => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        created_at: p.created_at,
        paid_at: p.paid_at,
        establishment_name: p.affiliate_referrals?.establishments?.name,
      }));
      setPayouts(formattedPayouts);

    } catch (error) {
      console.error('Error fetching affiliate data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const affiliateLink = `https://vilafood.delivery/r/${stats.affiliateCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(affiliateLink);
    toast.success("Link copiado!");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
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
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-medium">
                  {profile?.full_name?.substring(0, 2).toUpperCase() || 'AF'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{profile?.full_name || 'Afiliado'}</p>
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
              <h1 className="text-lg font-semibold truncate">Painel do Afiliado</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-6 overflow-x-auto">
          {/* Affiliate Link */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-2">Seu link de indicação</p>
              <div className="flex gap-2">
                <Input 
                  value={loading ? 'Carregando...' : affiliateLink} 
                  readOnly 
                  className="bg-background"
                />
                <Button onClick={copyLink} className="gap-2" disabled={loading}>
                  <Copy className="w-4 h-4" />
                  Copiar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Compartilhe este link e ganhe comissão em cada venda!
              </p>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Ganho</p>
                        <p className="text-xl font-bold">{formatCurrency(stats.totalEarnings)}</p>
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
                        <p className="text-xl font-bold">{formatCurrency(stats.pendingEarnings)}</p>
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
                        <p className="text-xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
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
                {loading ? (
                  <div className="space-y-3">
                    {Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : referrals.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Nenhuma indicação ainda. Compartilhe seu link!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {referrals.map((referral) => (
                      <div key={referral.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{referral.establishment_name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{referral.plan_name}</span>
                              <span>•</span>
                              <span>{formatDate(referral.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">+{formatCurrency(referral.commission_earned)}</p>
                          <Badge variant={referral.status === "active" ? "outline" : "secondary"}>
                            {referral.status === "active" ? "Ativo" : "Pendente"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payout History */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Histórico de Pagamentos</CardTitle>
                  <Link to="/afiliado/comissoes">
                    <Button variant="ghost" size="sm" className="gap-1">
                      Ver todas <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : payouts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Nenhum pagamento ainda.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {payouts.map((payout) => (
                      <div key={payout.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          {payout.status === "completed" ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-500" />
                          )}
                          <div>
                            <p className="font-medium text-sm">
                              Comissão {payout.establishment_name ? `- ${payout.establishment_name}` : ''}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(payout.paid_at || payout.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(payout.amount)}</p>
                          <Badge 
                            variant={payout.status === "completed" ? "outline" : "secondary"} 
                            className="text-xs"
                          >
                            {payout.status === "completed" ? "Pago" : 
                             payout.status === "processing" ? "Processando" : "Pendente"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                  <p className="text-2xl font-bold text-primary">20%</p>
                  <p className="text-sm text-muted-foreground">por assinatura</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Plano Pro</p>
                  <p className="text-2xl font-bold text-primary">20%</p>
                  <p className="text-sm text-muted-foreground">por assinatura</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Plano Enterprise</p>
                  <p className="text-2xl font-bold text-primary">20%</p>
                  <p className="text-sm text-muted-foreground">por assinatura</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center mt-4">
                Você receberá notificação via WhatsApp quando seus pagamentos forem processados!
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
