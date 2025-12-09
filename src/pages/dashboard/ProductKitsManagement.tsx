import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, Plus, Trash2, Edit2, Percent, Search, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ImageUpload } from "@/components/ImageUpload";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
}

interface KitItem {
  id?: string;
  product_id: string;
  product?: Product;
  quantity: number;
  is_replaceable: boolean;
}

interface ProductKit {
  id: string;
  name: string;
  description: string | null;
  kit_price: number;
  original_price: number | null;
  image_url: string | null;
  is_active: boolean;
  items?: KitItem[];
}

const ProductKitsManagement = () => {
  const { slug } = useParams();
  const [kits, setKits] = useState<ProductKit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<ProductKit | null>(null);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    kit_price: 0,
    image_url: "",
    is_active: true,
  });
  const [selectedItems, setSelectedItems] = useState<KitItem[]>([]);
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    fetchEstablishmentAndData();
  }, [slug]);

  const fetchEstablishmentAndData = async () => {
    try {
      const { data: establishment } = await supabase
        .from("establishments")
        .select("id")
        .eq("slug", slug)
        .single();

      if (establishment) {
        setEstablishmentId(establishment.id);
        await Promise.all([
          fetchKits(establishment.id),
          fetchProducts(establishment.id),
        ]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const fetchKits = async (estId: string) => {
    const { data, error } = await supabase
      .from("product_kits")
      .select(`
        *,
        product_kit_items (
          id,
          product_id,
          quantity,
          is_replaceable,
          products (id, name, price, image_url)
        )
      `)
      .eq("establishment_id", estId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    const formattedKits = data?.map(kit => ({
      ...kit,
      items: kit.product_kit_items?.map((item: any) => ({
        ...item,
        product: item.products,
      })),
    })) || [];
    
    setKits(formattedKits);
  };

  const fetchProducts = async (estId: string) => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, image_url")
      .eq("establishment_id", estId)
      .eq("is_active", true)
      .order("name");

    if (error) throw error;
    setProducts(data || []);
  };

  const calculateOriginalPrice = () => {
    return selectedItems.reduce((total, item) => {
      const product = products.find(p => p.id === item.product_id);
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  };

  const handleOpenDialog = (kit?: ProductKit) => {
    if (kit) {
      setEditingKit(kit);
      setFormData({
        name: kit.name,
        description: kit.description || "",
        kit_price: kit.kit_price,
        image_url: kit.image_url || "",
        is_active: kit.is_active,
      });
      setSelectedItems(
        kit.items?.map(item => ({
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          is_replaceable: item.is_replaceable,
        })) || []
      );
    } else {
      setEditingKit(null);
      setFormData({
        name: "",
        description: "",
        kit_price: 0,
        image_url: "",
        is_active: true,
      });
      setSelectedItems([]);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!establishmentId || !formData.name || selectedItems.length === 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const originalPrice = calculateOriginalPrice();
      const kitData = {
        establishment_id: establishmentId,
        name: formData.name,
        description: formData.description || null,
        kit_price: formData.kit_price,
        original_price: originalPrice,
        image_url: formData.image_url || null,
        is_active: formData.is_active,
      };

      let kitId = editingKit?.id;

      if (editingKit) {
        const { error } = await supabase
          .from("product_kits")
          .update(kitData)
          .eq("id", editingKit.id);
        if (error) throw error;

        // Delete existing items and re-add
        await supabase
          .from("product_kit_items")
          .delete()
          .eq("kit_id", editingKit.id);
      } else {
        const { data, error } = await supabase
          .from("product_kits")
          .insert(kitData)
          .select()
          .single();
        if (error) throw error;
        kitId = data.id;
      }

      // Add kit items
      const itemsToInsert = selectedItems.map(item => ({
        kit_id: kitId,
        product_id: item.product_id,
        quantity: item.quantity,
        is_replaceable: item.is_replaceable,
      }));

      const { error: itemsError } = await supabase
        .from("product_kit_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success(editingKit ? "Kit atualizado!" : "Kit criado!");
      setDialogOpen(false);
      fetchKits(establishmentId);
    } catch (error) {
      console.error("Error saving kit:", error);
      toast.error("Erro ao salvar kit");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este kit?")) return;

    try {
      const { error } = await supabase
        .from("product_kits")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Kit excluído!");
      if (establishmentId) fetchKits(establishmentId);
    } catch (error) {
      console.error("Error deleting kit:", error);
      toast.error("Erro ao excluir kit");
    }
  };

  const toggleProductInKit = (product: Product) => {
    const existing = selectedItems.find(i => i.product_id === product.id);
    if (existing) {
      setSelectedItems(prev => prev.filter(i => i.product_id !== product.id));
    } else {
      setSelectedItems(prev => [...prev, {
        product_id: product.id,
        quantity: 1,
        is_replaceable: false,
      }]);
    }
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    setSelectedItems(prev =>
      prev.map(item =>
        item.product_id === productId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  };

  const filteredKits = kits.filter(kit =>
    kit.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const savings = calculateOriginalPrice() - formData.kit_price;
  const savingsPercent = calculateOriginalPrice() > 0 
    ? Math.round((savings / calculateOriginalPrice()) * 100) 
    : 0;

  return (
    <DashboardLayout title="Kits de Produtos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar kits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Kit
          </Button>
        </div>

        {/* Kits Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 space-y-3">
                  <div className="h-32 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredKits.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum kit cadastrado</h3>
              <p className="text-muted-foreground mb-4">
                Crie kits combinando produtos para oferecer descontos
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeiro kit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredKits.map(kit => (
              <Card key={kit.id} className={!kit.is_active ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  {kit.image_url ? (
                    <img
                      src={kit.image_url}
                      alt={kit.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  ) : (
                    <div className="w-full h-32 bg-muted rounded-lg mb-3 flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold">{kit.name}</h3>
                      {!kit.is_active && (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </div>
                    
                    {kit.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {kit.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">
                        R$ {kit.kit_price.toFixed(2)}
                      </span>
                      {kit.original_price && kit.original_price > kit.kit_price && (
                        <>
                          <span className="text-sm text-muted-foreground line-through">
                            R$ {kit.original_price.toFixed(2)}
                          </span>
                          <Badge variant="destructive" className="text-xs">
                            -{Math.round(((kit.original_price - kit.kit_price) / kit.original_price) * 100)}%
                          </Badge>
                        </>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {kit.items?.length || 0} produto(s) no kit
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleOpenDialog(kit)}
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(kit.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Kit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {editingKit ? "Editar Kit" : "Novo Kit"}
            </DialogTitle>
            <DialogDescription>
              Combine produtos para criar um kit com preço especial
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Kit *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Combo Família"
                />
              </div>
              <div className="space-y-2">
                <Label>Preço do Kit *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.kit_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, kit_price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o que está incluído no kit"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Imagem do Kit</Label>
              <ImageUpload
                bucket="products"
                currentImage={formData.image_url}
                onUpload={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Kit ativo</Label>
            </div>

            {/* Product Selection */}
            <div className="space-y-3 border-t pt-4">
              <Label className="text-base font-medium">Produtos do Kit *</Label>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-2">
                {filteredProducts.map(product => {
                  const isSelected = selectedItems.some(i => i.product_id === product.id);
                  const item = selectedItems.find(i => i.product_id === product.id);
                  
                  return (
                    <div
                      key={product.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? "bg-primary/10 border border-primary/20" : "hover:bg-muted"
                      }`}
                      onClick={() => toggleProductInKit(product)}
                    >
                      <Checkbox checked={isSelected} />
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          R$ {product.price.toFixed(2)}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateItemQuantity(product.id, (item?.quantity || 1) - 1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center text-sm">{item?.quantity || 1}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateItemQuantity(product.id, (item?.quantity || 1) + 1)}
                          >
                            +
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              {selectedItems.length > 0 && (
                <div className="p-3 bg-muted rounded-lg space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Valor original:</span>
                    <span>R$ {calculateOriginalPrice().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Preço do kit:</span>
                    <span className="text-primary">R$ {formData.kit_price.toFixed(2)}</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Economia:</span>
                      <span>R$ {savings.toFixed(2)} ({savingsPercent}%)</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSave} className="flex-1">
                {editingKit ? "Salvar Alterações" : "Criar Kit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ProductKitsManagement;