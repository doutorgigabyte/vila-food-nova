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
  RefreshCw, 
  Unplug, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Package,
  Tag,
  Loader2,
  Link as LinkIcon,
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
    importStats,
    getStatus,
    connect,
    disconnect,
    importCatalog,
    refreshToken,
  } = useIFoodIntegration(establishment?.id);

  const [merchantId, setMerchantId] = useState("");

  useEffect(() => {
    if (establishment?.id) {
      getStatus();
    }
  }, [establishment?.id, getStatus]);

  const handleConnect = async () => {
    try {
      await connect(merchantId.trim() || undefined);
    } catch {
      // Error already handled in hook
    }
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
                
                {!connectionStatus.merchantId && (
                  <div className="space-y-2">
                    <Label htmlFor="merchantIdInput">Merchant ID (necessário para importar)</Label>
                    <Input
                      id="merchantIdInput"
                      placeholder="ID do seu merchant no iFood"
                      value={merchantId}
                      onChange={(e) => setMerchantId(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Encontre no Portal do Parceiro iFood em Configurações → Informações da Loja
                    </p>
                  </div>
                )}
                
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
            ) : (
              <div className="space-y-4">
                <Alert>
                  <AlertTitle>Conecte ao iFood</AlertTitle>
                  <AlertDescription>
                    Clique no botão abaixo para conectar sua loja ao iFood. 
                    Opcionalmente, informe o Merchant ID para poder importar o cardápio.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="merchantId">Merchant ID (opcional)</Label>
                  <Input
                    id="merchantId"
                    placeholder="ID do seu merchant no iFood"
                    value={merchantId}
                    onChange={(e) => setMerchantId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Encontre no Portal do Parceiro iFood em Configurações → Informações da Loja
                  </p>
                </div>

                <Button onClick={handleConnect} disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <LinkIcon className="w-4 h-4 mr-2" />
                  )}
                  Conectar ao iFood
                </Button>
              </div>
            )}
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
              <strong>Sincronização:</strong> A importação traz categorias e produtos do iFood para o VilaFood. 
              Produtos já importados serão atualizados.
            </p>
            <p>
              <strong>Token:</strong> O token de acesso expira periodicamente. 
              Se houver problemas, clique em "Renovar Token".
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default IFoodIntegration;
