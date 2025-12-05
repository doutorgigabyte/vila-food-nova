import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tag, Plus, Edit, Trash2, Search, Pizza, Coffee, ShoppingBag, Utensils, Beer, IceCream, Cake, Sandwich, Fish, Salad } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuditLog } from '@/hooks/useAuditLog';

interface Segment {
  id: string;
  name: string;
  icon: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

const iconOptions = [
  { value: 'Pizza', label: 'Pizza', icon: Pizza },
  { value: 'Coffee', label: 'Café', icon: Coffee },
  { value: 'ShoppingBag', label: 'Mercado', icon: ShoppingBag },
  { value: 'Utensils', label: 'Restaurante', icon: Utensils },
  { value: 'Beer', label: 'Bar', icon: Beer },
  { value: 'IceCream', label: 'Sorvete', icon: IceCream },
  { value: 'Cake', label: 'Doces', icon: Cake },
  { value: 'Sandwich', label: 'Lanche', icon: Sandwich },
  { value: 'Fish', label: 'Frutos do Mar', icon: Fish },
  { value: 'Salad', label: 'Saudável', icon: Salad },
];

const getIconComponent = (iconName: string | null) => {
  const found = iconOptions.find(opt => opt.value === iconName);
  return found?.icon || Tag;
};

const SegmentsManagement = () => {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    is_active: true
  });

  // Fetch segments
  const { data: segments, isLoading } = useQuery({
    queryKey: ['admin-segments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('segments')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Segment[];
    }
  });

  // Count establishments per segment
  const { data: establishmentCounts } = useQuery({
    queryKey: ['admin-establishment-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('establishments')
        .select('segment_id');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(est => {
        if (est.segment_id) {
          counts[est.segment_id] = (counts[est.segment_id] || 0) + 1;
        }
      });
      return counts;
    }
  });

  // Create segment mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: newSegment, error } = await supabase
        .from('segments')
        .insert({
          name: data.name,
          icon: data.icon || null,
          is_active: data.is_active
        })
        .select()
        .single();
      
      if (error) throw error;
      return newSegment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-segments'] });
      logAction({ action: 'create', entityType: 'segment', entityId: data.id, newData: data as any });
      toast.success('Segmento criado com sucesso!');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Erro ao criar segmento: ' + error.message);
    }
  });

  // Update segment mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { data: updated, error } = await supabase
        .from('segments')
        .update({
          name: data.name,
          icon: data.icon || null,
          is_active: data.is_active
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-segments'] });
      logAction({ action: 'update', entityType: 'segment', entityId: data.id, oldData: selectedSegment as any, newData: data as any });
      toast.success('Segmento atualizado com sucesso!');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Erro ao atualizar segmento: ' + error.message);
    }
  });

  // Delete segment mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('segments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['admin-segments'] });
      logAction({ action: 'delete', entityType: 'segment', entityId: id, oldData: selectedSegment as any });
      toast.success('Segmento excluído com sucesso!');
      setIsDeleteDialogOpen(false);
      setSelectedSegment(null);
    },
    onError: (error) => {
      toast.error('Erro ao excluir segmento: ' + error.message);
    }
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('segments')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
      return { id, is_active };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-segments'] });
      toast.success('Status atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      icon: '',
      is_active: true
    });
    setSelectedSegment(null);
  };

  const handleEdit = (segment: Segment) => {
    setSelectedSegment(segment);
    setFormData({
      name: segment.name,
      icon: segment.icon || '',
      is_active: segment.is_active ?? true
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (segment: Segment) => {
    setSelectedSegment(segment);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (selectedSegment) {
      updateMutation.mutate({ id: selectedSegment.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredSegments = segments?.filter(segment =>
    segment.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="Gerenciar Segmentos" icon={Tag} breadcrumb="Segmentos">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Segmentos Cadastrados ({segments?.length || 0})</CardTitle>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Segmento
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 max-w-md"
            />
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ícone</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Estabelecimentos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSegments?.map((segment) => {
                  const IconComponent = getIconComponent(segment.icon);
                  return (
                    <TableRow key={segment.id}>
                      <TableCell>
                        <div className="bg-primary/10 p-2 rounded-lg w-fit">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{segment.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {establishmentCounts?.[segment.id] || 0} lojas
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={segment.is_active ?? false}
                          onCheckedChange={(checked) => 
                            toggleActiveMutation.mutate({ id: segment.id, is_active: checked })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(segment)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(segment)}
                            disabled={(establishmentCounts?.[segment.id] || 0) > 0}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredSegments?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum segmento encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSegment ? 'Editar Segmento' : 'Novo Segmento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Pizzaria"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Ícone</Label>
              <Select 
                value={formData.icon} 
                onValueChange={(value) => setFormData({ ...formData, icon: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um ícone" />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Segmento ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {selectedSegment ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir segmento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o segmento "{selectedSegment?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedSegment && deleteMutation.mutate(selectedSegment.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default SegmentsManagement;
