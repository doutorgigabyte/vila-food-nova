import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SidebarProvider } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useUserEstablishment } from "@/hooks/useDashboardData";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { toast } from "sonner";
import { ProductFormIntelligent } from "@/components/products/ProductFormIntelligent";
import { BulkProductImport } from "@/components/products/BulkProductImport";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Loader2,
  Star,
  Upload,
  Pizza,
  Wine,
  Snowflake,
  Menu,
} from "lucide-react";

import type { Database } from "@/integrations/supabase/types";

type Product = Database['public']['Tables']['products']['Row'];

interface Category {
  id: string;
  name: string;
}

const ProductsManagement = () => {
  const { slug } = useParams();
  const { establishmentId, establishment, loading: estLoading } = useUserEstablishment();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'form' | 'import'>('form');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const baseUrl = slug ? `/painel/${slug}` : '/painel';

  useEffect(() => {
    if (establishmentId) {
      fetchProducts();
      fetchCategories();
    }
  }, [establishmentId]);

  const fetchProducts = async () => {
    if (!establishmentId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("establishment_id", establishmentId)
      .order("name");

    if (error) {
      toast.error("Erro ao carregar produtos");
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    if (!establishmentId) return;
    
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .eq("establishment_id", establishmentId)
      .eq("is_active", true)
      .order("name");

    setCategories(data || []);
  };

  const handleOpenDialog = (product?: Product) => {
    setEditingProduct(product || null);
    setDialogMode('form');
    setIsDialogOpen(true);
  };

  const handleOpenImport = () => {
    setDialogMode('import');
    setIsDialogOpen(true);
  };

  const handleSuccess = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    fetchProducts();
    fetchCategories();
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Deseja excluir "${product.name}"?`)) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {
      toast.error("Erro ao excluir produto");
    } else {
      toast.success("Produto excluído!");
      fetchProducts();
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProductTypeIcon = (type: string | null) => {
    switch (type) {
      case 'pizza': return <Pizza className="w-4 h-4" />;
      case 'drink': return <Wine className="w-4 h-4" />;
      case 'frozen': return <Snowflake className="w-4 h-4" />;
      default: return null;
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Sem categoria";
    return categories.find((c) => c.id === categoryId)?.name || "Sem categoria";
  };

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
                <h1 className="text-lg font-semibold">Produtos</h1>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleOpenImport}>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </Button>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Produto
                </Button>
              </div>
            </div>
          </header>

          <div className="p-4 md:p-6 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Products List */}
            {loading || estLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
                  </p>
                  {!searchTerm && (
                    <Button className="mt-4" onClick={() => handleOpenDialog()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar primeiro produto
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id}>
                    <CardContent className="p-4 flex gap-4">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{product.name}</h3>
                              {getProductTypeIcon(product.product_type)}
                              {product.is_featured && (
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              )}
                              {product.temperature_options && Array.isArray(product.temperature_options) && (product.temperature_options as string[]).includes('gelada') && (
                                <Badge variant="outline" className="text-blue-500 border-blue-300">
                                  <Snowflake className="w-3 h-3 mr-1" />
                                  Gelada
                                </Badge>
                              )}
                              {!product.is_active && (
                                <Badge variant="secondary">Inativo</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {getCategoryName(product.category_id)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(product)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(product)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {product.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-bold text-primary">
                            R$ {product.price.toFixed(2)}
                          </span>
                          {product.promotional_price && (
                            <span className="text-sm text-muted-foreground line-through">
                              R$ {product.promotional_price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'import' 
                ? 'Importar Produtos em Lote' 
                : editingProduct 
                  ? 'Editar Produto' 
                  : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>

          {dialogMode === 'import' ? (
            <BulkProductImport
              establishmentId={establishmentId || ''}
              categories={categories}
              onSuccess={handleSuccess}
              onCancel={() => setIsDialogOpen(false)}
            />
          ) : (
            <ProductFormIntelligent
              establishmentId={establishmentId || ''}
              categories={categories}
              initialData={editingProduct}
              onSuccess={handleSuccess}
              onCancel={() => setIsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default ProductsManagement;