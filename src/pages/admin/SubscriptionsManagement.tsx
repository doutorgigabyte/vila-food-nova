import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Utensils, 
  Bell, 
  Settings, 
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
  Store,
  Calendar,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Building2, label: "Estabelecimentos", href: "/admin/estabelecimentos" },
  { icon: UserCog, label: "Usuários", href: "/admin/usuarios" },
  { icon: MapPin, label: "Localidades", href: "/admin/localidades" },
  { icon: Tag, label: "Segmentos", href: "/admin/segmentos" },
  { icon: CreditCard, label: "Planos", href: "/admin/planos" },
  { icon: Gift, label: "Assinaturas", href: "/admin/assinaturas", active: true },
  { icon: BarChart3, label: "Relatórios", href: "/admin/relatorios" },
  { icon: Shield, label: "Segurança", href: "/admin/seguranca" },
  { icon: Settings, label: "Configurações", href: "/admin/configuracoes" },
];

interface Subscription {
  id: string;
  establishment_id: string;
  plan_id: string;
  status: string;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
  establishment?: { name: string; slug: string };
  plan?: { name: string; price: number };
}

const SubscriptionsManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data: subs, error: subsError } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (subsError) throw subsError;

      const { data: establishments } = await supabase
        .from("establishments")
        .select("id, name, slug");

      const { data: plans } = await supabase
        .from("plans")
        .select("id, name, price");

      const enrichedSubs = subs?.map(sub => ({
        ...sub,
        establishment: establishments?.find(e => e.id === sub.establishment_id),
        plan: plans?.find(p => p.id === sub.plan_id),
      })) || [];

      setSubscriptions(enrichedSubs);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast({ title: "Erro ao carregar assinaturas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      setSubscriptions(prev => prev.map(s => 
        s.id === id ? { ...s, status: newStatus } : s
      ));

      toast({ title: "Status atualizado!" });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.establishment?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sub.establishment?.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500">Ativa</Badge>;
      case "cancelled": return <Badge variant="destructive">Cancelada</Badge>;
      case "expired": return <Badge variant="secondary">Expirada</Badge>;
      case "pending": return <Badge variant="outline">Pendente</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalRevenue = subscriptions
    .filter(s => s.status === "active")
    .reduce((sum, s) => sum + (s.plan?.price || 0), 0);

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
                <Badge className="ml-2 text-xs">Admin</Badge>
              </div>
            </Link>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    item.active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">Super Admin</p>
              </div>
              <Button variant="ghost" size="icon"><LogOut className="w-4 h-4" /></Button>
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
              <h1 className="text-lg font-semibold">Gestão de Assinaturas</h1>
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-bold">{subscriptions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <RefreshCw className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ativas</p>
                    <p className="text-xl font-bold">{subscriptions.filter(s => s.status === "active").length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <X className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Canceladas</p>
                    <p className="text-xl font-bold">{subscriptions.filter(s => s.status === "cancelled").length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">MRR</p>
                    <p className="text-xl font-bold">R$ {totalRevenue.toFixed(0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar por estabelecimento..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="active">Ativas</SelectItem>
                    <SelectItem value="cancelled">Canceladas</SelectItem>
                    <SelectItem value="expired">Expiradas</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Subscriptions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Assinaturas ({filteredSubscriptions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Estabelecimento</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Início</TableHead>
                        <TableHead>Expira</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Store className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{sub.establishment?.name || "—"}</p>
                                <p className="text-xs text-muted-foreground">{sub.establishment?.slug}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{sub.plan?.name || "—"}</Badge>
                          </TableCell>
                          <TableCell>
                            R$ {sub.plan?.price.toFixed(2) || "0.00"}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={sub.status}
                              onValueChange={(value) => updateStatus(sub.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                {getStatusBadge(sub.status)}
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Ativa</SelectItem>
                                <SelectItem value="cancelled">Cancelada</SelectItem>
                                <SelectItem value="expired">Expirada</SelectItem>
                                <SelectItem value="pending">Pendente</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(sub.starts_at).toLocaleDateString("pt-BR")}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {sub.expires_at ? (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(sub.expires_at).toLocaleDateString("pt-BR")}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

export default SubscriptionsManagement;
