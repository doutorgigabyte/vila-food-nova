import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Tv, Image as ImageIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserEstablishment } from "@/hooks/useDashboardData";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PublicDisplayManager } from "@/components/dashboard/PublicDisplayManager";
import { TEMPLATE_OPTIONS } from "@/components/dashboard/TemplatePreviewSelector";
import { PlaylistSettings } from "@/components/dashboard/vilatok-tv/PlaylistSettings";
import { TVSlideCard } from "@/components/dashboard/vilatok-tv/TVSlideCard";
import { TVSlideForm } from "@/components/dashboard/vilatok-tv/TVSlideForm";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

interface TVSlide {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  product_id: string | null;
  template_type: string;
  sort_order: number;
  is_active: boolean;
  badge_text?: string | null;
  media_type?: string;
  duration_seconds?: number;
  product?: {
    id: string;
    name: string;
    price: number;
    promotional_price: number | null;
  } | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  promotional_price: number | null;
  image_url: string | null;
}

export default function TVSlideManagement() {
  const { establishmentId, establishment, loading: estLoading } = useUserEstablishment();
  const [slides, setSlides] = useState<TVSlide[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<TVSlide | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    product_id: '',
    template_type: 'product_showcase',
    badge_text: '',
    media_type: 'image' as 'image' | 'video',
    duration_seconds: 10
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (establishmentId) {
      fetchSlides();
      fetchProducts();
    }
  }, [establishmentId]);

  const fetchSlides = async () => {
    try {
      const { data, error } = await (supabase
        .from("tv_slides" as any)
        .select("*, product:products(id, name, price, promotional_price)")
        .eq("establishment_id", establishmentId)
        .order("sort_order", { ascending: true }) as any);
      if (error) throw error;
      setSlides((data || []) as TVSlide[]);
    } catch (error) {
      toast.error("Erro ao carregar slides");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, description, price, promotional_price, image_url")
      .eq("establishment_id", establishmentId!)
      .eq("is_active", true)
      .order("name");
    setProducts(data || []);
  };

  const handleSubmit = async () => {
    if (!formData.image_url) {
      toast.error("Adicione uma imagem ou vídeo");
      return;
    }
    try {
      const slideData = {
        establishment_id: establishmentId,
        title: formData.title || null,
        subtitle: formData.subtitle || null,
        image_url: formData.image_url,
        product_id: formData.product_id || null,
        template_type: formData.template_type,
        badge_text: formData.badge_text || null,
        media_type: formData.media_type,
        duration_seconds: formData.duration_seconds,
        sort_order: editingSlide ? editingSlide.sort_order : slides.length
      };
      
      if (editingSlide) {
        await (supabase.from("tv_slides" as any).update(slideData).eq("id", editingSlide.id) as any);
        toast.success("Slide atualizado!");
      } else {
        await (supabase.from("tv_slides" as any).insert(slideData) as any);
        toast.success("Slide criado!");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchSlides();
    } catch (error) {
      toast.error("Erro ao salvar slide");
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      image_url: '',
      product_id: '',
      template_type: 'product_showcase',
      badge_text: '',
      media_type: 'image',
      duration_seconds: 10
    });
    setEditingSlide(null);
  };

  const openEditDialog = (slide: TVSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      image_url: slide.image_url,
      product_id: slide.product_id || '',
      template_type: slide.template_type,
      badge_text: slide.badge_text || '',
      media_type: (slide.media_type as 'image' | 'video') || 'image',
      duration_seconds: slide.duration_seconds || 10
    });
    setIsDialogOpen(true);
  };

  const toggleSlideActive = async (slide: TVSlide) => {
    await (supabase.from("tv_slides" as any).update({ is_active: !slide.is_active }).eq("id", slide.id) as any);
    toast.success(slide.is_active ? "Slide desativado" : "Slide ativado");
    fetchSlides();
  };

  const deleteSlide = async (id: string) => {
    await (supabase.from("tv_slides" as any).delete().eq("id", id) as any);
    toast.success("Slide removido!");
    fetchSlides();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = slides.findIndex((s) => s.id === active.id);
      const newIndex = slides.findIndex((s) => s.id === over.id);
      
      const newSlides = arrayMove(slides, oldIndex, newIndex);
      setSlides(newSlides);
      
      // Update sort_order in database
      try {
        const updates = newSlides.map((slide, index) => ({
          id: slide.id,
          sort_order: index
        }));
        
        for (const update of updates) {
          await (supabase
            .from("tv_slides" as any)
            .update({ sort_order: update.sort_order })
            .eq("id", update.id) as any);
        }
        toast.success("Ordem atualizada!");
      } catch (error) {
        toast.error("Erro ao atualizar ordem");
        fetchSlides(); // Revert on error
      }
    }
  };

  const getTemplateName = (value: string) => {
    return TEMPLATE_OPTIONS.find(t => t.value === value)?.label || value;
  };

  const getPublicDisplayUrl = () => {
    // This would be fetched from public_display_tokens table
    return `/display/tv/${establishmentId}`;
  };

  if (estLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout title="VilaTok TV" establishment={establishment}>
      <div className="space-y-6">
        {/* Public Display Manager */}
        {establishmentId && <PublicDisplayManager establishmentId={establishmentId} />}
        
        {/* Playlist Settings */}
        {establishmentId && <PlaylistSettings establishmentId={establishmentId} />}
        
        {/* Slides Grid */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Tv className="w-5 h-5" />
              Slides para TV
              {slides.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({slides.filter(s => s.is_active).length} ativos)
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={getPublicDisplayUrl()} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Testar Visualização
                </a>
              </Button>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Slide
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
              </div>
            ) : slides.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum slide criado</h3>
                <p className="text-muted-foreground mb-4">
                  Crie slides para exibir em TVs do seu estabelecimento.
                  <br />
                  <span className="text-sm">Arraste para reordenar • Upload de fotos e vídeos • Templates variados</span>
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Slide
                </Button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={slides.map(s => s.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {slides.map((slide, index) => (
                      <TVSlideCard
                        key={slide.id}
                        slide={slide}
                        index={index}
                        getTemplateName={getTemplateName}
                        onToggleActive={toggleSlideActive}
                        onEdit={openEditDialog}
                        onDelete={deleteSlide}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingSlide ? 'Editar Slide' : 'Novo Slide'}</DialogTitle>
          </DialogHeader>
          {establishmentId && (
            <TVSlideForm
              formData={formData}
              setFormData={setFormData}
              products={products}
              establishmentId={establishmentId}
              onSubmit={handleSubmit}
              isEditing={!!editingSlide}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}