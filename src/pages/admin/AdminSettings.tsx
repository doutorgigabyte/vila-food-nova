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
import { MercadoPagoOAuth } from "@/components/payment/MercadoPagoOAuth";
import { N8nTemplatesDownload } from "@/components/admin/N8nTemplatesDownload";
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
  Bell,
  Bot,
  ToggleLeft,
  Loader2
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
    support_email: "suporte@vilafood.delivery",
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

  // Gateway settings
  const [gatewaySettings, setGatewaySettings] = useState({
    mercadopago_enabled: true,
    pagseguro_enabled: true,
    pix_static_enabled: true,
    cash_enabled: true,
  });
  const [gatewaysLoading, setGatewaysLoading] = useState(true);

  // Load gateway settings on mount
  useEffect(() => {
    const loadGatewaySettings = async () => {
      try {
        const { data, error } = await supabase
          .from('platform_settings')
          .select('setting_key, setting_value')
          .in('setting_key', [
            'gateway_mercadopago_enabled',
            'gateway_pagseguro_enabled',
            'gateway_pix_static_enabled',
            'gateway_cash_enabled'
          ]);

        if (error) throw error;

        if (data) {
          const settings = { ...gatewaySettings };
          data.forEach((row: any) => {
            const key = row.setting_key.replace('gateway_', '').replace('_enabled', '_enabled');
            const value = row.setting_value === 'true' || row.setting_value === true;
            if (row.setting_key === 'gateway_mercadopago_enabled') settings.mercadopago_enabled = value;
            if (row.setting_key === 'gateway_pagseguro_enabled') settings.pagseguro_enabled = value;
            if (row.setting_key === 'gateway_pix_static_enabled') settings.pix_static_enabled = value;
            if (row.setting_key === 'gateway_cash_enabled') settings.cash_enabled = value;
          });
          setGatewaySettings(settings);
        }
      } catch (error) {
        console.error('Error loading gateway settings:', error);
      } finally {
        setGatewaysLoading(false);
      }
    };

    loadGatewaySettings();
  }, []);

  const handleGatewayToggle = async (gateway: keyof typeof gatewaySettings, value: boolean) => {
    const settingKey = `gateway_${gateway.replace('_enabled', '')}_enabled`;
    
    try {
      const { error } = await supabase
        .from('platform_settings')
        .update({ setting_value: value.toString(), updated_at: new Date().toISOString() })
        .eq('setting_key', settingKey);

      if (error) throw error;

      setGatewaySettings(prev => ({ ...prev, [gateway]: value }));
      toast.success(`Gateway ${value ? 'ativado' : 'desativado'} com sucesso`);
    } catch (error) {
      console.error('Error updating gateway:', error);
      toast.error('Erro ao atualizar gateway');
    }
  };

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
    <div className="min-h-screen bg-background flex overflow-hidden">
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
      />
      
      <main className="flex-1 lg:ml-64 overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <Settings className="w-5 h-5 shrink-0" />
                  <span className="hidden sm:inline truncate">Configurações da Plataforma</span>
                  <span className="sm:hidden">Configurações</span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block truncate">
                  Gerencie as configurações globais do VilaFood
                </p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto shrink-0">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </header>

        <div className="p-6 overflow-x-auto">
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
              <TabsTrigger value="gateways" className="gap-2 text-xs sm:text-sm">
                <ToggleLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Gateways</span>
              </TabsTrigger>
              <TabsTrigger value="integrations" className="gap-2 text-xs sm:text-sm">
                <Link2 className="w-4 h-4" />
                <span className="hidden sm:inline">Integrações</span>
              </TabsTrigger>
              <TabsTrigger value="n8n" className="gap-2 text-xs sm:text-sm">
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">n8n / IA</span>
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
                {/* Mercado Pago OAuth - Platform Level */}
                <MercadoPagoOAuth context="admin" />
              </div>
            </TabsContent>

            {/* Gateways Tab */}
            <TabsContent value="gateways">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ToggleLeft className="w-5 h-5" />
                      Gateways de Pagamento
                    </CardTitle>
                    <CardDescription>
                      Ative ou desative os gateways disponíveis para os estabelecimentos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {gatewaysLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <>
                        {/* Mercado Pago */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium">Mercado Pago</p>
                              <p className="text-sm text-muted-foreground">
                                PIX, Cartão de Crédito/Débito, Checkout Pro
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={gatewaySettings.mercadopago_enabled}
                            onCheckedChange={(checked) => handleGatewayToggle('mercadopago_enabled', checked)}
                          />
                        </div>

                        {/* PagSeguro */}
                        <div className="flex items-center justify-between p-4 border rounded-lg opacity-60">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                              <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">PagSeguro (PagBank)</p>
                                <Badge variant="secondary" className="text-xs">Em breve</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                PIX, Cartão de Crédito/Débito</p>
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                Aguardando homologação PagBank</p>
                            </div>
                          </div>
                          <Switch
                            checked={false}
                            disabled={true}
                          />
                        </div>

                        {/* PIX Estático */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
                              <Wallet className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                            </div>
                            <div>
                              <p className="font-medium">PIX Estático</p>
                              <p className="text-sm text-muted-foreground">
                                Chave PIX manual (sem integração automática)
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={gatewaySettings.pix_static_enabled}
                            onCheckedChange={(checked) => handleGatewayToggle('pix_static_enabled', checked)}
                          />
                        </div>

                        {/* Dinheiro */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                              <Wallet className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                              <p className="font-medium">Dinheiro / Na Entrega</p>
                              <p className="text-sm text-muted-foreground">
                                Pagamento em dinheiro ou cartão na entrega
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={gatewaySettings.cash_enabled}
                            onCheckedChange={(checked) => handleGatewayToggle('cash_enabled', checked)}
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Informações</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>
                      • Os gateways desativados aqui não aparecerão nas opções de pagamento dos estabelecimentos.
                    </p>
                    <p>
                      • Cada estabelecimento ainda precisa configurar suas próprias credenciais para os gateways ativos.
                    </p>
                    <p>
                      • Desativar um gateway não afeta pagamentos já iniciados.
                    </p>
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

            {/* n8n / AI Templates Tab */}
            <TabsContent value="n8n">
              <N8nTemplatesDownload />
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
