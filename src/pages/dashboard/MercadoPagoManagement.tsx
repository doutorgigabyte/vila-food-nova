import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  CreditCard, 
  Link2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  ExternalLink,
  Wallet,
  TrendingUp,
  DollarSign
} from "lucide-react";

interface EstablishmentMpData {
  id: string;
  name: string;
  mp_user_id: string | null;
  mp_public_key: string | null;
  mp_token_expires_at: string | null;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  payer_name: string | null;
}

export default function MercadoPagoManagement() {
  const [establishment, setEstablishment] = useState<EstablishmentMpData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingAmount: 0,
    approvedCount: 0
  });

  useEffect(() => {
    fetchEstablishment();
  }, []);

  useEffect(() => {
    if (establishment?.id) {
      fetchTransactions();
    }
  }, [establishment?.id]);

  const fetchEstablishment = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('establishments')
        .select('id, name, mp_user_id, mp_public_key, mp_token_expires_at')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setEstablishment(data);
    } catch (error) {
      console.error('Error fetching establishment:', error);
      toast.error('Erro ao carregar dados do estabelecimento');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!establishment?.id) return;

    try {
      const { data, error } = await supabase
        .from('mp_transactions')
        .select('*')
        .eq('establishment_id', establishment.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);

      // Calculate stats
      const approved = (data || []).filter(t => t.status === 'approved');
      const pending = (data || []).filter(t => t.status === 'pending');
      
      setStats({
        totalSales: approved.reduce((sum, t) => sum + Number(t.amount), 0),
        pendingAmount: pending.reduce((sum, t) => sum + Number(t.amount), 0),
        approvedCount: approved.length
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleConnectMercadoPago = async () => {
    if (!establishment?.id) {
      toast.error('Estabelecimento não encontrado');
      return;
    }

    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-oauth', {
        body: {
          action: 'get_auth_url',
          establishment_id: establishment.id,
          redirect_uri: `${window.location.origin}/dashboard/mercadopago/callback`
        }
      });

      if (error) throw error;
      
      if (data?.auth_url) {
        window.location.href = data.auth_url;
      } else {
        throw new Error('URL de autorização não retornada');
      }
    } catch (error) {
      console.error('Error connecting to Mercado Pago:', error);
      toast.error('Erro ao conectar com Mercado Pago');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!establishment?.id) return;

    try {
      const { error } = await supabase
        .from('establishments')
        .update({
          mp_user_id: null,
          mp_public_key: null,
          mp_refresh_token: null,
          mp_token_expires_at: null,
          mercado_pago_token: null
        })
        .eq('id', establishment.id);

      if (error) throw error;
      
      toast.success('Mercado Pago desconectado');
      fetchEstablishment();
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Erro ao desconectar');
    }
  };

  const isConnected = !!establishment?.mp_user_id;
  const isTokenExpired = establishment?.mp_token_expires_at 
    ? new Date(establishment.mp_token_expires_at) < new Date() 
    : false;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Aprovado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!establishment) {
    return (
      <Alert>
        <AlertDescription>
          Você precisa criar um estabelecimento antes de configurar o Mercado Pago.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mercado Pago</h1>
        <p className="text-muted-foreground">
          Configure a integração com Mercado Pago para receber pagamentos
        </p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Status da Conexão
          </CardTitle>
          <CardDescription>
            Conecte sua conta do Mercado Pago para receber pagamentos diretamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <>
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="font-medium text-foreground">Conta Conectada</p>
                    <p className="text-sm text-muted-foreground">
                      ID: {establishment.mp_user_id}
                    </p>
                    {isTokenExpired && (
                      <p className="text-sm text-yellow-500">Token expirado - reconecte</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Não Conectado</p>
                    <p className="text-sm text-muted-foreground">
                      Conecte sua conta para receber pagamentos
                    </p>
                  </div>
                </>
              )}
            </div>
            
            {isConnected ? (
              <div className="flex gap-2">
                {isTokenExpired && (
                  <Button onClick={handleConnectMercadoPago} disabled={connecting}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${connecting ? 'animate-spin' : ''}`} />
                    Reconectar
                  </Button>
                )}
                <Button variant="outline" onClick={handleDisconnect}>
                  Desconectar
                </Button>
              </div>
            ) : (
              <Button onClick={handleConnectMercadoPago} disabled={connecting}>
                {connecting ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="mr-2 h-4 w-4" />
                )}
                Conectar Mercado Pago
              </Button>
            )}
          </div>

          {isConnected && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Sua conta está conectada! Você receberá automaticamente os pagamentos das vendas 
                (menos a taxa da plataforma de 5%).
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {isConnected && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total em Vendas
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                R$ {stats.totalSales.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendente
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                R$ {stats.pendingAmount.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Transações Aprovadas
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.approvedCount}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Transactions */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
            <CardDescription>
              Últimas transações processadas via Mercado Pago
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma transação encontrada
              </p>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {transaction.type === 'sale' ? 'Venda' : 
                           transaction.type === 'subscription' ? 'Assinatura' : transaction.type}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.payer_name || 'Cliente'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">
                        R$ {Number(transaction.amount).toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(transaction.status)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-primary font-bold">1</span>
              </div>
              <h3 className="font-medium text-foreground mb-1">Conecte sua conta</h3>
              <p className="text-sm text-muted-foreground">
                Autorize o acesso à sua conta do Mercado Pago via OAuth
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-primary font-bold">2</span>
              </div>
              <h3 className="font-medium text-foreground mb-1">Cliente compra</h3>
              <p className="text-sm text-muted-foreground">
                O cliente faz o pagamento via PIX, cartão ou saldo MP
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-primary font-bold">3</span>
              </div>
              <h3 className="font-medium text-foreground mb-1">Receba automaticamente</h3>
              <p className="text-sm text-muted-foreground">
                O valor (menos 5% de taxa) vai direto para sua conta
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Precisa de ajuda? Consulte a documentação do Mercado Pago
            </p>
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://www.mercadopago.com.br/developers/pt/docs" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Documentação
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
