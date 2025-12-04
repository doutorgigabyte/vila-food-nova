import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bike, Plus, Phone, Mail, Pencil, Trash2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  vehicle_type: string;
  license_plate: string | null;
  is_active: boolean;
  is_available: boolean;
}

const vehicleTypes = [
  { value: "motorcycle", label: "Moto" },
  { value: "bicycle", label: "Bicicleta" },
  { value: "car", label: "Carro" },
  { value: "walking", label: "A pé" },
];

const DeliveryDriversManagement = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    vehicle_type: "motorcycle",
    license_plate: "",
    is_active: true
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
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!establishment) return;
      setEstablishmentId(establishment.id);

      const { data } = await supabase
        .from("delivery_drivers")
        .select("*")
        .eq("establishment_id", establishment.id)
        .order("name");

      if (data) setDrivers(data);
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
      if (editingDriver) {
        await supabase
          .from("delivery_drivers")
          .update(form)
          .eq("id", editingDriver.id);
        toast.success("Entregador atualizado!");
      } else {
        await supabase
          .from("delivery_drivers")
          .insert({ ...form, establishment_id: establishmentId });
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

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      email: "",
      vehicle_type: "motorcycle",
      license_plate: "",
      is_active: true
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
      is_active: driver.is_active
    });
    setDialogOpen(true);
  };

  const activeDrivers = drivers.filter(d => d.is_active);
  const availableDrivers = drivers.filter(d => d.is_available && d.is_active);

  return (
    <DashboardLayout title="Entregadores">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      {/* Drivers List */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bike className="w-5 h-5" />
            Entregadores
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Entregador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingDriver ? "Editar Entregador" : "Novo Entregador"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
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
            <p className="text-muted-foreground text-center py-8">
              Nenhum entregador cadastrado
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Veículo</TableHead>
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
    </DashboardLayout>
  );
};

export default DeliveryDriversManagement;
