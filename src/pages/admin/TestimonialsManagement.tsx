import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Quote, Plus, Edit, Trash2, Search, Star, Eye, EyeOff } from 'lucide-react';
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
import { useAllTestimonialsAdmin, type Testimonial } from '@/hooks/useTestimonials';

interface FormState {
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar_url: string;
  metric_label: string;
  metric_value: string;
  establishment_id: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
}

const emptyForm: FormState = {
  name: '',
  role: '',
  content: '',
  rating: 5,
  avatar_url: '',
  metric_label: '',
  metric_value: '',
  establishment_id: '',
  is_active: true,
  is_featured: false,
  sort_order: 0,
};

const TestimonialsManagement = () => {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: testimonials, isLoading } = useAllTestimonialsAdmin();

  const filtered = (testimonials ?? []).filter((t) => {
    const q = searchTerm.toLowerCase();
    return (
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.content.toLowerCase().includes(q) ||
      (t.role ?? '').toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setSelected(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const openEdit = (t: Testimonial) => {
    setSelected(t);
    setForm({
      name: t.name,
      role: t.role ?? '',
      content: t.content,
      rating: t.rating,
      avatar_url: t.avatar_url ?? '',
      metric_label: t.metric_label ?? '',
      metric_value: t.metric_value ?? '',
      establishment_id: t.establishment_id ?? '',
      is_active: t.is_active,
      is_featured: t.is_featured,
      sort_order: t.sort_order,
    });
    setIsDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        role: form.role.trim() || null,
        content: form.content.trim(),
        rating: form.rating,
        avatar_url: form.avatar_url.trim() || null,
        metric_label: form.metric_label.trim() || null,
        metric_value: form.metric_value.trim() || null,
        establishment_id: form.establishment_id.trim() || null,
        is_active: form.is_active,
        is_featured: form.is_featured,
        sort_order: form.sort_order,
      };
      if (selected) {
        const { error } = await supabase.from('testimonials').update(payload).eq('id', selected.id);
        if (error) throw error;
        await logAction('update', 'testimonial', selected.id, payload);
      } else {
        const { data, error } = await supabase.from('testimonials').insert(payload).select().single();
        if (error) throw error;
        await logAction('create', 'testimonial', data.id, payload);
      }
    },
    onSuccess: () => {
      toast.success(selected ? 'Depoimento atualizado' : 'Depoimento criado');
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      setIsDialogOpen(false);
    },
    onError: (e: Error) => {
      toast.error(`Erro ao salvar: ${e.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      const { error } = await supabase.from('testimonials').delete().eq('id', selected.id);
      if (error) throw error;
      await logAction('delete', 'testimonial', selected.id, { name: selected.name });
    },
    onSuccess: () => {
      toast.success('Depoimento removido');
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      setIsDeleteDialogOpen(false);
      setSelected(null);
    },
    onError: (e: Error) => {
      toast.error(`Erro ao remover: ${e.message}`);
    },
  });

  const validateAndSave = () => {
    if (!form.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!form.content.trim()) {
      toast.error('Conteúdo é obrigatório');
      return;
    }
    if (form.rating < 1 || form.rating > 5) {
      toast.error('Rating deve ser entre 1 e 5');
      return;
    }
    saveMutation.mutate();
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Quote className="h-6 w-6 text-primary" /> Depoimentos
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Curadoria de testemunhos exibidos em <code>/conheca</code>. Quando vazio, a landing
              usa fallback hardcoded até você adicionar reais.
            </p>
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Novo depoimento
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Buscar por nome, cargo ou conteúdo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <span className="ml-auto text-sm text-muted-foreground font-normal">
                {filtered.length} depoimento{filtered.length === 1 ? '' : 's'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-sm py-8 text-center">Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">
                Nenhum depoimento ainda. Clique em <strong>Novo depoimento</strong> para começar.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome / Cargo</TableHead>
                    <TableHead>Conteúdo</TableHead>
                    <TableHead className="w-24">Rating</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-32 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="font-medium">{t.name}</div>
                        {t.role && (
                          <div className="text-xs text-muted-foreground">{t.role}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm line-clamp-2 max-w-md">{t.content}</p>
                        {t.metric_value && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {t.metric_value} {t.metric_label}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-0.5">
                          {[...Array(t.rating)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={t.is_active ? 'default' : 'secondary'} className="text-xs w-fit">
                            {t.is_active ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                            {t.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                          {t.is_featured && (
                            <Badge variant="outline" className="text-xs w-fit text-accent border-accent">
                              Destaque
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelected(t);
                            setIsDeleteDialogOpen(true);
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected ? 'Editar depoimento' : 'Novo depoimento'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Carlos Silva"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role">Cargo / Estabelecimento</Label>
                <Input
                  id="role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="Dono - Pizzaria Don Carlo"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="content">Conteúdo *</Label>
              <Textarea
                id="content"
                rows={4}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Triplicamos nossos pedidos em 3 meses..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="rating">Rating (1-5) *</Label>
                <Input
                  id="rating"
                  type="number"
                  min={1}
                  max={5}
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) || 5 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="metric_value">Métrica (valor)</Label>
                <Input
                  id="metric_value"
                  value={form.metric_value}
                  onChange={(e) => setForm({ ...form, metric_value: e.target.value })}
                  placeholder="+200%"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="metric_label">Métrica (label)</Label>
                <Input
                  id="metric_label"
                  value={form.metric_label}
                  onChange={(e) => setForm({ ...form, metric_label: e.target.value })}
                  placeholder="aumento de pedidos"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="avatar_url">URL da foto</Label>
                <Input
                  id="avatar_url"
                  value={form.avatar_url}
                  onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="establishment_id">ID do estabelecimento (opcional)</Label>
                <Input
                  id="establishment_id"
                  value={form.establishment_id}
                  onChange={(e) => setForm({ ...form, establishment_id: e.target.value })}
                  placeholder="UUID"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-center">
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
              <div className="flex items-center gap-2">
                <Switch
                  id="is_featured"
                  checked={form.is_featured}
                  onCheckedChange={(v) => setForm({ ...form, is_featured: v })}
                />
                <Label htmlFor="is_featured">Destaque</Label>
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover depoimento</AlertDialogTitle>
            <AlertDialogDescription>
              {selected && `Remover "${selected.name}"? Esta ação não pode ser desfeita.`}
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

export default TestimonialsManagement;
