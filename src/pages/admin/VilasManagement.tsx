import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, MapPin, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import AdminLayout from "@/components/admin/AdminLayout";

interface Vila {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  address: string | null;
  neighborhood: string | null;
  is_active: boolean;
  created_at: string;
}

const VilasManagement = () => {
  const [vilas, setVilas] = useState<Vila[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingVila, setEditingVila] = useState<Vila | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [isActive, setIsActive] = useState(true);

  const fetchVilas = async () => {
    const { data, error } = await supabase
      .from("vilas")
      .select("*")
      .order("name");

    if (!error && data) {
      setVilas(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVilas();
  }, []);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setImageUrl("");
    setAddress("");
    setNeighborhood("");
    setIsActive(true);
    setEditingVila(null);
  };

  const openEditDialog = (vila: Vila) => {
    setEditingVila(vila);
    setName(vila.name);
    setSlug(vila.slug);
    setDescription(vila.description || "");
    setImageUrl(vila.image_url || "");
    setAddress(vila.address || "");
    setNeighborhood(vila.neighborhood || "");
    setIsActive(vila.is_active);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name || !slug) {
      toast.error("Nome e slug são obrigatórios");
      return;
    }

    const vilaData = {
      name,
      slug,
      description: description || null,
      image_url: imageUrl || null,
      address: address || null,
      neighborhood: neighborhood || null,
      is_active: isActive,
    };

    if (editingVila) {
      const { error } = await supabase
        .from("vilas")
        .update(vilaData)
        .eq("id", editingVila.id);

      if (error) {
        toast.error("Erro ao atualizar vila");
        return;
      }
      toast.success("Vila atualizada com sucesso");
    } else {
      const { error } = await supabase.from("vilas").insert(vilaData);

      if (error) {
        if (error.code === "23505") {
          toast.error("Já existe uma vila com este slug");
        } else {
          toast.error("Erro ao criar vila");
        }
        return;
      }
      toast.success("Vila criada com sucesso");
    }

    setDialogOpen(false);
    resetForm();
    fetchVilas();
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    const { error } = await supabase.from("vilas").delete().eq("id", deletingId);

    if (error) {
      toast.error("Erro ao excluir vila");
      return;
    }

    toast.success("Vila excluída com sucesso");
    setDeleteDialogOpen(false);
    setDeletingId(null);
    fetchVilas();
  };

  const filteredVilas = vilas.filter((vila) =>
    vila.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="Vilas" icon={MapPin} breadcrumb="Vilas">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar vilas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Vila
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVila ? "Editar Vila" : "Nova Vila"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Imagem</Label>
                <ImageUpload
                  currentImage={imageUrl}
                  onUpload={setImageUrl}
                  bucket="establishments"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingVila) {
                      setSlug(generateSlug(e.target.value));
                    }
                  }}
                  placeholder="Vila Pescador Caboco"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(generateSlug(e.target.value))}
                  placeholder="vila-pescador-caboco"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva a vila..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Av. Principal, 123"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Centro"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is-active">Ativa</Label>
                <Switch
                  id="is-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              <Button onClick={handleSave} className="w-full">
                {editingVila ? "Salvar Alterações" : "Criar Vila"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="secondary" className="text-sm">
          {filteredVilas.length} Vilas
        </Badge>
      </div>

      {/* Vilas Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : filteredVilas.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma vila encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVilas.map((vila) => (
            <Card key={vila.id} className="overflow-hidden">
              <div className="relative h-32 bg-gradient-to-br from-primary/20 to-accent/20">
                {vila.image_url ? (
                  <img
                    src={vila.image_url}
                    alt={vila.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPin className="w-10 h-10 text-primary/30" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={vila.is_active ? "default" : "secondary"}>
                    {vila.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-1">{vila.name}</h3>
                {vila.neighborhood && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                    <MapPin className="w-3 h-3" />
                    {vila.neighborhood}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    /{vila.slug}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(vila)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeletingId(vila.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir vila?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Estabelecimentos vinculados a esta vila serão desvinculados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default VilasManagement;
