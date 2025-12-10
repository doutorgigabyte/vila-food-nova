import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bike, Plus, Phone, Mail, Pencil, Trash2, UserCheck, UserX, Users, Settings, QrCode, Star, BarChart3, AlertTriangle, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { DriverLinkRequests } from "@/components/dashboard/DriverLinkRequests";

interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  vehicle_type: string;
  license_plate: string | null;
  is_active: boolean;
  is_available: boolean;
  pix_key: string | null;
  pix_key_type: string | null;
  rating_average: number | null;
  total_deliveries: number | null;
  complaint_count: number | null;
}

interface DriverReview {
  id: string;
  driver_id: string;
  rating: number;
  comment: string | null;
  selected_tags: any;
  created_at: string;
}

const vehicleTypes = [
  { value: "motorcycle", label: "Moto" },
  { value: "bicycle", label: "Bicicleta" },
  { value: "car", label: "Carro" },
  { value: "walking", label: "A pé" },
];

const pixKeyTypes = [
  { value: "cpf", label: "CPF" },
  { value: "phone", label: "Telefone" },
  { value: "email", label: "E-mail" },
  { value: "random", label: "Chave Aleatória" },
];

const DeliveryDriversManagement = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [paymentConfig, setPaymentConfig] = useState({
    driver_payment_mode: "external",
    driver_default_commission_type: "fixed",
    driver_default_fee: 0
  });
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    vehicle_type: "motorcycle",
    license_plate: "",
    is_active: true,
    pix_key: "",
    pix_key_type: "cpf"
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: establishment } = await supabase
        .from("establishments")
        .select("id, driver_payment_mode, driver_default_commission_type, driver_default_fee")
        .eq("owner_id", user.id)
        .single();

      if (!establishment) return;
      setEstablishmentId(establishment.id);
      setPaymentConfig({
        driver_payment_mode: establishment.driver_payment_mode || "external",
        driver_default_commission_type: establishment.driver_default_commission_type || "fixed",
        driver_default_fee: establishment.driver_default_fee || 0
      });

      const { data } = await supabase
        .from("delivery_drivers")
        .select("*")
        .eq("establishment_id", establishment.id)
        .order("name");

      if (data) setDrivers(data);

      // Count pending link requests
      const { count } = await supabase
        .from("driver_establishment_links")
        .select("*", { count: "exact", head: true })
        .eq("establishment_id", establishment.id)
        .eq("status", "pending");

      setPendingCount(count || 0);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveDriver = async () => {
    if (!establishmentId || !form.name || !form.phone) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      const driverData = {
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        vehicle_type: form.vehicle_type,
        license_plate: form.license_plate || null,
        is_active: form.is_active,
        pix_key: form.pix_key || null,
        pix_key_type: form.pix_key_type || null
      };

      if (editingDriver) {
        await supabase
          .from("delivery_drivers")
          .update(driverData)
          .eq("id", editingDriver.id);
        toast.success("Entregador atualizado!");
      } else {
        await supabase
          .from("delivery_drivers")
          .insert({ ...driverData, establishment_id: establishmentId });
        toast.success("Entregador cadastrado!");
      }

      setDialogOpen(false);
      resetForm();
      fetchDrivers();
    } catch (error) {
      toast.error("Erro ao salvar");
    }
  };

  const deleteDriver = async (id: string) => {
    if (!confirm("Deseja excluir este entregador?")) return;

    try {
      await supabase.from("delivery_drivers").delete().eq("id", id);
      toast.success("Entregador excluído!");
      fetchDrivers();
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  };

  const toggleAvailability = async (driver: Driver) => {
    try {
      await supabase
        .from("delivery_drivers")
        .update({ is_available: !driver.is_available })
        .eq("id", driver.id);
      fetchDrivers();
    } catch (error) {
      toast.error("Erro ao atualizar");
    }
  };

  const savePaymentConfig = async () => {
    if (!establishmentId) return;

    try {
      await supabase
        .from("establishments")
        .update({
          driver_payment_mode: paymentConfig.driver_payment_mode,
          driver_default_commission_type: paymentConfig.driver_default_commission_type,
          driver_default_fee: paymentConfig.driver_default_fee
        })
        .eq("id", establishmentId);

      toast.success("Configurações salvas!");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      email: "",
      vehicle_type: "motorcycle",
      license_plate: "",
      is_active: true,
      pix_key: "",
      pix_key_type: "cpf"
    });
    setEditingDriver(null);
  };

  const openEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setForm({
      name: driver.name,
      phone: driver.phone,
      email: driver.email || "",
      vehicle_type: driver.vehicle_type,
      license_plate: driver.license_plate || "",
      is_active: driver.is_active,
      pix_key: driver.pix_key || "",
      pix_key_type: driver.pix_key_type || "cpf"
    });
    setDialogOpen(true);
  };

  const activeDrivers = drivers.filter(d => d.is_active);
  const availableDrivers = drivers.filter(d => d.is_available && d.is_active);

  return (
    <DashboardLayout title="Entregadores">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Bike className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{drivers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-xl font-bold">{activeDrivers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Bike className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Disponíveis</p>
                <p className="text-xl font-bold">{availableDrivers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Solicitações</p>
                <p className="text-xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="drivers" className="mt-6">
        <TabsList>
          <TabsTrigger value="drivers" className="flex items-center gap-2">
            <Bike className="w-4 h-4" />
            Entregadores
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            Solicitações
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
        <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Métricas
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Drivers Tab */}
        <TabsContent value="drivers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bike className="w-5 h-5" />
                Entregadores Cadastrados
              </CardTitle>
              <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Entregador
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingDriver ? "Editar Entregador" : "Novo Entregador"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                      <Label>Nome *</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Nome do entregador"
                      />
                    </div>
                    <div>
                      <Label>Telefone *</Label>
                      <Input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div>
                      <Label>E-mail</Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div>
                      <Label>Veículo</Label>
                      <Select value={form.vehicle_type} onValueChange={(v) => setForm({ ...form, vehicle_type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicleTypes.map((v) => (
                            <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Placa</Label>
                      <Input
                        value={form.license_plate}
                        onChange={(e) => setForm({ ...form, license_plate: e.target.value })}
                        placeholder="ABC-1234"
                      />
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-3">Dados para Pagamento PIX</p>
                      <div className="space-y-3">
                        <div>
                          <Label>Tipo de Chave PIX</Label>
                          <Select value={form.pix_key_type} onValueChange={(v) => setForm({ ...form, pix_key_type: v })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {pixKeyTypes.map((t) => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Chave PIX</Label>
                          <Input
                            value={form.pix_key}
                            onChange={(e) => setForm({ ...form, pix_key: e.target.value })}
                            placeholder="Chave PIX do entregador"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Ativo</Label>
                      <Switch
                        checked={form.is_active}
                        onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                      />
                    </div>
                    <Button onClick={saveDriver} className="w-full">
                      {editingDriver ? "Salvar" : "Cadastrar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-center py-8">Carregando...</p>
              ) : drivers.length === 0 ? (
                <div className="text-center py-8">
                  <Bike className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Nenhum entregador cadastrado</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cadastre manualmente ou aguarde solicitações de entregadores via QR Code
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>PIX</TableHead>
                      <TableHead>Disponível</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drivers.map((driver) => (
                      <TableRow key={driver.id}>
                        <TableCell className="font-medium">{driver.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {driver.phone}
                            </p>
                            {driver.email && (
                              <p className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="w-3 h-3" /> {driver.email}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <Badge variant="outline">
                              {vehicleTypes.find(v => v.value === driver.vehicle_type)?.label}
                            </Badge>
                            {driver.license_plate && (
                              <p className="text-xs text-muted-foreground mt-1">{driver.license_plate}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {driver.pix_key ? (
                            <div className="text-sm">
                              <Badge variant="secondary" className="text-xs">
                                {pixKeyTypes.find(t => t.value === driver.pix_key_type)?.label}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1 truncate max-w-[100px]">
                                {driver.pix_key}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Não cadastrado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={driver.is_available}
                            onCheckedChange={() => toggleAvailability(driver)}
                            disabled={!driver.is_active}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant={driver.is_active ? "default" : "secondary"}>
                            {driver.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => openEdit(driver)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteDriver(driver.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests">
          {establishmentId && (
            <DriverLinkRequests establishmentId={establishmentId} />
          )}
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Driver Ranking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Ranking de Entregadores
                </CardTitle>
                <CardDescription>
                  Classificação por avaliação média dos clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {drivers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhum entregador cadastrado</p>
                ) : (
                  <div className="space-y-4">
                    {[...drivers]
                      .sort((a, b) => (b.rating_average || 0) - (a.rating_average || 0))
                      .slice(0, 5)
                      .map((driver, index) => (
                        <div key={driver.id} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                            index === 1 ? 'bg-gray-300/30 text-gray-600' :
                            index === 2 ? 'bg-orange-500/20 text-orange-600' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}º
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{driver.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                {(driver.rating_average || 0).toFixed(1)}
                              </span>
                              <span>•</span>
                              <span>{driver.total_deliveries || 0} entregas</span>
                            </div>
                          </div>
                          <Progress 
                            value={(driver.rating_average || 0) * 10} 
                            className="w-20 h-2"
                          />
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Entregas por Entregador
                </CardTitle>
                <CardDescription>
                  Total de entregas realizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {drivers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhum entregador cadastrado</p>
                ) : (
                  <div className="space-y-4">
                    {[...drivers]
                      .sort((a, b) => (b.total_deliveries || 0) - (a.total_deliveries || 0))
                      .slice(0, 5)
                      .map((driver) => {
                        const maxDeliveries = Math.max(...drivers.map(d => d.total_deliveries || 0), 1);
                        const percentage = ((driver.total_deliveries || 0) / maxDeliveries) * 100;
                        return (
                          <div key={driver.id} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium truncate">{driver.name}</span>
                              <span className="text-muted-foreground">{driver.total_deliveries || 0}</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Complaints */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Reclamações
                </CardTitle>
                <CardDescription>
                  Entregadores com maior número de reclamações
                </CardDescription>
              </CardHeader>
              <CardContent>
                {drivers.filter(d => (d.complaint_count || 0) > 0).length === 0 ? (
                  <div className="text-center py-8">
                    <UserCheck className="w-12 h-12 mx-auto text-green-500/50 mb-3" />
                    <p className="text-muted-foreground">Nenhuma reclamação registrada</p>
                    <p className="text-sm text-muted-foreground">Seus entregadores estão fazendo um ótimo trabalho!</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Entregador</TableHead>
                        <TableHead>Reclamações</TableHead>
                        <TableHead>Entregas</TableHead>
                        <TableHead>Taxa de Reclamação</TableHead>
                        <TableHead>Avaliação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...drivers]
                        .filter(d => (d.complaint_count || 0) > 0)
                        .sort((a, b) => (b.complaint_count || 0) - (a.complaint_count || 0))
                        .map((driver) => {
                          const complaintRate = driver.total_deliveries 
                            ? ((driver.complaint_count || 0) / driver.total_deliveries * 100).toFixed(1)
                            : '0.0';
                          return (
                            <TableRow key={driver.id}>
                              <TableCell className="font-medium">{driver.name}</TableCell>
                              <TableCell>
                                <Badge variant="destructive">{driver.complaint_count || 0}</Badge>
                              </TableCell>
                              <TableCell>{driver.total_deliveries || 0}</TableCell>
                              <TableCell>
                                <span className={parseFloat(complaintRate) > 5 ? 'text-destructive font-medium' : ''}>
                                  {complaintRate}%
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                  {(driver.rating_average || 0).toFixed(1)}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurações de Pagamento
              </CardTitle>
              <CardDescription>
                Configure como os entregadores serão remunerados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Modo de Pagamento</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Escolha como deseja pagar os entregadores
                </p>
                <Select 
                  value={paymentConfig.driver_payment_mode} 
                  onValueChange={(v) => setPaymentConfig({ ...paymentConfig, driver_payment_mode: v })}
                >
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="external">
                      <div className="flex flex-col">
                        <span>Pagamento Externo</span>
                        <span className="text-xs text-muted-foreground">Você paga o entregador por fora</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="split">
                      <div className="flex flex-col">
                        <span>Split Automático (PIX)</span>
                        <span className="text-xs text-muted-foreground">Sistema paga via PIX automaticamente</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentConfig.driver_payment_mode === "split" && (
                <>
                  <div className="border-t pt-4">
                    <Label className="text-base font-medium">Tipo de Comissão Padrão</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Valor padrão para novos entregadores vinculados
                    </p>
                    <Select 
                      value={paymentConfig.driver_default_commission_type} 
                      onValueChange={(v) => setPaymentConfig({ ...paymentConfig, driver_default_commission_type: v })}
                    >
                      <SelectTrigger className="w-full md:w-[300px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Valor Fixo por Entrega</SelectItem>
                        <SelectItem value="percentage">Porcentagem do Frete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-base font-medium">
                      {paymentConfig.driver_default_commission_type === "fixed" 
                        ? "Valor Fixo (R$)" 
                        : "Porcentagem (%)"}
                    </Label>
                    <Input
                      type="number"
                      value={paymentConfig.driver_default_fee}
                      onChange={(e) => setPaymentConfig({ 
                        ...paymentConfig, 
                        driver_default_fee: parseFloat(e.target.value) || 0 
                      })}
                      placeholder={paymentConfig.driver_default_commission_type === "fixed" ? "5.00" : "80"}
                      className="w-full md:w-[200px] mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {paymentConfig.driver_default_commission_type === "fixed" 
                        ? "Valor que o entregador recebe por entrega"
                        : "Porcentagem do frete que o entregador recebe"}
                    </p>
                  </div>
                </>
              )}

              <div className="border-t pt-4">
                <Button onClick={savePaymentConfig}>
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default DeliveryDriversManagement;
