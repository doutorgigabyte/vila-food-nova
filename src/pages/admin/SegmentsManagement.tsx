import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Tag, Plus, Edit, Trash2, Search, Pizza, Coffee, ShoppingBag, Utensils, 
  Beer, IceCream, Cake, Sandwich, Fish, Salad, Grape, CupSoda, Sparkles, 
  Home, Smartphone, Pill, Beef, Package, Shirt, Box, Croissant, Dog, Wrench, ShoppingCart, Palette
} from 'lucide-react';
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
  parent_category_id: string | null;
  created_at: string | null;
}

interface MainCategory {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
}

// Map icon names to components
const iconMap: Record<string, any> = {
  'pizza': Pizza,
  'coffee': Coffee,
  'shopping-bag': ShoppingBag,
  'utensils': Utensils,
  'beer': Beer,
  'ice-cream': IceCream,
  'cake': Cake,
  'sandwich': Sandwich,
  'fish': Fish,
  'salad': Salad,
  'grape': Grape,
  'cup-soda': CupSoda,
  'sparkles': Sparkles,
  'home': Home,
  'smartphone': Smartphone,
  'pill': Pill,
  'beef': Beef,
  'package': Package,
  'shirt': Shirt,
  'box': Box,
  'croissant': Croissant,
  'dog': Dog,
  'wrench': Wrench,
  'shopping-cart': ShoppingCart,
  'palette': Palette,
};

const iconOptions = [
  { value: 'pizza', label: 'Pizza', icon: Pizza },
  { value: 'utensils', label: 'Restaurante', icon: Utensils },
  { value: 'beef', label: 'Hamburgueria', icon: Beef },
  { value: 'sandwich', label: 'Lanchonete', icon: Sandwich },
  { value: 'croissant', label: 'Padaria', icon: Croissant },
  { value: 'cake', label: 'Doces/Confeitaria', icon: Cake },
  { value: 'grape', label: 'Açaí', icon: Grape },
  { value: 'ice-cream', label: 'Sorveteria', icon: IceCream },
  { value: 'fish', label: 'Sushi/Frutos do Mar', icon: Fish },
  { value: 'package', label: 'Marmitaria', icon: Package },
  { value: 'cup-soda', label: 'Bebidas', icon: CupSoda },
  { value: 'coffee', label: 'Café', icon: Coffee },
  { value: 'beer', label: 'Bar', icon: Beer },
  { value: 'salad', label: 'Saudável', icon: Salad },
  { value: 'shopping-cart', label: 'Supermercado', icon: ShoppingCart },
  { value: 'pill', label: 'Farmácia', icon: Pill },
  { value: 'dog', label: 'Pet Shop', icon: Dog },
  { value: 'sparkles', label: 'Beleza', icon: Sparkles },
  { value: 'shirt', label: 'Moda', icon: Shirt },
  { value: 'smartphone', label: 'Eletrônicos', icon: Smartphone },
  { value: 'home', label: 'Casa e Jardim', icon: Home },
  { value: 'wrench', label: 'Serviços', icon: Wrench },
  { value: 'palette', label: 'Artesanato', icon: Palette },
  { value: 'box', label: 'Outros', icon: Box },
];

const getIconComponent = (iconName: string | null) => {
  if (!iconName) return Tag;
  return iconMap[iconName] || Tag;
};

const SegmentsManagement = () => {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    parent_category_id: '',
    is_active: true
  });

  // Fetch main categories
  const { data: mainCategories } = useQuery({
    queryKey: ['admin-main-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('main_categories')
        .select('id, slug, name, icon')
        .order('sort_order');
      
      if (error) throw error;
      return data as MainCategory[];
    }
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

  // Fetch establishments with segment info
  const { data: establishmentsData } = useQuery({
    queryKey: ['admin-establishments-by-segment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('establishments')
        .select('id, name, slug, segment_id, status, logo_url')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const establishmentCounts = establishmentsData?.reduce((acc, est) => {
    if (est.segment_id) {
      acc[est.segment_id] = (acc[est.segment_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: newSegment, error } = await supabase
        .from('segments')
        .insert({
          name: data.name,
          icon: data.icon || null,
          parent_category_id: data.parent_category_id || null,
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
      toast.success('Subcategoria criada com sucesso!');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Erro ao criar subcategoria: ' + error.message);
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { data: updated, error } = await supabase
        .from('segments')
        .update({
          name: data.name,
          icon: data.icon || null,
          parent_category_id: data.parent_category_id || null,
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
      toast.success('Subcategoria atualizada com sucesso!');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Erro ao atualizar subcategoria: ' + error.message);
    }
  });

  // Delete mutation
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
      toast.success('Subcategoria excluída com sucesso!');
      setIsDeleteDialogOpen(false);
      setSelectedSegment(null);
    },
    onError: (error) => {
      toast.error('Erro ao excluir subcategoria: ' + error.message);
    }
  });

  // Toggle active
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
      parent_category_id: '',
      is_active: true
    });
    setSelectedSegment(null);
  };

  const handleEdit = (segment: Segment) => {
    setSelectedSegment(segment);
    setFormData({
      name: segment.name,
      icon: segment.icon || '',
      parent_category_id: segment.parent_category_id || '',
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

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Sem categoria';
    const category = mainCategories?.find(c => c.id === categoryId);
    return category?.name || 'Desconhecida';
  };

  const getCategoryBadgeColor = (categoryId: string | null) => {
    if (!categoryId) return 'bg-muted text-muted-foreground';
    const category = mainCategories?.find(c => c.id === categoryId);
    switch (category?.slug) {
      case 'mercado': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'farmacia': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      case 'compras': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
      case 'comida': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      case 'artesanato': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
      case 'servicos': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredSegments = segments?.filter(segment => {
    const matchesSearch = segment.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || segment.parent_category_id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AdminLayout title="Gerenciar Subcategorias" icon={Tag} breadcrumb="Subcategorias">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Subcategorias ({segments?.length || 0})</CardTitle>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Subcategoria
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {mainCategories?.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  <TableHead>Categoria Principal</TableHead>
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
                        <Badge className={getCategoryBadgeColor(segment.parent_category_id)}>
                          {getCategoryName(segment.parent_category_id)}
                        </Badge>
                      </TableCell>
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
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhuma subcategoria encontrada
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
            <DialogTitle>{selectedSegment ? 'Editar Subcategoria' : 'Nova Subcategoria'}</DialogTitle>
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
              <Label htmlFor="parent_category">Categoria Principal</Label>
              <Select 
                value={formData.parent_category_id} 
                onValueChange={(value) => setFormData({ ...formData, parent_category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {mainCategories?.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <SelectContent className="max-h-72">
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
              <Label htmlFor="is_active">Subcategoria ativa</Label>
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

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir subcategoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a subcategoria "{selectedSegment?.name}"? 
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
