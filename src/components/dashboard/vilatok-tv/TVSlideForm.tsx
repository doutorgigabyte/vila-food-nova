import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Image as ImageIcon, ShoppingBag, Video, Clock } from "lucide-react";
import { TemplatePreviewSelector, TEMPLATE_OPTIONS } from "@/components/dashboard/TemplatePreviewSelector";
import { uploadToS3, uploadVideoToS3, validateFile, validateVideoFile } from "@/lib/s3";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  promotional_price: number | null;
  image_url: string | null;
}

interface FormData {
  title: string;
  subtitle: string;
  image_url: string;
  product_id: string;
  template_type: string;
  badge_text: string;
  media_type: 'image' | 'video';
  duration_seconds: number;
}

interface TVSlideFormProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  products: Product[];
  establishmentId: string;
  onSubmit: () => void;
  isEditing: boolean;
}

const DURATION_OPTIONS = [
  { value: 5, label: '5 segundos' },
  { value: 8, label: '8 segundos' },
  { value: 10, label: '10 segundos (padrão)' },
  { value: 15, label: '15 segundos' },
  { value: 20, label: '20 segundos' },
  { value: 30, label: '30 segundos' },
];

export function TVSlideForm({ 
  formData, 
  setFormData, 
  products, 
  establishmentId,
  onSubmit, 
  isEditing 
}: TVSlideFormProps) {
  const [uploading, setUploading] = useState(false);
  const [creationMode, setCreationMode] = useState<'custom' | 'product'>('custom');

  // Auto-fill when product is selected
  const handleProductSelect = (productId: string) => {
    if (productId === 'none') {
      setFormData({ ...formData, product_id: '' });
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product) {
      setFormData({
        ...formData,
        product_id: productId,
        title: product.name,
        subtitle: product.description || '',
        image_url: product.image_url || formData.image_url,
        media_type: 'image'
      });
      toast.success("Dados do produto preenchidos automaticamente!");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideoFile = file.type.startsWith('video/');
    
    if (isVideoFile) {
      const validation = validateVideoFile(file, { maxSize: 100 * 1024 * 1024 }); // 100MB
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
    } else {
      const validation = validateFile(file, { maxSize: 10 * 1024 * 1024 }); // 10MB
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
    }

    setUploading(true);
    try {
      const result = isVideoFile 
        ? await uploadVideoToS3(file, establishmentId)
        : await uploadToS3(file, 'products', establishmentId);
      
      if (result.url) {
        setFormData({
          ...formData,
          image_url: result.url,
          media_type: isVideoFile ? 'video' : 'image'
        });
        toast.success(`${isVideoFile ? 'Vídeo' : 'Imagem'} enviado com sucesso!`);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollArea className="max-h-[calc(90vh-100px)] pr-4">
      <div className="space-y-6 pt-4">
        {/* Creation Mode Tabs */}
        <Tabs value={creationMode} onValueChange={(v) => setCreationMode(v as 'custom' | 'product')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Personalizado
            </TabsTrigger>
            <TabsTrigger value="product" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Produto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="product" className="space-y-4 mt-4">
            <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
              <Label className="text-sm font-medium">Selecione um Produto</Label>
              <p className="text-xs text-muted-foreground mb-3">
                O sistema preencherá automaticamente com foto, nome e descrição do produto
              </p>
              <Select
                value={formData.product_id || "none"}
                onValueChange={handleProductSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um produto..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum selecionado</SelectItem>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        {p.image_url && (
                          <img src={p.image_url} className="w-6 h-6 rounded object-cover" alt="" />
                        )}
                        {p.name} - R$ {(p.promotional_price || p.price).toFixed(2)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 mt-4">
            {/* Media Upload */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Upload de Mídia</Label>
              <div className="flex gap-2">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*,video/mp4,video/webm"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors ${uploading ? 'opacity-50' : ''}`}>
                    <Upload className="w-5 h-5" />
                    <span className="text-sm">
                      {uploading ? 'Enviando...' : 'Clique para enviar foto ou vídeo'}
                    </span>
                  </div>
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Formatos: JPG, PNG, WebP (até 10MB) ou MP4, WebM (até 100MB)
              </p>
            </div>

            {/* URL Manual */}
            <div className="space-y-2">
              <Label className="text-sm">Ou cole a URL da mídia</Label>
              <Input
                placeholder="https://..."
                value={formData.image_url}
                onChange={(e) => {
                  const url = e.target.value;
                  const isVideo = url.match(/\.(mp4|webm|mov)$/i);
                  setFormData({ 
                    ...formData, 
                    image_url: url,
                    media_type: isVideo ? 'video' : 'image'
                  });
                }}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Media Preview */}
        {formData.image_url && (
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border">
            {formData.media_type === 'video' ? (
              <video
                src={formData.image_url}
                className="w-full h-full object-cover"
                controls
                muted
              />
            ) : (
              <img
                src={formData.image_url}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            )}
            {formData.media_type === 'video' && (
              <div className="absolute top-2 left-2">
                <span className="flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground rounded text-xs">
                  <Video className="w-3 h-3" />
                  Vídeo
                </span>
              </div>
            )}
          </div>
        )}

        {/* Template Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Escolha o Template</Label>
          <TemplatePreviewSelector
            templates={TEMPLATE_OPTIONS}
            value={formData.template_type}
            onValueChange={(v) => setFormData({ ...formData, template_type: v })}
          />
          <p className="text-xs text-muted-foreground">
            {TEMPLATE_OPTIONS.find(t => t.value === formData.template_type)?.description}
          </p>
        </div>

        {/* Title & Subtitle */}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              placeholder="Ex: Promoção do Dia"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Subtítulo</Label>
            <Input
              placeholder="Ex: Sabor irresistível..."
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            />
          </div>
        </div>

        {/* Badge Text */}
        {['promo', 'diamond', 'diagonal', 'catering'].includes(formData.template_type) && (
          <div className="space-y-2">
            <Label>Texto do Badge (opcional)</Label>
            <Input
              placeholder="Ex: 30% OFF, Menu Especial, Novidade"
              value={formData.badge_text}
              onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
            />
          </div>
        )}

        {/* Duration */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Duração do Slide
          </Label>
          <Select
            value={formData.duration_seconds.toString()}
            onValueChange={(v) => setFormData({ ...formData, duration_seconds: parseInt(v) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value.toString()}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Para vídeos, o slide avança quando o vídeo termina
          </p>
        </div>

        {/* Product Link (for custom mode) */}
        {creationMode === 'custom' && (
          <div className="space-y-2">
            <Label>Vincular Produto (opcional)</Label>
            <Select
              value={formData.product_id || "none"}
              onValueChange={(v) => setFormData({ ...formData, product_id: v === "none" ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} - R$ {(p.promotional_price || p.price).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button onClick={onSubmit} className="w-full" disabled={!formData.image_url}>
          {isEditing ? 'Salvar Alterações' : 'Criar Slide'}
        </Button>
      </div>
    </ScrollArea>
  );
}