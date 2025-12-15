import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useUserEstablishment } from "@/hooks/useDashboardData";
import { useIFoodIntegration } from "@/hooks/useIFoodIntegration";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  ExternalLink, 
  RefreshCw, 
  Unplug, 
  Download, 
  Copy, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Package,
  Tag,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const IFoodIntegration = () => {
  const { slug } = useParams();
  const { establishment, loading: loadingEst } = useUserEstablishment();
  const {
    loading,
    importing,
    connectionStatus,
    userCodeData,
    importStats,
    getStatus,
    generateUserCode,
    exchangeToken,
    disconnect,
    importCatalog,
    refreshToken,
    setUserCodeData,
  } = useIFoodIntegration(establishment?.id);

  const [authCode, setAuthCode] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [step, setStep] = useState<'idle' | 'authorizing' | 'entering_code'>('idle');

  useEffect(() => {
    if (establishment?.id) {
      getStatus();
    }
  }, [establishment?.id, getStatus]);

  const handleStartConnection = async () => {
    try {
      await generateUserCode();
      setStep('authorizing');
    } catch {
      // Error already handled in hook
    }
  };

  const handleCopyCode = () => {
    if (userCodeData?.userCode) {
      navigator.clipboard.writeText(userCodeData.userCode);
      toast.success('Código copiado!');
    }
  };

  const handleOpenVerification = () => {
    if (userCodeData?.verificationUrlComplete) {
      window.open(userCodeData.verificationUrlComplete, '_blank');
      setStep('entering_code');
    }
  };

  const handleExchangeToken = async () => {
    if (!authCode.trim()) {
      toast.error('Insira o código de autorização');
      return;
    }
    try {
      await exchangeToken(authCode.trim(), merchantId.trim() || undefined);
      setStep('idle');
      setAuthCode("");
      setMerchantId("");
    } catch {
      // Error already handled in hook
    }
  };

  const handleCancel = () => {
    setStep('idle');
    setUserCodeData(null);
    setAuthCode("");
    setMerchantId("");
  };

  const handleDisconnect = async () => {
    if (confirm('Tem certeza que deseja desconectar o iFood?')) {
      await disconnect();
    }
  };

  const handleImport = async () => {
    const id = connectionStatus?.merchantId || merchantId.trim();
    if (!id) {
      toast.error('Insira o Merchant ID do iFood');
      return;
    }
    await importCatalog(id);
  };

  const getStatusBadge = () => {
    switch (connectionStatus?.status) {
      case 'connected':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Conectado</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Aguardando</Badge>;
      case 'expired':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Expirado</Badge>;
      case 'revoked':
        return <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" /> Desconectado</Badge>;
      default:
        return <Badge variant="outline">Não conectado</Badge>;
    }
  };

  if (loadingEst) {
    return (
      <DashboardLayout title="Integração iFood" establishment={establishment}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Integração iFood" establishment={establishment}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Integração iFood</h1>
          <p className="text-muted-foreground">
            Conecte sua loja ao iFood para importar seu cardápio automaticamente
          </p>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg">Status da Conexão</CardTitle>
              <CardDescription>
                Estado atual da integração com o iFood
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={getStatus}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {connectionStatus?.connected ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Merchant ID:</span>
                    <p className="font-medium">{connectionStatus.merchantId || 'Não definido'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Última sincronização:</span>
                    <p className="font-medium">
                      {connectionStatus.lastSyncAt 
                        ? format(new Date(connectionStatus.lastSyncAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                        : 'Nunca'}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleImport} disabled={importing}>
                    {importing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Importar Cardápio
                  </Button>
                  <Button variant="outline" onClick={refreshToken} disabled={loading}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Renovar Token
                  </Button>
                  <Button variant="destructive" onClick={handleDisconnect} disabled={loading}>
                    <Unplug className="w-4 h-4 mr-2" />
                    Desconectar
                  </Button>
                </div>
              </div>
            ) : step === 'idle' ? (
              <div className="space-y-4">
                <Alert>
                  <AlertTitle>Como funciona?</AlertTitle>
                  <AlertDescription>
                    <ol className="list-decimal list-inside space-y-1 mt-2 text-sm">
                      <li>Clique em "Iniciar Conexão" para gerar um código</li>
                      <li>Acesse o Portal do Parceiro iFood e autorize o aplicativo</li>
                      <li>Cole o código de autorização recebido</li>
                      <li>Importe seu cardápio automaticamente</li>
                    </ol>
                  </AlertDescription>
                </Alert>
                <Button onClick={handleStartConnection} disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4 mr-2" />
                  )}
                  Iniciar Conexão
                </Button>
              </div>
            ) : step === 'authorizing' && userCodeData ? (
              <div className="space-y-4">
                <Alert className="bg-primary/5 border-primary/20">
                  <AlertTitle>Passo 1: Copie o código abaixo</AlertTitle>
                  <AlertDescription className="mt-2">
                    <div className="flex items-center gap-2 mt-2">
                      <code className="px-4 py-2 bg-muted rounded-lg text-xl font-mono tracking-wider">
                        {userCodeData.userCode}
                      </code>
                      <Button variant="outline" size="sm" onClick={handleCopyCode}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <AlertTitle>Passo 2: Autorize no Portal iFood</AlertTitle>
                  <AlertDescription>
                    <p className="text-sm mt-1">
                      Clique no botão abaixo para abrir o Portal do Parceiro iFood.
                      Faça login e cole o código acima para autorizar o VilaFood.
                    </p>
                    <Button className="mt-3" onClick={handleOpenVerification}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir Portal iFood
                    </Button>
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : step === 'entering_code' ? (
              <div className="space-y-4">
                <Alert className="bg-green-500/10 border-green-500/20">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <AlertTitle>Passo 3: Cole o código de autorização</AlertTitle>
                  <AlertDescription>
                    <p className="text-sm mt-1">
                      Após autorizar no Portal iFood, você receberá um código de autorização.
                      Cole-o abaixo para concluir a conexão.
                    </p>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="authCode">Código de Autorização *</Label>
                    <Input
                      id="authCode"
                      placeholder="Cole o authorization code aqui"
                      value={authCode}
                      onChange={(e) => setAuthCode(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="merchantId">Merchant ID (opcional)</Label>
                    <Input
                      id="merchantId"
                      placeholder="ID do seu merchant no iFood"
                      value={merchantId}
                      onChange={(e) => setMerchantId(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Você pode encontrar isso no Portal do Parceiro iFood
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleExchangeToken} disabled={loading || !authCode.trim()}>
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Conectar
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Import Stats Card */}
        {(importing || importStats) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resultado da Importação</CardTitle>
            </CardHeader>
            <CardContent>
              {importing ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span>Importando cardápio do iFood...</span>
                  </div>
                  <Progress value={33} className="h-2" />
                </div>
              ) : importStats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Tag className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{importStats.categoriesImported}</p>
                      <p className="text-xs text-muted-foreground">Categorias novas</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Tag className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                      <p className="text-2xl font-bold">{importStats.categoriesUpdated}</p>
                      <p className="text-xs text-muted-foreground">Categorias atualizadas</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Package className="w-6 h-6 mx-auto mb-2 text-green-500" />
                      <p className="text-2xl font-bold">{importStats.productsImported}</p>
                      <p className="text-xs text-muted-foreground">Produtos novos</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Package className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                      <p className="text-2xl font-bold">{importStats.productsUpdated}</p>
                      <p className="text-xs text-muted-foreground">Produtos atualizados</p>
                    </div>
                  </div>

                  {importStats.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="w-4 h-4" />
                      <AlertTitle>Alguns erros ocorreram</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside text-sm mt-2">
                          {importStats.errors.slice(0, 5).map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                          {importStats.errors.length > 5 && (
                            <li>...e mais {importStats.errors.length - 5} erros</li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {/* Help Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Precisa de ajuda?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Merchant ID:</strong> É o identificador único da sua loja no iFood. 
              Você pode encontrá-lo no Portal do Parceiro iFood, nas configurações da sua loja.
            </p>
            <p>
              <strong>Código de Autorização:</strong> Após autorizar o VilaFood no Portal do Parceiro, 
              o iFood exibirá um código que você deve colar aqui para concluir a conexão.
            </p>
            <p>
              <strong>Sincronização:</strong> A importação traz categorias e produtos do iFood para o VilaFood. 
              Produtos já importados serão atualizados.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default IFoodIntegration;
