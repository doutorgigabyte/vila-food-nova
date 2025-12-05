/**
 * PaymentRevenueChart - Gráfico de receita de pagamentos
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PaymentRevenueChartProps {
  establishmentId: string;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  count: number;
}

interface PaymentMethodStats {
  method: string;
  count: number;
  total: number;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const METHOD_LABELS: Record<string, string> = {
  pix: 'PIX',
  credit_card: 'Cartão Crédito',
  debit_card: 'Cartão Débito',
  cash: 'Dinheiro',
  card: 'Cartão',
};

export function PaymentRevenueChart({ establishmentId }: PaymentRevenueChartProps) {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<7 | 15 | 30>(7);
  const [dailyData, setDailyData] = useState<DailyRevenue[]>([]);
  const [methodData, setMethodData] = useState<PaymentMethodStats[]>([]);

  useEffect(() => {
    fetchData();
  }, [establishmentId, period]);

  const fetchData = async () => {
    if (!establishmentId) return;
    
    setLoading(true);
    try {
      const startDate = startOfDay(subDays(new Date(), period));
      const endDate = endOfDay(new Date());

      // Fetch orders for revenue data
      const { data: orders, error } = await supabase
        .from('orders')
        .select('created_at, total, payment_method, status')
        .eq('establishment_id', establishmentId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .in('status', ['confirmed', 'preparing', 'ready', 'delivering', 'delivered']);

      if (error) throw error;

      // Process daily revenue
      const dailyMap = new Map<string, { revenue: number; count: number }>();
      
      // Initialize all days with zero
      for (let i = 0; i < period; i++) {
        const date = format(subDays(new Date(), period - 1 - i), 'yyyy-MM-dd');
        dailyMap.set(date, { revenue: 0, count: 0 });
      }

      // Aggregate orders by day
      orders?.forEach((order) => {
        const date = format(new Date(order.created_at), 'yyyy-MM-dd');
        const existing = dailyMap.get(date) || { revenue: 0, count: 0 };
        dailyMap.set(date, {
          revenue: existing.revenue + (order.total || 0),
          count: existing.count + 1,
        });
      });

      const dailyArray: DailyRevenue[] = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date: format(new Date(date), 'dd/MM', { locale: ptBR }),
        revenue: data.revenue,
        count: data.count,
      }));

      setDailyData(dailyArray);

      // Process payment methods
      const methodMap = new Map<string, { count: number; total: number }>();
      orders?.forEach((order) => {
        const method = order.payment_method || 'other';
        const existing = methodMap.get(method) || { count: 0, total: 0 };
        methodMap.set(method, {
          count: existing.count + 1,
          total: existing.total + (order.total || 0),
        });
      });

      const methodArray: PaymentMethodStats[] = Array.from(methodMap.entries()).map(([method, data]) => ({
        method: METHOD_LABELS[method] || method,
        count: data.count,
        total: data.total,
      }));

      setMethodData(methodArray);
    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = dailyData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = dailyData.reduce((sum, d) => sum + d.count, 0);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Período:</span>
        {[7, 15, 30].map((days) => (
          <Button
            key={days}
            variant={period === days ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(days as 7 | 15 | 30)}
          >
            {days} dias
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Receita por Dia</CardTitle>
            <CardDescription>
              Total: R$ {totalRevenue.toFixed(2)} • {totalOrders} pedidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `R$${value}`}
                  className="text-muted-foreground"
                />
                <Tooltip
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Receita']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Métodos de Pagamento</CardTitle>
            <CardDescription>
              Distribuição por forma de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {methodData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={methodData}
                    dataKey="total"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ method, percent }) => 
                      `${method} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {methodData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `R$ ${value.toFixed(2)}`,
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Orders by Day Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pedidos por Dia</CardTitle>
            <CardDescription>
              Quantidade de pedidos no período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  formatter={(value: number) => [value, 'Pedidos']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
