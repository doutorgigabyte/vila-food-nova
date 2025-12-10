import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Percent, Tag, Package, ShoppingBag } from 'lucide-react';
import { useEstablishment } from '@/hooks/useEstablishment';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
}

interface ProductKit {
  id: string;
  name: string;
  kit_price: number;
  image_url: string | null;
}

interface ProductComplement {
  id: string;
  product_id: string | null;
  kit_id: string | null;
  complement_id: string;
  discount_percentage: number | null;
  discount_fixed: number | null;
  is_active: boolean;
  product?: Product | null;
  kit?: ProductKit | null;
  complement?: Product;
}

const ProductComplementsManagement = () => {
  const { slug } = useParams<{ slug: string }>();
  const { establishment } = useEstablishment(slug);
  const [complements, setComplements] = useState<ProductComplement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [kits, setKits] = useState<ProductKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    main_type: 'product' as 'product' | 'kit',
    product_id: '',
    kit_id: '',
    complement_id: '',
    discount_percentage: 0,
    discount_fixed: 0,
    discount_type: 'percentage' as 'percentage' | 'fixed',
    is_active: true,
  });

  useEffect(() => {
    if (establishment?.id) {
      fetchProducts();
      fetchKits();
    }
  }, [establishment?.id]);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, image_url')
      .eq('establishment_id', establishment!.id)
      .eq('is_active', true)
      .order('name');

    if (!error && data) {
      setProducts(data);
    }
  };

  const fetchKits = async () => {
    const { data, error } = await supabase
      .from('product_kits')
      .select('id, name, kit_price, image_url')
      .eq('establishment_id', establishment!.id)
      .eq('is_active', true)
      .order('name');

    if (!error && data) {
      setKits(data);
    }
  };

  useEffect(() => {
    if ((products.length > 0 || kits.length > 0) && establishment?.id) {
      fetchComplementsForProducts();
    }
  }, [products, kits]);

  const fetchComplementsForProducts = async () => {
    setLoading(true);
    const productIds = products.map(p => p.id);
    const kitIds = kits.map(k => k.id);
    
    if (productIds.length === 0 && kitIds.length === 0) {
      setComplements([]);
      setLoading(false);
      return;
    }

    let allComplements: any[] = [];
    
    if (productIds.length > 0) {
      const { data: productComplements } = await supabase
        .from('product_complements')
        .select('*')
        .in('product_id', productIds);
      
      if (productComplements) {
        allComplements = [...allComplements, ...productComplements];
      }
    }

    if (kitIds.length > 0) {
      const { data: kitComplements } = await supabase
        .from('product_complements')
        .select('*')
        .in('kit_id', kitIds);
      
      if (kitComplements) {
        allComplements = [...allComplements, ...kitComplements];
      }
    }

    const enriched = allComplements.map(c => ({
      ...c,
      product: c.product_id ? products.find(p => p.id === c.product_id) : null,
      kit: c.kit_id ? kits.find(k => k.id === c.kit_id) : null,
      complement: products.find(p => p.id === c.complement_id),
    }));
    
    setComplements(enriched as ProductComplement[]);
    setLoading(false);
  };

  const handleSave = async () => {
    const mainId = formData.main_type === 'product' ? formData.product_id : formData.kit_id;
    
    if (!mainId || !formData.complement_id) {
      toast.error('Selecione o item principal e o complemento');
      return;
    }

    if (formData.main_type === 'product' && formData.product_id === formData.complement_id) {
      toast.error('Produto e complemento devem ser diferentes');
      return;
    }

    const insertData: Record<string, any> = {
      complement_id: formData.complement_id,
      discount_percentage: formData.discount_type === 'percentage' ? formData.discount_percentage : null,
      discount_fixed: formData.discount_type === 'fixed' ? formData.discount_fixed : null,
      is_active: formData.is_active,
    };

    if (formData.main_type === 'product') {
      insertData.product_id = formData.product_id;
      insertData.kit_id = null;
    } else {
      insertData.kit_id = formData.kit_id;
      insertData.product_id = null;
    }

    const { error } = await supabase
      .from('product_complements')
      .insert(insertData);

    if (error) {
      toast.error('Erro ao criar complemento');
      console.error(error);
    } else {
      toast.success('Complemento criado!');
      setShowForm(false);
      setFormData({
        main_type: 'product',
        product_id: '',
        kit_id: '',
        complement_id: '',
        discount_percentage: 0,
        discount_fixed: 0,
        discount_type: 'percentage',
        is_active: true,
      });
      fetchComplementsForProducts();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('product_complements')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao remover');
    } else {
      toast.success('Removido!');
      setComplements(complements.filter(c => c.id !== id));
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('product_complements')
      .update({ is_active: isActive })
      .eq('id', id);

    if (!error) {
      setComplements(complements.map(c => 
        c.id === id ? { ...c, is_active: isActive } : c
      ));
    }
  };

  const calculateDiscountedPrice = (complement: ProductComplement) => {
    if (!complement.complement) return 0;
    const originalPrice = complement.complement.price;
    
    if (complement.discount_percentage) {
      return originalPrice * (1 - complement.discount_percentage / 100);
    }
    if (complement.discount_fixed) {
      return Math.max(0, originalPrice - complement.discount_fixed);
    }
    return originalPrice;
  };

  return (
    <DashboardLayout title="Produtos Complementares" establishment={establishment}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Configure produtos que combinam com outros e ofereça descontos
          </p>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Complemento
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Novo Complemento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                {/* Type Selection */}
                <div className="space-y-2">
                  <Label>Tipo do Item Principal</Label>
                  <Select
                    value={formData.main_type}
                    onValueChange={(v: 'product' | 'kit') => setFormData({ 
                      ...formData, 
                      main_type: v, 
                      product_id: '', 
                      kit_id: '' 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4" />
                          Produto
                        </div>
                      </SelectItem>
                      <SelectItem value="kit">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Kit
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Main Item Selection */}
                <div className="space-y-2">
                  <Label>{formData.main_type === 'product' ? 'Produto Principal' : 'Kit Principal'}</Label>
                  {formData.main_type === 'product' ? (
                    <Select
                      value={formData.product_id}
                      onValueChange={(v) => setFormData({ ...formData, product_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} - R$ {p.price.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select
                      value={formData.kit_id}
                      onValueChange={(v) => setFormData({ ...formData, kit_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {kits.map(k => (
                          <SelectItem key={k.id} value={k.id}>
                            {k.name} - R$ {k.kit_price.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Complement Selection - Only Products */}
                <div className="space-y-2">
                  <Label>Produto Complementar</Label>
                  <Select
                    value={formData.complement_id}
                    onValueChange={(v) => setFormData({ ...formData, complement_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products
                        .filter(p => formData.main_type === 'kit' || p.id !== formData.product_id)
                        .map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} - R$ {p.price.toFixed(2)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Tipo de Desconto</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(v: 'percentage' | 'fixed') => setFormData({ ...formData, discount_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentual (%)</SelectItem>
                      <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.discount_type === 'percentage' ? (
                  <div className="space-y-2">
                    <Label>Desconto (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: Number(e.target.value) })}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Desconto (R$)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={formData.discount_fixed}
                      onChange={(e) => setFormData({ ...formData, discount_fixed: Number(e.target.value) })}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                  />
                  <Label>Ativo</Label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave}>Salvar</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Complementos Cadastrados ({complements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : complements.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum complemento cadastrado. Clique em "Novo Complemento" para começar.
              </p>
            ) : (
              <div className="space-y-3">
                {complements.map((comp) => {
                  const mainName = comp.product?.name || comp.kit?.name || 'Item desconhecido';
                  const isKit = !!comp.kit;
                  
                  return (
                    <div
                      key={comp.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {isKit ? (
                            <Badge variant="outline" className="gap-1">
                              <Package className="w-3 h-3" />
                              Kit
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <ShoppingBag className="w-3 h-3" />
                              Produto
                            </Badge>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{mainName}</p>
                          <p className="text-sm text-muted-foreground">+ {comp.complement?.name}</p>
                        </div>
                        <div className="flex gap-2">
                          {comp.discount_percentage && (
                            <Badge variant="secondary" className="gap-1">
                              <Percent className="w-3 h-3" />
                              {comp.discount_percentage}% OFF
                            </Badge>
                          )}
                          {comp.discount_fixed && (
                            <Badge variant="secondary" className="gap-1">
                              <Tag className="w-3 h-3" />
                              R$ {comp.discount_fixed.toFixed(2)} OFF
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground line-through">
                            R$ {comp.complement?.price?.toFixed(2)}
                          </p>
                          <p className="font-bold text-green-600">
                            R$ {calculateDiscountedPrice(comp).toFixed(2)}
                          </p>
                        </div>

                        <Switch
                          checked={comp.is_active}
                          onCheckedChange={(v) => toggleActive(comp.id, v)}
                        />

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(comp.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProductComplementsManagement;
