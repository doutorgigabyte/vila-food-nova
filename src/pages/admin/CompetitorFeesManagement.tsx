import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Calculator, Plus, Edit, Trash2, Search, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useAllCompetitorFeesAdmin, type CompetitorFee } from '@/hooks/useCompetitorFees';

interface FormState {
  competitor_slug: string;
  competitor_name: string;
  plan_slug: string;
  plan_label: string;
  commission_percent: number;       // input em PORCENTAGEM (12 = 12%), normalizado no save
  payment_fee_percent: number;
  monthly_fee: number;
  monthly_fee_threshold: number;
  source_url: string;
  effective_from: string;
  notes: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm: FormState = {
  competitor_slug: 'ifood',
  competitor_name: 'iFood',
  plan_slug: '',
  plan_label: '',
  commission_percent: 0,
  payment_fee_percent: 0,
  monthly_fee: 0,
  monthly_fee_threshold: 0,
  source_url: '',
  effective_from: '',
  notes: '',
  sort_order: 0,
  is_active: true,
};

const CompetitorFeesManagement = () => {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<CompetitorFee | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: fees, isLoading } = useAllCompetitorFeesAdmin();

  const filtered = (fees ?? []).filter((f) => {
    const q = searchTerm.toLowerCase();
    return (
      !q ||
      f.competitor_name.toLowerCase().includes(q) ||
      f.plan_label.toLowerCase().includes(q) ||
      f.plan_slug.toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setSelected(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const openEdit = (f: CompetitorFee) => {
    setSelected(f);
    setForm({
      competitor_slug: f.competitor_slug,
      competitor_name: f.competitor_name,
      plan_slug: f.plan_slug,
      plan_label: f.plan_label,
      // DB armazena fracao decimal (0.12), input mostra porcentagem (12)
      commission_percent: f.commission_percent * 100,
      payment_fee_percent: f.payment_fee_percent * 100,
      monthly_fee: f.monthly_fee,
      monthly_fee_threshold: f.monthly_fee_threshold,
      source_url: f.source_url ?? '',
      effective_from: f.effective_from ?? '',
      notes: f.notes ?? '',
      sort_order: f.sort_order,
      is_active: f.is_active,
    });
    setIsDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        competitor_slug: form.competitor_slug.trim().toLowerCase(),
        competitor_name: form.competitor_name.trim(),
        plan_slug: form.plan_slug.trim().toLowerCase(),
        plan_label: form.plan_label.trim(),
        // input em %, DB em fracao
        commission_percent: form.commission_percent / 100,
        payment_fee_percent: form.payment_fee_percent / 100,
        monthly_fee: form.monthly_fee,
        monthly_fee_threshold: form.monthly_fee_threshold,
        source_url: form.source_url.trim() || null,
        effective_from: form.effective_from || null,
        notes: form.notes.trim() || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };
      if (selected) {
        const { error } = await supabase.from('competitor_fees').update(payload).eq('id', selected.id);
        if (error) throw error;
        await logAction('update', 'competitor_fee', selected.id, payload);
      } else {
        const { data, error } = await supabase.from('competitor_fees').insert(payload).select().single();
        if (error) throw error;
        await logAction('create', 'competitor_fee', data.id, payload);
      }
    },
    onSuccess: () => {
      toast.success(selected ? 'Taxa atualizada' : 'Taxa criada');
      queryClient.invalidateQueries({ queryKey: ['competitor-fees'] });
      setIsDialogOpen(false);
    },
    onError: (e: Error) => {
      toast.error(`Erro ao salvar: ${e.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      const { error } = await supabase.from('competitor_fees').delete().eq('id', selected.id);
      if (error) throw error;
      await logAction('delete', 'competitor_fee', selected.id, {
        competitor: selected.competitor_name,
        plan: selected.plan_label,
      });
    },
    onSuccess: () => {
      toast.success('Taxa removida');
      queryClient.invalidateQueries({ queryKey: ['competitor-fees'] });
      setIsDeleteOpen(false);
      setSelected(null);
    },
    onError: (e: Error) => {
      toast.error(`Erro ao remover: ${e.message}`);
    },
  });

  const validateAndSave = () => {
    if (!form.competitor_slug.trim()) return toast.error('Slug do competidor é obrigatório');
    if (!form.competitor_name.trim()) return toast.error('Nome do competidor é obrigatório');
    if (!form.plan_slug.trim()) return toast.error('Slug do plano é obrigatório');
    if (!form.plan_label.trim()) return toast.error('Nome do plano é obrigatório');
    if (form.commission_percent < 0 || form.commission_percent > 100) {
      return toast.error('Comissão deve estar entre 0 e 100%');
    }
    saveMutation.mutate();
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calculator className="h-6 w-6 text-primary" /> Taxas de Concorrentes
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Taxas exibidas no calculador de <code>/conheca</code>. Mantenha sincronizado com a
              tabela pública do iFood — atualize aqui quando eles mudarem (sem deploy). Atualmente
              os planos <code>basico-propria</code> e <code>entrega-ifood</code> são consumidos
              pelo calculator; outros podem ser adicionados para futuras telas comparativas.
            </p>
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Nova taxa
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Buscar por competidor ou plano..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
              <span className="ml-auto text-sm text-muted-foreground font-normal">
                {filtered.length} taxa{filtered.length === 1 ? '' : 's'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-sm py-8 text-center">Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">
                Nenhuma taxa cadastrada. O calculator usa fallback hardcoded até você criar.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competidor / Plano</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                    <TableHead className="text-right">Taxa pgto</TableHead>
                    <TableHead className="text-right">Mensalidade</TableHead>
                    <TableHead className="w-24">Vigente desde</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-32 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>
                        <div className="font-medium">
                          {f.competitor_name}
                          <code className="ml-2 text-xs text-muted-foreground">{f.plan_slug}</code>
                        </div>
                        <div className="text-xs text-muted-foreground">{f.plan_label}</div>
                        {f.source_url && (
                          <a
                            href={f.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary inline-flex items-center gap-1 mt-1"
                          >
                            <ExternalLink className="h-3 w-3" /> fonte
                          </a>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {(f.commission_percent * 100).toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {(f.payment_fee_percent * 100).toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-mono">R$ {f.monthly_fee.toFixed(2)}</div>
                        {f.monthly_fee_threshold > 0 && (
                          <div className="text-xs text-muted-foreground">
                            acima R$ {f.monthly_fee_threshold.toFixed(0)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {f.effective_from
                          ? new Date(f.effective_from).toLocaleDateString('pt-BR')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={f.is_active ? 'default' : 'secondary'} className="text-xs">
                          {f.is_active ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                          {f.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(f)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelected(f);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selected ? 'Editar taxa' : 'Nova taxa'}</DialogTitle>
            <DialogDescription>
              Valores em <strong>porcentagem</strong> (ex: 12 para 12%). O sistema converte
              automaticamente para fração decimal no DB.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="competitor_slug">Slug competidor *</Label>
                <Input
                  id="competitor_slug"
                  value={form.competitor_slug}
                  onChange={(e) => setForm({ ...form, competitor_slug: e.target.value })}
                  placeholder="ifood"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="competitor_name">Nome competidor *</Label>
                <Input
                  id="competitor_name"
                  value={form.competitor_name}
                  onChange={(e) => setForm({ ...form, competitor_name: e.target.value })}
                  placeholder="iFood"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="plan_slug">Slug do plano *</Label>
                <Input
                  id="plan_slug"
                  value={form.plan_slug}
                  onChange={(e) => setForm({ ...form, plan_slug: e.target.value })}
                  placeholder="basico-propria"
                />
                <p className="text-xs text-muted-foreground">
                  Calculator espera <code>basico-propria</code> e <code>entrega-ifood</code>.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plan_label">Nome do plano *</Label>
                <Input
                  id="plan_label"
                  value={form.plan_label}
                  onChange={(e) => setForm({ ...form, plan_label: e.target.value })}
                  placeholder="Plano Básico (Meus Motoboys)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="commission_percent">Comissão (%) *</Label>
                <Input
                  id="commission_percent"
                  type="number"
                  step="0.01"
                  value={form.commission_percent}
                  onChange={(e) =>
                    setForm({ ...form, commission_percent: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="12"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="payment_fee_percent">Taxa de pagamento (%)</Label>
                <Input
                  id="payment_fee_percent"
                  type="number"
                  step="0.01"
                  value={form.payment_fee_percent}
                  onChange={(e) =>
                    setForm({ ...form, payment_fee_percent: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="3.2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="monthly_fee">Mensalidade (R$)</Label>
                <Input
                  id="monthly_fee"
                  type="number"
                  step="0.01"
                  value={form.monthly_fee}
                  onChange={(e) => setForm({ ...form, monthly_fee: parseFloat(e.target.value) || 0 })}
                  placeholder="100"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="monthly_fee_threshold">Mensalidade só acima de (R$)</Label>
                <Input
                  id="monthly_fee_threshold"
                  type="number"
                  step="0.01"
                  value={form.monthly_fee_threshold}
                  onChange={(e) =>
                    setForm({ ...form, monthly_fee_threshold: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="1800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="source_url">URL da fonte oficial</Label>
                <Input
                  id="source_url"
                  value={form.source_url}
                  onChange={(e) => setForm({ ...form, source_url: e.target.value })}
                  placeholder="https://institucional.ifood.com.br/..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="effective_from">Vigente desde</Label>
                <Input
                  id="effective_from"
                  type="date"
                  value={form.effective_from}
                  onChange={(e) => setForm({ ...form, effective_from: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Ex: valores após negociação"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="space-y-1.5">
                <Label htmlFor="sort_order">Ordem</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
                <Label htmlFor="is_active">Ativo</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={validateAndSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover taxa</AlertDialogTitle>
            <AlertDialogDescription>
              {selected &&
                `Remover ${selected.competitor_name} - ${selected.plan_label}? Se esta taxa estiver sendo usada pelo calculator, ele cairá pro fallback hardcoded até nova taxa ser cadastrada.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default CompetitorFeesManagement;
