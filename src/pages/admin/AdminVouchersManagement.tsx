import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Search, Plus, Edit, Trash2, Ticket, Percent, DollarSign, Calendar, Store } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: string | null;
  discount_value: number;
  establishment_id: string;
  is_active: boolean | null;
  max_uses: number | null;
  min_order_value: number | null;
  uses_count: number | null;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string | null;
  establishments?: { name: string; slug: string } | null;
}

interface Establishment {
  id: string;
  name: string;
  slug: string;
}

const AdminVouchersManagement = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstablishment, setFilterEstablishment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    establishment_id: '',
    is_active: true,
    max_uses: null as number | null,
    min_order_value: null as number | null,
    valid_from: '',
    valid_until: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [couponsRes, establishmentsRes] = await Promise.all([
        supabase
          .from('coupons')
          .select('*, establishments(name, slug)')
          .order('created_at', { ascending: false }),
        supabase
          .from('establishments')
          .select('id, name, slug')
          .order('name')
      ]);

      if (couponsRes.error) throw couponsRes.error;
      if (establishmentsRes.error) throw establishmentsRes.error;

      setCoupons(couponsRes.data || []);
      setEstablishments(establishmentsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar cupons');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        description: coupon.description || '',
        discount_type: coupon.discount_type || 'percentage',
        discount_value: coupon.discount_value,
        establishment_id: coupon.establishment_id,
        is_active: coupon.is_active ?? true,
        max_uses: coupon.max_uses,
        min_order_value: coupon.min_order_value,
        valid_from: coupon.valid_from ? coupon.valid_from.split('T')[0] : '',
        valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : ''
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 0,
        establishment_id: '',
        is_active: true,
        max_uses: null,
        min_order_value: null,
        valid_from: '',
        valid_until: ''
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.establishment_id || formData.discount_value <= 0) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      const dataToSave = {
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        establishment_id: formData.establishment_id,
        is_active: formData.is_active,
        max_uses: formData.max_uses,
        min_order_value: formData.min_order_value,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(dataToSave)
          .eq('id', editingCoupon.id);

        if (error) throw error;
        toast.success('Cupom atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert(dataToSave);

        if (error) throw error;
        toast.success('Cupom criado com sucesso');
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      toast.error(error.message || 'Erro ao salvar cupom');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cupom?')) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Cupom excluído com sucesso');
      fetchData();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Erro ao excluir cupom');
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id);

      if (error) throw error;
      toast.success(`Cupom ${!coupon.is_active ? 'ativado' : 'desativado'}`);
      fetchData();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%`;
    }
    return `R$ ${coupon.discount_value.toFixed(2)}`;
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.establishments?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstablishment = filterEstablishment === 'all' || coupon.establishment_id === filterEstablishment;
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && coupon.is_active) ||
      (filterStatus === 'inactive' && !coupon.is_active);

    return matchesSearch && matchesEstablishment && matchesStatus;
  });

  const stats = {
    total: coupons.length,
    active: coupons.filter(c => c.is_active).length,
    totalUses: coupons.reduce((acc, c) => acc + (c.uses_count || 0), 0)
  };

  return (
    <AdminLayout title="Cupons e Vouchers" icon={Ticket} breadcrumb="Cupons">
      <div className="space-y-6">
        {/* Action Button */}
        <div className="flex justify-end">
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cupom
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Cupons</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cupons Ativos</CardTitle>
              <Percent className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Usos</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUses}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código, descrição ou estabelecimento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterEstablishment} onValueChange={setFilterEstablishment}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Estabelecimento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {establishments.map(est => (
                <SelectItem key={est.id} value={est.id}>{est.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Coupons Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredCoupons.length === 0 ? (
              <div className="text-center py-12">
                <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhum cupom encontrado</h3>
                <p className="text-muted-foreground mt-1">Crie um novo cupom para começar</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Estabelecimento</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono font-bold">{coupon.code}</span>
                          {coupon.description && (
                            <span className="text-xs text-muted-foreground">{coupon.description}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <span>{coupon.establishments?.name || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={coupon.discount_type === 'percentage' ? 'default' : 'secondary'}>
                          {formatDiscount(coupon)}
                        </Badge>
                        {coupon.min_order_value && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Mín: R$ {coupon.min_order_value.toFixed(2)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {coupon.valid_from && coupon.valid_until ? (
                            <span>
                              {format(new Date(coupon.valid_from), 'dd/MM', { locale: ptBR })} - {format(new Date(coupon.valid_until), 'dd/MM/yy', { locale: ptBR })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Sem limite</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{coupon.uses_count || 0}</span>
                        {coupon.max_uses && (
                          <span className="text-muted-foreground">/{coupon.max_uses}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={coupon.is_active ?? false}
                          onCheckedChange={() => handleToggleStatus(coupon)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(coupon)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(coupon.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Estabelecimento *</Label>
                <Select 
                  value={formData.establishment_id} 
                  onValueChange={(v) => setFormData({ ...formData, establishment_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estabelecimento" />
                  </SelectTrigger>
                  <SelectContent>
                    {establishments.map(est => (
                      <SelectItem key={est.id} value={est.id}>{est.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="PROMO10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Desconto</Label>
                  <Select 
                    value={formData.discount_type} 
                    onValueChange={(v) => setFormData({ ...formData, discount_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentagem</SelectItem>
                      <SelectItem value="fixed">Valor Fixo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Valor do Desconto *</Label>
                <Input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                  placeholder={formData.discount_type === 'percentage' ? '10' : '5.00'}
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Desconto de inauguração"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Mínimo</Label>
                  <Input
                    type="number"
                    value={formData.min_order_value || ''}
                    onChange={(e) => setFormData({ ...formData, min_order_value: parseFloat(e.target.value) || null })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Máximo de Usos</Label>
                  <Input
                    type="number"
                    value={formData.max_uses || ''}
                    onChange={(e) => setFormData({ ...formData, max_uses: parseInt(e.target.value) || null })}
                    placeholder="Ilimitado"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Válido de</Label>
                  <Input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Válido até</Label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Ativo</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingCoupon ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminVouchersManagement;
