import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Plus,
  Edit,
  Trash2,
  Check,
  Package,
  CreditCard,
  MessageSquare,
  Bot
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";

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
  whatsapp_chatbot: boolean;
  whatsapp_ai_agent: boolean;
  max_whatsapp_messages: number;
}

const PlansManagement = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    max_products: 50,
    max_orders: 500,
    features: "",
    billing_period: "monthly",
    is_active: true,
    whatsapp_chatbot: true,
    whatsapp_ai_agent: false,
    max_whatsapp_messages: 1000,
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
      setPlans(data?.map(p => ({ 
        ...p, 
        features: p.features as string[] || [],
        whatsapp_chatbot: p.whatsapp_chatbot ?? true,
        whatsapp_ai_agent: p.whatsapp_ai_agent ?? false,
        max_whatsapp_messages: p.max_whatsapp_messages ?? 1000
      })) || []);
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
        whatsapp_chatbot: formData.whatsapp_chatbot,
        whatsapp_ai_agent: formData.whatsapp_ai_agent,
        max_whatsapp_messages: formData.max_whatsapp_messages,
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

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const { error } = await supabase.from("plans").delete().eq("id", deletingId);
      if (error) throw error;
      toast({ title: "Plano excluído!" });
      setDeleteDialogOpen(false);
      setDeletingId(null);
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
      whatsapp_chatbot: true,
      whatsapp_ai_agent: false,
      max_whatsapp_messages: 1000,
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
      whatsapp_chatbot: plan.whatsapp_chatbot,
      whatsapp_ai_agent: plan.whatsapp_ai_agent,
      max_whatsapp_messages: plan.max_whatsapp_messages,
    });
    setDialogOpen(true);
  };

  return (
    <AdminLayout title="Gestão de Planos" icon={CreditCard} breadcrumb="Planos">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {plans.length} Planos
          </Badge>
        </div>
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
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* WhatsApp Features Section */}
              <Separator className="my-4" />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  <Label className="text-base font-semibold">Módulo WhatsApp</Label>
                </div>
                
                <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Chatbot (Nível 1)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Respostas automáticas com palavras-chave
                      </p>
                    </div>
                    <Switch
                      checked={formData.whatsapp_chatbot}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, whatsapp_chatbot: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        Agente IA (Nível 2)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Vendas conversacionais com IA
                      </p>
                    </div>
                    <Switch
                      checked={formData.whatsapp_ai_agent}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, whatsapp_ai_agent: checked }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Máx. Mensagens WhatsApp/mês</Label>
                    <Input
                      type="number"
                      value={formData.max_whatsapp_messages}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_whatsapp_messages: Number(e.target.value) }))}
                      placeholder="1000"
                    />
                    <p className="text-xs text-muted-foreground">
                      0 = ilimitado
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

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
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

                {/* WhatsApp Features Display */}
                <div className="flex flex-wrap gap-2">
                  {plan.whatsapp_chatbot && (
                    <Badge variant="outline" className="gap-1 text-green-600 border-green-600/30">
                      <MessageSquare className="w-3 h-3" />
                      Chatbot
                    </Badge>
                  )}
                  {plan.whatsapp_ai_agent && (
                    <Badge variant="outline" className="gap-1 text-blue-600 border-blue-600/30">
                      <Bot className="w-3 h-3" />
                      Agente IA
                    </Badge>
                  )}
                </div>

                {plan.max_whatsapp_messages > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {plan.max_whatsapp_messages.toLocaleString()} msgs WhatsApp/mês
                  </p>
                )}

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
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      setDeletingId(plan.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Estabelecimentos vinculados a este plano podem ser afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default PlansManagement;