import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Tv, Trash2, Image as ImageIcon, Eye, EyeOff, Settings } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserEstablishment } from "@/hooks/useDashboardData";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PublicDisplayManager } from "@/components/dashboard/PublicDisplayManager";

interface TVSlide { id: string; title: string | null; description: string | null; image_url: string; product_id: string | null; template_type: string; sort_order: number; duration_seconds: number; is_active: boolean; product?: { id: string; name: string; price: number; promotional_price: number | null; } | null; }
interface Product { id: string; name: string; price: number; promotional_price: number | null; }
const TEMPLATE_OPTIONS = [{ value: 'minimal', label: 'Minimalista', description: 'Foto em tela cheia + logo discreto' }, { value: 'product_showcase', label: 'Vitrine de Produto', description: 'Foto + nome + preço + QR Code' }, { value: 'promo', label: 'Promoção', description: 'Destaque promocional com preço' }, { value: 'full_image', label: 'Imagem Completa', description: 'Apenas a imagem sem moldura' }];

export default function TVSlideManagement() {
  const { establishmentId, establishment, loading: estLoading } = useUserEstablishment();
  const [slides, setSlides] = useState<TVSlide[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<TVSlide | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', image_url: '', product_id: '', template_type: 'minimal', duration_seconds: 8 });

  useEffect(() => { if (establishmentId) { fetchSlides(); fetchProducts(); } }, [establishmentId]);

  const fetchSlides = async () => {
    try {
      const { data, error } = await (supabase.from("tv_slides" as any).select("*, product:products(id, name, price, promotional_price)").eq("establishment_id", establishmentId).order("sort_order", { ascending: true }) as any);
      if (error) throw error;
      setSlides((data || []) as TVSlide[]);
    } catch (error) { toast.error("Erro ao carregar slides"); } finally { setLoading(false); }
  };

  const fetchProducts = async () => { const { data } = await supabase.from("products").select("id, name, price, promotional_price").eq("establishment_id", establishmentId!).eq("is_active", true).order("name"); setProducts(data || []); };

  const handleSubmit = async () => {
    if (!formData.image_url) { toast.error("Adicione uma imagem"); return; }
    try {
      const slideData = { establishment_id: establishmentId, title: formData.title || null, description: formData.description || null, image_url: formData.image_url, product_id: formData.product_id || null, template_type: formData.template_type, duration_seconds: formData.duration_seconds, sort_order: editingSlide ? editingSlide.sort_order : slides.length };
      if (editingSlide) { await (supabase.from("tv_slides" as any).update(slideData).eq("id", editingSlide.id) as any); toast.success("Slide atualizado!"); }
      else { await (supabase.from("tv_slides" as any).insert(slideData) as any); toast.success("Slide criado!"); }
      setIsDialogOpen(false); resetForm(); fetchSlides();
    } catch (error) { toast.error("Erro ao salvar slide"); }
  };

  const resetForm = () => { setFormData({ title: '', description: '', image_url: '', product_id: '', template_type: 'minimal', duration_seconds: 8 }); setEditingSlide(null); };
  const openEditDialog = (slide: TVSlide) => { setEditingSlide(slide); setFormData({ title: slide.title || '', description: slide.description || '', image_url: slide.image_url, product_id: slide.product_id || '', template_type: slide.template_type, duration_seconds: slide.duration_seconds }); setIsDialogOpen(true); };
  const toggleSlideActive = async (slide: TVSlide) => { await (supabase.from("tv_slides" as any).update({ is_active: !slide.is_active }).eq("id", slide.id) as any); toast.success(slide.is_active ? "Slide desativado" : "Slide ativado"); fetchSlides(); };
  const deleteSlide = async (id: string) => { await (supabase.from("tv_slides" as any).delete().eq("id", id) as any); toast.success("Slide removido!"); fetchSlides(); };

  if (estLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <DashboardLayout title="VilaTok TV" establishment={establishment}>
      <div className="space-y-6">
        {establishmentId && <PublicDisplayManager establishmentId={establishmentId} />}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><Tv className="w-5 h-5" />Slides para TV</CardTitle><Button onClick={() => { resetForm(); setIsDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" />Novo Slide</Button></CardHeader>
          <CardContent>
            {loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-48 w-full" />)}</div> : slides.length === 0 ? (
              <div className="text-center py-12"><ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-medium mb-2">Nenhum slide criado</h3><p className="text-muted-foreground mb-4">Crie slides para exibir em TVs</p><Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Criar Primeiro Slide</Button></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {slides.map((slide, index) => (
                  <Card key={slide.id} className={`overflow-hidden ${!slide.is_active ? 'opacity-50' : ''}`}>
                    <div className="relative aspect-video bg-muted"><img src={slide.image_url} alt={slide.title || 'Slide'} className="w-full h-full object-cover" /><div className="absolute top-2 left-2 flex gap-1"><Badge variant="secondary" className="text-xs">#{index + 1}</Badge><Badge variant="outline" className="text-xs">{TEMPLATE_OPTIONS.find(t => t.value === slide.template_type)?.label}</Badge></div>{slide.product && <Badge className="absolute bottom-2 left-2">{slide.product.name}</Badge>}</div>
                    <CardContent className="p-3"><div className="flex items-center justify-between"><div className="truncate"><p className="font-medium truncate">{slide.title || 'Sem título'}</p><p className="text-xs text-muted-foreground">{slide.duration_seconds}s</p></div><div className="flex items-center gap-1"><Button variant="ghost" size="icon" onClick={() => toggleSlideActive(slide)}>{slide.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</Button><Button variant="ghost" size="icon" onClick={() => openEditDialog(slide)}><Settings className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => deleteSlide(slide.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button></div></div></CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editingSlide ? 'Editar Slide' : 'Novo Slide'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2"><Label>URL da Imagem *</Label><Input placeholder="https://..." value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} />{formData.image_url && <div className="aspect-video bg-muted rounded-lg overflow-hidden"><img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" /></div>}</div>
            <div className="space-y-2"><Label>Título</Label><Input placeholder="Ex: Promoção do Dia" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea placeholder="Descrição breve..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} /></div>
            <div className="space-y-2"><Label>Template</Label><Select value={formData.template_type} onValueChange={(v) => setFormData({ ...formData, template_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TEMPLATE_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}><div><p className="font-medium">{t.label}</p><p className="text-xs text-muted-foreground">{t.description}</p></div></SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Vincular Produto</Label><Select value={formData.product_id} onValueChange={(v) => setFormData({ ...formData, product_id: v })}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="">Nenhum</SelectItem>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} - R$ {(p.promotional_price || p.price).toFixed(2)}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Duração (segundos)</Label><Input type="number" min={3} max={30} value={formData.duration_seconds} onChange={(e) => setFormData({ ...formData, duration_seconds: parseInt(e.target.value) || 8 })} /></div>
            <Button onClick={handleSubmit} className="w-full">{editingSlide ? 'Salvar' : 'Criar Slide'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}