import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MessageSquare, Bot, Smartphone, Wifi, WifiOff, RefreshCw, QrCode } from "lucide-react";

interface WhatsAppInstance {
  id: string;
  instance_name: string | null;
  instance_id: string | null;
  status: string | null;
  qr_code: string | null;
  ai_enabled: boolean | null;
  ai_prompt: string | null;
}

const WhatsAppManagement = () => {
  const { user } = useAuth();
  const [instance, setInstance] = useState<WhatsAppInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [establishmentName, setEstablishmentName] = useState<string>("");

  const [form, setForm] = useState({
    instance_name: "",
    ai_enabled: false,
    ai_prompt: "",
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
    if (establishmentId) fetchInstance();
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
      setInstance(data);
      setForm({
        instance_name: data.instance_name || "",
        ai_enabled: data.ai_enabled || false,
        ai_prompt: data.ai_prompt || defaultPrompt.replace("{NOME_ESTABELECIMENTO}", establishmentName),
      });
    } else {
      setForm({
        ...form,
        ai_prompt: defaultPrompt.replace("{NOME_ESTABELECIMENTO}", establishmentName),
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const instanceData = {
      instance_name: form.instance_name || null,
      ai_enabled: form.ai_enabled,
      ai_prompt: form.ai_prompt || null,
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
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
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
                <Button variant="outline" size="sm" disabled>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reconectar
                </Button>
              </div>

              {instance?.qr_code && instance.status !== "connected" && (
                <div className="mt-6 flex flex-col items-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Escaneie o QR Code com o WhatsApp do seu celular
                  </p>
                  <div className="p-4 bg-white rounded-lg">
                    <img
                      src={instance.qr_code}
                      alt="QR Code WhatsApp"
                      className="w-48 h-48"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instance Config */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Configuração da Instância
              </CardTitle>
              <CardDescription>
                Configure o nome da sua instância do WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instance_name">Nome da Instância</Label>
                <Input
                  id="instance_name"
                  value={form.instance_name}
                  onChange={(e) => setForm({ ...form, instance_name: e.target.value })}
                  placeholder={establishmentName.toLowerCase().replace(/\s/g, "_")}
                />
                <p className="text-xs text-muted-foreground">
                  Identificador único para sua instância (sem espaços)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI Config */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Inteligência Artificial
              </CardTitle>
              <CardDescription>
                Configure o atendimento automático com IA
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

              {form.ai_enabled && (
                <div className="space-y-2">
                  <Label htmlFor="ai_prompt">Prompt da IA</Label>
                  <Textarea
                    id="ai_prompt"
                    value={form.ai_prompt}
                    onChange={(e) => setForm({ ...form, ai_prompt: e.target.value })}
                    placeholder="Instruções para a IA..."
                    rows={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Descreva como a IA deve se comportar e quais informações ela tem acesso
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <QrCode className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-primary mb-1">Como funciona?</p>
                  <p className="text-muted-foreground">
                    A integração com WhatsApp usa a Evolution API para conectar seu número.
                    Após configurar, você poderá receber pedidos e atender clientes diretamente
                    pelo WhatsApp, com ou sem auxílio de IA.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default WhatsAppManagement;
