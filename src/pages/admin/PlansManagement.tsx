import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Utensils, 
  Bell, 
  Settings, 
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
  Plus,
  Edit,
  Trash2,
  Check,
  Package
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Building2, label: "Estabelecimentos", href: "/admin/estabelecimentos" },
  { icon: UserCog, label: "Usuários", href: "/admin/usuarios" },
  { icon: MapPin, label: "Localidades", href: "/admin/localidades" },
  { icon: Tag, label: "Segmentos", href: "/admin/segmentos" },
  { icon: CreditCard, label: "Planos", href: "/admin/planos", active: true },
  { icon: Gift, label: "Assinaturas", href: "/admin/assinaturas" },
  { icon: BarChart3, label: "Relatórios", href: "/admin/relatorios" },
  { icon: Shield, label: "Segurança", href: "/admin/seguranca" },
  { icon: Settings, label: "Configurações", href: "/admin/configuracoes" },
];

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  max_products: number;
  max_orders: number;
  features: string[];
  billing_period: string;
  is_active: boolean;
  created_at: string;
}

const PlansManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    max_products: 50,
    max_orders: 500,
    features: "",
    billing_period: "monthly",
    is_active: true,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("price", { ascending: true });

      if (error) throw error;
      setPlans(data?.map(p => ({ ...p, features: p.features as string[] || [] })) || []);
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast({ title: "Erro ao carregar planos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const planData = {
        name: formData.name,
        description: formData.description || null,
        price: formData.price,
        max_products: formData.max_products,
        max_orders: formData.max_orders,
        features: formData.features.split("\n").filter(f => f.trim()),
        billing_period: formData.billing_period,
        is_active: formData.is_active,
      };

      if (editingPlan) {
        const { error } = await supabase
          .from("plans")
          .update(planData)
          .eq("id", editingPlan.id);

        if (error) throw error;
        toast({ title: "Plano atualizado!" });
      } else {
        const { error } = await supabase
          .from("plans")
          .insert(planData);

        if (error) throw error;
        toast({ title: "Plano criado!" });
      }

      setDialogOpen(false);
      setEditingPlan(null);
      resetForm();
      fetchPlans();
    } catch (error) {
      console.error("Error saving plan:", error);
      toast({ title: "Erro ao salvar plano", variant: "destructive" });
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este plano?")) return;

    try {
      const { error } = await supabase.from("plans").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Plano excluído!" });
      fetchPlans();
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast({ title: "Erro ao excluir plano", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      max_products: 50,
      max_orders: 500,
      features: "",
      billing_period: "monthly",
      is_active: true,
    });
  };

  const openEditDialog = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      price: plan.price,
      max_products: plan.max_products,
      max_orders: plan.max_orders,
      features: plan.features.join("\n"),
      billing_period: plan.billing_period,
      is_active: plan.is_active,
    });
    setDialogOpen(true);
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
              <h1 className="text-lg font-semibold">Gestão de Planos</h1>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) { setEditingPlan(null); resetForm(); }
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Novo Plano
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingPlan ? "Editar Plano" : "Novo Plano"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Plano Premium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descrição do plano"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Preço (R$)</Label>
                        <Input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Período</Label>
                        <select
                          className="w-full h-10 px-3 border border-input rounded-md bg-background"
                          value={formData.billing_period}
                          onChange={(e) => setFormData(prev => ({ ...prev, billing_period: e.target.value }))}
                        >
                          <option value="monthly">Mensal</option>
                          <option value="yearly">Anual</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Máx. Produtos</Label>
                        <Input
                          type="number"
                          value={formData.max_products}
                          onChange={(e) => setFormData(prev => ({ ...prev, max_products: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Máx. Pedidos/mês</Label>
                        <Input
                          type="number"
                          value={formData.max_orders}
                          onChange={(e) => setFormData(prev => ({ ...prev, max_orders: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Recursos (um por linha)</Label>
                      <Textarea
                        value={formData.features}
                        onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value }))}
                        placeholder="Cardápio digital ilimitado&#10;Suporte por WhatsApp&#10;Relatórios básicos"
                        rows={4}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                      <Label>Plano ativo</Label>
                    </div>
                    <Button className="w-full" onClick={handleSubmit}>
                      {editingPlan ? "Atualizar" : "Criar"} Plano
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card key={plan.id} className={`relative ${!plan.is_active && "opacity-60"}`}>
                  {!plan.is_active && (
                    <Badge variant="secondary" className="absolute top-4 right-4">Inativo</Badge>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{plan.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-3xl font-bold">R$ {plan.price.toFixed(2)}</span>
                      <span className="text-muted-foreground">/{plan.billing_period === "monthly" ? "mês" : "ano"}</span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Até {plan.max_products} produtos</p>
                      <p>Até {plan.max_orders} pedidos/mês</p>
                    </div>

                    <div className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-border">
                      <Button variant="outline" className="flex-1" onClick={() => openEditDialog(plan)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deletePlan(plan.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

export default PlansManagement;
