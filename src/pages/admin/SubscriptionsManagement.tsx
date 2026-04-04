import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { 
  Search,
  CreditCard,
  RefreshCw,
  XCircle,
  DollarSign,
  Gift,
  MoreVertical,
  CheckCircle,
  Ban,
  Clock,
  Plus,
  Building2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { format, addMonths, addYears } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Subscription {
  id: string;
  establishment_id: string;
  plan_id: string;
  status: string;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
  establishment?: { id: string; name: string; slug: string };
  plan?: { id: string; name: string; price: number; billing_period: string };
}

interface Establishment {
  id: string;
  name: string;
  slug: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_period: string;
}

const SubscriptionsManagement = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  
  // Create form
  const [newSubForm, setNewSubForm] = useState({
    establishment_id: "",
    plan_id: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subsRes, estRes, plansRes] = await Promise.all([
        supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
        supabase.from("establishments").select("id, name, slug"),
        supabase.from("plans").select("id, name, price, billing_period").eq("is_active", true),
      ]);

      if (subsRes.error) throw subsRes.error;

      const enrichedSubs = subsRes.data?.map(sub => ({
        ...sub,
        establishment: estRes.data?.find(e => e.id === sub.establishment_id),
        plan: plansRes.data?.find(p => p.id === sub.plan_id),
      })) || [];

      setSubscriptions(enrichedSubs);
      setEstablishments(estRes.data || []);
      setPlans(plansRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscription = async () => {
    if (!newSubForm.establishment_id || !newSubForm.plan_id) {
      toast({ title: "Selecione estabelecimento e plano", variant: "destructive" });
      return;
    }

    try {
      const plan = plans.find(p => p.id === newSubForm.plan_id);
      const startsAt = new Date();
      const expiresAt = plan?.billing_period === "yearly" 
        ? addYears(startsAt, 1) 
        : addMonths(startsAt, 1);

      const { error } = await supabase.from("subscriptions").insert({
        establishment_id: newSubForm.establishment_id,
        plan_id: newSubForm.plan_id,
        status: "active",
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      // Update establishment plan_id
      await supabase
        .from("establishments")
        .update({ plan_id: newSubForm.plan_id })
        .eq("id", newSubForm.establishment_id);

      toast({ title: "Assinatura criada com sucesso!" });
      setCreateDialogOpen(false);
      setNewSubForm({ establishment_id: "", plan_id: "" });
      fetchData();
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast({ title: "Erro ao criar assinatura", variant: "destructive" });
    }
  };

  const handleActivateSubscription = async (sub: Subscription) => {
    try {
      const plan = sub.plan;
      const startsAt = new Date();
      const expiresAt = plan?.billing_period === "yearly" 
        ? addYears(startsAt, 1) 
        : addMonths(startsAt, 1);

      const { error } = await supabase
        .from("subscriptions")
        .update({ 
          status: "active",
          starts_at: startsAt.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq("id", sub.id);

      if (error) throw error;

      // Update establishment plan_id
      await supabase
        .from("establishments")
        .update({ plan_id: sub.plan_id })
        .eq("id", sub.establishment_id);

      toast({ title: "Assinatura ativada!" });
      fetchData();
    } catch (error) {
      console.error("Error activating subscription:", error);
      toast({ title: "Erro ao ativar assinatura", variant: "destructive" });
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedSub) return;

    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("id", selectedSub.id);

      if (error) throw error;

      toast({ title: "Assinatura cancelada" });
      setCancelDialogOpen(false);
      setSelectedSub(null);
      fetchData();
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast({ title: "Erro ao cancelar assinatura", variant: "destructive" });
    }
  };

  const handleRenewSubscription = async (sub: Subscription) => {
    try {
      const plan = sub.plan;
      const expiresAt = plan?.billing_period === "yearly" 
        ? addYears(new Date(), 1) 
        : addMonths(new Date(), 1);

      const { error } = await supabase
        .from("subscriptions")
        .update({ 
          status: "active",
          expires_at: expiresAt.toISOString(),
        })
        .eq("id", sub.id);

      if (error) throw error;

      toast({ title: "Assinatura renovada!" });
      fetchData();
    } catch (error) {
      console.error("Error renewing subscription:", error);
      toast({ title: "Erro ao renovar assinatura", variant: "destructive" });
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

  // Get establishments without active subscription
  const availableEstablishments = establishments.filter(est => 
    !subscriptions.some(sub => sub.establishment_id === est.id && sub.status === "active")
  );

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
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Assinatura
          </Button>
        </div>

        {/* Subscriptions List */}
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
              <>
                {/* Mobile Cards View */}
                <div className="block md:hidden divide-y">
                  {filteredSubscriptions.map((sub) => (
                    <div key={sub.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{sub.establishment?.name || '-'}</p>
                          <p className="text-xs text-muted-foreground">{sub.establishment?.slug}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {sub.status !== "active" && (
                              <DropdownMenuItem onClick={() => handleActivateSubscription(sub)}>
                                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                Ativar
                              </DropdownMenuItem>
                            )}
                            {sub.status === "active" && (
                              <>
                                <DropdownMenuItem onClick={() => handleRenewSubscription(sub)}>
                                  <RefreshCw className="w-4 h-4 mr-2 text-blue-500" />
                                  Renovar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedSub(sub);
                                    setCancelDialogOpen(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <Ban className="w-4 h-4 mr-2" />
                                  Cancelar
                                </DropdownMenuItem>
                              </>
                            )}
                            {(sub.status === "expired" || sub.status === "cancelled") && (
                              <DropdownMenuItem onClick={() => handleActivateSubscription(sub)}>
                                <Clock className="w-4 h-4 mr-2 text-orange-500" />
                                Reativar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        {getStatusBadge(sub.status)}
                        <Badge variant="outline">{sub.plan?.name || '-'}</Badge>
                        <span className="text-sm font-medium">
                          {sub.plan?.price ? `R$ ${sub.plan.price.toFixed(2)}` : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Início: {sub.starts_at ? format(new Date(sub.starts_at), 'dd/MM/yy', { locale: ptBR }) : '-'}</span>
                        <span>Expira: {sub.expires_at ? format(new Date(sub.expires_at), 'dd/MM/yy', { locale: ptBR }) : '-'}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Estabelecimento</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Início</TableHead>
                        <TableHead>Expira</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
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
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {sub.status !== "active" && (
                                  <DropdownMenuItem onClick={() => handleActivateSubscription(sub)}>
                                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                    Ativar
                                  </DropdownMenuItem>
                                )}
                                {sub.status === "active" && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleRenewSubscription(sub)}>
                                      <RefreshCw className="w-4 h-4 mr-2 text-blue-500" />
                                      Renovar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setSelectedSub(sub);
                                        setCancelDialogOpen(true);
                                      }}
                                      className="text-destructive"
                                    >
                                      <Ban className="w-4 h-4 mr-2" />
                                      Cancelar
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {(sub.status === "expired" || sub.status === "cancelled") && (
                                  <DropdownMenuItem onClick={() => handleActivateSubscription(sub)}>
                                    <Clock className="w-4 h-4 mr-2 text-orange-500" />
                                    Reativar
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Subscription Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Assinatura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Estabelecimento</Label>
              <Select 
                value={newSubForm.establishment_id} 
                onValueChange={(v) => setNewSubForm(prev => ({ ...prev, establishment_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estabelecimento" />
                </SelectTrigger>
                <SelectContent>
                  {availableEstablishments.map(est => (
                    <SelectItem key={est.id} value={est.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {est.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableEstablishments.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Todos os estabelecimentos já possuem assinatura ativa
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Plano</Label>
              <Select 
                value={newSubForm.plan_id} 
                onValueChange={(v) => setNewSubForm(prev => ({ ...prev, plan_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - R$ {plan.price.toFixed(2)}/{plan.billing_period === "yearly" ? "ano" : "mês"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="w-full" 
              onClick={handleCreateSubscription}
              disabled={!newSubForm.establishment_id || !newSubForm.plan_id}
            >
              Criar Assinatura
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
            <AlertDialogDescription>
              A assinatura de "{selectedSub?.establishment?.name}" será cancelada. 
              O estabelecimento perderá acesso aos recursos do plano.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedSub(null)}>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelSubscription} className="bg-destructive text-destructive-foreground">
              Cancelar Assinatura
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default SubscriptionsManagement;
