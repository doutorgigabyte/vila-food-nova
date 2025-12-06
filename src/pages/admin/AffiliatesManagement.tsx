import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  Edit, 
  DollarSign,
  Building2,
  Search,
  TrendingUp,
  Percent
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Affiliate {
  id: string;
  user_id: string;
  code: string;
  commission_rate: number;
  total_earnings: number;
  is_active: boolean;
  can_manage_stores: boolean;
  created_at: string;
  full_name?: string | null;
  user_email?: string;
  referrals_count?: number;
}

const commissionOptions = [10, 15, 20, 25, 30, 35, 40];

export default function AffiliatesManagement() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editCommissionRate, setEditCommissionRate] = useState<number>(20);
  const [editCanManageStores, setEditCanManageStores] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      
      // Fetch affiliates
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get referral counts and profile info
      const affiliatesWithCounts = await Promise.all(
        (data || []).map(async (affiliate) => {
          const { count } = await supabase
            .from('affiliate_referrals')
            .select('*', { count: 'exact', head: true })
            .eq('affiliate_id', affiliate.id);

          // Get profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', affiliate.user_id)
            .single();

          return {
            ...affiliate,
            full_name: profileData?.full_name || null,
            user_email: 'Afiliado',
            referrals_count: count || 0,
            can_manage_stores: affiliate.can_manage_stores || false,
          };
        })
      );

      setAffiliates(affiliatesWithCounts);
    } catch (error) {
      console.error('Error fetching affiliates:', error);
      toast.error('Erro ao carregar afiliados');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (affiliate: Affiliate) => {
    setEditingAffiliate(affiliate);
    setEditCommissionRate(affiliate.commission_rate);
    setEditCanManageStores(affiliate.can_manage_stores);
    setEditIsActive(affiliate.is_active);
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingAffiliate) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('affiliates')
        .update({
          commission_rate: editCommissionRate,
          can_manage_stores: editCanManageStores,
          is_active: editIsActive,
        })
        .eq('id', editingAffiliate.id);

      if (error) throw error;

      toast.success('Afiliado atualizado com sucesso');
      setEditDialogOpen(false);
      fetchAffiliates();
    } catch (error) {
      console.error('Error updating affiliate:', error);
      toast.error('Erro ao atualizar afiliado');
    } finally {
      setSaving(false);
    }
  };

  const filteredAffiliates = affiliates.filter(affiliate => {
    const searchLower = search.toLowerCase();
    return (
      affiliate.code.toLowerCase().includes(searchLower) ||
      affiliate.full_name?.toLowerCase().includes(searchLower) ||
      affiliate.user_email?.toLowerCase().includes(searchLower)
    );
  });

  const totalEarnings = affiliates.reduce((sum, a) => sum + (a.total_earnings || 0), 0);
  const activeAffiliates = affiliates.filter(a => a.is_active).length;
  const totalReferrals = affiliates.reduce((sum, a) => sum + (a.referrals_count || 0), 0);

  return (
    <AdminLayout title="Gerenciamento de Afiliados">
      <p className="text-muted-foreground mb-6">Configure comissões e permissões dos afiliados</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Afiliados</p>
                <p className="text-2xl font-bold">{affiliates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">{activeAffiliates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Indicações</p>
                <p className="text-2xl font-bold">{totalReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pago</p>
                <p className="text-2xl font-bold">
                  R$ {totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, código ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Afiliados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredAffiliates.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum afiliado encontrado
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Afiliado</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Indicações</TableHead>
                  <TableHead>Total Ganho</TableHead>
                  <TableHead>Gerenciar Lojas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAffiliates.map((affiliate) => (
                  <TableRow key={affiliate.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {affiliate.full_name || 'Sem nome'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {affiliate.user_email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {affiliate.code}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="gap-1">
                        <Percent className="w-3 h-3" />
                        {affiliate.commission_rate}%
                      </Badge>
                    </TableCell>
                    <TableCell>{affiliate.referrals_count}</TableCell>
                    <TableCell>
                      R$ {(affiliate.total_earnings || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={affiliate.can_manage_stores ? "default" : "secondary"}>
                        {affiliate.can_manage_stores ? 'Sim' : 'Não'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={affiliate.is_active ? "default" : "secondary"}>
                        {affiliate.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(affiliate)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Afiliado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Taxa de Comissão</Label>
              <Select
                value={editCommissionRate.toString()}
                onValueChange={(value) => setEditCommissionRate(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a comissão" />
                </SelectTrigger>
                <SelectContent>
                  {commissionOptions.map((rate) => (
                    <SelectItem key={rate} value={rate.toString()}>
                      {rate}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Percentual da mensalidade pago como comissão ao afiliado
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Pode Gerenciar Lojas</Label>
                <p className="text-xs text-muted-foreground">
                  Permite acesso aos painéis das lojas vinculadas
                </p>
              </div>
              <Switch
                checked={editCanManageStores}
                onCheckedChange={setEditCanManageStores}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Afiliado Ativo</Label>
                <p className="text-xs text-muted-foreground">
                  Desativar impede novas indicações
                </p>
              </div>
              <Switch
                checked={editIsActive}
                onCheckedChange={setEditIsActive}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
