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
  Users
} from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

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
  neighborhood: string | null;
  city_id: string | null;
  zip_code: string | null;
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
  });
  
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [operatingHours, setOperatingHours] = useState<Record<string, { open: string; close: string; enabled: boolean }>>({
    monday: { open: "08:00", close: "22:00", enabled: true },
    tuesday: { open: "08:00", close: "22:00", enabled: true },
    wednesday: { open: "08:00", close: "22:00", enabled: true },
    thursday: { open: "08:00", close: "22:00", enabled: true },
    friday: { open: "08:00", close: "22:00", enabled: true },
    saturday: { open: "08:00", close: "22:00", enabled: true },
    sunday: { open: "08:00", close: "22:00", enabled: false },
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
      });
      setLogoUrl(data.logo_url);
      setBannerUrl(data.banner_url);
      if (data.operating_hours) {
        setOperatingHours(data.operating_hours as any);
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
          address: formData.address,
          neighborhood: formData.neighborhood,
          zip_code: formData.zip_code,
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
      <div className="min-h-screen bg-background flex">
        <DashboardSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          establishment={null}
        />
        <main className="flex-1 lg:ml-64 p-6">
          <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-[600px] w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        establishment={establishment}
      />
      
      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configurações
                </h1>
                <p className="text-sm text-muted-foreground">
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
            <TabsList className="flex-wrap h-auto p-1">
              <TabsTrigger value="profile" className="gap-2">
                <Store className="w-4 h-4" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="hours" className="gap-2">
                <Clock className="w-4 h-4" />
                Horários
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-2">
                <CreditCard className="w-4 h-4" />
                Pagamentos
              </TabsTrigger>
              <TabsTrigger value="delivery" className="gap-2">
                <Truck className="w-4 h-4" />
                Delivery
              </TabsTrigger>
              <TabsTrigger value="appearance" className="gap-2">
                <Palette className="w-4 h-4" />
                Aparência
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="w-4 h-4" />
                Notificações
              </TabsTrigger>
              <TabsTrigger value="drivers" className="gap-2">
                <Users className="w-4 h-4" />
                Entregadores
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
                    <CardDescription>Localização do estabelecimento</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="neighborhood">Bairro</Label>
                        <Input
                          id="neighborhood"
                          value={formData.neighborhood}
                          onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip_code">CEP</Label>
                        <Input
                          id="zip_code"
                          value={formData.zip_code}
                          onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                        />
                      </div>
                    </div>
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
                  <CardDescription>Configure os horários de abertura e fechamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(operatingHours).map(([day, hours]) => (
                      <div key={day} className="flex items-center gap-4 p-3 rounded-lg border">
                        <Switch
                          checked={hours.enabled}
                          onCheckedChange={(checked) => 
                            setOperatingHours({
                              ...operatingHours,
                              [day]: { ...hours, enabled: checked }
                            })
                          }
                        />
                        <span className="w-32 font-medium">{dayNames[day]}</span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={hours.open}
                            onChange={(e) =>
                              setOperatingHours({
                                ...operatingHours,
                                [day]: { ...hours, open: e.target.value }
                              })
                            }
                            disabled={!hours.enabled}
                            className="w-32"
                          />
                          <span className="text-muted-foreground">às</span>
                          <Input
                            type="time"
                            value={hours.close}
                            onChange={(e) =>
                              setOperatingHours({
                                ...operatingHours,
                                [day]: { ...hours, close: e.target.value }
                              })
                            }
                            disabled={!hours.enabled}
                            className="w-32"
                          />
                        </div>
                        {!hours.enabled && (
                          <Badge variant="secondary">Fechado</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments">
              <MercadoPagoOAuth 
                establishmentId={establishment?.id || ''} 
                onConnected={fetchEstablishment}
              />
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

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notificações</CardTitle>
                  <CardDescription>Configure alertas e sons</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Som de Novo Pedido</p>
                      <p className="text-sm text-muted-foreground">Tocar som quando receber novo pedido</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Notificação por WhatsApp</p>
                      <p className="text-sm text-muted-foreground">Receber alertas no WhatsApp</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                      <strong>Nota:</strong> Todas as notificações são internas (dentro da plataforma) ou via WhatsApp. 
                      E-mail é usado apenas para validação de conta.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Drivers Tab */}
            <TabsContent value="drivers">
              <DeliveryConfigTab establishmentId={establishment?.id || null} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default EstablishmentSettings;
