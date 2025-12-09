import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAccess } from "@/contexts/AdminAccessContext";
import { useEstablishmentPlan } from "@/hooks/useEstablishmentPlan";
import { toast } from "sonner";
import { 
  Loader2, MessageSquare, Bot, Smartphone, Wifi, WifiOff, 
  RefreshCw, QrCode, Check, Sparkles, MessageCircle, Send,
  CheckCircle2, XCircle, AlertCircle
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { HumanTakeoverPanel } from "@/components/whatsapp/HumanTakeoverPanel";

interface WhatsAppInstance {
  id: string;
  instance_name: string | null;
  status: string | null;
  qr_code: string | null;
  ai_enabled: boolean | null;
  auto_response_enabled: boolean | null;
  whatsapp_level: number;
  keywords_enabled: boolean;
  welcome_message: string | null;
}

interface WhatsAppKeyword {
  id: string;
  category: string;
  keywords: string[];
  response_text: string | null;
  is_active: boolean;
}

const DEFAULT_KEYWORDS = [
  { category: 'menu', keywords: ['cardápio', 'menu', 'ver produtos'], response_text: 'Acesse nosso cardápio digital:', is_active: true },
  { category: 'order', keywords: ['fazer pedido', 'quero pedir', 'pedido'], response_text: 'Para fazer seu pedido, acesse nosso cardápio:', is_active: true },
  { category: 'hours', keywords: ['horário', 'funcionamento', 'aberto'], response_text: 'Nosso horário de funcionamento: {HORARIO}', is_active: true },
  { category: 'address', keywords: ['endereço', 'onde fica', 'localização'], response_text: 'Nosso endereço: {ENDERECO}', is_active: true },
  { category: 'delivery', keywords: ['entrega', 'delivery', 'frete'], response_text: 'Fazemos entregas! Confira as taxas no cardápio:', is_active: true },
  { category: 'human', keywords: ['atendente', 'falar com alguém', 'humano'], response_text: 'Um momento! Estou encaminhando você para um atendente. 👋', is_active: true },
];

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  menu: { label: 'Cardápio', icon: <MessageSquare className="w-4 h-4" /> },
  order: { label: 'Pedido', icon: <Send className="w-4 h-4" /> },
  hours: { label: 'Horário', icon: <MessageCircle className="w-4 h-4" /> },
  address: { label: 'Endereço', icon: <MessageCircle className="w-4 h-4" /> },
  delivery: { label: 'Entrega', icon: <Send className="w-4 h-4" /> },
  human: { label: 'Atendente', icon: <MessageCircle className="w-4 h-4" /> },
};

