import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wand2, Plus, Trash2, Loader2, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductTypeSelector, ProductType } from "./ProductTypeSelector";
import { TemperatureOption } from "./TemperatureSelector";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "@/components/ImageUpload";

const productSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  price: z.number().min(0.01, "Preço deve ser maior que zero"),
  promotional_price: z.number().optional(),
  category_id: z.string().optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  preparation_time: z.number().optional(),
  stock_quantity: z.number().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Category {
  id: string;
  name: string;
}

interface PizzaSize {
  name: string;
  price: number;
  max_flavors: number;
}

interface PizzaFlavor {
  name: string;
  price_modifier: number;
}

interface PriceTier {
  quantity: number;
  price_per_unit: number;
}

interface ProductFormIntelligentProps {
  establishmentId: string;
  categories: Category[];
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ProductFormIntelligent = ({
  establishmentId,
  categories,
  initialData,
  onSuccess,
  onCancel,
}: ProductFormIntelligentProps) => {
  const [productType, setProductType] = useState<ProductType>(initialData?.product_type || 'single');
  const [imageUrl, setImageUrl] = useState<string>(initialData?.image_url || '');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Pizza settings
  const [pizzaSizes, setPizzaSizes] = useState<PizzaSize[]>(
    initialData?.variations?.sizes || [
      { name: 'Pequena', price: 35.90, max_flavors: 1 },
      { name: 'Média', price: 49.90, max_flavors: 2 },
      { name: 'Grande', price: 69.90, max_flavors: 3 },
    ]
  );
  const [pizzaFlavors, setPizzaFlavors] = useState<PizzaFlavor[]>(
    initialData?.variations?.flavors || []
  );

  // Temperature settings
  const [temperatureOptions, setTemperatureOptions] = useState<TemperatureOption[]>(
    initialData?.temperature_options || []
  );

  // Progressive pricing
  const [progressiveTiers, setProgressiveTiers] = useState<PriceTier[]>(
    initialData?.progressive_pricing?.tiers || []
  );

  // Storage type
  const [storageType, setStorageType] = useState<string>(initialData?.storage_type || 'ambient');

  // Age verification
  const [requiresAgeVerification, setRequiresAgeVerification] = useState(
    initialData?.requires_age_verification || false
  );

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      price: initialData?.price || 0,
      promotional_price: initialData?.promotional_price || undefined,
      category_id: initialData?.category_id || '',
      is_active: initialData?.is_active ?? true,
      is_featured: initialData?.is_featured ?? false,
      preparation_time: initialData?.preparation_time || undefined,
      stock_quantity: initialData?.stock_quantity || undefined,
    },
  });

  const handleAIAssist = async () => {
    const name = form.getValues('name');
    if (!name) {
      toast.error('Digite o nome do produto primeiro');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-product-assistant', {
        body: { 
          action: 'suggest',
          productName: name,
          productType,
          categories: categories.map(c => c.name),
        },
      });

      if (error) throw error;

      if (data.description) {
        form.setValue('description', data.description);
      }
      if (data.category && categories.find(c => c.name === data.category)) {
        const cat = categories.find(c => c.name === data.category);
        if (cat) form.setValue('category_id', cat.id);
      }
      if (data.price) {
        form.setValue('price', data.price);
      }

      toast.success('Sugestões aplicadas!');
    } catch (error) {
      console.error('AI assist error:', error);
      toast.error('Erro ao gerar sugestões');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const addPizzaSize = () => {
    setPizzaSizes([...pizzaSizes, { name: '', price: 0, max_flavors: 1 }]);
  };

  const removePizzaSize = (index: number) => {
    setPizzaSizes(pizzaSizes.filter((_, i) => i !== index));
  };

  const updatePizzaSize = (index: number, field: keyof PizzaSize, value: any) => {
    const updated = [...pizzaSizes];
    updated[index] = { ...updated[index], [field]: value };
    setPizzaSizes(updated);
  };

  const addPizzaFlavor = () => {
    setPizzaFlavors([...pizzaFlavors, { name: '', price_modifier: 0 }]);
  };

  const removePizzaFlavor = (index: number) => {
    setPizzaFlavors(pizzaFlavors.filter((_, i) => i !== index));
  };

  const updatePizzaFlavor = (index: number, field: keyof PizzaFlavor, value: any) => {
    const updated = [...pizzaFlavors];
    updated[index] = { ...updated[index], [field]: value };
    setPizzaFlavors(updated);
  };

  const addPriceTier = () => {
    const lastQty = progressiveTiers.length > 0 
      ? progressiveTiers[progressiveTiers.length - 1].quantity 
      : 0;
    setProgressiveTiers([...progressiveTiers, { quantity: lastQty + 1, price_per_unit: form.getValues('price') || 0 }]);
  };

  const removePriceTier = (index: number) => {
    setProgressiveTiers(progressiveTiers.filter((_, i) => i !== index));
  };

  const updatePriceTier = (index: number, field: keyof PriceTier, value: number) => {
    const updated = [...progressiveTiers];
    updated[index] = { ...updated[index], [field]: value };
    setProgressiveTiers(updated);
  };

  const toggleTemperature = (temp: TemperatureOption) => {
    if (temperatureOptions.includes(temp)) {
      setTemperatureOptions(temperatureOptions.filter(t => t !== temp));
    } else {
      setTemperatureOptions([...temperatureOptions, temp]);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSaving(true);
    try {
      const productData: any = {
        ...data,
        establishment_id: establishmentId,
        image_url: imageUrl || null,
        product_type: productType,
        requires_age_verification: requiresAgeVerification,
        storage_type: storageType,
        temperature_options: temperatureOptions.length > 0 ? temperatureOptions : null,
        progressive_pricing: progressiveTiers.length > 0 ? { tiers: progressiveTiers } : null,
        allows_multiple_flavors: productType === 'pizza',
        max_flavors: productType === 'pizza' ? Math.max(...pizzaSizes.map(s => s.max_flavors)) : 1,
        variations: productType === 'pizza' ? { sizes: pizzaSizes, flavors: pizzaFlavors } : null,
      };

      if (initialData?.id) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', initialData.id);
        if (error) throw error;
        toast.success('Produto atualizado!');
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);
        if (error) throw error;
        toast.success('Produto criado!');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Erro ao salvar produto');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="type">Tipo & Variações</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            {/* Imagem */}
            <div className="space-y-2">
              <Label>Imagem do Produto</Label>
              <ImageUpload
                bucket="products"
                currentImage={imageUrl}
                onUpload={setImageUrl}
                onRemove={() => setImageUrl('')}
                establishmentId={establishmentId}
              />
            </div>

            {/* Nome com assistente IA */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="Ex: Pizza Calabresa" {...field} />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleAIAssist}
                      disabled={isGeneratingAI}
                    >
                      {isGeneratingAI ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o produto..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preço e Categoria */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="promotional_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Promocional (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="Opcional"
                        {...field}
                        value={field.value || ''}
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="type" className="space-y-4 mt-4">
            {/* Seletor de Tipo */}
            <div className="space-y-2">
              <Label>Tipo de Produto</Label>
              <ProductTypeSelector value={productType} onChange={setProductType} />
            </div>

            {/* Configurações específicas por tipo */}
            {productType === 'pizza' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configuração de Pizza</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tamanhos */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Tamanhos</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addPizzaSize}>
                        <Plus className="w-4 h-4 mr-1" /> Adicionar
                      </Button>
                    </div>
                    {pizzaSizes.map((size, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          placeholder="Nome (ex: Grande)"
                          value={size.name}
                          onChange={(e) => updatePizzaSize(index, 'name', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Preço"
                          value={size.price}
                          onChange={(e) => updatePizzaSize(index, 'price', parseFloat(e.target.value))}
                          className="w-24"
                        />
                        <Input
                          type="number"
                          placeholder="Sabores"
                          value={size.max_flavors}
                          onChange={(e) => updatePizzaSize(index, 'max_flavors', parseInt(e.target.value))}
                          className="w-20"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePizzaSize(index)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Sabores */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Sabores Disponíveis</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addPizzaFlavor}>
                        <Plus className="w-4 h-4 mr-1" /> Adicionar
                      </Button>
                    </div>
                    {pizzaFlavors.map((flavor, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          placeholder="Nome do sabor"
                          value={flavor.name}
                          onChange={(e) => updatePizzaFlavor(index, 'name', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Adicional"
                          value={flavor.price_modifier}
                          onChange={(e) => updatePizzaFlavor(index, 'price_modifier', parseFloat(e.target.value))}
                          className="w-24"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePizzaFlavor(index)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {productType === 'drink' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configuração de Bebida</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Opções de Temperatura</Label>
                    <div className="flex flex-wrap gap-2">
                      {(['gelada', 'ambiente'] as TemperatureOption[]).map((temp) => (
                        <Button
                          key={temp}
                          type="button"
                          variant={temperatureOptions.includes(temp) ? "default" : "outline"}
                          onClick={() => toggleTemperature(temp)}
                        >
                          {temp === 'gelada' ? '❄️ Gelada' : '🌡️ Ambiente'}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={requiresAgeVerification}
                      onCheckedChange={setRequiresAgeVerification}
                    />
                    <Label>Requer verificação de idade (bebida alcoólica)</Label>
                  </div>
                </CardContent>
              </Card>
            )}

            {(productType === 'frozen' || productType === 'fresh') && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tipo de Armazenamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Opções de Temperatura do Produto</Label>
                    <div className="flex flex-wrap gap-2">
                      {(['congelada', 'in_natura', 'gelada', 'ambiente'] as TemperatureOption[]).map((temp) => (
                        <Button
                          key={temp}
                          type="button"
                          variant={temperatureOptions.includes(temp) ? "default" : "outline"}
                          onClick={() => toggleTemperature(temp)}
                        >
                          {temp === 'congelada' && '🧊 Congelado'}
                          {temp === 'in_natura' && '🌿 In Natura'}
                          {temp === 'gelada' && '❄️ Refrigerado'}
                          {temp === 'ambiente' && '🌡️ Ambiente'}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Select value={storageType} onValueChange={setStorageType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de armazenamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="frozen">Congelado</SelectItem>
                      <SelectItem value="refrigerated">Refrigerado</SelectItem>
                      <SelectItem value="ambient">Ambiente</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {productType === 'combo' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preço Progressivo (Leve + Pague -)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Faixas de Desconto</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addPriceTier}>
                        <Plus className="w-4 h-4 mr-1" /> Adicionar
                      </Button>
                    </div>
                    {progressiveTiers.map((tier, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          type="number"
                          placeholder="Qtd"
                          value={tier.quantity}
                          onChange={(e) => updatePriceTier(index, 'quantity', parseInt(e.target.value))}
                          className="w-20"
                        />
                        <span className="text-muted-foreground">unidades por</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Preço/un"
                          value={tier.price_per_unit}
                          onChange={(e) => updatePriceTier(index, 'price_per_unit', parseFloat(e.target.value))}
                          className="w-28"
                        />
                        <span className="text-muted-foreground">/un</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePriceTier(index)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="preparation_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempo de Preparo (min)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="Ex: 30"
                        {...field}
                        value={field.value || ''}
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="Ex: 100"
                        {...field}
                        value={field.value || ''}
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center gap-6">
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Ativo</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_featured"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Destaque</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {initialData ? 'Atualizar' : 'Criar'} Produto
          </Button>
        </div>
      </form>
    </Form>
  );
};
