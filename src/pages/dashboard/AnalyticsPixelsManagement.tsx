import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { LineChart, Save, ExternalLink, Facebook, BarChart3, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEstablishment } from "@/hooks/useEstablishment";
import { useEstablishmentPlan } from "@/hooks/useEstablishmentPlan";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface PixelConfig {
  id?: string;
  facebook_pixel_id: string | null;
  google_analytics_id: string | null;
  google_ads_id: string | null;
  tiktok_pixel_id: string | null;
  is_active: boolean;
}

const AnalyticsPixelsManagement = () => {
  const { slug } = useParams();
  const { establishment } = useEstablishment(slug);
  const { hasFeature } = useEstablishmentPlan(establishment?.id);
  const hasAnalyticsAccess = hasFeature('analytics_pixels');
  
  const [config, setConfig] = useState<PixelConfig>({
    facebook_pixel_id: null,
    google_analytics_id: null,
    google_ads_id: null,
    tiktok_pixel_id: null,
    is_active: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: establishment } = await supabase
        .from("establishments")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!establishment) return;
      setEstablishmentId(establishment.id);

      const { data } = await supabase
        .from("analytics_pixels")
        .select("*")
        .eq("establishment_id", establishment.id)
        .maybeSingle();

      if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!establishmentId) return;
    setSaving(true);

    try {
      const payload = {
        establishment_id: establishmentId,
        facebook_pixel_id: config.facebook_pixel_id || null,
        google_analytics_id: config.google_analytics_id || null,
        google_ads_id: config.google_ads_id || null,
        tiktok_pixel_id: config.tiktok_pixel_id || null,
        is_active: config.is_active
      };

      if (config.id) {
        await supabase
          .from("analytics_pixels")
          .update(payload)
          .eq("id", config.id);
      } else {
        await supabase
          .from("analytics_pixels")
          .insert(payload);
      }

      toast.success("Configurações salvas!");
      fetchConfig();
    } catch (error) {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const configuredCount = [
    config.facebook_pixel_id,
    config.google_analytics_id,
    config.google_ads_id,
    config.tiktok_pixel_id
  ].filter(Boolean).length;

  // Plan restriction - show upgrade prompt if no access
  if (!hasAnalyticsAccess) {
    return (
      <DashboardLayout title="Pixels Analytics" establishment={establishment}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="max-w-lg text-center border-amber-500/30 bg-amber-500/5">
            <CardContent className="py-12">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Lock className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Pixels de Analytics - Recurso Premium</h2>
              <p className="text-muted-foreground mb-6">
                Rastreie conversões com Facebook Pixel, Google Analytics, Google Ads e TikTok Pixel.
                Este recurso está disponível apenas em planos avançados.
              </p>
              <Button className="gap-2">
                <Sparkles className="w-4 h-4" />
                Fazer Upgrade do Plano
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Pixels Analytics" establishment={establishment}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Status Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <LineChart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Rastreamento de Conversões</h3>
                  <p className="text-sm text-muted-foreground">
                    {configuredCount} plataforma(s) configurada(s)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={config.is_active ? "default" : "secondary"}>
                  {config.is_active ? "Ativo" : "Inativo"}
                </Badge>
                <Switch
                  checked={config.is_active}
                  onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Facebook Pixel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Facebook className="w-5 h-5 text-blue-600" />
              Facebook Pixel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Pixel ID</Label>
              <Input
                value={config.facebook_pixel_id || ""}
                onChange={(e) => setConfig({ ...config, facebook_pixel_id: e.target.value || null })}
                placeholder="Ex: 123456789012345"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Rastreia eventos como visualização de página, adição ao carrinho e compras
              </p>
            </div>
            <a
              href="https://business.facebook.com/events_manager"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Criar/encontrar Pixel ID <ExternalLink className="w-3 h-3" />
            </a>
          </CardContent>
        </Card>

        {/* Google Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5 text-orange-500" />
              Google Analytics 4
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Measurement ID</Label>
              <Input
                value={config.google_analytics_id || ""}
                onChange={(e) => setConfig({ ...config, google_analytics_id: e.target.value || null })}
                placeholder="Ex: G-XXXXXXXXXX"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Análise detalhada de tráfego, comportamento e conversões
              </p>
            </div>
            <a
              href="https://analytics.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Acessar Google Analytics <ExternalLink className="w-3 h-3" />
            </a>
          </CardContent>
        </Card>

        {/* Google Ads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 2L22 19H3L12.5 2Z" fill="#FBBC04"/>
                <circle cx="6" cy="19" r="4" fill="#4285F4"/>
                <circle cx="18" cy="19" r="4" fill="#34A853"/>
              </svg>
              Google Ads
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Conversion ID</Label>
              <Input
                value={config.google_ads_id || ""}
                onChange={(e) => setConfig({ ...config, google_ads_id: e.target.value || null })}
                placeholder="Ex: AW-123456789"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Rastreia conversões de campanhas do Google Ads
              </p>
            </div>
            <a
              href="https://ads.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Acessar Google Ads <ExternalLink className="w-3 h-3" />
            </a>
          </CardContent>
        </Card>

        {/* TikTok Pixel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
              </svg>
              TikTok Pixel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Pixel ID</Label>
              <Input
                value={config.tiktok_pixel_id || ""}
                onChange={(e) => setConfig({ ...config, tiktok_pixel_id: e.target.value || null })}
                placeholder="Ex: C1234567890123456789"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Rastreia conversões de campanhas do TikTok Ads
              </p>
            </div>
            <a
              href="https://ads.tiktok.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Acessar TikTok Ads <ExternalLink className="w-3 h-3" />
            </a>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button onClick={saveConfig} disabled={saving} className="w-full" size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Eventos rastreados automaticamente:</strong> Visualização de página, Visualização de produto, 
              Adição ao carrinho, Início do checkout, Compra finalizada, Pesquisa
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPixelsManagement;
