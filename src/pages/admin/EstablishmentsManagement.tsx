import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Search,
  Store,
  Edit,
  Plus,
  Filter,
  Building2,
  Star,
  Trash2,
  LayoutDashboard
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAuditLog } from "@/hooks/useAuditLog";

interface Establishment {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  email: string | null;
  status: string;
  is_open: boolean;
  phone: string | null;
  city_id: string | null;
  created_at: string;
  neighborhood: string | null;
}

const EstablishmentsManagement = () => {
  const navigate = useNavigate();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { logAction, logAdminAccess } = useAuditLog();

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
    const establishment = establishments.find(e => e.id === id);
    try {
      const { error } = await supabase
        .from("establishments")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      await logAction({
        action: 'update_status',
        entityType: 'establishment',
        entityId: id,
        oldData: { status: establishment?.status },
        newData: { status: newStatus }
      });

      setEstablishments(prev => prev.map(e => 
        e.id === id ? { ...e, status: newStatus } : e
      ));

      toast({ title: "Status atualizado!" });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    }
  };

  const handleAccessPanel = async (establishment: Establishment) => {
    await logAdminAccess(establishment.id);
    await logAction({
      action: 'admin_access_panel',
      entityType: 'establishment',
      entityId: establishment.id,
      metadata: { establishment_name: establishment.name }
    });
    navigate(`/painel/${establishment.slug}`);
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
    <AdminLayout title="Estabelecimentos" icon={Building2} breadcrumb="Estabelecimentos">
      {/* Filter Bar */}
      <Card className="mb-6 bg-destructive/10 border-destructive/20">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 text-destructive font-medium">
              <Filter className="h-5 w-5" />
              <span>Filtrar</span>
            </div>
            <div className="flex flex-1 flex-col md:flex-row gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome ou slug..." 
                  className="pl-10 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 bg-background">
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
          </div>
        </CardContent>
      </Card>

      {/* Stats and Add Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {filteredEstablishments.length} Registros
          </Badge>
        </div>
        <Button variant="outline" className="gap-2">
          Adicionar <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead></TableHead>
                    <TableHead>SUBDOMÍNIO</TableHead>
                    <TableHead>NOME</TableHead>
                    <TableHead>E-MAIL</TableHead>
                    <TableHead>CIDADE</TableHead>
                    <TableHead>STATUS</TableHead>
                    <TableHead className="text-right">AÇÕES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEstablishments.map((est) => (
                    <TableRow key={est.id}>
                      <TableCell className="w-16">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                          {est.logo_url ? (
                            <img src={est.logo_url} alt="" className="w-10 h-10 object-cover" />
                          ) : (
                            <Store className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link 
                          to={`/loja/${est.slug}`} 
                          target="_blank"
                          className="text-primary hover:underline"
                        >
                          {est.slug}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="text-primary font-medium">{est.name}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {est.email || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {est.neighborhood || "—"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={est.status}
                          onValueChange={(value) => updateStatus(est.id, value as "active" | "pending" | "suspended" | "inactive")}
                        >
                          <SelectTrigger className="w-28 h-8">
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
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Acessar Painel"
                            onClick={() => handleAccessPanel(est)}
                            className="text-primary hover:text-primary"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            title="Destacar"
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Editar">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Excluir" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
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
    </AdminLayout>
  );
};

export default EstablishmentsManagement;
