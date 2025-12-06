import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
  User,
  Key,
  Wallet,
  BellRing,
  Save
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Profile {
  full_name: string | null;
  phone: string | null;
}

interface Affiliate {
  id: string;
  code: string;
  commission_rate: number;
  can_manage_stores: boolean;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/afiliado" },
  { icon: Building2, label: "Indicações", href: "/afiliado/indicacoes" },
  { icon: CreditCard, label: "Comissões", href: "/afiliado/comissoes" },
  { icon: Gift, label: "Vouchers", href: "/afiliado/vouchers" },
  { icon: BarChart3, label: "Relatórios", href: "/afiliado/relatorios" },
  { icon: Settings, label: "Configurações", href: "/afiliado/configuracoes", active: true },
];

const AffiliateSettings = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({ full_name: '', phone: '' });
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [pixKey, setPixKey] = useState("");
  const [notifications, setNotifications] = useState({
    newReferral: true,
    paymentReceived: true,
    weeklyReport: true
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user?.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      const { data: affiliateData } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (affiliateData) {
        setAffiliate(affiliateData);
      }

    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Erro ao salvar perfil');
    } finally {
      setSaving(false);
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
              <h1 className="text-lg font-semibold">Configurações</h1>
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-6">
          {loading ? (
            <div className="space-y-6">
              {Array(3).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-40 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* Profile Settings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    <CardTitle>Dados do Perfil</CardTitle>
                  </div>
                  <CardDescription>Atualize suas informações pessoais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        value={profile.full_name || ''}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        placeholder="Seu nome"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={profile.phone || ''}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                    <Save className="w-4 h-4" />
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </CardContent>
              </Card>

              {/* Affiliate Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-primary" />
                    <CardTitle>Informações do Afiliado</CardTitle>
                  </div>
                  <CardDescription>Dados da sua conta de afiliado</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Código de Afiliado</Label>
                      <Input value={affiliate?.code || ''} disabled className="bg-muted font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label>Taxa de Comissão</Label>
                      <Input value={`${affiliate?.commission_rate || 0}%`} disabled className="bg-muted" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={affiliate?.can_manage_stores ? 'default' : 'secondary'}>
                      {affiliate?.can_manage_stores ? 'Pode gerenciar lojas' : 'Sem acesso a gerenciamento'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Settings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-primary" />
                    <CardTitle>Dados de Pagamento</CardTitle>
                  </div>
                  <CardDescription>Configure sua chave PIX para receber comissões</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pix">Chave PIX</Label>
                    <Input
                      id="pix"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="CPF, e-mail, telefone ou chave aleatória"
                    />
                    <p className="text-xs text-muted-foreground">
                      Todos os pagamentos serão enviados para esta chave PIX
                    </p>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Save className="w-4 h-4" />
                    Salvar Chave PIX
                  </Button>
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BellRing className="w-5 h-5 text-primary" />
                    <CardTitle>Notificações</CardTitle>
                  </div>
                  <CardDescription>Configure quais notificações deseja receber</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Nova indicação</p>
                      <p className="text-sm text-muted-foreground">Quando um novo estabelecimento se cadastra</p>
                    </div>
                    <Switch
                      checked={notifications.newReferral}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, newReferral: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Pagamento recebido</p>
                      <p className="text-sm text-muted-foreground">Quando uma comissão é paga</p>
                    </div>
                    <Switch
                      checked={notifications.paymentReceived}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, paymentReceived: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Relatório semanal</p>
                      <p className="text-sm text-muted-foreground">Resumo semanal das suas indicações</p>
                    </div>
                    <Switch
                      checked={notifications.weeklyReport}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReport: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AffiliateSettings;
