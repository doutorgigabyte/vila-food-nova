import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { HelpCircle, Plus, Edit, Trash2, Search, Eye, EyeOff } from 'lucide-react';
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
import { useAllFAQItemsAdmin, type FAQItem } from '@/hooks/useFAQItems';

interface FormState {
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm: FormState = {
  category: '',
  question: '',
  answer: '',
  sort_order: 0,
  is_active: true,
};

const FAQManagement = () => {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<FAQItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: items, isLoading } = useAllFAQItemsAdmin();

  const filtered = (items ?? []).filter((i) => {
    const q = searchTerm.toLowerCase();
    return (
      !q ||
      i.question.toLowerCase().includes(q) ||
      i.answer.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q)
    );
  });

  // Sugestoes de categoria a partir do que ja existe
  const existingCategories = Array.from(new Set((items ?? []).map((i) => i.category))).filter(Boolean);

  const openCreate = () => {
    setSelected(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const openEdit = (i: FAQItem) => {
    setSelected(i);
    setForm({
      category: i.category,
      question: i.question,
      answer: i.answer,
      sort_order: i.sort_order,
      is_active: i.is_active,
    });
    setIsDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        category: form.category.trim(),
        question: form.question.trim(),
        answer: form.answer.trim(),
        sort_order: form.sort_order,
        is_active: form.is_active,
      };
      if (selected) {
        const { error } = await supabase.from('faq_items').update(payload).eq('id', selected.id);
        if (error) throw error;
        await logAction('update', 'faq_item', selected.id, payload);
      } else {
        const { data, error } = await supabase.from('faq_items').insert(payload).select().single();
        if (error) throw error;
        await logAction('create', 'faq_item', data.id, payload);
      }
    },
    onSuccess: () => {
      toast.success(selected ? 'FAQ atualizado' : 'FAQ criado');
      queryClient.invalidateQueries({ queryKey: ['faq-items'] });
      setIsDialogOpen(false);
    },
    onError: (e: Error) => {
      toast.error(`Erro ao salvar: ${e.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      const { error } = await supabase.from('faq_items').delete().eq('id', selected.id);
      if (error) throw error;
      await logAction('delete', 'faq_item', selected.id, { question: selected.question });
    },
    onSuccess: () => {
      toast.success('FAQ removido');
      queryClient.invalidateQueries({ queryKey: ['faq-items'] });
      setIsDeleteOpen(false);
      setSelected(null);
    },
    onError: (e: Error) => {
      toast.error(`Erro ao remover: ${e.message}`);
    },
  });

  const validateAndSave = () => {
    if (!form.category.trim()) return toast.error('Categoria é obrigatória');
    if (!form.question.trim()) return toast.error('Pergunta é obrigatória');
    if (!form.answer.trim()) return toast.error('Resposta é obrigatória');
    saveMutation.mutate();
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-primary" /> FAQ
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Perguntas frequentes da landing <code>/conheca</code>. Quando vazio, usa fallback
              hardcoded em <code>src/components/landing/faqData.ts</code>.
            </p>
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Nova pergunta
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Buscar por categoria, pergunta ou resposta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
              <span className="ml-auto text-sm text-muted-foreground font-normal">
                {filtered.length} pergunta{filtered.length === 1 ? '' : 's'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-sm py-8 text-center">Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">
                Nenhum FAQ cadastrado. A landing usa o conteúdo padrão até você criar.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-48">Categoria</TableHead>
                    <TableHead>Pergunta / Resposta</TableHead>
                    <TableHead className="w-20">Ordem</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-32 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium align-top">{i.category}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{i.question}</div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 max-w-xl">
                          {i.answer}
                        </p>
                      </TableCell>
                      <TableCell className="text-center align-top">{i.sort_order}</TableCell>
                      <TableCell className="align-top">
                        <Badge
                          variant={i.is_active ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {i.is_active ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                          {i.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right align-top">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(i)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelected(i);
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected ? 'Editar pergunta' : 'Nova pergunta'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="category">Categoria *</Label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Sobre a Plataforma"
                list="faq-categories"
              />
              <datalist id="faq-categories">
                {existingCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">
                Sugestões: {existingCategories.join(' · ') || 'nenhuma ainda'}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="question">Pergunta *</Label>
              <Input
                id="question"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="Como funciona o período gratuito?"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="answer">Resposta *</Label>
              <Textarea
                id="answer"
                rows={5}
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                placeholder="Você pode começar usando o VilaFood gratuitamente..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="space-y-1.5">
                <Label htmlFor="sort_order">Ordem (dentro da categoria)</Label>
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
            <AlertDialogTitle>Remover FAQ</AlertDialogTitle>
            <AlertDialogDescription>
              {selected && `Remover "${selected.question}"? Esta ação não pode ser desfeita.`}
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

export default FAQManagement;
