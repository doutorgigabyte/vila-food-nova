import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Plus, Edit, Trash2, Truck, Loader2, MapPin, Clock } from "lucide-react";

interface DeliveryFee {
  id: string;
  neighborhood: string;
  city: string | null;
  fee: number;
  min_time: number | null;
  max_time: number | null;
  is_active: boolean | null;
}

const DeliveryFeesManagement = () => {
  const { user } = useAuth();
  const [fees, setFees] = useState<DeliveryFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<DeliveryFee | null>(null);
  const [saving, setSaving] = useState(false);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);

  const [form, setForm] = useState({
    neighborhood: "",
    city: "",
    fee: "",
    min_time: "",
    max_time: "",
    is_active: true,
  });

  useEffect(() => {
    if (user) fetchEstablishment();
  }, [user]);

  useEffect(() => {
    if (establishmentId) fetchFees();
  }, [establishmentId]);

  const fetchEstablishment = async () => {
    const { data } = await supabase
      .from("establishments")
      .select("id")
      .eq("owner_id", user?.id)
      .maybeSingle();
    if (data) setEstablishmentId(data.id);
  };

  const fetchFees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("delivery_fees")
      .select("*")
      .eq("establishment_id", establishmentId)
      .order("neighborhood");

    if (error) toast.error("Erro ao carregar taxas de entrega");
    else setFees(data || []);
    setLoading(false);
  };

  const handleOpenDialog = (fee?: DeliveryFee) => {
    if (fee) {
      setEditingFee(fee);
      setForm({
        neighborhood: fee.neighborhood,
        city: fee.city || "",
        fee: fee.fee.toString(),
        min_time: fee.min_time?.toString() || "",
        max_time: fee.max_time?.toString() || "",
        is_active: fee.is_active ?? true,
      });
    } else {
      setEditingFee(null);
      setForm({
        neighborhood: "",
        city: "",
        fee: "",
        min_time: "",
        max_time: "",
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.neighborhood || !form.fee) {
      toast.error("Bairro e taxa são obrigatórios");
      return;
    }

    setSaving(true);
    const feeData = {
      neighborhood: form.neighborhood,
      city: form.city || null,
      fee: parseFloat(form.fee),
      min_time: form.min_time ? parseInt(form.min_time) : null,
      max_time: form.max_time ? parseInt(form.max_time) : null,
      is_active: form.is_active,
      establishment_id: establishmentId,
    };

    try {
      if (editingFee) {
        const { error } = await supabase
          .from("delivery_fees")
          .update(feeData)
          .eq("id", editingFee.id);
        if (error) throw error;
        toast.success("Taxa atualizada!");
      } else {
        const { error } = await supabase.from("delivery_fees").insert(feeData);
        if (error) throw error;
        toast.success("Taxa criada!");
      }
      setIsDialogOpen(false);
      fetchFees();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar taxa");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (fee: DeliveryFee) => {
    if (!confirm(`Deseja excluir a taxa do bairro "${fee.neighborhood}"?`)) return;
    const { error } = await supabase.from("delivery_fees").delete().eq("id", fee.id);
    if (error) toast.error("Erro ao excluir taxa");
    else {
      toast.success("Taxa excluída!");
      fetchFees();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/painel">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Taxas de Entrega</h1>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Taxa
          </Button>
        </div>
      </header>

      <div className="p-4 md:p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : fees.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Truck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma taxa de entrega cadastrada</p>
              <Button className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar primeira taxa
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {fees.map((fee) => (
              <Card key={fee.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <h3 className="font-medium">{fee.neighborhood}</h3>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${fee.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                      {fee.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  {fee.city && (
                    <p className="text-sm text-muted-foreground mb-2">{fee.city}</p>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-primary">
                      R$ {fee.fee.toFixed(2)}
                    </span>
                    {(fee.min_time || fee.max_time) && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>
                          {fee.min_time || "?"}-{fee.max_time || "?"} min
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenDialog(fee)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(fee)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFee ? "Editar Taxa" : "Nova Taxa de Entrega"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro *</Label>
              <Input
                id="neighborhood"
                value={form.neighborhood}
                onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                placeholder="Centro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Tamandaré"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee">Taxa de Entrega (R$) *</Label>
              <Input
                id="fee"
                type="number"
                step="0.01"
                value={form.fee}
                onChange={(e) => setForm({ ...form, fee: e.target.value })}
                placeholder="5.00"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_time">Tempo Mín. (min)</Label>
                <Input
                  id="min_time"
                  type="number"
                  value={form.min_time}
                  onChange={(e) => setForm({ ...form, min_time: e.target.value })}
                  placeholder="20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_time">Tempo Máx. (min)</Label>
                <Input
                  id="max_time"
                  type="number"
                  value={form.max_time}
                  onChange={(e) => setForm({ ...form, max_time: e.target.value })}
                  placeholder="40"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingFee ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeliveryFeesManagement;
