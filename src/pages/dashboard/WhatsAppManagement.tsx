import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  ArrowLeft, Loader2, MessageSquare, Bot, Smartphone, Wifi, WifiOff, 
  RefreshCw, QrCode, Settings, Link2, Copy, ExternalLink, Zap,
  CreditCard, MapPin, Volume2, Activity, MessageCircle, Check, Plus,
  Trash2, ChevronRight, Lock, Sparkles, Edit, Send
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

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
  whatsapp_level: number;
  keywords_enabled: boolean;
  welcome_message: string | null;
  business_hours_message: string | null;
  outside_hours_message: string | null;
}

interface WhatsAppKeyword {
  id: string;
  category: string;
  keywords: string[];
  response_text: string | null;
  response_link: string | null;
  send_menu_link: boolean;
  is_active: boolean;
}

interface Analytics {
  messages_today: number;
  orders_today: number;
  active_sessions: number;
}

const DEFAULT_KEYWORDS: Omit<WhatsAppKeyword, 'id'>[] = [
  { 
    category: 'menu', 
    keywords: ['cardápio', 'menu', 'ver produtos', 'o que tem', 'cardapio'],
    response_text: 'Acesse nosso cardápio digital:',
    response_link: null,
    send_menu_link: true,
    is_active: true
  },
  { 
    category: 'order', 
    keywords: ['fazer pedido', 'quero pedir', 'encomendar', 'pedir', 'pedido'],
    response_text: 'Para fazer seu pedido, acesse nosso cardápio:',
    response_link: null,
    send_menu_link: true,
    is_active: true
  },
  { 
    category: 'hours', 
    keywords: ['horário', 'horario', 'abre que horas', 'funcionamento', 'aberto'],
    response_text: 'Nosso horário de funcionamento: {HORARIO}',
    response_link: null,
    send_menu_link: false,
    is_active: true
  },
  { 
    category: 'address', 
    keywords: ['endereço', 'endereco', 'onde fica', 'localização', 'localizacao'],
    response_text: 'Nosso endereço: {ENDERECO}',
    response_link: null,
    send_menu_link: false,
    is_active: true
  },
  { 
    category: 'delivery', 
    keywords: ['entrega', 'delivery', 'taxa de entrega', 'frete'],
    response_text: 'Fazemos entregas! Confira as taxas no cardápio:',
    response_link: null,
    send_menu_link: true,
    is_active: true
  },
  { 
    category: 'human', 
    keywords: ['atendente', 'falar com alguém', 'humano', 'pessoa', 'atendimento'],
    response_text: 'Um momento! Estou encaminhando você para um atendente. 👋',
    response_link: null,
    send_menu_link: false,
    is_active: true
  },
];

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  menu: { label: 'Cardápio', icon: <MessageSquare className="w-4 h-4" />, color: 'text-green-600' },
  order: { label: 'Pedido', icon: <Zap className="w-4 h-4" />, color: 'text-blue-600' },
  hours: { label: 'Horário', icon: <Activity className="w-4 h-4" />, color: 'text-orange-600' },
  address: { label: 'Endereço', icon: <MapPin className="w-4 h-4" />, color: 'text-purple-600' },
  delivery: { label: 'Entrega', icon: <Send className="w-4 h-4" />, color: 'text-cyan-600' },
  human: { label: 'Atendente', icon: <MessageCircle className="w-4 h-4" />, color: 'text-pink-600' },
};