const WhatsAppManagement = () => {
  const { user } = useAuth();
  const { accessingEstablishmentId } = useAdminAccess();
  const { slug } = useParams();
  const [instance, setInstance] = useState<WhatsAppInstance | null>(null);
  const [keywords, setKeywords] = useState<WhatsAppKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [establishment, setEstablishment] = useState<any>(null);
  
  const { canUseWhatsappChatbot, canUseWhatsappAI } = useEstablishmentPlan(establishmentId);
  const hasChatbotAccess = canUseWhatsappChatbot();
  const hasAIAccess = canUseWhatsappAI();

  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [aiEnabled, setAiEnabled] = useState(false);
  const [keywordsEnabled, setKeywordsEnabled] = useState(true);
  const [pollingActive, setPollingActive] = useState(false);

  useEffect(() => {
    if (user || accessingEstablishmentId) fetchEstablishment();
  }, [user, slug, accessingEstablishmentId]);

  useEffect(() => {
    if (establishmentId) {
      fetchInstance();
      fetchKeywords();
    }
  }, [establishmentId]);

  // Auto-polling when connecting - check status every 5 seconds
  useEffect(() => {
    if (!instance?.instance_name || instance?.status !== 'connecting') {
      setPollingActive(false);
      return;
    }

    setPollingActive(true);
    console.log('Starting auto-polling for connection status...');

    const pollStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('evolution-api', {
          body: {
            action: 'check_status',
            instanceName: instance.instance_name,
            establishmentId,
          }
        });

        if (error) {
          console.warn('Status poll error:', error);
          return;
        }

        const state = data?.state || data?.instance?.state;
        console.log('Poll result - state:', state);

        if (state === 'open') {
          // Connected! Update database and UI
          await supabase
            .from("whatsapp_instances")
            .update({ status: 'connected', qr_code: null })
            .eq("id", instance.id);
          
          toast.success("WhatsApp conectado com sucesso!");
          fetchInstance();
          setPollingActive(false);
        } else if (state === 'close' || state === 'connecting') {
          // Still connecting, try to refresh QR code
          const { data: qrData } = await supabase.functions.invoke('evolution-api', {
            body: {
              action: 'fetch_qr',
              instanceName: instance.instance_name,
              establishmentId,
            }
          });

          const newQR = qrData?.data?.base64 || qrData?.base64 || qrData?.data?.code || qrData?.code;
          if (newQR && newQR !== instance.qr_code) {
            await supabase
              .from("whatsapp_instances")
              .update({ qr_code: newQR })
              .eq("id", instance.id);
            
            setInstance(prev => prev ? { ...prev, qr_code: newQR } : null);
            console.log('QR code updated');
          }
        }
      } catch (err) {
        console.warn('Polling error:', err);
      }
    };

    // Poll immediately
    pollStatus();

    // Then poll every 5 seconds
    const interval = setInterval(pollStatus, 5000);

    return () => {
      clearInterval(interval);
      setPollingActive(false);
    };
  }, [instance?.instance_name, instance?.status, instance?.id, establishmentId]);

  const fetchEstablishment = async () => {
    let query = supabase.from("establishments").select("id, name, slug, whatsapp_instance_name");
    
    if (accessingEstablishmentId) {
      query = query.eq("id", accessingEstablishmentId);
    } else if (slug) {
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

  const fetchInstance = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("whatsapp_instances")
      .select("*")
      .eq("establishment_id", establishmentId)
      .maybeSingle();

    if (data) {
      setInstance(data as WhatsAppInstance);
      setWelcomeMessage(data.welcome_message || "");
      setAiEnabled(data.ai_enabled || false);
      setKeywordsEnabled(data.keywords_enabled ?? true);
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
      setKeywords(DEFAULT_KEYWORDS.map((k, i) => ({ ...k, id: `temp-${i}` })) as WhatsAppKeyword[]);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setTestResult(null);
    
    try {
      // Generate instance name from establishment slug or id
      const instanceName = establishment?.whatsapp_instance_name || 
                          establishment?.slug || 
                          `instance-${establishmentId?.slice(0, 8)}`;

      console.log('Connecting instance:', instanceName);
      
      let qrCode = null;

      // Step 1: Try to create instance (may already exist)
      const { data: createData, error: createError } = await supabase.functions.invoke('evolution-api', {
        body: {
          action: 'create_instance',
          instanceName,
          establishmentId,
        }
      });

      // Check if instance already exists - this is fine, just proceed to fetch QR
      const alreadyExists = createData?.data?.alreadyExists || createData?.alreadyExists;

      if (alreadyExists) {
        console.log('Instance already exists, fetching QR code');
      } else if (createError) {
        console.error('Create error:', createError);
        // Don't throw, try to fetch QR anyway
      } else if (createData?.success === false && !createData?.error?.includes('already')) {
        console.error('Create failed:', createData);
        // Don't throw, try to fetch QR anyway
      } else {
        console.log('Instance created/exists:', createData);
        qrCode = createData?.data?.qrcode?.base64 || createData?.data?.base64 || null;
      }

      // Step 2: Always try to fetch QR code if we don't have one
      if (!qrCode) {
        console.log('Fetching QR code via connect endpoint');
        const { data: qrData, error: qrError } = await supabase.functions.invoke('evolution-api', {
          body: {
            action: 'fetch_qr',
            instanceName,
            establishmentId,
          }
        });

        if (qrError) {
          console.warn('QR fetch error:', qrError);
        } else {
          console.log('QR data received:', qrData);
          qrCode = qrData?.data?.base64 || qrData?.base64 || qrData?.data?.code || qrData?.code || null;
        }
      }

      // Create or update instance record in database
      const { data: existingInstance } = await supabase
        .from("whatsapp_instances")
        .select("id")
        .eq("establishment_id", establishmentId)
        .maybeSingle();

      if (existingInstance) {
        await supabase
          .from("whatsapp_instances")
          .update({ 
            instance_name: instanceName,
            status: qrCode ? 'connecting' : 'disconnected', 
            qr_code: qrCode
          })
          .eq("id", existingInstance.id);
      } else {
        await supabase
          .from("whatsapp_instances")
          .insert({
            establishment_id: establishmentId,
            instance_name: instanceName,
            status: qrCode ? 'connecting' : 'disconnected',
            qr_code: qrCode,
            whatsapp_level: 1,
            keywords_enabled: true,
          });
      }

      await fetchInstance();
      
      if (qrCode) {
        toast.success("Escaneie o QR Code para conectar!");
      } else {
        toast.info("Instância criada. Clique em 'Atualizar QR' para gerar o código.");
      }
    } catch (error: any) {
      console.error('Connect error:', error);
      toast.error(error.message || "Erro ao conectar. Tente novamente.");
    } finally {
      setConnecting(false);
    }
  };

  const handleRefreshQR = async () => {
    if (!instance?.instance_name) return;
    
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: {
          action: 'fetch_qr',
          instanceName: instance.instance_name,
          establishmentId,
        }
      });

      if (error) throw error;

      if (data?.qrcode?.base64) {
        await supabase
          .from("whatsapp_instances")
          .update({ qr_code: data.qrcode.base64 })
          .eq("id", instance.id);
        fetchInstance();
        toast.success("QR Code atualizado!");
      }
    } catch (error) {
      toast.error("Erro ao atualizar QR Code");
    } finally {
      setConnecting(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: {
          action: 'check_status',
          instanceName: instance?.instance_name,
          establishmentId,
        }
      });

      if (error) throw error;

      const state = data?.state || data?.instance?.state;
      
      if (state === 'open') {
        setTestResult('success');
        await supabase
          .from("whatsapp_instances")
          .update({ status: 'connected' })
          .eq("id", instance?.id);
        fetchInstance();
        toast.success("WhatsApp conectado com sucesso!");
      } else {
        setTestResult('error');
        toast.error("WhatsApp ainda não conectado. Escaneie o QR Code.");
      }
    } catch (error) {
      setTestResult('error');
      toast.error("Erro ao testar conexão");
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!instance?.instance_name) return;
    
    try {
      await supabase.functions.invoke('evolution-api', {
        body: {
          action: 'disconnect',
          instanceName: instance.instance_name,
          establishmentId,
        }
      });

      await supabase
        .from("whatsapp_instances")
        .update({ status: 'disconnected', qr_code: null })
        .eq("id", instance.id);
      
      fetchInstance();
      setTestResult(null);
      toast.success("WhatsApp desconectado");
    } catch (error) {
      toast.error("Erro ao desconectar");
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      if (instance) {
        await supabase
          .from("whatsapp_instances")
          .update({
            welcome_message: welcomeMessage,
            ai_enabled: aiEnabled,
            keywords_enabled: keywordsEnabled,
            whatsapp_level: aiEnabled ? 2 : 1,
          })
          .eq("id", instance.id);
      }

      // Save keywords
      for (const keyword of keywords) {
        if (keyword.id.startsWith('temp-')) {
          await supabase.from("whatsapp_keywords").insert({
            establishment_id: establishmentId,
            category: keyword.category,
            keywords: keyword.keywords,
            response_text: keyword.response_text,
            is_active: keyword.is_active,
          });
        } else {
          await supabase.from("whatsapp_keywords").update({
            response_text: keyword.response_text,
            is_active: keyword.is_active,
          }).eq("id", keyword.id);
        }
      }

      toast.success("Configurações salvas!");
      fetchInstance();
      fetchKeywords();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const updateKeyword = (index: number, field: keyof WhatsAppKeyword, value: any) => {
    setKeywords(prev => prev.map((k, i) => i === index ? { ...k, [field]: value } : k));
  };

  const getStatusDisplay = () => {
    switch (instance?.status) {
      case "connected":
        return (
          <div className="flex items-center gap-2 text-green-600">
            <Wifi className="w-5 h-5" />
            <span className="font-medium">Conectado</span>
            <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
              Online
            </Badge>
          </div>
        );
      case "connecting":
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium">Aguardando conexão...</span>
            {pollingActive && (
              <Badge variant="outline" className="ml-2 text-yellow-600 border-yellow-600 animate-pulse">
                Verificando a cada 5s
              </Badge>
            )}
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <WifiOff className="w-5 h-5" />
            <span className="font-medium">Desconectado</span>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <AdminLayout title="WhatsApp">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="WhatsApp">
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-green-500/10">
            <Smartphone className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">WhatsApp</h1>
            <p className="text-muted-foreground">Atendimento automático via WhatsApp</p>
          </div>
        </div>

        {/* Connection Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Conexão
                </CardTitle>
                <CardDescription>
                  Conecte seu WhatsApp Business para atendimento automático
                </CardDescription>
              </div>
              {getStatusDisplay()}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Not connected or connecting without QR - Show connect button */}
            {(!instance || instance.status === 'disconnected' || (instance.status === 'connecting' && !instance.qr_code)) && (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Smartphone className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Conecte seu WhatsApp</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Clique no botão abaixo para gerar um QR Code. 
                  Escaneie com seu WhatsApp Business para ativar o atendimento automático.
                </p>
                <Button 
                  size="lg" 
                  onClick={handleConnect} 
                  disabled={connecting}
                  className="gap-2"
                >
                  {connecting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <QrCode className="w-5 h-5" />
                  )}
                  {instance?.status === 'connecting' ? 'Gerar QR Code' : 'Conectar WhatsApp'}
                </Button>
              </div>
            )}

            {/* Connecting - Show QR Code */}
            {instance?.status === 'connecting' && instance.qr_code && (
              <div className="text-center py-4">
                <h3 className="text-lg font-semibold mb-4">Escaneie o QR Code</h3>
                <div className="bg-white p-4 rounded-xl inline-block shadow-lg mb-4">
                  <img 
                    src={instance.qr_code.startsWith('data:') ? instance.qr_code : `data:image/png;base64,${instance.qr_code}`}
                    alt="QR Code WhatsApp"
                    className="w-64 h-64"
                  />
                </div>
                <p className="text-muted-foreground mb-4">
                  Abra o WhatsApp no seu celular → Menu (⋮) → Aparelhos conectados → Conectar um aparelho
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button variant="outline" onClick={handleRefreshQR} disabled={connecting}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${connecting ? 'animate-spin' : ''}`} />
                    Atualizar QR
                  </Button>
                  <Button onClick={handleTestConnection} disabled={testing}>
                    {testing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Testar Conexão
                  </Button>
                </div>

                {testResult === 'success' && (
                  <div className="mt-4 p-3 bg-green-500/10 rounded-lg flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>WhatsApp conectado com sucesso!</span>
                  </div>
                )}
                {testResult === 'error' && (
                  <div className="mt-4 p-3 bg-red-500/10 rounded-lg flex items-center justify-center gap-2 text-red-600">
                    <XCircle className="w-5 h-5" />
                    <span>Ainda não conectado. Escaneie o QR Code primeiro.</span>
                  </div>
                )}
              </div>
            )}

            {/* Connected - Show status */}
            {instance?.status === 'connected' && (
              <div className="text-center py-4">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-green-600">WhatsApp Conectado!</h3>
                <p className="text-muted-foreground mb-6">
                  Seu atendimento automático está ativo. Configure as respostas abaixo.
                </p>
                <Button variant="outline" onClick={handleDisconnect}>
                  <WifiOff className="w-4 h-4 mr-2" />
                  Desconectar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings - Only show when connected */}
        {instance?.status === 'connected' && (
          <Tabs defaultValue="messages" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="messages" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Mensagens</span>
              </TabsTrigger>
              <TabsTrigger value="keywords" className="gap-2">
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Respostas</span>
              </TabsTrigger>
              {hasAIAccess && (
                <TabsTrigger value="ai" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">IA</span>
                </TabsTrigger>
              )}
            </TabsList>

            {/* Messages Tab */}
            <TabsContent value="messages">
              <Card>
                <CardHeader>
                  <CardTitle>Mensagem de Boas-Vindas</CardTitle>
                  <CardDescription>
                    Mensagem enviada automaticamente quando um cliente entra em contato
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Olá! 👋 Bem-vindo ao nosso estabelecimento! Como posso ajudar?"
                    rows={4}
                  />
                  <Button onClick={handleSaveSettings} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Salvar
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Keywords Tab */}
            <TabsContent value="keywords">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Respostas Automáticas</CardTitle>
                      <CardDescription>
                        Configure respostas para palavras-chave comuns
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="keywords-switch">Ativar</Label>
                      <Switch
                        id="keywords-switch"
                        checked={keywordsEnabled}
                        onCheckedChange={setKeywordsEnabled}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {keywords.map((keyword, index) => (
                    <div key={keyword.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {CATEGORY_LABELS[keyword.category]?.icon}
                          <span className="font-medium">
                            {CATEGORY_LABELS[keyword.category]?.label || keyword.category}
                          </span>
                        </div>
                        <Switch
                          checked={keyword.is_active}
                          onCheckedChange={(v) => updateKeyword(index, 'is_active', v)}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Palavras: {keyword.keywords.join(', ')}
                      </div>
                      <Textarea
                        value={keyword.response_text || ''}
                        onChange={(e) => updateKeyword(index, 'response_text', e.target.value)}
                        placeholder="Resposta automática..."
                        rows={2}
                        disabled={!keyword.is_active}
                      />
                    </div>
                  ))}
                  <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Salvar Respostas
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Tab */}
            {hasAIAccess && (
              <TabsContent value="ai">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-purple-500" />
                          Agente IA
                        </CardTitle>
                        <CardDescription>
                          Ative a inteligência artificial para atendimento avançado
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="ai-switch">Ativar IA</Label>
                        <Switch
                          id="ai-switch"
                          checked={aiEnabled}
                          onCheckedChange={setAiEnabled}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {aiEnabled ? (
                      <div className="p-4 bg-purple-500/10 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Bot className="w-8 h-8 text-purple-500 mt-1" />
                          <div>
                            <h4 className="font-medium text-purple-700 dark:text-purple-300">
                              Agente IA Ativado
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              A IA irá responder clientes automaticamente, recomendar produtos, 
                              gerenciar pedidos e processar pagamentos via PIX.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Ative a IA para habilitar atendimento inteligente 24/7
                        </p>
                      </div>
                    )}
                    <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Salvar Configurações
                    </Button>
                  </CardContent>
                </Card>

                {/* Human Takeover Panel */}
                {aiEnabled && establishmentId && (
                  <div className="mt-4">
                    <HumanTakeoverPanel 
                      establishmentId={establishmentId} 
                      instanceId={instance?.id}
                    />
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        )}

        {/* Upgrade prompt if no chatbot access */}
        {!hasChatbotAccess && (
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Recurso Premium</h3>
              <p className="text-muted-foreground mb-4">
                O atendimento via WhatsApp está disponível nos planos Premium.
                Entre em contato para fazer upgrade.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default WhatsAppManagement;
