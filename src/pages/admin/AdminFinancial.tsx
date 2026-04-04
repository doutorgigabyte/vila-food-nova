import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { 
  DollarSign, TrendingUp, CreditCard, Wallet, ArrowUpRight, ArrowDownRight,
  Loader2, CheckCircle, XCircle, Clock, Store, Users, PiggyBank, Receipt,
  RefreshCw, AlertCircle
} from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { toast } from "sonner";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  platform_fee: number;
  net_amount: number;
  status: string;
  mp_payment_id: string;
  payer_email: string;
  payer_name: string;
  created_at: string;
  establishment_id: string | null;
  establishments?: { name: string } | null;
}

interface FinancialSummary {
  totalRevenue: number;
  platformFees: number;
  pendingPayments: number;
  approvedPayments: number;
  affiliatePayouts: number;
  subscriptionRevenue: number;
  transactionCount: number;
}

const AdminFinancial = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, [dateFrom, dateTo, statusFilter, typeFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("mp_transactions")
        .select("*, establishments(name)")
        .gte("created_at", `${dateFrom}T00:00:00`)
        .lte("created_at", `${dateTo}T23:59:59`)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTransactions(data || []);

      // Calculate summary
      const totalRevenue = data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const platformFees = data?.reduce((sum, t) => sum + (t.platform_fee || 0), 0) || 0;
      const pendingPayments = data?.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0) || 0;
      const approvedPayments = data?.filter(t => t.status === 'approved').reduce((sum, t) => sum + t.amount, 0) || 0;
      const subscriptionRevenue = data?.filter(t => t.type === 'subscription').reduce((sum, t) => sum + t.amount, 0) || 0;

      // Get affiliate payouts
      const { data: payouts } = await supabase
        .from("affiliate_payouts")
        .select("amount")
        .eq("status", "completed")
        .gte("created_at", `${dateFrom}T00:00:00`)
        .lte("created_at", `${dateTo}T23:59:59`);

      const affiliatePayouts = payouts?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      setSummary({
        totalRevenue,
        platformFees,
        pendingPayments,
        approvedPayments,
        affiliatePayouts,
        subscriptionRevenue,
        transactionCount: data?.length || 0,
      });

      // Build chart data
      const dailyData: Record<string, { revenue: number; fees: number }> = {};
      data?.forEach(t => {
        const day = format(new Date(t.created_at), 'dd/MM');
        if (!dailyData[day]) {
          dailyData[day] = { revenue: 0, fees: 0 };
        }
        dailyData[day].revenue += t.amount || 0;
        dailyData[day].fees += t.platform_fee || 0;
      });

      setChartData(Object.entries(dailyData).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        fees: data.fees,
      })));

    } catch (error: any) {
      console.error("Error fetching financial data:", error);
      toast.error("Erro ao carregar dados financeiros");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'rejected':
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'subscription':
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Assinatura</Badge>;
      case 'sale':
        return <Badge variant="outline" className="border-green-500 text-green-600">Venda</Badge>;
      case 'multi_split':
        return <Badge variant="outline" className="border-purple-500 text-purple-600">Multi-Split</Badge>;
      case 'pix':
        return <Badge variant="outline" className="border-cyan-500 text-cyan-600">PIX</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <AdminLayout title="Financeiro">
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>De</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Até</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="subscription">Assinatura</SelectItem>
                    <SelectItem value="sale">Venda</SelectItem>
                    <SelectItem value="multi_split">Multi-Split</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">Receita Total</span>
                  </div>
                  <p className="text-xl font-bold mt-1">
                    R$ {summary?.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <PiggyBank className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Taxa Plataforma</span>
                  </div>
                  <p className="text-xl font-bold mt-1">
                    R$ {summary?.platformFees.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">Aprovados</span>
                  </div>
                  <p className="text-xl font-bold mt-1">
                    R$ {summary?.approvedPayments.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs text-muted-foreground">Pendentes</span>
                  </div>
                  <p className="text-xl font-bold mt-1">
                    R$ {summary?.pendingPayments.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-muted-foreground">Assinaturas</span>
                  </div>
                  <p className="text-xl font-bold mt-1">
                    R$ {summary?.subscriptionRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-muted-foreground">Afiliados</span>
                  </div>
                  <p className="text-xl font-bold mt-1">
                    R$ {summary?.affiliatePayouts.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Transações</span>
                  </div>
                  <p className="text-xl font-bold mt-1">
                    {summary?.transactionCount || 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Receita por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#FF6B35" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          `R$ ${value.toFixed(2)}`, 
                          name === 'revenue' ? 'Receita' : 'Taxa'
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#22c55e" 
                        fill="url(#colorRevenue)" 
                        strokeWidth={2}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="fees" 
                        stroke="#FF6B35" 
                        fill="url(#colorFees)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Sem dados para o período selecionado
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Transações</CardTitle>
                  <CardDescription>Histórico de pagamentos Mercado Pago</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma transação encontrada</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Estabelecimento</TableHead>
                          <TableHead>Pagador</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="text-right">Taxa</TableHead>
                          <TableHead className="text-right">Líquido</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(t.created_at), "dd/MM/yy HH:mm")}
                            </TableCell>
                            <TableCell>{getTypeBadge(t.type)}</TableCell>
                            <TableCell>{getStatusBadge(t.status)}</TableCell>
                            <TableCell className="max-w-[150px] truncate">
                              {t.establishments?.name || '-'}
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate">
                              {t.payer_name || t.payer_email || '-'}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              R$ {t.amount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              R$ {(t.platform_fee || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-medium text-green-600">
                              R$ {(t.net_amount || 0).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Integration Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Status da Integração Mercado Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">PIX Dinâmico</p>
                      <p className="text-xs text-muted-foreground">Geração de QR Code via API</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">Split de Pagamento</p>
                      <p className="text-xs text-muted-foreground">Divisão automática 5% plataforma</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">Multi-Split (Vila)</p>
                      <p className="text-xs text-muted-foreground">Pagamento único, múltiplas lojas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">Assinaturas SaaS</p>
                      <p className="text-xs text-muted-foreground">Cobrança recorrente de lojistas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">Webhook Ativo</p>
                      <p className="text-xs text-muted-foreground">Notificações automáticas de pagamento</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">Payout Afiliados</p>
                      <p className="text-xs text-muted-foreground">Pagamento via PIX automático</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFinancial;
