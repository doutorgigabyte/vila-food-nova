import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Award, Gift, Settings, Users, Star, TrendingUp, Plus, Trash2, Edit, Crown, Percent, Package, Truck } from "lucide-react";

interface LoyaltyProgram {
  id: string;
  name: string;
  type: 'points' | 'stamps' | 'tiers';
  points_per_real: number;
  points_value: number;
  min_redemption: number;
  expiration_days: number | null;
  is_active: boolean;
}

interface LoyaltyTier {
  id: string;
  name: string;
  min_points: number;
  multiplier: number;
  benefits: string[];
  color: string;
  sort_order: number;
}

interface LoyaltyReward {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  reward_type: 'discount_percent' | 'discount_fixed' | 'free_product' | 'free_delivery';
  reward_value: number | null;
  product_id: string | null;
  stock: number | null;
  is_active: boolean;
}

export default function LoyaltyManagement() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [isRewardDialogOpen, setIsRewardDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);

  const { data: establishment } = useQuery({
    queryKey: ["establishment", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("establishments")
        .select("id, name")
        .eq("slug", slug)
        .single();
      return data;
    },
  });

  // Buscar programa de fidelidade
  const { data: program } = useQuery({
    queryKey: ["loyalty-program", establishment?.id],
    queryFn: async () => {
      if (!establishment?.id) return null;
      
      const { data } = await supabase
        .from("loyalty_programs")
        .select("*")
        .eq("establishment_id", establishment.id)
        .single();
      
      return data as LoyaltyProgram | null;
    },
    enabled: !!establishment?.id,
  });

  // Buscar níveis
  const { data: tiers } = useQuery({
    queryKey: ["loyalty-tiers", establishment?.id],
    queryFn: async () => {
      if (!establishment?.id) return [];
      
      const { data } = await supabase
        .from("loyalty_tiers")
        .select("*")
        .eq("establishment_id", establishment.id)
        .order("sort_order");
      
      return (data || []).map(t => ({
        ...t,
        benefits: Array.isArray(t.benefits) ? t.benefits : [],
      })) as LoyaltyTier[];
    },
    enabled: !!establishment?.id,
  });

  // Buscar recompensas
  const { data: rewards } = useQuery({
    queryKey: ["loyalty-rewards", establishment?.id],
    queryFn: async () => {
      if (!establishment?.id) return [];
      
      const { data } = await supabase
        .from("loyalty_rewards")
        .select("*")
        .eq("establishment_id", establishment.id)
        .order("points_cost");
      
      return data as LoyaltyReward[];
    },
    enabled: !!establishment?.id,
  });

  // Buscar estatísticas
  const { data: stats } = useQuery({
    queryKey: ["loyalty-stats", establishment?.id],
    queryFn: async () => {
      if (!establishment?.id) return null;
      
      const { data: balances } = await supabase
        .from("loyalty_balances")
        .select("points_balance, total_earned, total_redeemed")
        .eq("establishment_id", establishment.id);

      const { data: transactions } = await supabase
        .from("loyalty_transactions")
        .select("type, points")
        .eq("establishment_id", establishment.id);

      const totalMembers = balances?.length || 0;
      const activeMembers = balances?.filter(b => b.points_balance > 0).length || 0;
      const totalPointsEarned = balances?.reduce((sum, b) => sum + (b.total_earned || 0), 0) || 0;
      const totalPointsRedeemed = balances?.reduce((sum, b) => sum + (b.total_redeemed || 0), 0) || 0;
      const totalRedemptions = transactions?.filter(t => t.type === 'redeem').length || 0;

      return {
        totalMembers,
        activeMembers,
        totalPointsEarned,
        totalPointsRedeemed,
        totalRedemptions,
      };
    },
    enabled: !!establishment?.id,
  });

  // Criar/atualizar programa
  const upsertProgramMutation = useMutation({
    mutationFn: async (data: Partial<LoyaltyProgram>) => {
      if (program?.id) {
        const { error } = await supabase
          .from("loyalty_programs")
          .update(data)
          .eq("id", program.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("loyalty_programs")
          .insert({
            establishment_id: establishment?.id,
            ...data,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Programa atualizado!");
      queryClient.invalidateQueries({ queryKey: ["loyalty-program"] });
    },
    onError: () => {
      toast.error("Erro ao salvar programa");
    },
  });

  // Criar níveis padrão
  const createDefaultTiersMutation = useMutation({
    mutationFn: async () => {
      const defaultTiers = [
        { name: "Bronze", min_points: 0, multiplier: 1, color: "#CD7F32", benefits: ["Acumule pontos em cada compra"], sort_order: 0 },
        { name: "Prata", min_points: 500, multiplier: 1.5, color: "#C0C0C0", benefits: ["1.5x pontos por compra", "Acesso a promoções exclusivas"], sort_order: 1 },
        { name: "Ouro", min_points: 1500, multiplier: 2, color: "#FFD700", benefits: ["2x pontos por compra", "Frete grátis", "Atendimento prioritário"], sort_order: 2 },
        { name: "Diamante", min_points: 5000, multiplier: 3, color: "#B9F2FF", benefits: ["3x pontos por compra", "Frete grátis", "Brindes exclusivos", "Acesso VIP"], sort_order: 3 },
      ];

      for (const tier of defaultTiers) {
        await supabase
          .from("loyalty_tiers")
          .insert({
            establishment_id: establishment?.id,
            ...tier,
          });
      }
    },
    onSuccess: () => {
      toast.success("Níveis criados!");
      queryClient.invalidateQueries({ queryKey: ["loyalty-tiers"] });
    },
  });

  // Criar/atualizar recompensa
  const upsertRewardMutation = useMutation({
    mutationFn: async (data: Partial<LoyaltyReward>) => {
      if (editingReward?.id) {
        const { error } = await supabase
          .from("loyalty_rewards")
          .update(data as any)
          .eq("id", editingReward.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("loyalty_rewards")
          .insert({
            establishment_id: establishment?.id,
            name: data.name || "",
            points_cost: data.points_cost || 100,
            reward_type: data.reward_type || "discount_percent",
            reward_value: data.reward_value,
            description: data.description,
            stock: data.stock,
            is_active: data.is_active ?? true,
          } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingReward ? "Recompensa atualizada!" : "Recompensa criada!");
      queryClient.invalidateQueries({ queryKey: ["loyalty-rewards"] });
      setIsRewardDialogOpen(false);
      setEditingReward(null);
    },
    onError: () => {
      toast.error("Erro ao salvar recompensa");
    },
  });

  // Deletar recompensa
  const deleteRewardMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("loyalty_rewards")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Recompensa removida!");
      queryClient.invalidateQueries({ queryKey: ["loyalty-rewards"] });
    },
  });

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'discount_percent': return <Percent className="h-4 w-4" />;
      case 'discount_fixed': return <Gift className="h-4 w-4" />;
      case 'free_product': return <Package className="h-4 w-4" />;
      case 'free_delivery': return <Truck className="h-4 w-4" />;
      default: return <Gift className="h-4 w-4" />;
    }
  };

  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case 'discount_percent': return 'Desconto %';
      case 'discount_fixed': return 'Desconto R$';
      case 'free_product': return 'Produto Grátis';
      case 'free_delivery': return 'Frete Grátis';
      default: return type;
    }
  };

  const [newReward, setNewReward] = useState<Partial<LoyaltyReward>>({
    name: "",
    description: "",
    points_cost: 100,
    reward_type: "discount_percent",
    reward_value: 10,
    is_active: true,
  });

  return (
    <DashboardLayout title="Programa de Fidelidade">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Award className="h-6 w-6 text-yellow-500" />
              Programa de Fidelidade
            </h1>
            <p className="text-muted-foreground">Configure recompensas e níveis para seus clientes</p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="program-active">Programa Ativo</Label>
            <Switch
              id="program-active"
              checked={program?.is_active || false}
              onCheckedChange={(checked) => upsertProgramMutation.mutate({ is_active: checked })}
            />
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Membros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalMembers || 0}</div>
              <p className="text-xs text-muted-foreground">{stats?.activeMembers || 0} ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                Pontos Emitidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats?.totalPointsEarned || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">desde o início</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Gift className="h-4 w-4 text-green-500" />
                Pontos Resgatados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats?.totalPointsRedeemed || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{stats?.totalRedemptions || 0} resgates</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Taxa de Resgate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalPointsEarned 
                  ? ((stats.totalPointsRedeemed / stats.totalPointsEarned) * 100).toFixed(1)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">engajamento</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="config">
          <TabsList>
            <TabsTrigger value="config">
              <Settings className="h-4 w-4 mr-2" />
              Configuração
            </TabsTrigger>
            <TabsTrigger value="tiers">
              <Crown className="h-4 w-4 mr-2" />
              Níveis
            </TabsTrigger>
            <TabsTrigger value="rewards">
              <Gift className="h-4 w-4 mr-2" />
              Recompensas
            </TabsTrigger>
          </TabsList>

          {/* Configuração */}
          <TabsContent value="config" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Programa</CardTitle>
                <CardDescription>Defina as regras de pontuação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Nome do Programa</Label>
                    <Input
                      defaultValue={program?.name || "Programa de Fidelidade"}
                      onBlur={(e) => upsertProgramMutation.mutate({ name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Pontos por R$ gasto</Label>
                    <Input
                      type="number"
                      defaultValue={program?.points_per_real || 1}
                      onBlur={(e) => upsertProgramMutation.mutate({ points_per_real: parseFloat(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ex: 1 = cada R$1 gasto = 1 ponto
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Valor de cada ponto (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      defaultValue={program?.points_value || 0.01}
                      onBlur={(e) => upsertProgramMutation.mutate({ points_value: parseFloat(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ex: 0.01 = 100 pontos = R$1,00
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Mínimo para resgate</Label>
                    <Input
                      type="number"
                      defaultValue={program?.min_redemption || 100}
                      onBlur={(e) => upsertProgramMutation.mutate({ min_redemption: parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Quantidade mínima de pontos para trocar
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Validade dos pontos (dias)</Label>
                    <Input
                      type="number"
                      placeholder="Sem validade"
                      defaultValue={program?.expiration_days || ""}
                      onBlur={(e) => upsertProgramMutation.mutate({ 
                        expiration_days: e.target.value ? parseInt(e.target.value) : null 
                      })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Deixe vazio para pontos sem validade
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Níveis */}
          <TabsContent value="tiers" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Níveis de Fidelidade</CardTitle>
                  <CardDescription>Clientes avançam de nível ao acumular pontos</CardDescription>
                </div>
                {(!tiers || tiers.length === 0) && (
                  <Button onClick={() => createDefaultTiersMutation.mutate()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Níveis Padrão
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {tiers?.map((tier) => (
                    <Card key={tier.id} className="relative overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{ backgroundColor: tier.color }}
                      />
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                          <Crown className="h-5 w-5" style={{ color: tier.color }} />
                          {tier.name}
                        </CardTitle>
                        <CardDescription>
                          A partir de {tier.min_points.toLocaleString()} pontos
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Badge variant="outline">{tier.multiplier}x pontos</Badge>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {tier.benefits.map((benefit, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <Star className="h-3 w-3 text-yellow-500" />
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recompensas */}
          <TabsContent value="rewards" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Catálogo de Recompensas</CardTitle>
                  <CardDescription>Prêmios que os clientes podem resgatar</CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingReward(null);
                  setNewReward({
                    name: "",
                    description: "",
                    points_cost: 100,
                    reward_type: "discount_percent",
                    reward_value: 10,
                    is_active: true,
                  });
                  setIsRewardDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Recompensa
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rewards?.map((reward) => (
                    <Card key={reward.id} className={!reward.is_active ? 'opacity-50' : ''}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base flex items-center gap-2">
                            {getRewardIcon(reward.reward_type)}
                            {reward.name}
                          </CardTitle>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setEditingReward(reward);
                                setNewReward(reward);
                                setIsRewardDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => deleteRewardMutation.mutate(reward.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">{reward.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge>{reward.points_cost} pontos</Badge>
                          <span className="text-sm">
                            {reward.reward_type === 'discount_percent' && `${reward.reward_value}% OFF`}
                            {reward.reward_type === 'discount_fixed' && `R$${reward.reward_value} OFF`}
                            {reward.reward_type === 'free_delivery' && 'Frete Grátis'}
                            {reward.reward_type === 'free_product' && 'Produto Grátis'}
                          </span>
                        </div>
                        {reward.stock !== null && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Estoque: {reward.stock} disponíveis
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {(!rewards || rewards.length === 0) && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      <Gift className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>Nenhuma recompensa cadastrada</p>
                      <p className="text-sm">Crie recompensas para seus clientes resgatarem</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de recompensa */}
        <Dialog open={isRewardDialogOpen} onOpenChange={setIsRewardDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingReward ? "Editar Recompensa" : "Nova Recompensa"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={newReward.name}
                  onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                  placeholder="Ex: Desconto de 10%"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={newReward.description || ""}
                  onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                  placeholder="Descreva a recompensa"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pontos necessários</Label>
                  <Input
                    type="number"
                    value={newReward.points_cost}
                    onChange={(e) => setNewReward({ ...newReward, points_cost: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de recompensa</Label>
                  <Select
                    value={newReward.reward_type}
                    onValueChange={(v) => setNewReward({ ...newReward, reward_type: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discount_percent">Desconto %</SelectItem>
                      <SelectItem value="discount_fixed">Desconto R$</SelectItem>
                      <SelectItem value="free_delivery">Frete Grátis</SelectItem>
                      <SelectItem value="free_product">Produto Grátis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(newReward.reward_type === 'discount_percent' || newReward.reward_type === 'discount_fixed') && (
                <div className="space-y-2">
                  <Label>
                    {newReward.reward_type === 'discount_percent' ? 'Percentual de desconto' : 'Valor do desconto (R$)'}
                  </Label>
                  <Input
                    type="number"
                    value={newReward.reward_value || ""}
                    onChange={(e) => setNewReward({ ...newReward, reward_value: parseFloat(e.target.value) })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Estoque (opcional)</Label>
                <Input
                  type="number"
                  value={newReward.stock || ""}
                  onChange={(e) => setNewReward({ ...newReward, stock: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Deixe vazio para ilimitado"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={newReward.is_active}
                  onCheckedChange={(checked) => setNewReward({ ...newReward, is_active: checked })}
                />
                <Label>Recompensa ativa</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRewardDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => upsertRewardMutation.mutate(newReward)}>
                {editingReward ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
