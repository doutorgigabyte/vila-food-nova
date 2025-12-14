import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { DeliveryConfigTab } from "@/components/dashboard/DeliveryConfigTab";
import { MercadoPagoOAuth } from "@/components/payment/MercadoPagoOAuth";
import { SmartAddressInput, AddressData } from "@/components/address";
import { 
  Menu, 
  Store, 
  Clock, 
  CreditCard, 
  Truck, 
  Bell, 
  Settings,
  Save,
  Palette,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Share2,
  Bot,
  Instagram,
  Globe
} from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { NotificationSoundSelector } from "@/components/settings/NotificationSoundSelector";
import { WhatsAppNotificationsConfig } from "@/components/settings/WhatsAppNotificationsConfig";
import { AssociatedDriversList } from "@/components/settings/AssociatedDriversList";
import { OperatingHoursEditor } from "@/components/settings/OperatingHoursEditor";

// Component to show available platform gateways
const AvailableGatewaysCard = () => {
  const [gateways, setGateways] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGateways = async () => {
      try {
        const { data, error } = await supabase
          .from("platform_settings")
          .select("setting_key, setting_value")
          .like("setting_key", "gateway_%");

        if (error) throw error;

        const gatewayMap: Record<string, boolean> = {};
        data?.forEach(item => {
          gatewayMap[item.setting_key] = item.setting_value === 'true' || item.setting_value === true;
        });
        setGateways(gatewayMap);
      } catch (error) {
        console.error("Error fetching gateways:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGateways();
  }, []);

  const gatewayInfo = [
    { key: "gateway_mercadopago_enabled", name: "Mercado Pago", description: "PIX, cartão de crédito/débito" },
    { key: "gateway_pagseguro_enabled", name: "PagSeguro", description: "PIX, cartão de crédito/débito" },
    { key: "gateway_pix_static_enabled", name: "PIX Estático", description: "QR Code fixo da loja" },
    { key: "gateway_cash_enabled", name: "Dinheiro", description: "Pagamento em espécie" },
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando gateways...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gateways Disponíveis na Plataforma</CardTitle>
        <CardDescription>
          Métodos de pagamento habilitados pelo administrador da plataforma
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {gatewayInfo.map(gateway => {
            const isEnabled = gateways[gateway.key] ?? false;
            return (
              <div 
                key={gateway.key}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isEnabled ? "bg-green-500/10 border-green-500/30" : "bg-muted/50 border-muted"
                }`}
              >
                {isEnabled ? (
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <div className="min-w-0">
                  <p className={`font-medium text-sm ${!isEnabled && "text-muted-foreground"}`}>
                    {gateway.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {gateway.description}
                  </p>
                </div>
                <Badge 
                  variant={isEnabled ? "default" : "secondary"} 
                  className="ml-auto shrink-0 text-xs"
                >
                  {isEnabled ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Para habilitar novos gateways, entre em contato com o administrador da plataforma.
        </p>
      </CardContent>
    </Card>
  );
};

interface Establishment {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  address_number: string | null;
  neighborhood: string | null;
  city_id: string | null;
  zip_code: string | null;
  latitude: number | null;
  longitude: number | null;
  primary_color: string | null;
  secondary_color: string | null;
  min_order_value: number | null;
  avg_delivery_time: number | null;
  delivery_base_fee: number | null;
  delivery_fee_per_km: number | null;
  max_delivery_radius_km: number | null;
  accepts_delivery: boolean | null;
  accepts_pickup: boolean | null;
  accepts_table: boolean | null;
  is_open: boolean | null;
  operating_hours: any;
  pix_key: string | null;
  mercado_pago_token: string | null;
  mp_public_key: string | null;
}

const EstablishmentSettings = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    neighborhood: "",
    zip_code: "",
    primary_color: "#ea384c",
    secondary_color: "#fbbf24",
    min_order_value: 0,
    avg_delivery_time: 30,
    delivery_base_fee: 5,
    delivery_fee_per_km: 1,
    max_delivery_radius_km: 10,
    accepts_delivery: true,
    accepts_pickup: true,
    accepts_table: false,
    pix_key: "",
    mercado_pago_token: "",
    mp_public_key: "",
    // Social Media
    instagram: "",
    facebook: "",
    tiktok: "",
    twitter: "",
    youtube: "",
    website: "",
    // AI Agent
    ai_prompt: "",
    ai_enabled: false,
  });
  
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [addressData, setAddressData] = useState<AddressData>({
    cep: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    reference: "",
    lat: undefined,
    lng: undefined,
  });
  const [operatingHours, setOperatingHours] = useState<Record<string, { open: boolean; start: string; end: string }>>({
    monday: { open: true, start: "08:00", end: "22:00" },
    tuesday: { open: true, start: "08:00", end: "22:00" },
    wednesday: { open: true, start: "08:00", end: "22:00" },
    thursday: { open: true, start: "08:00", end: "22:00" },
    friday: { open: true, start: "08:00", end: "22:00" },
    saturday: { open: true, start: "08:00", end: "22:00" },
    sunday: { open: false, start: "08:00", end: "22:00" },
  });
  
  // Notification settings state
  const [notificationSound, setNotificationSound] = useState("new-order");
  const [notificationVolume, setNotificationVolume] = useState(80);
  const [whatsappNotificationsEnabled, setWhatsappNotificationsEnabled] = useState(false);
  const [whatsappNotifications, setWhatsappNotifications] = useState<Record<string, boolean>>({
    new_order: true,
    order_ready: true,
    payment_confirmed: true,
    delivery_assigned: false,
    delivery_completed: false,
    review_received: false,
    low_stock: false,
    scheduled_order: false,
  });

  useEffect(() => {
    if (slug) {
      fetchEstablishment();
    }
  }, [slug]);

  const fetchEstablishment = async () => {
    try {
      const { data, error } = await supabase
        .from("establishments")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;

      setEstablishment(data);
      setFormData({
        name: data.name || "",
        description: data.description || "",
        phone: data.phone || "",
        whatsapp: data.whatsapp || "",
        email: data.email || "",
        address: data.address || "",
        neighborhood: data.neighborhood || "",
        zip_code: data.zip_code || "",
        primary_color: data.primary_color || "#ea384c",
        secondary_color: data.secondary_color || "#fbbf24",
        min_order_value: data.min_order_value || 0,
        avg_delivery_time: data.avg_delivery_time || 30,
        delivery_base_fee: data.delivery_base_fee || 5,
        delivery_fee_per_km: data.delivery_fee_per_km || 1,
        max_delivery_radius_km: data.max_delivery_radius_km || 10,
        accepts_delivery: data.accepts_delivery ?? true,
        accepts_pickup: data.accepts_pickup ?? true,
        accepts_table: data.accepts_table ?? false,
        pix_key: data.pix_key || "",
        mercado_pago_token: data.mercado_pago_token || "",
        mp_public_key: data.mp_public_key || "",
        // Social Media (use optional chaining since columns may not exist yet)
        instagram: (data as any).instagram || "",
        facebook: (data as any).facebook || "",
        tiktok: (data as any).tiktok || "",
        twitter: (data as any).twitter || "",
        youtube: (data as any).youtube || "",
        website: (data as any).website || "",
        // AI Agent
        ai_prompt: (data as any).ai_prompt || "",
        ai_enabled: (data as any).ai_enabled ?? false,
      });
      setLogoUrl(data.logo_url);
      setBannerUrl(data.banner_url);
      setAddressData({
        cep: data.zip_code || "",
        address: data.address || "",
        number: data.address_number || "",
        complement: "",
        neighborhood: data.neighborhood || "",
        city: "",
        state: "",
        reference: "",
        lat: data.latitude ?? undefined,
        lng: data.longitude ?? undefined,
      });
      if (data.operating_hours) {
        // Normalizar dados antigos para o novo formato
        const normalizedHours: Record<string, { open: boolean; start: string; end: string }> = {};
        const rawHours = data.operating_hours as Record<string, any>;
        
        for (const [day, dayData] of Object.entries(rawHours)) {
          normalizedHours[day] = {
            open: dayData.enabled ?? dayData.open ?? false,
            start: dayData.start ?? (typeof dayData.open === 'string' ? dayData.open : "08:00"),
            end: dayData.end ?? dayData.close ?? "22:00"
          };
        }
        
        setOperatingHours(normalizedHours);
      }
    } catch (error) {
      console.error("Error fetching establishment:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!establishment) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("establishments")
        .update({
          name: formData.name,
          description: formData.description,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          email: formData.email,
          address: addressData.address,
          address_number: addressData.number,
          neighborhood: addressData.neighborhood,
          zip_code: addressData.cep,
          latitude: addressData.lat,
          longitude: addressData.lng,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          min_order_value: formData.min_order_value,
          avg_delivery_time: formData.avg_delivery_time,
          delivery_base_fee: formData.delivery_base_fee,
          delivery_fee_per_km: formData.delivery_fee_per_km,
          max_delivery_radius_km: formData.max_delivery_radius_km,
          accepts_delivery: formData.accepts_delivery,
          accepts_pickup: formData.accepts_pickup,
          accepts_table: formData.accepts_table,
          pix_key: formData.pix_key,
          mercado_pago_token: formData.mercado_pago_token,
          mp_public_key: formData.mp_public_key,
          logo_url: logoUrl,
          banner_url: bannerUrl,
          operating_hours: operatingHours,
          updated_at: new Date().toISOString(),
        })
        .eq("id", establishment.id);

      if (error) throw error;

      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const dayNames: Record<string, string> = {
    monday: "Segunda-feira",
    tuesday: "Terça-feira",
    wednesday: "Quarta-feira",
    thursday: "Quinta-feira",
    friday: "Sexta-feira",
    saturday: "Sábado",
    sunday: "Domingo",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex overflow-hidden">
        <DashboardSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          establishment={null}
        />
        <main className="flex-1 lg:ml-64 p-6 overflow-x-hidden">
          <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-[600px] w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        establishment={establishment}
      />
      
      <main className="flex-1 lg:ml-64 overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden shrink-0"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Settings className="w-5 h-5 shrink-0" />
                  <span className="truncate">Configurações</span>
                </h1>
                <p className="text-sm text-muted-foreground truncate">
                  Gerencie as configurações do seu estabelecimento
                </p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </header>

        <div className="p-6">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="flex flex-wrap h-auto gap-1 p-1 bg-muted/50">
              <TabsTrigger value="profile" className="gap-2 text-xs sm:text-sm">
                <Store className="w-4 h-4" />
                <span className="hidden sm:inline">Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="hours" className="gap-2 text-xs sm:text-sm">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">Horários</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-2 text-xs sm:text-sm">
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Pagamentos</span>
              </TabsTrigger>
              <TabsTrigger value="delivery" className="gap-2 text-xs sm:text-sm">
                <Truck className="w-4 h-4" />
                <span className="hidden sm:inline">Delivery</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="gap-2 text-xs sm:text-sm">
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">Aparência</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="gap-2 text-xs sm:text-sm">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Redes</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-2 text-xs sm:text-sm">
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">IA</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2 text-xs sm:text-sm">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Alertas</span>
              </TabsTrigger>
              <TabsTrigger value="drivers" className="gap-2 text-xs sm:text-sm">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Entrega</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações Básicas</CardTitle>
                    <CardDescription>Dados principais do estabelecimento</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Estabelecimento</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp">WhatsApp</Label>
                        <Input
                          id="whatsapp"
                          value={formData.whatsapp}
                          onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Endereço</CardTitle>
                    <CardDescription>Localização do estabelecimento com mapa interativo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SmartAddressInput
                      value={addressData}
                      onChange={setAddressData}
                      showMap={true}
                      showGpsButton={true}
                    />
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Imagens</CardTitle>
                    <CardDescription>Logo e banner do estabelecimento</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Logo</Label>
                      <ImageUpload
                        bucket="establishments"
                        currentImage={logoUrl}
                        onUpload={setLogoUrl}
                        establishmentId={establishment?.id}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Banner</Label>
                      <ImageUpload
                        bucket="establishments"
                        currentImage={bannerUrl}
                        onUpload={setBannerUrl}
                        aspectRatio="banner"
                        establishmentId={establishment?.id}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Hours Tab */}
            <TabsContent value="hours">
              <Card>
                <CardHeader>
                  <CardTitle>Horário de Funcionamento</CardTitle>
                  <CardDescription>
                    Configure os horários de abertura e fechamento. 
                    Você pode criar blocos de horário para vários dias de uma vez.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <OperatingHoursEditor
                    value={operatingHours}
                    onChange={setOperatingHours}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments">
              <div className="space-y-6">
                {/* Available Platform Gateways */}
                <AvailableGatewaysCard />
                
                {/* Mercado Pago OAuth */}
                <MercadoPagoOAuth 
                  establishmentId={establishment?.id || ''} 
                  onConnected={fetchEstablishment}
                />
              </div>
            </TabsContent>

            {/* Delivery Tab */}
            <TabsContent value="delivery">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Tipos de Atendimento</CardTitle>
                    <CardDescription>Escolha como deseja atender seus clientes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Delivery</p>
                        <p className="text-sm text-muted-foreground">Entrega em domicílio</p>
                      </div>
                      <Switch
                        checked={formData.accepts_delivery}
                        onCheckedChange={(checked) => setFormData({ ...formData, accepts_delivery: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Retirada</p>
                        <p className="text-sm text-muted-foreground">Cliente retira no local</p>
                      </div>
                      <Switch
                        checked={formData.accepts_pickup}
                        onCheckedChange={(checked) => setFormData({ ...formData, accepts_pickup: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Mesa</p>
                        <p className="text-sm text-muted-foreground">Atendimento em mesa</p>
                      </div>
                      <Switch
                        checked={formData.accepts_table}
                        onCheckedChange={(checked) => setFormData({ ...formData, accepts_table: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Taxas e Tempo</CardTitle>
                    <CardDescription>Configure valores de entrega</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="min_order">Pedido Mínimo (R$)</Label>
                        <Input
                          id="min_order"
                          type="number"
                          value={formData.min_order_value}
                          onChange={(e) => setFormData({ ...formData, min_order_value: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="avg_time">Tempo Médio (min)</Label>
                        <Input
                          id="avg_time"
                          type="number"
                          value={formData.avg_delivery_time}
                          onChange={(e) => setFormData({ ...formData, avg_delivery_time: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="base_fee">Taxa Base (R$)</Label>
                        <Input
                          id="base_fee"
                          type="number"
                          step="0.01"
                          value={formData.delivery_base_fee}
                          onChange={(e) => setFormData({ ...formData, delivery_base_fee: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fee_km">Taxa por KM (R$)</Label>
                        <Input
                          id="fee_km"
                          type="number"
                          step="0.01"
                          value={formData.delivery_fee_per_km}
                          onChange={(e) => setFormData({ ...formData, delivery_fee_per_km: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_radius">Raio Máximo (KM)</Label>
                      <Input
                        id="max_radius"
                        type="number"
                        value={formData.max_delivery_radius_km}
                        onChange={(e) => setFormData({ ...formData, max_delivery_radius_km: Number(e.target.value) })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Cores do Tema</CardTitle>
                  <CardDescription>Personalize as cores do seu cardápio digital</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="primary_color">Cor Primária</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primary_color"
                          type="color"
                          value={formData.primary_color}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={formData.primary_color}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondary_color">Cor Secundária</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondary_color"
                          type="color"
                          value={formData.secondary_color}
                          onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={formData.secondary_color}
                          onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Preview */}
                  <div className="mt-6 p-6 rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-4">Prévia do tema:</p>
                    <div className="flex gap-4">
                      <Button style={{ backgroundColor: formData.primary_color }}>
                        Botão Primário
                      </Button>
                      <Button style={{ backgroundColor: formData.secondary_color, color: "#000" }}>
                        Botão Secundário
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Social Media Tab */}
            <TabsContent value="social">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5" />
                    Redes Sociais
                  </CardTitle>
                  <CardDescription>Links das suas redes sociais (serão exibidos no cardápio e VilaTok TV)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="instagram" className="flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-pink-500" />
                        Instagram
                      </Label>
                      <Input
                        id="instagram"
                        placeholder="@seuinstagram"
                        value={formData.instagram}
                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="facebook" className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-600" />
                        Facebook
                      </Label>
                      <Input
                        id="facebook"
                        placeholder="facebook.com/suapagina"
                        value={formData.facebook}
                        onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tiktok">TikTok</Label>
                      <Input
                        id="tiktok"
                        placeholder="@seutiktok"
                        value={formData.tiktok}
                        onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youtube">YouTube</Label>
                      <Input
                        id="youtube"
                        placeholder="youtube.com/@seucanal"
                        value={formData.youtube}
                        onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitter">Twitter / X</Label>
                      <Input
                        id="twitter"
                        placeholder="@seutwitter"
                        value={formData.twitter}
                        onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website" className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Website
                      </Label>
                      <Input
                        id="website"
                        placeholder="https://seusite.com.br"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Agent Tab */}
            <TabsContent value="ai">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="w-5 h-5" />
                      Agente de IA
                    </CardTitle>
                    <CardDescription>Configure o comportamento do seu assistente virtual via WhatsApp</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Ativar Agente IA</p>
                        <p className="text-sm text-muted-foreground">Permitir que o bot responda automaticamente no WhatsApp</p>
                      </div>
                      <Switch
                        checked={formData.ai_enabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, ai_enabled: checked })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ai_prompt">Prompt do Sistema (Personalidade do Bot)</Label>
                      <Textarea
                        id="ai_prompt"
                        placeholder="Você é um atendente amigável de uma lanchonete. Responda de forma cordial e ajude o cliente a fazer pedidos..."
                        value={formData.ai_prompt}
                        onChange={(e) => setFormData({ ...formData, ai_prompt: e.target.value })}
                        rows={6}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Este texto define como o bot deve se comportar. Inclua instruções sobre tom de voz, produtos em destaque, e como lidar com dúvidas.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <div className="grid gap-6 md:grid-cols-2">
                <NotificationSoundSelector
                  selectedSound={notificationSound}
                  volume={notificationVolume}
                  onSoundChange={setNotificationSound}
                  onVolumeChange={setNotificationVolume}
                />
                <WhatsAppNotificationsConfig
                  enabled={whatsappNotificationsEnabled}
                  onEnabledChange={setWhatsappNotificationsEnabled}
                  notifications={whatsappNotifications}
                  onNotificationChange={(id, enabled) => 
                    setWhatsappNotifications(prev => ({ ...prev, [id]: enabled }))
                  }
                />
              </div>
              <div className="mt-6 p-4 border rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  <strong>Nota:</strong> Todas as notificações são internas (dentro da plataforma) ou via WhatsApp. 
                  E-mail é usado apenas para validação de conta.
                </p>
              </div>
            </TabsContent>

            {/* Drivers Tab */}
            <TabsContent value="drivers">
              <div className="space-y-6">
                <AssociatedDriversList establishmentId={establishment?.id || null} />
                <DeliveryConfigTab establishmentId={establishment?.id || null} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default EstablishmentSettings;