const WhatsAppManagement = () => {
  const { user } = useAuth();
  const { slug } = useParams();
  const [instance, setInstance] = useState<WhatsAppInstance | null>(null);
  const [keywords, setKeywords] = useState<WhatsAppKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [establishment, setEstablishment] = useState<any>(null);
  const [analytics, setAnalytics] = useState<Analytics>({ messages_today: 0, orders_today: 0, active_sessions: 0 });
  const [copied, setCopied] = useState(false);
  const [hasAIAccess, setHasAIAccess] = useState(false);

  const [form, setForm] = useState({
    instance_name: "",
    evolution_api_url: "",
    evolution_api_key: "",
    ai_enabled: false,
    ai_prompt: "",
    auto_response_enabled: true,
    audio_enabled: false,
    pix_enabled: false,
    keywords_enabled: true,
    welcome_message: "",
    business_hours_message: "",
    outside_hours_message: "",
  });

  const defaultPrompt = `Você é um assistente virtual do {NOME_ESTABELECIMENTO}. Ajude os clientes com:
- Informações sobre o cardápio
- Realizar pedidos
- Horários de funcionamento
- Formas de pagamento

Seja sempre educado e prestativo. Se não souber responder algo, peça para o cliente aguardar atendimento humano.`;

  useEffect(() => {
    if (user) fetchEstablishment();
  }, [user, slug]);

  useEffect(() => {
    if (establishmentId) {
      fetchInstance();
      fetchKeywords();
      fetchAnalytics();
      checkPlanAccess();
    }
  }, [establishmentId]);

  const fetchEstablishment = async () => {
    let query = supabase.from("establishments").select("id, name, slug, address, plan_id");
    
    if (slug) {
      query = query.eq("slug", slug);
    } else {
      query = query.eq("owner_id", user?.id);
    }
    
    const { data } = await query.maybeSingle();
    if (data) {
      setEstablishmentId(data.id);
      setEstablishment(data);
    }
  };

  const checkPlanAccess = async () => {
    if (!establishment?.plan_id) return;
    
    const { data: plan } = await supabase
      .from("plans")
      .select("whatsapp_ai_agent")
      .eq("id", establishment.plan_id)
      .single();
    
    setHasAIAccess(plan?.whatsapp_ai_agent ?? false);
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
        ai_prompt: data.ai_prompt || defaultPrompt.replace("{NOME_ESTABELECIMENTO}", establishment?.name || ""),
        auto_response_enabled: data.auto_response_enabled ?? true,
        audio_enabled: data.audio_enabled || false,
        pix_enabled: data.pix_enabled || false,
        keywords_enabled: data.keywords_enabled ?? true,
        welcome_message: data.welcome_message || "",
        business_hours_message: data.business_hours_message || "",
        outside_hours_message: data.outside_hours_message || "",
      });
    } else {
      setForm({
        ...form,
        ai_prompt: defaultPrompt.replace("{NOME_ESTABELECIMENTO}", establishment?.name || ""),
      });
    }
    setLoading(false);
  };

  const fetchKeywords = async () => {
    const { data } = await supabase
      .from("whatsapp_keywords")
      .select("*")
      .eq("establishment_id", establishmentId)
      .order("sort_order");

    if (data && data.length > 0) {
      setKeywords(data as WhatsAppKeyword[]);
    } else {
      // Initialize with defaults
      setKeywords(DEFAULT_KEYWORDS.map((k, i) => ({ ...k, id: `temp-${i}` })) as WhatsAppKeyword[]);
    }
  };

  const fetchAnalytics = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: messagesCount } = await supabase
      .from("whatsapp_conversations")
      .select("*", { count: "exact", head: true })
      .eq("establishment_id", establishmentId)
      .gte("last_message_at", today.toISOString());

    setAnalytics({
      messages_today: messagesCount || 0,
      orders_today: 0,
      active_sessions: 0,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const instanceData = {
        instance_name: form.instance_name || null,
        evolution_api_url: form.evolution_api_url || null,
        evolution_api_key: form.evolution_api_key || null,
        ai_enabled: form.ai_enabled,
        ai_prompt: form.ai_prompt || null,
        auto_response_enabled: form.auto_response_enabled,
        audio_enabled: form.audio_enabled,
        pix_enabled: form.pix_enabled,
        keywords_enabled: form.keywords_enabled,
        welcome_message: form.welcome_message || null,
        business_hours_message: form.business_hours_message || null,
        outside_hours_message: form.outside_hours_message || null,
        establishment_id: establishmentId,
        whatsapp_level: form.ai_enabled ? 2 : 1,
      };

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

      // Save keywords
      for (const keyword of keywords) {
        if (keyword.id.startsWith('temp-')) {
          // Insert new
          await supabase.from("whatsapp_keywords").insert({
            establishment_id: establishmentId,
            category: keyword.category,
            keywords: keyword.keywords,
            response_text: keyword.response_text,
            response_link: keyword.response_link,
            send_menu_link: keyword.send_menu_link,
            is_active: keyword.is_active,
          });
        } else {
          // Update existing
          await supabase.from("whatsapp_keywords").update({
            keywords: keyword.keywords,
            response_text: keyword.response_text,
            response_link: keyword.response_link,
            send_menu_link: keyword.send_menu_link,
            is_active: keyword.is_active,
          }).eq("id", keyword.id);
        }
      }

      toast.success("Configurações salvas!");
      fetchInstance();
      fetchKeywords();
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
      const instanceName = form.instance_name || establishment?.name.toLowerCase().replace(/\s/g, "_");
      
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
      setForm(prev => ({ ...prev, instance_name: instanceName }));
      
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
        keywords_enabled: form.keywords_enabled,
        establishment_id: establishmentId,
        whatsapp_level: 1,
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

  const updateKeyword = (index: number, field: keyof WhatsAppKeyword, value: any) => {
    setKeywords(prev => prev.map((k, i) => i === index ? { ...k, [field]: value } : k));
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

  // Progress calculation
  const progressSteps = [
    { label: 'Configurar Evolution API', done: !!form.evolution_api_url && !!form.evolution_api_key },
    { label: 'Criar Instância', done: !!instance?.instance_name },
    { label: 'Conectar WhatsApp', done: instance?.status === 'connected' },
    { label: 'Configurar Palavras-Chave', done: keywords.some(k => k.is_active) },
    { label: 'Testar Funcionamento', done: analytics.messages_today > 0 },
  ];
  const completedSteps = progressSteps.filter(s => s.done).length;
  const progressPercent = Math.round((completedSteps / progressSteps.length) * 100);

  const baseUrl = slug ? `/painel/${slug}` : '/painel';

  return (
    <AdminLayout 
      title="WhatsApp" 
      icon={MessageSquare} 
      breadcrumb="WhatsApp"
    >
      <div className="space-y-6">
        {/* Progress Card */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="w-5 h-5 text-primary" />
                Configuração do WhatsApp
              </CardTitle>
              <Badge variant={progressPercent === 100 ? "default" : "secondary"}>
                {progressPercent}% completo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progressPercent} className="h-2" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {progressSteps.map((step, i) => (
                <div 
                  key={i} 
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                    step.done ? 'bg-green-500/10 text-green-700' : 'bg-muted/50 text-muted-foreground'
                  }`}
                >
                  {step.done ? (
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                  )}
                  <span className="truncate">{step.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
              <p className="text-xs text-muted-foreground">Pedidos via WhatsApp</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{analytics.active_sessions}</p>
              <p className="text-xs text-muted-foreground">Conversas ativas</p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="connection" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="connection" className="gap-2">
                <Smartphone className="w-4 h-4" />
                <span className="hidden sm:inline">Conexão</span>
              </TabsTrigger>
              <TabsTrigger value="chatbot" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Chatbot</span>
              </TabsTrigger>
              <TabsTrigger value="ai-agent" className="gap-2 relative">
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">Agente IA</span>
                {!hasAIAccess && <Lock className="w-3 h-3 absolute -top-1 -right-1" />}
              </TabsTrigger>
              <TabsTrigger value="messages" className="gap-2">
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Mensagens</span>
              </TabsTrigger>
            </TabsList>

            {/* Connection Tab */}
            <TabsContent value="connection" className="space-y-4 mt-4">
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
                      placeholder={establishment?.name?.toLowerCase().replace(/\s/g, "_") || "minha_loja"}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Chatbot Tab (Nível 1) */}
            <TabsContent value="chatbot" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                        Chatbot com Palavras-Chave
                      </CardTitle>
                      <CardDescription>
                        Respostas automáticas baseadas em palavras-chave (Nível 1)
                      </CardDescription>
                    </div>
                    <Switch
                      checked={form.keywords_enabled}
                      onCheckedChange={(checked) => setForm({ ...form, keywords_enabled: checked })}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-sm text-green-700">
                      <strong>Como funciona:</strong> Quando o cliente envia uma mensagem contendo uma das palavras-chave configuradas, o sistema responde automaticamente com a mensagem correspondente.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {keywords.map((keyword, index) => {
                      const config = CATEGORY_LABELS[keyword.category] || { label: keyword.category, icon: <MessageSquare className="w-4 h-4" />, color: 'text-gray-600' };
                      
                      return (
                        <Card key={keyword.id} className={`${!keyword.is_active ? 'opacity-50' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className={config.color}>{config.icon}</div>
                                  <span className="font-medium">{config.label}</span>
                                  <Switch
                                    checked={keyword.is_active}
                                    onCheckedChange={(checked) => updateKeyword(index, 'is_active', checked)}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground">Palavras-chave (separadas por vírgula)</Label>
                                  <Input
                                    value={keyword.keywords.join(', ')}
                                    onChange={(e) => updateKeyword(index, 'keywords', e.target.value.split(',').map(k => k.trim()))}
                                    placeholder="palavra1, palavra2, palavra3"
                                    className="text-sm"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground">Resposta automática</Label>
                                  <Textarea
                                    value={keyword.response_text || ''}
                                    onChange={(e) => updateKeyword(index, 'response_text', e.target.value)}
                                    placeholder="Digite a resposta..."
                                    rows={2}
                                    className="text-sm"
                                  />
                                </div>

                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={keyword.send_menu_link}
                                    onCheckedChange={(checked) => updateKeyword(index, 'send_menu_link', checked)}
                                  />
                                  <Label className="text-xs">Enviar link do cardápio junto</Label>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Agent Tab (Nível 2) */}
            <TabsContent value="ai-agent" className="space-y-4 mt-4">
              {!hasAIAccess ? (
                <Card className="border-amber-500/30 bg-amber-500/5">
                  <CardContent className="p-8 text-center space-y-4">
                    <Lock className="w-12 h-12 mx-auto text-amber-500" />
                    <h3 className="text-xl font-semibold">Agente IA - Recurso Premium</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      O Agente IA permite vendas conversacionais completas, com carrinho de compras, 
                      cálculo de frete e pagamento PIX diretamente pelo WhatsApp.
                    </p>
                    <Button className="gap-2">
                      <Sparkles className="w-4 h-4" />
                      Fazer Upgrade do Plano
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Bot className="w-5 h-5 text-blue-600" />
                            Agente IA Conversacional
                          </CardTitle>
                          <CardDescription>
                            Vendas completas com IA (Nível 2 - Premium)
                          </CardDescription>
                        </div>
                        <Switch
                          checked={form.ai_enabled}
                          onCheckedChange={(checked) => setForm({ ...form, ai_enabled: checked })}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-2">
                        <p className="text-sm font-medium text-blue-700">Recursos do Agente IA:</p>
                        <ul className="text-sm text-blue-700/80 space-y-1">
                          <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Busca inteligente de produtos</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Carrinho de compras via chat</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Validação de endereço com Google Maps</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Cálculo automático de frete</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Geração de QR Code PIX</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Envio de imagens dos produtos</li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <Label>Prompt Personalizado</Label>
                        <Textarea
                          value={form.ai_prompt}
                          onChange={(e) => setForm({ ...form, ai_prompt: e.target.value })}
                          placeholder="Instruções para o agente IA..."
                          rows={6}
                        />
                        <p className="text-xs text-muted-foreground">
                          Personalize como o agente deve se comportar e responder aos clientes.
                        </p>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="flex items-center gap-2">
                              <Volume2 className="w-4 h-4" />
                              Respostas em Áudio
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              IA responde com mensagens de voz
                            </p>
                          </div>
                          <Switch
                            checked={form.audio_enabled}
                            onCheckedChange={(checked) => setForm({ ...form, audio_enabled: checked })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              Pagamento PIX no Chat
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Gerar QR Code PIX diretamente no WhatsApp
                            </p>
                          </div>
                          <Switch
                            checked={form.pix_enabled}
                            onCheckedChange={(checked) => setForm({ ...form, pix_enabled: checked })}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Auto Messages Tab */}
            <TabsContent value="messages" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Mensagens Automáticas
                  </CardTitle>
                  <CardDescription>
                    Configure mensagens enviadas automaticamente em cada situação
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Mensagem de Boas-Vindas</Label>
                    <Textarea
                      value={form.welcome_message}
                      onChange={(e) => setForm({ ...form, welcome_message: e.target.value })}
                      placeholder="Olá! Bem-vindo ao {NOME_LOJA}! 👋"
                      rows={2}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enviada quando um novo cliente inicia conversa
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Horário Comercial</Label>
                    <Textarea
                      value={form.business_hours_message}
                      onChange={(e) => setForm({ ...form, business_hours_message: e.target.value })}
                      placeholder="Estamos abertos! Como posso ajudar?"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fora do Horário</Label>
                    <Textarea
                      value={form.outside_hours_message}
                      onChange={(e) => setForm({ ...form, outside_hours_message: e.target.value })}
                      placeholder="Estamos fechados no momento. Nosso horário: {HORARIO}"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            <Check className="w-4 h-4" />
            Salvar Configurações
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default WhatsAppManagement;