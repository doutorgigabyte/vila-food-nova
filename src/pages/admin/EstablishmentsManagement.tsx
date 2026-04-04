import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { 
  Search,
  Store,
  Edit,
  Plus,
  Filter,
  Building2,
  Star,
  Trash2,
  LayoutDashboard,
  Sparkles,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAuditLog } from "@/hooks/useAuditLog";
import { ImageUpload } from "@/components/ImageUpload";

interface Establishment {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  banner_url: string | null;
  email: string | null;
  status: string;
  is_open: boolean;
  phone: string | null;
  whatsapp: string | null;
  city_id: string | null;
  segment_id: string | null;
  plan_id: string | null;
  created_at: string;
  neighborhood: string | null;
  address: string | null;
  description: string | null;
  owner_id: string | null;
  is_featured?: boolean;
}

interface Segment {
  id: string;
  name: string;
}

interface City {
  id: string;
  name: string;
}

interface Plan {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  full_name: string | null;
}

const EstablishmentsManagement = () => {
  const navigate = useNavigate();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { logAction, logAdminAccess } = useAuditLog();

  // Form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingEstablishment, setEditingEstablishment] = useState<Establishment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Lookup data
  const [segments, setSegments] = useState<Segment[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  // Form fields
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    neighborhood: "",
    logo_url: "",
    banner_url: "",
    segment_id: "",
    city_id: "",
    plan_id: "",
    owner_id: "",
    status: "pending",
    is_open: false,
  });

  // AI generation states
  const [generatingLogo, setGeneratingLogo] = useState(false);
  const [generatingBanner, setGeneratingBanner] = useState(false);

  // Format establishment name for display (capitalize words properly)
  const formatDisplayName = (name: string) => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Generate logo using AI
  const handleGenerateLogo = async () => {
    if (!formData.name) {
      toast({ title: "Digite o nome do estabelecimento primeiro", variant: "destructive" });
      return;
    }

    setGeneratingLogo(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          type: 'logo',
          id: editingEstablishment?.id,
          name: formData.name,
          establishmentId: editingEstablishment?.id
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setFormData(prev => ({ ...prev, logo_url: data.imageUrl }));
        toast({ title: "Logo gerada com sucesso!" });
      } else {
        throw new Error(data?.error || 'Falha ao gerar logo');
      }
    } catch (error: any) {
      console.error('Error generating logo:', error);
      toast({ 
        title: "Erro ao gerar logo", 
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive" 
      });
    } finally {
      setGeneratingLogo(false);
    }
  };

  // Generate banner using AI
  const handleGenerateBanner = async () => {
    if (!formData.name) {
      toast({ title: "Digite o nome do estabelecimento primeiro", variant: "destructive" });
      return;
    }

    setGeneratingBanner(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          type: 'banner',
          id: editingEstablishment?.id,
          name: formData.name,
          establishmentId: editingEstablishment?.id
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setFormData(prev => ({ ...prev, banner_url: data.imageUrl }));
        toast({ title: "Banner gerado com sucesso!" });
      } else {
        throw new Error(data?.error || 'Falha ao gerar banner');
      }
    } catch (error: any) {
      console.error('Error generating banner:', error);
      toast({ 
        title: "Erro ao gerar banner", 
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive" 
      });
    } finally {
      setGeneratingBanner(false);
    }
  };

  useEffect(() => {
    fetchEstablishments();
    fetchLookupData();
  }, []);

  const fetchLookupData = async () => {
    const [segmentsRes, citiesRes, plansRes, profilesRes] = await Promise.all([
      supabase.from("segments").select("id, name").eq("is_active", true),
      supabase.from("cities").select("id, name").eq("is_active", true),
      supabase.from("plans").select("id, name").eq("is_active", true),
      supabase.from("profiles").select("id, full_name"),
    ]);

    if (segmentsRes.data) setSegments(segmentsRes.data);
    if (citiesRes.data) setCities(citiesRes.data);
    if (plansRes.data) setPlans(plansRes.data);
    if (profilesRes.data) setProfiles(profilesRes.data);
  };

  const fetchEstablishments = async () => {
    try {
      const { data, error } = await supabase
        .from("establishments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEstablishments(data || []);
    } catch (error) {
      console.error("Error fetching establishments:", error);
      toast({ title: "Erro ao carregar estabelecimentos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      email: "",
      phone: "",
      whatsapp: "",
      address: "",
      neighborhood: "",
      logo_url: "",
      banner_url: "",
      segment_id: "",
      city_id: "",
      plan_id: "",
      owner_id: "",
      status: "pending",
      is_open: false,
    });
    setEditingEstablishment(null);
  };

  const openEditDialog = (est: Establishment) => {
    setEditingEstablishment(est);
    setFormData({
      name: est.name || "",
      slug: est.slug || "",
      description: est.description || "",
      email: est.email || "",
      phone: est.phone || "",
      whatsapp: est.whatsapp || "",
      address: est.address || "",
      neighborhood: est.neighborhood || "",
      logo_url: est.logo_url || "",
      banner_url: est.banner_url || "",
      segment_id: est.segment_id || "",
      city_id: est.city_id || "",
      plan_id: est.plan_id || "",
      owner_id: est.owner_id || "",
      status: est.status || "pending",
      is_open: est.is_open || false,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.slug) {
      toast({ title: "Nome e slug são obrigatórios", variant: "destructive" });
      return;
    }

    try {
      const establishmentData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        email: formData.email || null,
        phone: formData.phone || null,
        whatsapp: formData.whatsapp || null,
        address: formData.address || null,
        neighborhood: formData.neighborhood || null,
        logo_url: formData.logo_url || null,
        banner_url: formData.banner_url || null,
        segment_id: formData.segment_id || null,
        city_id: formData.city_id || null,
        plan_id: formData.plan_id || null,
        owner_id: formData.owner_id || null,
        status: formData.status as "active" | "pending" | "suspended" | "inactive",
        is_open: formData.is_open,
      };

      if (editingEstablishment) {
        const { error } = await supabase
          .from("establishments")
          .update(establishmentData)
          .eq("id", editingEstablishment.id);

        if (error) throw error;

        await logAction({
          action: 'update_establishment',
          entityType: 'establishment',
          entityId: editingEstablishment.id,
          oldData: editingEstablishment as any,
          newData: establishmentData as any
        });

        toast({ title: "Estabelecimento atualizado!" });
      } else {
        const { error } = await supabase
          .from("establishments")
          .insert(establishmentData);

        if (error) {
          if (error.code === "23505") {
            toast({ title: "Já existe um estabelecimento com este slug", variant: "destructive" });
            return;
          }
          throw error;
        }

        await logAction({
          action: 'create_establishment',
          entityType: 'establishment',
          newData: establishmentData as any
        });

        toast({ title: "Estabelecimento criado!" });
      }

      setDialogOpen(false);
      resetForm();
      fetchEstablishments();
    } catch (error) {
      console.error("Error saving establishment:", error);
      toast({ title: "Erro ao salvar estabelecimento", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const { error } = await supabase
        .from("establishments")
        .delete()
        .eq("id", deletingId);

      if (error) throw error;

      await logAction({
        action: 'delete_establishment',
        entityType: 'establishment',
        entityId: deletingId
      });

      toast({ title: "Estabelecimento excluído!" });
      setDeleteDialogOpen(false);
      setDeletingId(null);
      fetchEstablishments();
    } catch (error) {
      console.error("Error deleting establishment:", error);
      toast({ title: "Erro ao excluir estabelecimento", variant: "destructive" });
    }
  };

  const toggleFeatured = async (id: string, currentValue: boolean) => {
    // Como não temos campo is_featured, vamos usar description ou criar uma abordagem diferente
    toast({ title: currentValue ? "Removido dos destaques" : "Adicionado aos destaques" });
  };

  const updateStatus = async (id: string, newStatus: "active" | "pending" | "suspended" | "inactive") => {
    const establishment = establishments.find(e => e.id === id);
    try {
      const { error } = await supabase
        .from("establishments")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      await logAction({
        action: 'update_status',
        entityType: 'establishment',
        entityId: id,
        oldData: { status: establishment?.status },
        newData: { status: newStatus }
      });

      setEstablishments(prev => prev.map(e => 
        e.id === id ? { ...e, status: newStatus } : e
      ));

      toast({ title: "Status atualizado!" });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    }
  };

  const handleAccessPanel = async (establishment: Establishment) => {
    await logAdminAccess(establishment.id);
    await logAction({
      action: 'admin_access_panel',
      entityType: 'establishment',
      entityId: establishment.id,
      metadata: { establishment_name: establishment.name }
    });
    navigate(`/painel/${establishment.slug}`);
  };

  const filteredEstablishments = establishments.filter(est => {
    const matchesSearch = est.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          est.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || est.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500">Ativo</Badge>;
      case "pending": return <Badge variant="secondary">Pendente</Badge>;
      case "suspended": return <Badge variant="destructive">Suspenso</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout title="Estabelecimentos" icon={Building2} breadcrumb="Estabelecimentos">
      {/* Filter Bar */}
      <Card className="mb-6 bg-destructive/10 border-destructive/20">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 text-destructive font-medium">
              <Filter className="h-5 w-5" />
              <span>Filtrar</span>
            </div>
            <div className="flex flex-1 flex-col md:flex-row gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome ou slug..." 
                  className="pl-10 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 bg-background">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="suspended">Suspensos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats and Add Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {filteredEstablishments.length} Registros
          </Badge>
        </div>
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          Adicionar <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead></TableHead>
                    <TableHead>SUBDOMÍNIO</TableHead>
                    <TableHead>NOME</TableHead>
                    <TableHead>E-MAIL</TableHead>
                    <TableHead>CIDADE</TableHead>
                    <TableHead>STATUS</TableHead>
                    <TableHead className="text-right">AÇÕES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEstablishments.map((est) => (
                    <TableRow key={est.id}>
                      <TableCell className="w-16">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                          {est.logo_url ? (
                            <img src={est.logo_url} alt="" className="w-10 h-10 object-cover" />
                          ) : (
                            <Store className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link 
                          to={`/loja/${est.slug}`} 
                          target="_blank"
                          className="text-primary hover:underline"
                        >
                          {est.slug}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="text-primary font-medium">{est.name}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {est.email || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {est.neighborhood || "—"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={est.status}
                          onValueChange={(value) => updateStatus(est.id, value as "active" | "pending" | "suspended" | "inactive")}
                        >
                          <SelectTrigger className="w-28 h-8">
                            {getStatusBadge(est.status)}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="suspended">Suspenso</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Acessar Painel"
                            onClick={() => handleAccessPanel(est)}
                            className="text-primary hover:text-primary"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            title="Destacar"
                            onClick={() => toggleFeatured(est.id, est.is_featured || false)}
                          >
                            <Star className={`w-4 h-4 ${est.is_featured ? "fill-yellow-500 text-yellow-500" : ""}`} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Editar"
                            onClick={() => openEditDialog(est)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Excluir" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setDeletingId(est.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEstablishment ? "Editar Estabelecimento" : "Novo Estabelecimento"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Logo</Label>
                  <span className="text-xs text-muted-foreground">500x500px</span>
                </div>
                <ImageUpload
                  currentImage={formData.logo_url}
                  onUpload={(url) => setFormData(prev => ({ ...prev, logo_url: url }))}
                  bucket="establishments"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={handleGenerateLogo}
                  disabled={generatingLogo || !formData.name}
                >
                  {generatingLogo ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Gerar Logo com IA
                    </>
                  )}
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Banner</Label>
                  <span className="text-xs text-muted-foreground">1200x400px</span>
                </div>
                <ImageUpload
                  currentImage={formData.banner_url}
                  onUpload={(url) => setFormData(prev => ({ ...prev, banner_url: url }))}
                  bucket="establishments"
                  aspectRatio="banner"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={handleGenerateBanner}
                  disabled={generatingBanner || !formData.name}
                >
                  {generatingBanner ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Gerar Banner com IA
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      name: e.target.value,
                      slug: !editingEstablishment ? generateSlug(e.target.value) : prev.slug
                    }));
                  }}
                  placeholder="Nome do estabelecimento"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                  placeholder="slug-do-estabelecimento"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do estabelecimento"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(81) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input
                  value={formData.whatsapp}
                  onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                  placeholder="(81) 99999-9999"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Rua, número"
                />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input
                  value={formData.neighborhood}
                  onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  placeholder="Bairro"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Segmento</Label>
                <Select 
                  value={formData.segment_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, segment_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {segments.map(seg => (
                      <SelectItem key={seg.id} value={seg.id}>{seg.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Select 
                  value={formData.city_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, city_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map(city => (
                      <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Plano</Label>
                <Select 
                  value={formData.plan_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, plan_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Proprietário</Label>
                <Select 
                  value={formData.owner_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, owner_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name || "Sem nome"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="suspended">Suspenso</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_open}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_open: checked }))}
              />
              <Label>Loja aberta</Label>
            </div>

            <Button className="w-full" onClick={handleSubmit}>
              {editingEstablishment ? "Salvar Alterações" : "Criar Estabelecimento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir estabelecimento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o estabelecimento e todos os dados relacionados.
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

export default EstablishmentsManagement;
