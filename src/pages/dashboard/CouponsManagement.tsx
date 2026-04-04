import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Plus, Edit, Trash2, Ticket, Loader2, Percent, DollarSign } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: string | null;
  discount_value: number;
  min_order_value: number | null;
  max_uses: number | null;
  uses_count: number | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean | null;
}

const CouponsManagement = () => {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    min_order_value: "",
    max_uses: "",
    valid_until: "",
    is_active: true,
  });

  useEffect(() => {
    if (user) fetchEstablishment();
  }, [user]);

  useEffect(() => {
    if (establishmentId) fetchCoupons();
  }, [establishmentId]);

  const fetchEstablishment = async () => {
    // First try to find as owner
    const { data: ownerData } = await supabase
      .from("establishments")
      .select("id")
      .eq("owner_id", user?.id)
      .maybeSingle();
    
    if (ownerData) {
      setEstablishmentId(ownerData.id);
      return;
    }
    
    // Then try via establishment_users
    const { data: memberData } = await supabase
      .from("establishment_users")
      .select("establishment_id")
      .eq("user_id", user?.id)
      .eq("is_active", true)
      .maybeSingle();
    
    if (memberData) setEstablishmentId(memberData.establishment_id);
  };

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("establishment_id", establishmentId)
      .order("created_at", { ascending: false });

    if (error) toast.error("Erro ao carregar cupons");
    else setCoupons(data || []);
    setLoading(false);
  };

  const handleOpenDialog = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setForm({
        code: coupon.code,
        description: coupon.description || "",
        discount_type: coupon.discount_type || "percentage",
        discount_value: coupon.discount_value.toString(),
        min_order_value: coupon.min_order_value?.toString() || "",
        max_uses: coupon.max_uses?.toString() || "",
        valid_until: coupon.valid_until?.split("T")[0] || "",
        is_active: coupon.is_active ?? true,
      });
    } else {
      setEditingCoupon(null);
      setForm({
        code: "",
        description: "",
        discount_type: "percentage",
        discount_value: "",
        min_order_value: "",
        max_uses: "",
        valid_until: "",
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.discount_value) {
      toast.error("Código e valor do desconto são obrigatórios");
      return;
    }

    setSaving(true);
    const couponData = {
      code: form.code.toUpperCase(),
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      min_order_value: form.min_order_value ? parseFloat(form.min_order_value) : null,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
      is_active: form.is_active,
      establishment_id: establishmentId,
    };

    try {
      if (editingCoupon) {
        const { error } = await supabase
          .from("coupons")
          .update(couponData)
          .eq("id", editingCoupon.id);
        if (error) throw error;
        toast.success("Cupom atualizado!");
      } else {
        const { error } = await supabase.from("coupons").insert(couponData);
        if (error) throw error;
        toast.success("Cupom criado!");
      }
      setIsDialogOpen(false);
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar cupom");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Deseja excluir o cupom "${coupon.code}"?`)) return;
    const { error } = await supabase.from("coupons").delete().eq("id", coupon.id);
    if (error) toast.error("Erro ao excluir cupom");
    else {
      toast.success("Cupom excluído!");
      fetchCoupons();
    }
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === "percentage") return `${coupon.discount_value}%`;
    return `R$ ${coupon.discount_value.toFixed(2)}`;
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
            <h1 className="text-lg font-semibold">Cupons</h1>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Cupom
          </Button>
        </div>
      </header>

      <div className="p-4 md:p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : coupons.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum cupom cadastrado</p>
              <Button className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Criar primeiro cupom
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {coupons.map((coupon) => (
              <Card key={coupon.id}>
                <CardContent className="p-4 flex gap-4 items-center">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    {coupon.discount_type === "percentage" ? (
                      <Percent className="w-6 h-6 text-primary" />
                    ) : (
                      <DollarSign className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{coupon.code}</h3>
                      <Badge variant={coupon.is_active ? "default" : "secondary"}>
                        {coupon.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{coupon.description}</p>
                    <div className="flex gap-4 text-sm mt-1">
                      <span className="font-medium text-primary">{formatDiscount(coupon)}</span>
                      {coupon.min_order_value && (
                        <span className="text-muted-foreground">
                          Mín: R$ {coupon.min_order_value.toFixed(2)}
                        </span>
                      )}
                      {coupon.max_uses && (
                        <span className="text-muted-foreground">
                          Usos: {coupon.uses_count || 0}/{coupon.max_uses}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(coupon)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon)}>
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
            <DialogTitle>{editingCoupon ? "Editar Cupom" : "Novo Cupom"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="VERAO20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="20% de desconto no verão"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Desconto</Label>
                <Select
                  value={form.discount_type}
                  onValueChange={(value) => setForm({ ...form, discount_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                    <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_value">Valor *</Label>
                <Input
                  id="discount_value"
                  type="number"
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                  placeholder={form.discount_type === "percentage" ? "20" : "10.00"}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_order_value">Pedido Mínimo (R$)</Label>
                <Input
                  id="min_order_value"
                  type="number"
                  value={form.min_order_value}
                  onChange={(e) => setForm({ ...form, min_order_value: e.target.value })}
                  placeholder="50.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_uses">Limite de Usos</Label>
                <Input
                  id="max_uses"
                  type="number"
                  value={form.max_uses}
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                  placeholder="100"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid_until">Válido Até</Label>
              <Input
                id="valid_until"
                type="date"
                value={form.valid_until}
                onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
              />
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
              {editingCoupon ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponsManagement;
