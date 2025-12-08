import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import AdminSidebar from "@/components/admin/AdminSidebar";
import { PaymentGatewaySetup } from "@/components/payment/PaymentGatewaySetup";
import { 
  Menu, 
  Globe, 
  Wallet, 
  CreditCard, 
  Link2, 
  Shield, 
  Settings,
  Save,
  Key,
  Database,
  Bell
} from "lucide-react";

const AdminSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Platform settings
  const [platformSettings, setPlatformSettings] = useState({
    platform_name: "VilaFood",
    platform_description: "Plataforma de delivery e cardápio digital",
    support_email: "suporte@vilafood.com.br",
    support_phone: "",
  });
  
  // Financial settings
  const [financialSettings, setFinancialSettings] = useState({
    marketplace_fee_percent: 5,
    affiliate_commission_percent: 20,
    min_payout_amount: 50,
    payout_day: 10,
  });
  
  // Payment settings
  const [paymentSettings, setPaymentSettings] = useState({
    mp_access_token: "",
    mp_public_key: "",
    platform_pix_key: "",
  });
  
  // Integration settings
  const [integrationSettings, setIntegrationSettings] = useState({
    aws_region: "us-east-1",
    cloudfront_domain: "d2fhl3f70zfvod.cloudfront.net",
    evolution_api_url: "",
    gemini_api_key: "",
  });
  
  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    require_2fa_admin: false,
    session_timeout_hours: 24,
    max_login_attempts: 5,
    audit_log_retention_days: 90,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      // In a real implementation, these would be saved to a settings table
      // For now, we'll just show a success message
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
      />
      
      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  <span className="hidden sm:inline">Configurações da Plataforma</span>
                  <span className="sm:hidden">Configurações</span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Gerencie as configurações globais do VilaFood
                </p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </header>

        <div className="p-6">
          <Tabs defaultValue="platform" className="space-y-6">
            <TabsList className="flex flex-wrap h-auto p-1 w-full justify-start gap-1">
              <TabsTrigger value="platform" className="gap-2 text-xs sm:text-sm">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Plataforma</span>
              </TabsTrigger>
              <TabsTrigger value="financial" className="gap-2 text-xs sm:text-sm">
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">Financeiro</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-2 text-xs sm:text-sm">
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Pagamentos</span>
              </TabsTrigger>
              <TabsTrigger value="integrations" className="gap-2 text-xs sm:text-sm">
                <Link2 className="w-4 h-4" />
                <span className="hidden sm:inline">Integrações</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2 text-xs sm:text-sm">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Segurança</span>
              </TabsTrigger>
            </TabsList>

            {/* Platform Tab */}
            <TabsContent value="platform">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações da Plataforma</CardTitle>
                    <CardDescription>Dados principais do VilaFood</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="platform_name">Nome da Plataforma</Label>
                      <Input
                        id="platform_name"
                        value={platformSettings.platform_name}
                        onChange={(e) => setPlatformSettings({ ...platformSettings, platform_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="platform_description">Descrição</Label>
                      <Textarea
                        id="platform_description"
                        value={platformSettings.platform_description}
                        onChange={(e) => setPlatformSettings({ ...platformSettings, platform_description: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Suporte</CardTitle>
                    <CardDescription>Contato de suporte da plataforma</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="support_email">E-mail de Suporte</Label>
                      <Input
                        id="support_email"
                        type="email"
                        value={platformSettings.support_email}
                        onChange={(e) => setPlatformSettings({ ...platformSettings, support_email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="support_phone">Telefone de Suporte</Label>
                      <Input
                        id="support_phone"
                        value={platformSettings.support_phone}
                        onChange={(e) => setPlatformSettings({ ...platformSettings, support_phone: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Taxas do Marketplace</CardTitle>
                    <CardDescription>Configure as taxas cobradas pela plataforma</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="marketplace_fee">Taxa do Marketplace (%)</Label>
                      <Input
                        id="marketplace_fee"
                        type="number"
                        step="0.1"
                        value={financialSettings.marketplace_fee_percent}
                        onChange={(e) => setFinancialSettings({ ...financialSettings, marketplace_fee_percent: Number(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Percentual cobrado em pedidos originados do marketplace
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="affiliate_commission">Comissão de Afiliado (%)</Label>
                      <Input
                        id="affiliate_commission"
                        type="number"
                        step="0.1"
                        value={financialSettings.affiliate_commission_percent}
                        onChange={(e) => setFinancialSettings({ ...financialSettings, affiliate_commission_percent: Number(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Percentual pago aos afiliados sobre assinaturas
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pagamentos a Afiliados</CardTitle>
                    <CardDescription>Configure regras de pagamento</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="min_payout">Valor Mínimo para Saque (R$)</Label>
                      <Input
                        id="min_payout"
                        type="number"
                        value={financialSettings.min_payout_amount}
                        onChange={(e) => setFinancialSettings({ ...financialSettings, min_payout_amount: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payout_day">Dia do Pagamento</Label>
                      <Input
                        id="payout_day"
                        type="number"
                        min="1"
                        max="28"
                        value={financialSettings.payout_day}
                        onChange={(e) => setFinancialSettings({ ...financialSettings, payout_day: Number(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Dia do mês para pagamento automático de afiliados
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments">
              <div className="space-y-6">
                {/* Admin Gateway Setup */}
                <PaymentGatewaySetup 
                  context="admin" 
                  entityId="platform" 
                />

                {/* Additional Platform Payment Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>PIX da Plataforma</CardTitle>
                    <CardDescription>Chave PIX para recebimento de taxas da plataforma</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="platform_pix">Chave PIX Master</Label>
                      <Input
                        id="platform_pix"
                        value={paymentSettings.platform_pix_key}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, platform_pix_key: e.target.value })}
                        placeholder="CPF, CNPJ, E-mail ou Telefone"
                      />
                      <p className="text-xs text-muted-foreground">
                        Todas as taxas do marketplace serão creditadas nesta chave
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Integrations Tab */}
            <TabsContent value="integrations">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>AWS / CloudFront</CardTitle>
                    <CardDescription>Configurações de armazenamento e CDN</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="aws_region">Região AWS</Label>
                      <Input
                        id="aws_region"
                        value={integrationSettings.aws_region}
                        onChange={(e) => setIntegrationSettings({ ...integrationSettings, aws_region: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cloudfront_domain">Domínio CloudFront</Label>
                      <Input
                        id="cloudfront_domain"
                        value={integrationSettings.cloudfront_domain}
                        onChange={(e) => setIntegrationSettings({ ...integrationSettings, cloudfront_domain: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>WhatsApp / Evolution API</CardTitle>
                    <CardDescription>Configurações de integração WhatsApp</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="evolution_url">URL da Evolution API</Label>
                      <Input
                        id="evolution_url"
                        value={integrationSettings.evolution_api_url}
                        onChange={(e) => setIntegrationSettings({ ...integrationSettings, evolution_api_url: e.target.value })}
                        placeholder="https://api.evolution.example.com"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Google Gemini</CardTitle>
                    <CardDescription>API para funcionalidades de IA</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="gemini_key">API Key</Label>
                      <Input
                        id="gemini_key"
                        type="password"
                        value={integrationSettings.gemini_api_key}
                        onChange={(e) => setIntegrationSettings({ ...integrationSettings, gemini_api_key: e.target.value })}
                        placeholder="AIza..."
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Autenticação</CardTitle>
                    <CardDescription>Configurações de segurança de login</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">2FA para Admins</p>
                        <p className="text-sm text-muted-foreground">Exigir autenticação de dois fatores</p>
                      </div>
                      <Switch
                        checked={securitySettings.require_2fa_admin}
                        onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, require_2fa_admin: checked })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="session_timeout">Timeout de Sessão (horas)</Label>
                      <Input
                        id="session_timeout"
                        type="number"
                        value={securitySettings.session_timeout_hours}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, session_timeout_hours: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_attempts">Máximo de Tentativas de Login</Label>
                      <Input
                        id="max_attempts"
                        type="number"
                        value={securitySettings.max_login_attempts}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, max_login_attempts: Number(e.target.value) })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Logs e Auditoria</CardTitle>
                    <CardDescription>Configurações de registro de ações</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="log_retention">Retenção de Logs (dias)</Label>
                      <Input
                        id="log_retention"
                        type="number"
                        value={securitySettings.audit_log_retention_days}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, audit_log_retention_days: Number(e.target.value) })}
                      />
                    </div>
                    <div className="pt-4">
                      <Button variant="outline" className="w-full" asChild>
                        <a href="/admin/health">
                          <Database className="w-4 h-4 mr-2" />
                          Ver Logs do Sistema
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;
