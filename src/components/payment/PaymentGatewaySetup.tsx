import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Copy, 
  Eye, 
  EyeOff,
  Loader2,
  HelpCircle,
  CreditCard,
  Wallet,
  Building2,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export type GatewayContext = 'establishment' | 'affiliate' | 'admin';

interface PaymentGatewaySetupProps {
  context: GatewayContext;
  entityId: string;
  onConfigured?: () => void;
}

interface MercadoPagoCredentials {
  access_token: string;
  public_key: string;
  pix_key: string;
}

const MERCADO_PAGO_LINKS = {
  credentials: "https://www.mercadopago.com.br/settings/account/credentials",
  developers: "https://www.mercadopago.com.br/developers/panel/app",
  pix: "https://www.mercadopago.com.br/settings/pix-and-keys",
  signup: "https://www.mercadopago.com.br/hub/registration/landing"
};

export function PaymentGatewaySetup({ context, entityId, onConfigured }: PaymentGatewaySetupProps) {
  const [credentials, setCredentials] = useState<MercadoPagoCredentials>({
    access_token: '',
    public_key: '',
    pix_key: ''
  });
  const [showToken, setShowToken] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (entityId && context !== 'admin') {
      fetchCredentials();
    }
  }, [entityId, context]);

  const fetchCredentials = async () => {
    try {
      if (context === 'establishment') {
        const { data } = await supabase
          .from('establishments')
          .select('mercado_pago_token, mp_public_key, pix_key')
          .eq('id', entityId)
          .single();

        if (data) {
          setCredentials({
            access_token: data.mercado_pago_token || '',
            public_key: data.mp_public_key || '',
            pix_key: data.pix_key || ''
          });
          if (data.mercado_pago_token) setConnectionStatus('success');
        }
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
    }
  };

  const testConnection = async () => {
    if (!credentials.access_token) {
      toast.error('Informe o Access Token');
      return;
    }

    setTesting(true);
    setConnectionStatus('idle');

    try {
      // Test by calling MP API to get user info
      const response = await fetch('https://api.mercadopago.com/users/me', {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConnectionStatus('success');
        toast.success(`Conectado! Conta: ${data.email}`);
      } else {
        setConnectionStatus('error');
        toast.error('Token inválido ou expirado');
      }
    } catch (error) {
      setConnectionStatus('error');
      toast.error('Erro ao testar conexão');
    } finally {
      setTesting(false);
    }
  };

  const saveCredentials = async () => {
    setSaving(true);
    try {
      if (context === 'establishment') {
        const { error } = await supabase
          .from('establishments')
          .update({
            mercado_pago_token: credentials.access_token || null,
            mp_public_key: credentials.public_key || null,
            pix_key: credentials.pix_key || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', entityId);

        if (error) throw error;
      }

      toast.success('Credenciais salvas com sucesso!');
      onConfigured?.();
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast.error('Erro ao salvar credenciais');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const renderStepGuide = () => {
    if (context === 'affiliate') {
      return (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="step1">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 p-0 justify-center">1</Badge>
                Acessar sua conta Mercado Pago
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>Acesse <strong>mercadopago.com.br</strong> e faça login na sua conta.</p>
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <a href={MERCADO_PAGO_LINKS.signup} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  Criar conta (se não tiver)
                </a>
              </Button>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step2">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 p-0 justify-center">2</Badge>
                Copiar sua Chave PIX
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>Vá em <strong>"Seu perfil" → "Pix" → "Minhas Chaves"</strong></p>
              <p>Copie uma das suas chaves cadastradas (CPF, e-mail, telefone ou aleatória).</p>
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <a href={MERCADO_PAGO_LINKS.pix} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  Abrir Minhas Chaves PIX
                </a>
              </Button>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step3">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 p-0 justify-center">3</Badge>
                Colar a chave abaixo
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              <p>Cole sua chave PIX no campo abaixo para receber suas comissões automaticamente.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

    return (
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="step1">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 p-0 justify-center">1</Badge>
              Acessar sua conta Mercado Pago
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-2">
            <p>Acesse <strong>mercadopago.com.br</strong> e faça login com a conta do seu negócio.</p>
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a href={MERCADO_PAGO_LINKS.signup} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Criar conta (se não tiver)
              </a>
            </Button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="step2">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 p-0 justify-center">2</Badge>
              Acessar as Credenciais
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-2">
            <p>Vá em <strong>"Seu negócio" → "Configurações" → "Gestão e administração" → "Credenciais"</strong></p>
            <p>Ou clique no botão abaixo para ir direto:</p>
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a href={MERCADO_PAGO_LINKS.credentials} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Abrir Credenciais
              </a>
            </Button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="step3">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 p-0 justify-center">3</Badge>
              Copiar Public Key e Access Token
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-2">
            <p>Na página de credenciais, você verá:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Public Key</strong> - Começa com <code className="bg-muted px-1 rounded">APP_USR-</code> ou <code className="bg-muted px-1 rounded">TEST-</code></li>
              <li><strong>Access Token</strong> - Também começa com <code className="bg-muted px-1 rounded">APP_USR-</code> ou <code className="bg-muted px-1 rounded">TEST-</code></li>
            </ul>
            <Alert className="mt-2">
              <HelpCircle className="h-4 w-4" />
              <AlertTitle>Produção vs Teste</AlertTitle>
              <AlertDescription className="text-xs">
                Use credenciais de <strong>Produção</strong> para receber pagamentos reais.
                Use <strong>Teste</strong> apenas para desenvolvimento.
              </AlertDescription>
            </Alert>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="step4">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 p-0 justify-center">4</Badge>
              Copiar Chave PIX (opcional)
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-2">
            <p>Para PIX estático (sem QR Code dinâmico), copie também sua chave PIX.</p>
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a href={MERCADO_PAGO_LINKS.pix} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Ver Minhas Chaves PIX
              </a>
            </Button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="step5">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 p-0 justify-center">5</Badge>
              Colar e testar conexão
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            <p>Cole as credenciais nos campos abaixo e clique em <strong>"Testar Conexão"</strong> para verificar.</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  };

  // Simplified view for affiliates (only PIX key needed)
  if (context === 'affiliate') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            <CardTitle>Dados de Pagamento</CardTitle>
          </div>
          <CardDescription>Configure sua chave PIX para receber comissões</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderStepGuide()}
          
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="pix_key">Chave PIX</Label>
              <Input
                id="pix_key"
                value={credentials.pix_key}
                onChange={(e) => setCredentials({ ...credentials, pix_key: e.target.value })}
                placeholder="CPF, e-mail, telefone ou chave aleatória"
              />
              <p className="text-xs text-muted-foreground">
                Todos os pagamentos de comissão serão enviados para esta chave
              </p>
            </div>

            <Button onClick={saveCredentials} disabled={saving || !credentials.pix_key} className="w-full gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {saving ? 'Salvando...' : 'Salvar Chave PIX'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className={cn(
        "border-2 transition-colors",
        connectionStatus === 'success' && "border-green-500/50 bg-green-500/5",
        connectionStatus === 'error' && "border-red-500/50 bg-red-500/5"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                connectionStatus === 'success' ? "bg-green-500/20" : 
                connectionStatus === 'error' ? "bg-red-500/20" : "bg-blue-500/20"
              )}>
                <img 
                  src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/6.6.92/mercadopago/logo__large@2x.png" 
                  alt="Mercado Pago" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <CardTitle className="text-lg">Mercado Pago</CardTitle>
                <CardDescription>Gateway de pagamentos</CardDescription>
              </div>
            </div>
            <Badge variant={connectionStatus === 'success' ? 'default' : connectionStatus === 'error' ? 'destructive' : 'secondary'}>
              {connectionStatus === 'success' ? (
                <><CheckCircle2 className="w-3 h-3 mr-1" /> Conectado</>
              ) : connectionStatus === 'error' ? (
                <><XCircle className="w-3 h-3 mr-1" /> Erro</>
              ) : (
                'Não configurado'
              )}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Step-by-step Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Como obter as credenciais
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepGuide()}
        </CardContent>
      </Card>

      {/* Credentials Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Credenciais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="public_key">Public Key</Label>
            <Input
              id="public_key"
              value={credentials.public_key}
              onChange={(e) => setCredentials({ ...credentials, public_key: e.target.value })}
              placeholder="APP_USR-xxx ou TEST-xxx"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="access_token">Access Token</Label>
            <div className="relative">
              <Input
                id="access_token"
                type={showToken ? 'text' : 'password'}
                value={credentials.access_token}
                onChange={(e) => setCredentials({ ...credentials, access_token: e.target.value })}
                placeholder="APP_USR-xxx ou TEST-xxx"
                className="pr-20"
              />
              <div className="absolute right-1 top-1 flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                {credentials.access_token && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyToClipboard(credentials.access_token)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pix_key">Chave PIX (opcional)</Label>
            <Input
              id="pix_key"
              value={credentials.pix_key}
              onChange={(e) => setCredentials({ ...credentials, pix_key: e.target.value })}
              placeholder="CPF, CNPJ, e-mail ou telefone"
            />
            <p className="text-xs text-muted-foreground">
              Usada para PIX estático quando o cliente preferir copiar/colar
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={testConnection}
              disabled={testing || !credentials.access_token}
              className="gap-2"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Testar Conexão
            </Button>
            <Button 
              onClick={saveCredentials} 
              disabled={saving}
              className="gap-2 flex-1"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {saving ? 'Salvando...' : 'Salvar Credenciais'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Future Gateways Placeholder */}
      <Card className="border-dashed opacity-60">
        <CardContent className="py-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center gap-4 opacity-50">
              <img src="https://logodownload.org/wp-content/uploads/2019/09/pagseguro-logo-0.png" alt="PagSeguro" className="h-6 object-contain grayscale" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Stone_logo.svg/1200px-Stone_logo.svg.png" alt="Stone" className="h-6 object-contain grayscale" />
              <img src="https://logodownload.org/wp-content/uploads/2020/02/getnet-logo-0.png" alt="Getnet" className="h-6 object-contain grayscale" />
            </div>
            <p className="text-sm text-muted-foreground">
              Em breve: PagSeguro, Stone, Getnet e mais...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PaymentGatewaySetup;
