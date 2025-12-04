import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Plus, Edit, Trash2, Image, Loader2, GripVertical } from "lucide-react";

interface Banner {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

const BannersManagement = () => {
  const { user } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    image_url: "",
    link_url: "",
    is_active: true,
  });

  useEffect(() => {
    if (user) fetchEstablishment();
  }, [user]);

  useEffect(() => {
    if (establishmentId) fetchBanners();
  }, [establishmentId]);

  const fetchEstablishment = async () => {
    const { data } = await supabase
      .from("establishments")
      .select("id")
      .eq("owner_id", user?.id)
      .maybeSingle();
    if (data) setEstablishmentId(data.id);
  };

  const fetchBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .eq("establishment_id", establishmentId)
      .order("sort_order");

    if (error) toast.error("Erro ao carregar banners");
    else setBanners(data || []);
    setLoading(false);
  };

  const handleOpenDialog = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setForm({
        title: banner.title || "",
        image_url: banner.image_url,
        link_url: banner.link_url || "",
        is_active: banner.is_active ?? true,
      });
    } else {
      setEditingBanner(null);
      setForm({ title: "", image_url: "", link_url: "", is_active: true });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.image_url) {
      toast.error("Imagem é obrigatória");
      return;
    }

    setSaving(true);
    const bannerData = {
      title: form.title || null,
      image_url: form.image_url,
      link_url: form.link_url || null,
      is_active: form.is_active,
      establishment_id: establishmentId,
      sort_order: editingBanner?.sort_order ?? banners.length,
    };

    try {
      if (editingBanner) {
        const { error } = await supabase
          .from("banners")
          .update(bannerData)
          .eq("id", editingBanner.id);
        if (error) throw error;
        toast.success("Banner atualizado!");
      } else {
        const { error } = await supabase.from("banners").insert(bannerData);
        if (error) throw error;
        toast.success("Banner criado!");
      }
      setIsDialogOpen(false);
      fetchBanners();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar banner");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (banner: Banner) => {
    if (!confirm("Deseja excluir este banner?")) return;
    const { error } = await supabase.from("banners").delete().eq("id", banner.id);
    if (error) toast.error("Erro ao excluir banner");
    else {
      toast.success("Banner excluído!");
      fetchBanners();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/painel">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Banners</h1>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Banner
          </Button>
        </div>
      </header>

      <div className="p-4 md:p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : banners.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum banner cadastrado</p>
              <Button className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar primeiro banner
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {banners.map((banner) => (
              <Card key={banner.id}>
                <CardContent className="p-4 flex gap-4 items-center">
                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                  <img
                    src={banner.image_url}
                    alt={banner.title || "Banner"}
                    className="w-32 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{banner.title || "Sem título"}</h3>
                    {banner.link_url && (
                      <p className="text-sm text-muted-foreground truncate">{banner.link_url}</p>
                    )}
                    <span className={`text-xs ${banner.is_active ? "text-green-500" : "text-red-500"}`}>
                      {banner.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(banner)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(banner)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBanner ? "Editar Banner" : "Novo Banner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <ImageUpload
              bucket="establishments"
              currentImage={form.image_url}
              onUpload={(url) => setForm({ ...form, image_url: url })}
              onRemove={() => setForm({ ...form, image_url: "" })}
              aspectRatio="banner"
            />
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Promoção de Verão"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link_url">Link (opcional)</Label>
              <Input
                id="link_url"
                value={form.link_url}
                onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingBanner ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BannersManagement;
