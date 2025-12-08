import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ImageUpload } from "@/components/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { useUserEstablishment } from "@/hooks/useDashboardData";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Tag,
  Loader2,
  GripVertical,
  Menu,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean | null;
  sort_order: number | null;
}

const CategoriesManagement = () => {
  const { slug } = useParams();
  const { establishmentId, establishment, loading: estLoading } = useUserEstablishment();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const baseUrl = slug ? `/painel/${slug}` : '/painel';

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    image_url: "",
    is_active: true,
    sort_order: "0",
  });

  useEffect(() => {
    if (establishmentId) {
      fetchCategories();
    }
  }, [establishmentId]);

  const fetchCategories = async () => {
    if (!establishmentId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("establishment_id", establishmentId)
      .order("sort_order");

    if (error) {
      toast.error("Erro ao carregar categorias");
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setForm({
        name: category.name,
        description: category.description || "",
        image_url: category.image_url || "",
        is_active: category.is_active ?? true,
        sort_order: category.sort_order?.toString() || "0",
      });
    } else {
      setEditingCategory(null);
      setForm({
        name: "",
        description: "",
        image_url: "",
        is_active: true,
        sort_order: (categories.length * 10).toString(),
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (!establishmentId) {
      toast.error("Estabelecimento não encontrado");
      return;
    }

    setSaving(true);

    const categoryData = {
      name: form.name,
      description: form.description || null,
      image_url: form.image_url || null,
      is_active: form.is_active,
      sort_order: parseInt(form.sort_order) || 0,
      establishment_id: establishmentId,
    };

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from("categories")
          .update(categoryData)
          .eq("id", editingCategory.id);

        if (error) throw error;
        toast.success("Categoria atualizada!");
      } else {
        const { error } = await supabase
          .from("categories")
          .insert(categoryData);

        if (error) throw error;
        toast.success("Categoria criada!");
      }

      setIsDialogOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar categoria");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Deseja excluir "${category.name}"?`)) return;

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", category.id);

    if (error) {
      toast.error("Erro ao excluir categoria");
    } else {
      toast.success("Categoria excluída!");
      fetchCategories();
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          establishment={establishment}
        />

        <div className="flex-1 lg:ml-64">
          <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </Button>
                <h1 className="text-lg font-semibold">Categorias</h1>
              </div>
              <Button onClick={() => handleOpenDialog()} size="sm" className="hidden sm:flex">
                <Plus className="w-4 h-4 mr-2" />
                Nova Categoria
              </Button>
              <Button onClick={() => handleOpenDialog()} size="icon" className="sm:hidden">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </header>

          <div className="p-4 md:p-6 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar categorias..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Categories List */}
            {loading || estLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCategories.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? "Nenhuma categoria encontrada" : "Nenhuma categoria cadastrada"}
                  </p>
                  {!searchTerm && (
                    <Button className="mt-4" onClick={() => handleOpenDialog()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar primeira categoria
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredCategories.map((category) => (
                  <Card key={category.id}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                      
                      {category.image_url ? (
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="w-14 h-14 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                          <Tag className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{category.name}</h3>
                          {!category.is_active && (
                            <Badge variant="secondary">Inativa</Badge>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {category.description}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(category)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {establishmentId && (
              <ImageUpload
                bucket="establishments"
                currentImage={form.image_url}
                onUpload={(url) => setForm({ ...form, image_url: url })}
                onRemove={() => setForm({ ...form, image_url: "" })}
                aspectRatio="banner"
              />
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Pizzas Salgadas"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descreva a categoria..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">Ordem de exibição</Label>
              <Input
                id="sort_order"
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label>Categoria ativa</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCategory ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default CategoriesManagement;