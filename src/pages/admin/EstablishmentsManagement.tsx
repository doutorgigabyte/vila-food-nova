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
  Eye,
  Edit,
  ToggleLeft,
  ToggleRight,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Building2, label: "Estabelecimentos", href: "/admin/estabelecimentos", active: true },
  { icon: UserCog, label: "Usuários", href: "/admin/usuarios" },
  { icon: MapPin, label: "Localidades", href: "/admin/localidades" },
  { icon: Tag, label: "Segmentos", href: "/admin/segmentos" },
  { icon: CreditCard, label: "Planos", href: "/admin/planos" },
  { icon: Gift, label: "Assinaturas", href: "/admin/assinaturas" },
  { icon: BarChart3, label: "Relatórios", href: "/admin/relatorios" },
  { icon: Shield, label: "Segurança", href: "/admin/seguranca" },
  { icon: Settings, label: "Configurações", href: "/admin/configuracoes" },
];

interface Establishment {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  status: string;
  is_open: boolean;
  phone: string | null;
  city_id: string | null;
  created_at: string;
}

const EstablishmentsManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchEstablishments();
  }, []);

  const fetchEstablishments = async () => {
    try {
      const { data, error } = await supabase
        .from("establishments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEstablishments(data || []);
    } catch (error) {
      console.error("Error fetching establishments:", error);
      toast({ title: "Erro ao carregar estabelecimentos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: "active" | "pending" | "suspended" | "inactive") => {
    try {
      const { error } = await supabase
        .from("establishments")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      setEstablishments(prev => prev.map(e => 
        e.id === id ? { ...e, status: newStatus } : e
      ));

      toast({ title: "Status atualizado!" });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    }
  };

  const toggleOpen = async (id: string, isOpen: boolean) => {
    try {
      const { error } = await supabase
        .from("establishments")
        .update({ is_open: !isOpen })
        .eq("id", id);

      if (error) throw error;

      setEstablishments(prev => prev.map(e => 
        e.id === id ? { ...e, is_open: !isOpen } : e
      ));

      toast({ title: `Estabelecimento ${!isOpen ? "aberto" : "fechado"}!` });
    } catch (error) {
      console.error("Error toggling open:", error);
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const filteredEstablishments = establishments.filter(est => {
    const matchesSearch = est.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          est.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || est.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500">Ativo</Badge>;
      case "pending": return <Badge variant="secondary">Pendente</Badge>;
      case "suspended": return <Badge variant="destructive">Suspenso</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
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
              <h1 className="text-lg font-semibold">Gestão de Estabelecimentos</h1>
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
                    <Store className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-bold">{establishments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <ToggleRight className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ativos</p>
                    <p className="text-xl font-bold">{establishments.filter(e => e.status === "active").length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <ToggleLeft className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                    <p className="text-xl font-bold">{establishments.filter(e => e.status === "pending").length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Store className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Abertos Agora</p>
                    <p className="text-xl font-bold">{establishments.filter(e => e.is_open).length}</p>
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
                    placeholder="Buscar por nome ou slug..." 
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
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="suspended">Suspensos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Establishments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Estabelecimentos ({filteredEstablishments.length})</CardTitle>
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
                        <TableHead>Slug</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aberto</TableHead>
                        <TableHead>Cadastro</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEstablishments.map((est) => (
                        <TableRow key={est.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                                {est.logo_url ? (
                                  <img src={est.logo_url} alt="" className="w-10 h-10 object-cover" />
                                ) : (
                                  <Store className="w-5 h-5 text-primary" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{est.name}</p>
                                <p className="text-xs text-muted-foreground">{est.phone || "—"}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">{est.slug}</code>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={est.status}
                              onValueChange={(value) => updateStatus(est.id, value as "active" | "pending" | "suspended" | "inactive")}
                            >
                              <SelectTrigger className="w-32">
                                {getStatusBadge(est.status)}
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Ativo</SelectItem>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="suspended">Suspenso</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleOpen(est.id, est.is_open)}
                            >
                              {est.is_open ? (
                                <Badge className="bg-green-500">Aberto</Badge>
                              ) : (
                                <Badge variant="secondary">Fechado</Badge>
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            {new Date(est.created_at).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link to={`/loja/${est.slug}`} target="_blank">
                                <Button variant="ghost" size="icon">
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button variant="ghost" size="icon">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
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

export default EstablishmentsManagement;
