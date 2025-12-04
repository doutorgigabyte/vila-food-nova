import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  ArrowLeft, Loader2, MessageSquare, Bot, Smartphone, Wifi, WifiOff, 
  RefreshCw, QrCode, Settings, Link2, Copy, ExternalLink, Zap,
  CreditCard, MapPin, Volume2, Activity, MessageCircle, Check
} from "lucide-react";

interface WhatsAppInstance {
  id: string;
  instance_name: string | null;
  instance_id: string | null;
  status: string | null;
  qr_code: string | null;
  ai_enabled: boolean | null;
  ai_prompt: string | null;
  evolution_api_url: string | null;
  evolution_api_key: string | null;
  auto_response_enabled: boolean | null;
  audio_enabled: boolean | null;
  pix_enabled: boolean | null;
}

interface Analytics {
  messages_today: number;
  orders_today: number;
  active_sessions: number;
}

const WhatsAppManagement = () => {
  const { user } = useAuth();
  const [instance, setInstance] = useState<WhatsAppInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [establishmentName, setEstablishmentName] = useState<string>("");
  const [analytics, setAnalytics] = useState<Analytics>({ messages_today: 0, orders_today: 0, active_sessions: 0 });
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    instance_name: "",
    evolution_api_url: "",
    evolution_api_key: "",
    ai_enabled: false,
    ai_prompt: "",
    auto_response_enabled: true,
    audio_enabled: false,
    pix_enabled: false,
  });

  const defaultPrompt = `Você é um assistente virtual do {NOME_ESTABELECIMENTO}. Ajude os clientes com:
- Informações sobre o cardápio
- Realizar pedidos
- Horários de funcionamento
- Formas de pagamento

Seja sempre educado e prestativo. Se não souber responder algo, peça para o cliente aguardar atendimento humano.`;

  useEffect(() => {
    if (user) fetchEstablishment();
  }, [user]);

  useEffect(() => {
    if (establishmentId) {
      fetchInstance();
      fetchAnalytics();
    }
  }, [establishmentId]);

  const fetchEstablishment = async () => {
    const { data } = await supabase
      .from("establishments")
      .select("id, name")
      .eq("owner_id", user?.id)
      .maybeSingle();
    if (data) {
      setEstablishmentId(data.id);
      setEstablishmentName(data.name);
    }
  };

  const fetchInstance = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("whatsapp_instances")
      .select("*")
      .eq("establishment_id", establishmentId)
      .maybeSingle();

    if (!error && data) {
      setInstance(data as WhatsAppInstance);
      setForm({
        instance_name: data.instance_name || "",
        evolution_api_url: data.evolution_api_url || "",
        evolution_api_key: data.evolution_api_key || "",
        ai_enabled: data.ai_enabled || false,
        ai_prompt: data.ai_prompt || defaultPrompt.replace("{NOME_ESTABELECIMENTO}", establishmentName),
        auto_response_enabled: data.auto_response_enabled ?? true,
        audio_enabled: data.audio_enabled || false,
        pix_enabled: data.pix_enabled || false,
      });
    } else {
      setForm({
        ...form,
        ai_prompt: defaultPrompt.replace("{NOME_ESTABELECIMENTO}", establishmentName),
      });
    }
    setLoading(false);
  };

  const fetchAnalytics = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: messagesCount } = await supabase
      .from("whatsapp_analytics")
      .select("*", { count: "exact", head: true })
      .eq("establishment_id", establishmentId)
      .eq("event_type", "message_received")
      .gte("created_at", today.toISOString());

    const { count: ordersCount } = await supabase
      .from("whatsapp_analytics")
      .select("*", { count: "exact", head: true })
      .eq("establishment_id", establishmentId)
      .eq("event_type", "order_created")
      .gte("created_at", today.toISOString());

    const { count: sessionsCount } = await supabase
      .from("whatsapp_sessions")
      .select("*", { count: "exact", head: true })
      .eq("establishment_id", establishmentId)
      .eq("status", "active");

    setAnalytics({
      messages_today: messagesCount || 0,
      orders_today: ordersCount || 0,
      active_sessions: sessionsCount || 0,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const instanceData = {
      instance_name: form.instance_name || null,
      evolution_api_url: form.evolution_api_url || null,
      evolution_api_key: form.evolution_api_key || null,
      ai_enabled: form.ai_enabled,
      ai_prompt: form.ai_prompt || null,
      auto_response_enabled: form.auto_response_enabled,
      audio_enabled: form.audio_enabled,
      pix_enabled: form.pix_enabled,
      establishment_id: establishmentId,
    };

    try {
      if (instance) {
        const { error } = await supabase
          .from("whatsapp_instances")
          .update(instanceData)
          .eq("id", instance.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("whatsapp_instances").insert(instanceData);
        if (error) throw error;
      }
      toast.success("Configurações salvas!");
      fetchInstance();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = async () => {
    if (!form.evolution_api_url || !form.evolution_api_key) {
      toast.error("Preencha a URL e API Key da Evolution API");
      return;
    }

    setConnecting(true);
    try {
      // Create instance on Evolution API
      const instanceName = form.instance_name || establishmentName.toLowerCase().replace(/\s/g, "_");
      
      const response = await fetch(`${form.evolution_api_url}/instance/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": form.evolution_api_key,
        },
        body: JSON.stringify({
          instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar instância");
      }

      const data = await response.json();
      
      // Update form with instance name and save
      setForm(prev => ({ ...prev, instance_name: instanceName }));
      
      // Save to database
      const instanceData = {
        instance_name: instanceName,
        instance_id: data.instance?.instanceId || instanceName,
        evolution_api_url: form.evolution_api_url,
        evolution_api_key: form.evolution_api_key,
        status: "connecting",
        qr_code: data.qrcode?.base64 || null,
        ai_enabled: form.ai_enabled,
        ai_prompt: form.ai_prompt,
        auto_response_enabled: form.auto_response_enabled,
        audio_enabled: form.audio_enabled,
        pix_enabled: form.pix_enabled,
        establishment_id: establishmentId,
      };

      if (instance) {
        await supabase.from("whatsapp_instances").update(instanceData).eq("id", instance.id);
      } else {
        await supabase.from("whatsapp_instances").insert(instanceData);
      }

      toast.success("Instância criada! Escaneie o QR Code para conectar.");
      fetchInstance();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao conectar");
    } finally {
      setConnecting(false);
    }
  };

  const handleSetupWebhook = async () => {
    if (!instance?.evolution_api_url || !instance?.evolution_api_key || !instance?.instance_name) {
      toast.error("Configure a conexão primeiro");
      return;
    }

    try {
      const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`;
      
      const response = await fetch(`${instance.evolution_api_url}/webhook/set/${instance.instance_name}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": instance.evolution_api_key,
        },
        body: JSON.stringify({
          url: webhookUrl,
          webhook_by_events: false,
          webhook_base64: true,
          events: [
            "MESSAGES_UPSERT",
            "MESSAGES_UPDATE",
            "CONNECTION_UPDATE",
          ],
        }),
      });

      if (!response.ok) throw new Error("Erro ao configurar webhook");

      toast.success("Webhook configurado com sucesso!");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao configurar webhook");
    }
  };

  const copyWebhookUrl = () => {
    const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`;
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success("URL copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-500">Conectado</Badge>;
      case "disconnected":
        return <Badge variant="destructive">Desconectado</Badge>;
      case "connecting":
        return <Badge variant="secondary">Conectando...</Badge>;
      default:
        return <Badge variant="outline">Não configurado</Badge>;
    }
  };

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`;

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
            <h1 className="text-lg font-semibold">WhatsApp IA</h1>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="p-4 md:p-6 space-y-6">
          {/* Analytics Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <MessageCircle className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{analytics.messages_today}</p>
                <p className="text-xs text-muted-foreground">Mensagens hoje</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Zap className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{analytics.orders_today}</p>
                <p className="text-xs text-muted-foreground">Pedidos hoje</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Activity className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{analytics.active_sessions}</p>
                <p className="text-xs text-muted-foreground">Sessões ativas</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="connection" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="connection">Conexão</TabsTrigger>
              <TabsTrigger value="ai">Inteligência</TabsTrigger>
              <TabsTrigger value="integrations">Integrações</TabsTrigger>
            </TabsList>

            {/* Connection Tab */}
            <TabsContent value="connection" className="space-y-4 mt-4">
              {/* Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    Status da Conexão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {instance?.status === "connected" ? (
                        <Wifi className="w-8 h-8 text-green-500" />
                      ) : (
                        <WifiOff className="w-8 h-8 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">WhatsApp Business</p>
                        {getStatusBadge(instance?.status)}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleConnect}
                      disabled={connecting || !form.evolution_api_url}
                    >
                      {connecting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      {instance?.status === "connected" ? "Reconectar" : "Conectar"}
                    </Button>
                  </div>

                  {instance?.qr_code && instance.status !== "connected" && (
                    <div className="mt-6 flex flex-col items-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        Escaneie o QR Code com o WhatsApp do seu celular
                      </p>
                      <div className="p-4 bg-white rounded-lg">
                        <img
                          src={instance.qr_code.startsWith("data:") ? instance.qr_code : `data:image/png;base64,${instance.qr_code}`}
                          alt="QR Code WhatsApp"
                          className="w-48 h-48"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Evolution API Config */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Evolution API
                  </CardTitle>
                  <CardDescription>
                    Configure a conexão com sua instância da Evolution API
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="evolution_api_url">URL da Evolution API</Label>
                    <Input
                      id="evolution_api_url"
                      value={form.evolution_api_url}
                      onChange={(e) => setForm({ ...form, evolution_api_url: e.target.value })}
                      placeholder="https://sua-evolution-api.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="evolution_api_key">API Key</Label>
                    <Input
                      id="evolution_api_key"
                      type="password"
                      value={form.evolution_api_key}
                      onChange={(e) => setForm({ ...form, evolution_api_key: e.target.value })}
                      placeholder="Sua chave da API"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instance_name">Nome da Instância</Label>
                    <Input
                      id="instance_name"
                      value={form.instance_name}
                      onChange={(e) => setForm({ ...form, instance_name: e.target.value })}
                      placeholder={establishmentName.toLowerCase().replace(/\s/g, "_")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Identificador único (sem espaços ou caracteres especiais)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Webhook Config */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="w-5 h-5" />
                    Webhook
                  </CardTitle>
                  <CardDescription>
                    Configure o webhook para receber mensagens
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>URL do Webhook</Label>
                    <div className="flex gap-2">
                      <Input
                        value={webhookUrl}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use esta URL para configurar o webhook na Evolution API
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleSetupWebhook}
                    disabled={!instance?.instance_name}
                    className="w-full"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Configurar Webhook Automaticamente
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Tab */}
            <TabsContent value="ai" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    Atendimento com IA
                  </CardTitle>
                  <CardDescription>
                    Configure o assistente virtual para atender seus clientes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Ativar Atendimento com IA</Label>
                      <p className="text-sm text-muted-foreground">
                        Responda automaticamente mensagens usando IA
                      </p>
                    </div>
                    <Switch
                      checked={form.ai_enabled}
                      onCheckedChange={(checked) => setForm({ ...form, ai_enabled: checked })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Resposta Automática</Label>
                      <p className="text-sm text-muted-foreground">
                        Enviar respostas sem intervenção manual
                      </p>
                    </div>
                    <Switch
                      checked={form.auto_response_enabled}
                      onCheckedChange={(checked) => setForm({ ...form, auto_response_enabled: checked })}
                    />
                  </div>

                  {form.ai_enabled && (
                    <div className="space-y-2 pt-4">
                      <Label htmlFor="ai_prompt">Prompt da IA</Label>
                      <Textarea
                        id="ai_prompt"
                        value={form.ai_prompt}
                        onChange={(e) => setForm({ ...form, ai_prompt: e.target.value })}
                        placeholder="Instruções para a IA..."
                        rows={12}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Descreva como a IA deve se comportar. Inclua informações sobre seu estabelecimento,
                        horários, formas de pagamento, etc. A IA terá acesso ao cardápio automaticamente.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Features Info */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Bot className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="text-sm space-y-2">
                      <p className="font-medium text-primary">Recursos da IA</p>
                      <ul className="text-muted-foreground space-y-1">
                        <li>✅ Consulta e envia o cardápio com preços</li>
                        <li>✅ Adiciona produtos ao carrinho</li>
                        <li>✅ Calcula taxa de entrega por localização</li>
                        <li>✅ Finaliza pedidos automaticamente</li>
                        <li>✅ Gera QR Code PIX para pagamento</li>
                        <li>✅ Solicita atendimento humano quando necessário</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Integrations Tab */}
            <TabsContent value="integrations" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Integrações Disponíveis</CardTitle>
                  <CardDescription>
                    Ative recursos adicionais para seu atendimento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Audio Integration */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Volume2 className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <Label>Respostas em Áudio</Label>
                        <p className="text-sm text-muted-foreground">
                          Envie respostas em áudio usando ElevenLabs
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={form.audio_enabled}
                      onCheckedChange={(checked) => setForm({ ...form, audio_enabled: checked })}
                    />
                  </div>

                  <Separator />

                  {/* PIX Integration */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <CreditCard className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <Label>Pagamento PIX</Label>
                        <p className="text-sm text-muted-foreground">
                          Gere QR Code PIX via Mercado Pago
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={form.pix_enabled}
                      onCheckedChange={(checked) => setForm({ ...form, pix_enabled: checked })}
                    />
                  </div>

                  <Separator />

                  {/* Location Integration */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <MapPin className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <Label>Cálculo de Frete</Label>
                        <p className="text-sm text-muted-foreground">
                          Calcule frete por geolocalização
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Ativo</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* N8N Template Info */}
              <Card className="border-orange-500/20 bg-orange-500/5">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Zap className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-orange-600 mb-2">Integração com N8N</p>
                      <p className="text-muted-foreground mb-3">
                        Para recursos avançados como transcrição de áudio (Whisper), análise de imagens 
                        (Gemini Vision), e geração de voz (ElevenLabs), configure um workflow no N8N.
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <a 
                          href="https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.webhook/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Documentação N8N
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default WhatsAppManagement;
