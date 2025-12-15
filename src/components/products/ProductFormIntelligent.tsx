import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Loader2, Sparkles, Upload, Clock, MapPin, Link, ThermometerSnowflake, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductTypeSelector, ProductType, getProductCategory } from "./ProductTypeSelector";
import { TemperatureOption } from "./TemperatureSelector";
import { ProductAdditionalsManager, ProductAdditional } from "./ProductAdditionalsManager";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "@/components/ImageUpload";
import { CurrencyInput } from "@/components/ui/currency-input";
import { CategorySuggestionModal } from "./CategorySuggestionModal";
import { useSegments, Segment } from "@/hooks/useSegments";

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
  const { segments, loading: loadingSegments } = useSegments();
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  
  // Sync local categories when prop changes
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const [productType, setProductType] = useState<ProductType>(initialData?.product_type || 'single');
  const [imageUrl, setImageUrl] = useState<string>(initialData?.image_url || '');
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

  // Service specific
  const [serviceDuration, setServiceDuration] = useState<number>(initialData?.service_duration || 60);
  const [serviceLocation, setServiceLocation] = useState<string>(initialData?.service_location || 'store');
  const [requiresBooking, setRequiresBooking] = useState(initialData?.requires_booking || false);
  const [bookingAdvanceDays, setBookingAdvanceDays] = useState<number>(initialData?.booking_advance_days || 1);

  // Digital specific
  const [digitalDeliveryUrl, setDigitalDeliveryUrl] = useState<string>(initialData?.digital_delivery_url || '');
  const [digitalInstructions, setDigitalInstructions] = useState<string>(initialData?.digital_instructions || '');

  // Perishable specific
  const [expirationDays, setExpirationDays] = useState<number>(initialData?.expiration_days || 7);
  const [requiresRefrigeration, setRequiresRefrigeration] = useState(initialData?.requires_refrigeration || false);
  const [storageTemperature, setStorageTemperature] = useState<string>(initialData?.storage_temperature || '');

  // Product Additionals (Extras, Bordas, Acompanhamentos)
  const [additionals, setAdditionals] = useState<ProductAdditional[]>(
    initialData?.additionals || []
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
      const productCategory = getProductCategory(productType);
      
      const productData: any = {
        ...data,
        establishment_id: establishmentId,
        image_url: imageUrl || null,
        product_type: productType,
        product_category: productCategory,
        requires_age_verification: requiresAgeVerification,
        storage_type: storageType,
        temperature_options: temperatureOptions.length > 0 ? temperatureOptions : null,
        progressive_pricing: progressiveTiers.length > 0 ? { tiers: progressiveTiers } : null,
        allows_multiple_flavors: productType === 'pizza',
        max_flavors: productType === 'pizza' ? Math.max(...pizzaSizes.map(s => s.max_flavors)) : 1,
        variations: productType === 'pizza' ? { sizes: pizzaSizes, flavors: pizzaFlavors } : null,
        // Service fields
        service_duration: productType === 'service' ? serviceDuration : null,
        service_location: productType === 'service' ? serviceLocation : null,
        requires_booking: productType === 'service' ? requiresBooking : false,
        booking_advance_days: productType === 'service' && requiresBooking ? bookingAdvanceDays : null,
        // Digital fields
        digital_delivery_url: productType === 'digital' ? digitalDeliveryUrl || null : null,
        digital_instructions: productType === 'digital' ? digitalInstructions || null : null,
        // Perishable fields
        expiration_days: productType === 'perishable' ? expirationDays : null,
        requires_refrigeration: productType === 'perishable' ? requiresRefrigeration : false,
        storage_temperature: productType === 'perishable' ? storageTemperature || null : null,
        // Additionals (extras, bordas, etc.)
        additionals: additionals.length > 0 ? additionals : null,
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

            {/* Nome */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Pizza Calabresa" {...field} />
                  </FormControl>
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

            {/* Preço e Preço Promocional */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="0,00"
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
                      <CurrencyInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="0,00"
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
                  <div className="flex gap-2">
                    <Select 
                      onValueChange={async (value) => {
                        // Check if this is a segment (system category) that needs to be imported
                        const segment = segments.find(s => s.id === value);
                        if (segment) {
                          // Check if already exists in local categories
                          const existingLocal = localCategories.find(c => c.name === segment.name);
                          if (existingLocal) {
                            field.onChange(existingLocal.id);
                          } else {
                            // Import segment as local category
                            try {
                              const { data: newCategory, error } = await supabase
                                .from('categories')
                                .insert({
                                  establishment_id: establishmentId,
                                  name: segment.name,
                                  is_active: true,
                                })
                                .select()
                                .single();
                              
                              if (error) throw error;
                              
                              setLocalCategories(prev => [...prev, { id: newCategory.id, name: newCategory.name }]);
                              field.onChange(newCategory.id);
                              toast.success(`Categoria "${segment.name}" importada!`);
                            } catch (error: any) {
                              console.error('Error importing category:', error);
                              toast.error('Erro ao importar categoria');
                            }
                          }
                        } else {
                          // It's already a local category
                          field.onChange(value);
                        }
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder={loadingSegments ? "Carregando..." : "Selecione uma categoria"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* Show system categories (segments) */}
                        {segments.map((segment) => {
                          // Check if this segment already exists locally
                          const localMatch = localCategories.find(c => c.name === segment.name);
                          return (
                            <SelectItem 
                              key={segment.id} 
                              value={localMatch ? localMatch.id : segment.id}
                            >
                              {segment.name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <CategorySuggestionModal
                      establishmentId={establishmentId}
                      onCategoryCreated={(categoryId, categoryName) => {
                        setLocalCategories(prev => [...prev, { id: categoryId, name: categoryName || '' }]);
                        field.onChange(categoryId);
                      }}
                    />
                  </div>
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

            {/* Service Configuration */}
            {productType === 'service' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Configuração de Serviço
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duração (minutos)</Label>
                      <Input
                        type="number"
                        value={serviceDuration}
                        onChange={(e) => setServiceDuration(parseInt(e.target.value) || 60)}
                        placeholder="60"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Local de Atendimento</Label>
                      <Select value={serviceLocation} onValueChange={setServiceLocation}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="store">No estabelecimento</SelectItem>
                          <SelectItem value="customer_location">No cliente</SelectItem>
                          <SelectItem value="remote">Remoto/Online</SelectItem>
                          <SelectItem value="hybrid">Híbrido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={requiresBooking}
                        onCheckedChange={setRequiresBooking}
                      />
                      <Label>Requer agendamento</Label>
                    </div>
                  </div>

                  {requiresBooking && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Antecedência mínima (dias)
                      </Label>
                      <Input
                        type="number"
                        value={bookingAdvanceDays}
                        onChange={(e) => setBookingAdvanceDays(parseInt(e.target.value) || 1)}
                        min={1}
                        placeholder="1"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Digital Product Configuration */}
            {productType === 'digital' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Link className="w-5 h-5" />
                    Configuração de Produto Digital
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>URL de Entrega / Download</Label>
                    <Input
                      value={digitalDeliveryUrl}
                      onChange={(e) => setDigitalDeliveryUrl(e.target.value)}
                      placeholder="https://exemplo.com/download/produto"
                    />
                    <p className="text-xs text-muted-foreground">
                      Link enviado ao cliente após a compra
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Instruções de Acesso</Label>
                    <Textarea
                      value={digitalInstructions}
                      onChange={(e) => setDigitalInstructions(e.target.value)}
                      placeholder="Instruções que serão exibidas ao cliente..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Perishable Product Configuration */}
            {productType === 'perishable' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ThermometerSnowflake className="w-5 h-5" />
                    Configuração de Produto Perecível
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Validade (dias)</Label>
                      <Input
                        type="number"
                        value={expirationDays}
                        onChange={(e) => setExpirationDays(parseInt(e.target.value) || 7)}
                        placeholder="7"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Temperatura de Armazenamento</Label>
                      <Input
                        value={storageTemperature}
                        onChange={(e) => setStorageTemperature(e.target.value)}
                        placeholder="0°C a 5°C"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={requiresRefrigeration}
                      onCheckedChange={setRequiresRefrigeration}
                    />
                    <Label>Requer refrigeração</Label>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Product Additionals - Available for all product types */}
            <ProductAdditionalsManager
              additionals={additionals}
              onChange={setAdditionals}
            />
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
