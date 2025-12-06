import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Search,
  Filter,
  ExternalLink
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

interface Referral {
  id: string;
  establishment_id: string;
  establishment_name: string;
  establishment_slug: string;
  plan_name: string;
  status: string;
  commission_earned: number;
  can_be_managed: boolean;
  created_at: string;
}

interface Affiliate {
  id: string;
  code: string;
  can_manage_stores: boolean;
  commission_rate: number;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/afiliado" },
  { icon: Building2, label: "Indicações", href: "/afiliado/indicacoes", active: true },
  { icon: CreditCard, label: "Comissões", href: "/afiliado/comissoes" },
  { icon: Gift, label: "Vouchers", href: "/afiliado/vouchers" },
  { icon: BarChart3, label: "Relatórios", href: "/afiliado/relatorios" },
  { icon: Settings, label: "Configurações", href: "/afiliado/configuracoes" },
];

const AffiliateReferrals = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchReferrals();
    }
  }, [user]);

  const fetchReferrals = async () => {
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

      const { data: referralsData, error: referralsError } = await supabase
        .from('affiliate_referrals')
        .select(`
          *,
          establishments(id, name, slug, plan_id, plans(name))
        `)
        .eq('affiliate_id', affiliateData.id)
        .order('created_at', { ascending: false });

      if (referralsError) {
        console.error('Referrals error:', referralsError);
        return;
      }

      const formattedReferrals: Referral[] = (referralsData || []).map((r: any) => ({
        id: r.id,
        establishment_id: r.establishment_id,
        establishment_name: r.establishments?.name || 'Estabelecimento',
        establishment_slug: r.establishments?.slug || '',
        plan_name: r.establishments?.plans?.name || 'Plano',
        status: r.status,
        commission_earned: r.commission_earned || 0,
        can_be_managed: r.can_be_managed ?? true,
        created_at: r.created_at,
      }));

      setReferrals(formattedReferrals);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      toast.error('Erro ao carregar indicações');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const filteredReferrals = referrals.filter(r => {
    const matchesSearch = r.establishment_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: referrals.length,
    active: referrals.filter(r => r.status === 'active').length,
    pending: referrals.filter(r => r.status === 'pending').length,
    totalCommission: referrals.reduce((sum, r) => sum + r.commission_earned, 0),
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
              <h1 className="text-lg font-semibold">Minhas Indicações</h1>
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
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalCommission)}</p>
                <p className="text-sm text-muted-foreground">Comissões</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar estabelecimento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Referrals List */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Indicações</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredReferrals.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma indicação encontrada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReferrals.map((referral) => (
                    <div 
                      key={referral.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/30 rounded-lg gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-primary" />
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
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            +{formatCurrency(referral.commission_earned)}
                          </p>
                          <Badge variant={referral.status === "active" ? "default" : "secondary"}>
                            {referral.status === "active" ? "Ativo" : 
                             referral.status === "pending" ? "Pendente" : "Cancelado"}
                          </Badge>
                        </div>
                        {affiliate?.can_manage_stores && referral.can_be_managed && referral.establishment_slug && (
                          <Link to={`/painel/${referral.establishment_slug}`}>
                            <Button variant="outline" size="sm" className="gap-2">
                              <ExternalLink className="w-4 h-4" />
                              Gerenciar
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AffiliateReferrals;
