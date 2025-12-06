import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Layers, Plus, Edit, Trash2, Search, 
  ShoppingCart, Pill, ShoppingBag, UtensilsCrossed, Palette, Package, Wrench,
  Pizza, Beef, Utensils, Sandwich, IceCream, Croissant, Grape, Fish, CupSoda,
  Sparkles, Home, Smartphone, Shirt, Dog, Store
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

interface MainCategory {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  description: string | null;
  bg_color: string | null;
  icon_color: string | null;
  border_color: string | null;
  image_url: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  created_at: string | null;
}

const iconMap: Record<string, any> = {
  'shopping-cart': ShoppingCart,
  'pill': Pill,
  'shopping-bag': ShoppingBag,
  'utensils-crossed': UtensilsCrossed,
  'utensils': Utensils,
  'palette': Palette,
  'package': Package,
  'wrench': Wrench,
  'pizza': Pizza,
  'beef': Beef,
  'sandwich': Sandwich,
  'ice-cream': IceCream,
  'croissant': Croissant,
  'grape': Grape,
  'fish': Fish,
  'cup-soda': CupSoda,
  'sparkles': Sparkles,
  'home': Home,
  'smartphone': Smartphone,
  'shirt': Shirt,
  'dog': Dog,
};

const iconOptions = [
  { value: 'shopping-cart', label: 'Mercado', icon: ShoppingCart },
  { value: 'pill', label: 'Farmácia', icon: Pill },
  { value: 'shopping-bag', label: 'Compras', icon: ShoppingBag },
  { value: 'utensils-crossed', label: 'Comida', icon: UtensilsCrossed },
  { value: 'palette', label: 'Artesanato', icon: Palette },
  { value: 'wrench', label: 'Serviços', icon: Wrench },
  { value: 'package', label: 'Pacote', icon: Package },
];

const getIconComponent = (iconName: string | null) => {
  if (!iconName) return Store;
  return iconMap[iconName] || Store;
};

const MainCategoriesManagement = () => {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MainCategory | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    icon: '',
    description: '',
    bg_color: 'bg-gray-100',
    icon_color: 'text-gray-600',
    border_color: 'border-gray-400',
    image_url: '',
    sort_order: 0,
    is_active: true
  });

  // Fetch categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-main-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('main_categories')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data as MainCategory[];
    }
  });

  // Fetch subcategory counts
  const { data: subcategoryCounts } = useQuery({
    queryKey: ['admin-subcategory-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('segments')
        .select('parent_category_id');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(seg => {
        if (seg.parent_category_id) {
          counts[seg.parent_category_id] = (counts[seg.parent_category_id] || 0) + 1;
        }
      });
      return counts;
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: newCategory, error } = await supabase
        .from('main_categories')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return newCategory;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-main-categories'] });
      logAction({ action: 'create', entityType: 'main_category', entityId: data.id, newData: data as any });
      toast.success('Categoria criada com sucesso!');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Erro ao criar categoria: ' + error.message);
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { data: updated, error } = await supabase
        .from('main_categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-main-categories'] });
      logAction({ action: 'update', entityType: 'main_category', entityId: data.id, oldData: selectedCategory as any, newData: data as any });
      toast.success('Categoria atualizada com sucesso!');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Erro ao atualizar categoria: ' + error.message);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('main_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['admin-main-categories'] });
      logAction({ action: 'delete', entityType: 'main_category', entityId: id, oldData: selectedCategory as any });
      toast.success('Categoria excluída com sucesso!');
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
    },
    onError: (error) => {
      toast.error('Erro ao excluir categoria: ' + error.message);
    }
  });

  // Toggle active
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('main_categories')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
      return { id, is_active };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-main-categories'] });
      toast.success('Status atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      slug: '',
      name: '',
      icon: '',
      description: '',
      bg_color: 'bg-gray-100',
      icon_color: 'text-gray-600',
      border_color: 'border-gray-400',
      image_url: '',
      sort_order: 0,
      is_active: true
    });
    setSelectedCategory(null);
  };

  const handleEdit = (category: MainCategory) => {
    setSelectedCategory(category);
    setFormData({
      slug: category.slug,
      name: category.name,
      icon: category.icon || '',
      description: category.description || '',
      bg_color: category.bg_color || 'bg-gray-100',
      icon_color: category.icon_color || 'text-gray-600',
      border_color: category.border_color || 'border-gray-400',
      image_url: category.image_url || '',
      sort_order: category.sort_order || 0,
      is_active: category.is_active ?? true
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (category: MainCategory) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.slug) {
      toast.error('Nome e slug são obrigatórios');
      return;
    }

    if (selectedCategory) {
      updateMutation.mutate({ id: selectedCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredCategories = categories?.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="Categorias Principais" icon={Layers} breadcrumb="Categorias Principais">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Categorias Principais ({categories?.length || 0})</CardTitle>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 max-w-md"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ícone</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Subcategorias</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories?.map((category) => {
                  const IconComponent = getIconComponent(category.icon);
                  return (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className={`p-2 rounded-lg w-fit ${category.bg_color || 'bg-primary/10'}`}>
                          <IconComponent className={`h-5 w-5 ${category.icon_color || 'text-primary'}`} />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{category.slug}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {subcategoryCounts?.[category.id] || 0} subcategorias
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={category.is_active ?? false}
                          onCheckedChange={(checked) => 
                            toggleActiveMutation.mutate({ id: category.id, is_active: checked })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(category)}
                            disabled={(subcategoryCounts?.[category.id] || 0) > 0}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Comida"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="Ex: comida"
                />
              </div>
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
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Restaurantes e lanches"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image_url">URL da Imagem</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort_order">Ordem</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Categoria ativa</Label>
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
              {selectedCategory ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{selectedCategory?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedCategory && deleteMutation.mutate(selectedCategory.id)}
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

export default MainCategoriesManagement;
