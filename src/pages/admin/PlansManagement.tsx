import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Bot,
  Star,
  Store,
  Users,
  Video,
  ShoppingBag,
  RefreshCw,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { useSyncPlansWithMP } from "@/hooks/useSubscription";
import { Progress } from "@/components/ui/progress";

interface Plan {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  price: number;
  price_monthly: number | null;
  price_yearly: number | null;
  max_products: number | null;
  max_orders: number | null;
  max_videos: number | null;
  max_users: number | null;
  max_stores: number | null;
  features: string[];
  billing_period: string;
  is_active: boolean;
  is_popular: boolean | null;
  sort_order: number | null;
  whatsapp_chatbot: boolean;
  whatsapp_ai_agent: boolean;
  chatbot_basic: boolean | null;
  max_whatsapp_messages: number;
  marketplace_enabled: boolean | null;
  marketplace_highlight: boolean | null;
  marketplace_priority: number | null;
}

interface Addon {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  is_active: boolean | null;
}

const PlansManagement = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addonDialogOpen, setAddonDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingType, setDeletingType] = useState<"plan" | "addon">("plan");
  
  const { syncAllPlans, isLoading: isSyncing, progress } = useSyncPlansWithMP();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price_monthly: 0,
    price_yearly: 0,
    max_products: 50,
    max_orders: 500,
    max_videos: 5,
    max_users: 2,
    max_stores: 1,
    features: "",
    is_active: true,
    is_popular: false,
    sort_order: 1,
    whatsapp_chatbot: false,
    whatsapp_ai_agent: false,
    chatbot_basic: false,
    max_whatsapp_messages: 100,
    marketplace_enabled: true,
    marketplace_highlight: false,
    marketplace_priority: 0,
  });

  const [addonFormData, setAddonFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price_monthly: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchPlans();
    fetchAddons();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setPlans(data?.map(p => ({ 
        ...p, 
        features: p.features as string[] || [],
        whatsapp_chatbot: p.whatsapp_chatbot ?? false,
        whatsapp_ai_agent: p.whatsapp_ai_agent ?? false,
        max_whatsapp_messages: p.max_whatsapp_messages ?? 0,
      })) || []);
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast({ title: "Erro ao carregar planos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchAddons = async () => {
    try {
      const { data, error } = await supabase
        .from("plan_addons")
        .select("*")
        .order("price_monthly", { ascending: true });

      if (error) throw error;
      setAddons(data || []);
    } catch (error) {
      console.error("Error fetching addons:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      const planData = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-"),
        description: formData.description || null,
        price: formData.price_monthly,
        price_monthly: formData.price_monthly,
        price_yearly: formData.price_yearly || formData.price_monthly * 12 * 0.8,
        max_products: formData.max_products,
        max_orders: formData.max_orders,
        max_videos: formData.max_videos,
        max_users: formData.max_users,
        max_stores: formData.max_stores,
        features: formData.features.split("\n").filter(f => f.trim()),
        billing_period: "monthly",
        is_active: formData.is_active,
        is_popular: formData.is_popular,
        sort_order: formData.sort_order,
        whatsapp_chatbot: formData.whatsapp_chatbot,
        whatsapp_ai_agent: formData.whatsapp_ai_agent,
        chatbot_basic: formData.chatbot_basic,
        max_whatsapp_messages: formData.max_whatsapp_messages,
        marketplace_enabled: formData.marketplace_enabled,
        marketplace_highlight: formData.marketplace_highlight,
        marketplace_priority: formData.marketplace_priority,
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

  const handleAddonSubmit = async () => {
    try {
      const addonData = {
        name: addonFormData.name,
        slug: addonFormData.slug || addonFormData.name.toLowerCase().replace(/\s+/g, "-"),
        description: addonFormData.description || null,
        price_monthly: addonFormData.price_monthly,
        is_active: addonFormData.is_active,
      };

      if (editingAddon) {
        const { error } = await supabase
          .from("plan_addons")
          .update(addonData)
          .eq("id", editingAddon.id);

        if (error) throw error;
        toast({ title: "Add-on atualizado!" });
      } else {
        const { error } = await supabase
          .from("plan_addons")
          .insert(addonData);

        if (error) throw error;
        toast({ title: "Add-on criado!" });
      }

      setAddonDialogOpen(false);
      setEditingAddon(null);
      resetAddonForm();
      fetchAddons();
    } catch (error) {
      console.error("Error saving addon:", error);
      toast({ title: "Erro ao salvar add-on", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      if (deletingType === "plan") {
        const { error } = await supabase.from("plans").delete().eq("id", deletingId);
        if (error) throw error;
        toast({ title: "Plano excluído!" });
        fetchPlans();
      } else {
        const { error } = await supabase.from("plan_addons").delete().eq("id", deletingId);
        if (error) throw error;
        toast({ title: "Add-on excluído!" });
        fetchAddons();
      }
      setDeleteDialogOpen(false);
      setDeletingId(null);
    } catch (error) {
      console.error("Error deleting:", error);
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      price_monthly: 0,
      price_yearly: 0,
      max_products: 50,
      max_orders: 500,
      max_videos: 5,
      max_users: 2,
      max_stores: 1,
      features: "",
      is_active: true,
      is_popular: false,
      sort_order: plans.length + 1,
      whatsapp_chatbot: false,
      whatsapp_ai_agent: false,
      chatbot_basic: false,
      max_whatsapp_messages: 100,
      marketplace_enabled: true,
      marketplace_highlight: false,
      marketplace_priority: 0,
    });
  };

  const resetAddonForm = () => {
    setAddonFormData({
      name: "",
      slug: "",
      description: "",
      price_monthly: 0,
      is_active: true,
    });
  };

  const openEditDialog = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug || "",
      description: plan.description || "",
      price_monthly: plan.price_monthly || plan.price,
      price_yearly: plan.price_yearly || 0,
      max_products: plan.max_products || 50,
      max_orders: plan.max_orders || 500,
      max_videos: plan.max_videos || 5,
      max_users: plan.max_users || 2,
      max_stores: plan.max_stores || 1,
      features: plan.features.join("\n"),
      is_active: plan.is_active,
      is_popular: plan.is_popular || false,
      sort_order: plan.sort_order || 1,
      whatsapp_chatbot: plan.whatsapp_chatbot,
      whatsapp_ai_agent: plan.whatsapp_ai_agent,
      chatbot_basic: plan.chatbot_basic || false,
      max_whatsapp_messages: plan.max_whatsapp_messages,
      marketplace_enabled: plan.marketplace_enabled ?? true,
      marketplace_highlight: plan.marketplace_highlight || false,
      marketplace_priority: plan.marketplace_priority || 0,
    });
    setDialogOpen(true);
  };

  const openEditAddonDialog = (addon: Addon) => {
    setEditingAddon(addon);
    setAddonFormData({
      name: addon.name,
      slug: addon.slug,
      description: addon.description || "",
      price_monthly: addon.price_monthly,
      is_active: addon.is_active ?? true,
    });
    setAddonDialogOpen(true);
  };

  const formatLimit = (value: number | null) => {
    if (value === null || value === -1) return "∞";
    return value.toLocaleString();
  };

  return (
    <AdminLayout title="Gestão de Planos" icon={CreditCard} breadcrumb="Planos">
      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList>
          <TabsTrigger value="plans">Planos ({plans.length})</TabsTrigger>
          <TabsTrigger value="addons">Add-ons ({addons.length})</TabsTrigger>
        </TabsList>

        {/* PLANOS TAB */}
        <TabsContent value="plans" className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Gerencie os planos de assinatura disponíveis para os estabelecimentos
              </p>
              {isSyncing && (
                <div className="mt-2 space-y-1">
                  <Progress value={(progress.current / progress.total) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Sincronizando {progress.current}/{progress.total} planos...
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => syncAllPlans(plans.map(p => ({
                  ...p,
                  features: p.features || [],
                  created_at: null,
                  ai_unlimited: null,
                })))}
                disabled={isSyncing || plans.length === 0}
              >
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Sincronizar com MP
              </Button>
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
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingPlan ? "Editar Plano" : "Novo Plano"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Informações Básicas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Pro"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug</Label>
                      <Input
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="pro"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição curta do plano"
                    />
                  </div>

                  {/* Preços */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Preço Mensal (R$)</Label>
                      <Input
                        type="number"
                        value={formData.price_monthly}
                        onChange={(e) => setFormData(prev => ({ ...prev, price_monthly: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Preço Anual/mês (R$)</Label>
                      <Input
                        type="number"
                        value={formData.price_yearly}
                        onChange={(e) => setFormData(prev => ({ ...prev, price_yearly: Number(e.target.value) }))}
                        placeholder="Auto: -20%"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ordem</Label>
                      <Input
                        type="number"
                        value={formData.sort_order}
                        onChange={(e) => setFormData(prev => ({ ...prev, sort_order: Number(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Limites */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Limites (-1 = ilimitado)</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm">
                          <Package className="w-4 h-4" /> Produtos
                        </Label>
                        <Input
                          type="number"
                          value={formData.max_products}
                          onChange={(e) => setFormData(prev => ({ ...prev, max_products: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm">
                          <ShoppingBag className="w-4 h-4" /> Pedidos/mês
                        </Label>
                        <Input
                          type="number"
                          value={formData.max_orders}
                          onChange={(e) => setFormData(prev => ({ ...prev, max_orders: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm">
                          <Video className="w-4 h-4" /> Vídeos
                        </Label>
                        <Input
                          type="number"
                          value={formData.max_videos}
                          onChange={(e) => setFormData(prev => ({ ...prev, max_videos: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4" /> Usuários
                        </Label>
                        <Input
                          type="number"
                          value={formData.max_users}
                          onChange={(e) => setFormData(prev => ({ ...prev, max_users: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm">
                          <Store className="w-4 h-4" /> Lojas
                        </Label>
                        <Input
                          type="number"
                          value={formData.max_stores}
                          onChange={(e) => setFormData(prev => ({ ...prev, max_stores: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm">
                          <MessageSquare className="w-4 h-4" /> Msgs WhatsApp
                        </Label>
                        <Input
                          type="number"
                          value={formData.max_whatsapp_messages}
                          onChange={(e) => setFormData(prev => ({ ...prev, max_whatsapp_messages: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* WhatsApp e Marketplace */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">WhatsApp</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Chatbot Básico</Label>
                          <Switch
                            checked={formData.chatbot_basic}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, chatbot_basic: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Chatbot Avançado</Label>
                          <Switch
                            checked={formData.whatsapp_chatbot}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, whatsapp_chatbot: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Agente IA</Label>
                          <Switch
                            checked={formData.whatsapp_ai_agent}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, whatsapp_ai_agent: checked }))}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Marketplace</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Habilitado</Label>
                          <Switch
                            checked={formData.marketplace_enabled}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, marketplace_enabled: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Destaque</Label>
                          <Switch
                            checked={formData.marketplace_highlight}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, marketplace_highlight: checked }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm">Prioridade (0-10)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            value={formData.marketplace_priority}
                            onChange={(e) => setFormData(prev => ({ ...prev, marketplace_priority: Number(e.target.value) }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Features e Status */}
                  <div className="space-y-2">
                    <Label>Recursos (um por linha)</Label>
                    <Textarea
                      value={formData.features}
                      onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value }))}
                      placeholder="Cardápio digital&#10;Suporte por WhatsApp&#10;Relatórios básicos"
                      rows={5}
                    />
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                      <Label>Ativo</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.is_popular}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_popular: checked }))}
                      />
                      <Label>Mais Popular</Label>
                    </div>
                  </div>

                  <Button className="w-full" onClick={handleSubmit}>
                    {editingPlan ? "Atualizar" : "Criar"} Plano
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {/* Plans Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {plans.map((plan) => (
                <Card key={plan.id} className={`relative ${!plan.is_active && "opacity-60"}`}>
                  {plan.is_popular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                      <Star className="w-3 h-3 mr-1" /> Popular
                    </Badge>
                  )}
                  {!plan.is_active && (
                    <Badge variant="secondary" className="absolute top-2 right-2">Inativo</Badge>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      {plan.name}
                      <Badge variant="outline" className="text-xs font-normal">{plan.slug}</Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-3xl font-bold">R$ {(plan.price_monthly || plan.price).toFixed(2)}</span>
                      <span className="text-muted-foreground">/mês</span>
                      {plan.price_yearly && plan.price_yearly > 0 && (
                        <p className="text-xs text-green-600">
                          R$ {plan.price_yearly.toFixed(2)}/mês no anual
                        </p>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
                      <div className="flex justify-between">
                        <span>Produtos</span>
                        <span className="font-medium">{formatLimit(plan.max_products)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pedidos/mês</span>
                        <span className="font-medium">{formatLimit(plan.max_orders)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vídeos</span>
                        <span className="font-medium">{formatLimit(plan.max_videos)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Usuários</span>
                        <span className="font-medium">{formatLimit(plan.max_users)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lojas</span>
                        <span className="font-medium">{formatLimit(plan.max_stores)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {plan.chatbot_basic && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <MessageSquare className="w-3 h-3" /> Chatbot
                        </Badge>
                      )}
                      {plan.whatsapp_ai_agent && (
                        <Badge variant="outline" className="text-xs gap-1 text-blue-600 border-blue-600/30">
                          <Bot className="w-3 h-3" /> IA
                        </Badge>
                      )}
                      {plan.marketplace_highlight && (
                        <Badge variant="outline" className="text-xs gap-1 text-yellow-600 border-yellow-600/30">
                          <Star className="w-3 h-3" /> Destaque
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(plan)}>
                        <Edit className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setDeletingId(plan.id);
                          setDeletingType("plan");
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ADD-ONS TAB */}
        <TabsContent value="addons" className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Add-ons são recursos extras que podem ser adicionados a qualquer plano
            </p>
            <Dialog open={addonDialogOpen} onOpenChange={(open) => {
              setAddonDialogOpen(open);
              if (!open) { setEditingAddon(null); resetAddonForm(); }
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Novo Add-on
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingAddon ? "Editar Add-on" : "Novo Add-on"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input
                        value={addonFormData.name}
                        onChange={(e) => setAddonFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Agente IA"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug</Label>
                      <Input
                        value={addonFormData.slug}
                        onChange={(e) => setAddonFormData(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="ai-agent"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={addonFormData.description}
                      onChange={(e) => setAddonFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição do add-on"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preço Mensal (R$)</Label>
                    <Input
                      type="number"
                      value={addonFormData.price_monthly}
                      onChange={(e) => setAddonFormData(prev => ({ ...prev, price_monthly: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={addonFormData.is_active}
                      onCheckedChange={(checked) => setAddonFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label>Ativo</Label>
                  </div>
                  <Button className="w-full" onClick={handleAddonSubmit}>
                    {editingAddon ? "Atualizar" : "Criar"} Add-on
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {addons.map((addon) => (
              <Card key={addon.id} className={!addon.is_active ? "opacity-60" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{addon.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{addon.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-2xl font-bold">R$ {addon.price_monthly.toFixed(2)}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <Badge variant="outline">{addon.slug}</Badge>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditAddonDialog(addon)}>
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setDeletingId(addon.id);
                        setDeletingType("addon");
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {deletingType === "plan" ? "plano" : "add-on"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. {deletingType === "plan" && "Estabelecimentos vinculados a este plano podem ser afetados."}
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
