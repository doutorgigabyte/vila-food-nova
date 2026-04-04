import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  DollarSign,
  Receipt,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface DebtItem {
  id: string;
  order_id: string;
  products_amount: number;
  delivery_fee: number;
  total_order: number;
  platform_product_fee: number;
  platform_service_fee: number;
  total_commission_due: number;
  status: 'pending' | 'paid' | 'deducted' | 'cancelled';
  payment_method: string | null;
  created_at: string;
  paid_at: string | null;
  order?: {
    order_number: number;
  };
}

interface DebtSummary {
  pending_count: number;
  pending_amount: number;
  paid_count: number;
  paid_amount: number;
  total_amount: number;
}

interface CommissionDebtPanelProps {
  establishmentId: string;
}

const CommissionDebtPanel = ({ establishmentId }: CommissionDebtPanelProps) => {
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [summary, setSummary] = useState<DebtSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');

  useEffect(() => {
    fetchDebts();
  }, [establishmentId]);

  const fetchDebts = async () => {
    setIsLoading(true);
    try {
      // Fetch debts with order info
      const { data: debtsData, error: debtsError } = await supabase
        .from('establishment_commission_debt')
        .select(`
          *,
          order:orders(order_number)
        `)
        .eq('establishment_id', establishmentId)
        .order('created_at', { ascending: false });

      if (debtsError) throw debtsError;

      // Calculate summary
      const pending = debtsData?.filter(d => d.status === 'pending') || [];
      const paid = debtsData?.filter(d => d.status === 'paid' || d.status === 'deducted') || [];

      setSummary({
        pending_count: pending.length,
        pending_amount: pending.reduce((sum, d) => sum + Number(d.total_commission_due), 0),
        paid_count: paid.length,
        paid_amount: paid.reduce((sum, d) => sum + Number(d.total_commission_due), 0),
        total_amount: debtsData?.reduce((sum, d) => sum + Number(d.total_commission_due), 0) || 0,
      });

      setDebts(debtsData as DebtItem[] || []);
    } catch (error) {
      console.error('Error fetching debts:', error);
      toast.error('Erro ao carregar extrato');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDebts = debts.filter(d => {
    if (filter === 'pending') return d.status === 'pending';
    if (filter === 'paid') return d.status === 'paid' || d.status === 'deducted';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pendente</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Pago</Badge>;
      case 'deducted':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Descontado</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/20">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  R$ {summary?.pending_amount.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary?.pending_count || 0} pedido(s)
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pago</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {summary?.paid_amount.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary?.paid_count || 0} pedido(s)
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Histórico</p>
                <p className="text-2xl font-bold">
                  R$ {summary?.total_amount.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Todas as comissões
                </p>
              </div>
              <Receipt className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-700 dark:text-blue-400">Como funciona o extrato de comissões</p>
              <p className="text-muted-foreground mt-1">
                Quando um pedido é pago na entrega (dinheiro ou maquininha), a comissão da plataforma 
                (5% dos produtos) é registrada aqui como pendente. 
                Essa comissão será descontada automaticamente das suas vendas online ou cobrada via boleto mensal.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Todos
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
        >
          Pendentes
        </Button>
        <Button
          variant={filter === 'paid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('paid')}
        >
          Pagos
        </Button>
      </div>

      {/* Debts List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Extrato de Comissões
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDebts.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                {filter === 'pending' 
                  ? 'Nenhuma comissão pendente'
                  : filter === 'paid'
                  ? 'Nenhuma comissão paga ainda'
                  : 'Nenhuma comissão registrada'
                }
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {filteredDebts.map((debt) => (
                  <div
                    key={debt.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          Pedido #{debt.order?.order_number || debt.order_id.slice(-8)}
                        </span>
                        {getStatusBadge(debt.status)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <span>Produtos: R$ {Number(debt.products_amount).toFixed(2)}</span>
                        {Number(debt.delivery_fee) > 0 && (
                          <span className="ml-2">• Frete: R$ {Number(debt.delivery_fee).toFixed(2)}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(debt.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${debt.status === 'pending' ? 'text-yellow-600' : 'text-green-600'}`}>
                        R$ {Number(debt.total_commission_due).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        5%: R$ {Number(debt.platform_product_fee).toFixed(2)} + Taxa: R$ {Number(debt.platform_service_fee).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionDebtPanel;
