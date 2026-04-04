import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Loader2,
  Wallet,
  Link2,
  Link2Off,
  RefreshCw,
  AlertCircle,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface MercadoPagoOAuthProps {
  establishmentId?: string;
  context?: 'establishment' | 'admin';
  onConnected?: () => void;
}

interface EstablishmentMpData {
  id: string;
  name: string;
  mp_user_id: string | null;
  mercado_pago_token: string | null;
  mp_public_key: string | null;
  mp_refresh_token: string | null;
  mp_token_expires_at: string | null;
  pix_key: string | null;
}

export function MercadoPagoOAuth({ establishmentId, context = 'establishment', onConnected }: MercadoPagoOAuthProps) {
  const [loading, setLoading] = useState(context === 'establishment');
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [savingPix, setSavingPix] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [platformStatus, setPlatformStatus] = useState<{
    connected: boolean;
    userId?: string;
    email?: string;
    balance?: number;
  } | null>(null);
  const [establishment, setEstablishment] = useState<EstablishmentMpData | null>(null);
  const [pixKey, setPixKey] = useState('');

  useEffect(() => {
    if (establishmentId && context === 'establishment') {
      fetchEstablishment();
    }
  }, [establishmentId, context]);

  const fetchEstablishment = async () => {
    if (!establishmentId) return;
    try {
      const { data, error } = await supabase
        .from('establishments')
        .select('id, name, mp_user_id, mercado_pago_token, mp_public_key, mp_refresh_token, mp_token_expires_at, pix_key')
        .eq('id', establishmentId)
        .single();

      if (error) throw error;
      setEstablishment(data);
      setPixKey(data.pix_key || '');
    } catch (error) {
      console.error('Error fetching establishment:', error);
    } finally {
      setLoading(false);
    }
  };

  const [authUrl, setAuthUrl] = useState<string | null>(null);

  const handleConnect = async () => {
    setConnecting(true);
    setAuthUrl(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Você precisa estar logado');
        return;
      }

      const { data, error } = await supabase.functions.invoke('mercadopago-oauth', {
        body: {
          action: 'get_auth_url',
          establishment_id: establishmentId
        }
      });

      if (error) throw error;

      if (data.auth_url) {
        // Try to open in new tab first
        const newWindow = window.open(data.auth_url, '_blank');
        
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          // Popup was blocked - show URL for manual copy
          setAuthUrl(data.auth_url);
          toast.info('Popup bloqueado. Copie a URL abaixo e abra manualmente.');
        } else {
          toast.success('Janela do Mercado Pago aberta. Complete a autorização lá.');
        }
      } else {
        throw new Error('URL de autorização não retornada');
      }
    } catch (error: any) {
      console.error('Error connecting:', error);
      toast.error(error.message || 'Erro ao iniciar conexão');
    } finally {
      setConnecting(false);
    }
  };

  const handleCopyAuthUrl = () => {
    if (authUrl) {
      navigator.clipboard.writeText(authUrl);
      toast.success('URL copiada! Cole em uma nova aba.');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Tem certeza que deseja desconectar o Mercado Pago?')) return;
    
    setDisconnecting(true);
    try {
      const { error } = await supabase
        .from('establishments')
        .update({
          mercado_pago_token: null,
          mp_public_key: null,
          mp_refresh_token: null,
          mp_token_expires_at: null,
          mp_user_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', establishmentId);

      if (error) throw error;

      toast.success('Mercado Pago desconectado');
      fetchEstablishment();
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Erro ao desconectar');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleRefreshToken = async () => {
    setRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Você precisa estar logado');
        return;
      }

      const { data, error } = await supabase.functions.invoke('mercadopago-oauth', {
        body: {
          action: 'refresh_token',
          establishment_id: establishmentId
        }
      });

      if (error) throw error;

      toast.success('Token renovado com sucesso!');
      fetchEstablishment();
      onConnected?.();
    } catch (error: any) {
      console.error('Error refreshing token:', error);
      toast.error(error.message || 'Erro ao renovar token');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSavePixKey = async () => {
    setSavingPix(true);
    try {
      const { error } = await supabase
        .from('establishments')
        .update({
          pix_key: pixKey || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', establishmentId);

      if (error) throw error;

      toast.success('Chave PIX salva!');
      fetchEstablishment();
    } catch (error) {
      console.error('Error saving PIX key:', error);
      toast.error('Erro ao salvar chave PIX');
    } finally {
      setSavingPix(false);
    }
  };

  const isConnected = !!establishment?.mercado_pago_token;
  const isTokenExpired = establishment?.mp_token_expires_at 
    ? new Date(establishment.mp_token_expires_at) < new Date()
    : false;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Test platform connection
  const handleTestPlatformConnection = async () => {
    setTestingConnection(true);
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-affiliate-payout', {
        body: { action: 'check_balance' }
      });

      if (error) throw error;

      if (data.success) {
        setPlatformStatus({
          connected: true,
          userId: data.user?.id,
          email: data.user?.email,
          balance: data.balance?.available_balance
        });
        toast.success('Conexão com Mercado Pago verificada!');
      } else {
        setPlatformStatus({ connected: false });
        toast.error(data.error || 'Erro ao verificar conexão');
      }
    } catch (error: any) {
      console.error('Error testing connection:', error);
      setPlatformStatus({ connected: false });
      toast.error('Erro ao testar conexão. Verifique os secrets.');
    } finally {
      setTestingConnection(false);
    }
  };

  // Admin context - show platform-level information
  if (context === 'admin') {
    return (
      <div className="space-y-6">
        <Card className={cn(
          "border-2 transition-colors",
          platformStatus?.connected && "border-green-500/50 bg-green-500/5",
          platformStatus && !platformStatus.connected && "border-red-500/50 bg-red-500/5"
        )}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center",
                  platformStatus?.connected ? "bg-green-500/20" : "bg-blue-500/20"
                )}>
                  <img 
                    src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/6.6.92/mercadopago/logo__large@2x.png" 
                    alt="Mercado Pago" 
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div>
                  <CardTitle className="text-lg">Mercado Pago - Plataforma</CardTitle>
                  <CardDescription>Conta principal para assinaturas e pagamentos de afiliados</CardDescription>
                </div>
              </div>
              {platformStatus && (
                <Badge variant={platformStatus.connected ? 'default' : 'destructive'} className={cn(
                  platformStatus.connected && "bg-green-600"
                )}>
                  {platformStatus.connected ? (
                    <><CheckCircle2 className="w-3 h-3 mr-1" /> Conectado</>
                  ) : (
                    <><XCircle className="w-3 h-3 mr-1" /> Erro</>
                  )}
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Platform Account Status */}
            {platformStatus?.connected && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Conta Conectada
                </h4>
                <div className="grid gap-1 text-sm">
                  {platformStatus.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">E-mail</span>
                      <span className="font-mono">{platformStatus.email}</span>
                    </div>
                  )}
                  {platformStatus.userId && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">ID do Vendedor</span>
                      <span className="font-mono">{platformStatus.userId}</span>
                    </div>
                  )}
                  {platformStatus.balance !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Saldo Disponível</span>
                      <span className="font-medium text-green-700">
                        R$ {platformStatus.balance.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription>
                A conta da plataforma é usada para cobrar assinaturas dos estabelecimentos e pagar 
                comissões aos afiliados. Os secrets são gerenciados via Lovable Cloud.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleTestPlatformConnection}
              disabled={testingConnection}
              variant={platformStatus?.connected ? "outline" : "default"}
              className="w-full gap-2"
            >
              {testingConnection ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {testingConnection ? 'Verificando...' : 'Testar Conexão'}
            </Button>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm">Como funciona o fluxo de pagamentos:</h4>
              <ol className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="w-5 h-5 p-0 justify-center shrink-0 mt-0.5">1</Badge>
                  <span>Cada estabelecimento conecta seu próprio Mercado Pago via OAuth</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="w-5 h-5 p-0 justify-center shrink-0 mt-0.5">2</Badge>
                  <span>Pagamentos de clientes vão direto para o estabelecimento</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="w-5 h-5 p-0 justify-center shrink-0 mt-0.5">3</Badge>
                  <span>Taxa do marketplace (5%) é retida automaticamente via split payment</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="w-5 h-5 p-0 justify-center shrink-0 mt-0.5">4</Badge>
                  <span>Comissões de afiliados são pagas via PIX usando esta conta</span>
                </li>
              </ol>
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Secrets Configurados
              </h4>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground">MERCADOPAGO_ACCESS_TOKEN</span>
                  <Badge variant="secondary">Cobranças e Pagamentos</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground">MERCADOPAGO_CLIENT_ID</span>
                  <Badge variant="secondary">OAuth</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground">MERCADOPAGO_CLIENT_SECRET</span>
                  <Badge variant="secondary">OAuth</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Para trocar a conta, atualize o <strong>MERCADOPAGO_ACCESS_TOKEN</strong> nos secrets do projeto.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Connection Card */}
      <Card className={cn(
        "border-2 transition-colors",
        isConnected && !isTokenExpired && "border-green-500/50 bg-green-500/5",
        isConnected && isTokenExpired && "border-yellow-500/50 bg-yellow-500/5",
        !isConnected && "border-border"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center",
                isConnected && !isTokenExpired ? "bg-green-500/20" : 
                isConnected && isTokenExpired ? "bg-yellow-500/20" : "bg-blue-500/20"
              )}>
                <img 
                  src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/6.6.92/mercadopago/logo__large@2x.png" 
                  alt="Mercado Pago" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div>
                <CardTitle className="text-lg">Mercado Pago</CardTitle>
                <CardDescription>Receba pagamentos via PIX, cartão e mais</CardDescription>
              </div>
            </div>
            <Badge variant={
              isConnected && !isTokenExpired ? 'default' : 
              isConnected && isTokenExpired ? 'secondary' : 
              'outline'
            } className={cn(
              isConnected && !isTokenExpired && "bg-green-600"
            )}>
              {isConnected && !isTokenExpired ? (
                <><CheckCircle2 className="w-3 h-3 mr-1" /> Conectado</>
              ) : isConnected && isTokenExpired ? (
                <><AlertCircle className="w-3 h-3 mr-1" /> Token Expirado</>
              ) : (
                <><XCircle className="w-3 h-3 mr-1" /> Não conectado</>
              )}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!isConnected ? (
            <>
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription>
                  Conecte sua conta Mercado Pago em apenas um clique. Você será redirecionado para 
                  fazer login e autorizar o VilaFood a processar pagamentos.
                </AlertDescription>
              </Alert>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-sm">Como funciona:</h4>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <Badge variant="outline" className="w-5 h-5 p-0 justify-center shrink-0 mt-0.5">1</Badge>
                    <span>Clique em "Conectar Mercado Pago"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="outline" className="w-5 h-5 p-0 justify-center shrink-0 mt-0.5">2</Badge>
                    <span>Faça login na sua conta Mercado Pago</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="outline" className="w-5 h-5 p-0 justify-center shrink-0 mt-0.5">3</Badge>
                    <span>Autorize o VilaFood a receber pagamentos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="outline" className="w-5 h-5 p-0 justify-center shrink-0 mt-0.5">4</Badge>
                    <span>Pronto! Você já pode receber pagamentos</span>
                  </li>
                </ol>
              </div>

              <Button 
                onClick={handleConnect} 
                disabled={connecting}
                className="w-full gap-2"
                size="lg"
              >
                {connecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
                {connecting ? 'Conectando...' : 'Conectar Mercado Pago'}
              </Button>

              {/* Show URL if popup was blocked */}
              {authUrl && (
                <Alert className="bg-yellow-500/10 border-yellow-500/50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="space-y-2">
                    <p className="text-sm text-yellow-700">
                      Popup bloqueado. Copie a URL abaixo e abra em uma nova aba:
                    </p>
                    <div className="flex gap-2">
                      <Input 
                        value={authUrl} 
                        readOnly 
                        className="text-xs font-mono"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCopyAuthUrl}
                        className="shrink-0"
                      >
                        Copiar
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ou tente desativar o bloqueador de popups e clique em Conectar novamente.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              <p className="text-xs text-center text-muted-foreground">
                Não tem conta?{' '}
                <a 
                  href="https://www.mercadopago.com.br/hub/registration/landing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Criar conta grátis <ExternalLink className="w-3 h-3 inline" />
                </a>
              </p>
            </>
          ) : (
            <>
              {isTokenExpired && (
                <Alert variant="destructive" className="bg-yellow-500/10 border-yellow-500/50 text-yellow-700">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Seu token expirou. Renove para continuar recebendo pagamentos.
                  </AlertDescription>
                </Alert>
              )}

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ID do Vendedor</span>
                  <span className="text-sm font-mono">{establishment?.mp_user_id || 'N/A'}</span>
                </div>
                {establishment?.mp_token_expires_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Token expira em</span>
                    <span className="text-sm">
                      {new Date(establishment.mp_token_expires_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleRefreshToken}
                  disabled={refreshing}
                  className="flex-1 gap-2"
                >
                  {refreshing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Renovar Token
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="gap-2"
                >
                  {disconnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Link2Off className="w-4 h-4" />
                  )}
                  Desconectar
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* PIX Key Card (optional, for static PIX) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-base">Chave PIX (opcional)</CardTitle>
              <CardDescription className="text-xs">
                Para PIX estático como alternativa ao QR Code dinâmico
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pix_key">Chave PIX</Label>
            <div className="flex gap-2">
              <Input
                id="pix_key"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="CPF, e-mail, telefone ou chave aleatória"
                className="flex-1"
              />
              <Button 
                onClick={handleSavePixKey}
                disabled={savingPix || pixKey === (establishment?.pix_key || '')}
                variant="outline"
              >
                {savingPix ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Usado quando o pagamento dinâmico não estiver disponível
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
