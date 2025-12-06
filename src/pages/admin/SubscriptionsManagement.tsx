import { useState, useEffect } from "react";
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
  CreditCard,
  RefreshCw,
  XCircle,
  DollarSign,
  Gift
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.establishment?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sub.establishment?.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500 hover:bg-green-600">Ativa</Badge>;
      case "cancelled": return <Badge variant="destructive">Cancelada</Badge>;
      case "expired": return <Badge variant="secondary">Expirada</Badge>;
      case "pending": return <Badge variant="outline">Pendente</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalRevenue = subscriptions
    .filter(s => s.status === "active")
    .reduce((sum, s) => sum + (s.plan?.price || 0), 0);

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === "active").length,
    cancelled: subscriptions.filter(s => s.status === "cancelled").length,
    mrr: totalRevenue
  };

  return (
    <AdminLayout title="Gestão de Assinaturas">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ativas</p>
                  <p className="text-xl font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Canceladas</p>
                  <p className="text-xl font-bold">{stats.cancelled}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">MRR</p>
                  <p className="text-xl font-bold">R$ {stats.mrr.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por estabelecimento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Todos os status" />
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

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="text-center py-12">
                <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhuma assinatura encontrada</h3>
                <p className="text-muted-foreground mt-1">Não há assinaturas com os filtros selecionados</p>
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
                          <div className="font-medium">{sub.establishment?.name || '-'}</div>
                          <div className="text-xs text-muted-foreground">{sub.establishment?.slug}</div>
                        </TableCell>
                        <TableCell>{sub.plan?.name || '-'}</TableCell>
                        <TableCell>
                          {sub.plan?.price ? `R$ ${sub.plan.price.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        <TableCell>
                          {sub.starts_at ? format(new Date(sub.starts_at), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                        </TableCell>
                        <TableCell>
                          {sub.expires_at ? format(new Date(sub.expires_at), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
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
    </AdminLayout>
  );
};

export default SubscriptionsManagement;
