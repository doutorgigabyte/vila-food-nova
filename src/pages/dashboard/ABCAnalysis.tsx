import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Package, DollarSign, AlertTriangle, BarChart3 } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProductABC {
  id: string;
  name: string;
  category: string;
  price: number;
  cost_price: number;
  quantity_sold: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  cumulative_percent: number;
  classification: 'A' | 'B' | 'C';
}

export default function ABCAnalysis() {
  const { slug } = useParams();
  const [period, setPeriod] = useState("30");

  const { data: establishment } = useQuery({
    queryKey: ["establishment", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("establishments")
        .select("id, name")
        .eq("slug", slug)
        .single();
      return data;
    },
  });

  const { data: abcData, isLoading } = useQuery({
    queryKey: ["abc-analysis", establishment?.id, period],
    queryFn: async () => {
      if (!establishment?.id) return null;

      const startDate = format(subDays(new Date(), parseInt(period)), "yyyy-MM-dd");
      
      // Buscar pedidos com itens
      const { data: orders } = await supabase
        .from("orders")
        .select("id, items, total, created_at")
        .eq("establishment_id", establishment.id)
        .gte("created_at", startDate)
        .in("status", ["delivered", "ready"]);

      // Buscar produtos com custo
      const { data: products } = await supabase
        .from("products")
        .select("id, name, price, cost_price, category_id, categories(name)")
        .eq("establishment_id", establishment.id);

      if (!orders || !products) return null;

      // Mapear produtos
      const productMap = new Map(products.map(p => [p.id, p]));
      
      // Calcular vendas por produto
      const salesByProduct = new Map<string, { quantity: number; revenue: number }>();
      
      orders.forEach(order => {
        const items = order.items as Array<{ product_id?: string; id?: string; quantity: number; price: number }>;
        items?.forEach(item => {
          const productId = item.product_id || item.id;
          if (!productId) return;
          
          const current = salesByProduct.get(productId) || { quantity: 0, revenue: 0 };
          salesByProduct.set(productId, {
            quantity: current.quantity + (item.quantity || 1),
            revenue: current.revenue + (item.price * (item.quantity || 1)),
          });
        });
      });

      // Calcular métricas ABC
      const totalRevenue = Array.from(salesByProduct.values()).reduce((sum, s) => sum + s.revenue, 0);
      
      const productAnalysis: ProductABC[] = [];
      
      salesByProduct.forEach((sales, productId) => {
        const product = productMap.get(productId);
        if (!product) return;
        
        const costPrice = product.cost_price || product.price * 0.4;
        const cost = costPrice * sales.quantity;
        const profit = sales.revenue - cost;
        const margin = sales.revenue > 0 ? (profit / sales.revenue) * 100 : 0;
        
        productAnalysis.push({
          id: productId,
          name: product.name,
          category: (product.categories as any)?.name || "Sem categoria",
          price: product.price,
          cost_price: costPrice,
          quantity_sold: sales.quantity,
          revenue: sales.revenue,
          cost,
          profit,
          margin,
          cumulative_percent: 0,
          classification: 'C',
        });
      });

      // Ordenar por receita (maior para menor)
      productAnalysis.sort((a, b) => b.revenue - a.revenue);

      // Calcular percentuais acumulados e classificar
      let cumulative = 0;
      productAnalysis.forEach(product => {
        cumulative += (product.revenue / totalRevenue) * 100;
        product.cumulative_percent = cumulative;
        
        if (cumulative <= 80) {
          product.classification = 'A';
        } else if (cumulative <= 95) {
          product.classification = 'B';
        } else {
          product.classification = 'C';
        }
      });

      // Calcular CMV total
      const totalCMV = productAnalysis.reduce((sum, p) => sum + p.cost, 0);
      const totalProfit = productAnalysis.reduce((sum, p) => sum + p.profit, 0);
      const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      // Contar por classificação
      const classA = productAnalysis.filter(p => p.classification === 'A');
      const classB = productAnalysis.filter(p => p.classification === 'B');
      const classC = productAnalysis.filter(p => p.classification === 'C');

      // Produtos com margem baixa
      const lowMarginProducts = productAnalysis.filter(p => p.margin < 30 && p.quantity_sold > 0);

      return {
        products: productAnalysis,
        totalRevenue,
        totalCMV,
        totalProfit,
        avgMargin,
        classA,
        classB,
        classC,
        lowMarginProducts,
        ordersCount: orders.length,
      };
    },
    enabled: !!establishment?.id,
  });

  const getClassificationColor = (classification: 'A' | 'B' | 'C') => {
    switch (classification) {
      case 'A': return 'bg-green-500';
      case 'B': return 'bg-yellow-500';
      case 'C': return 'bg-red-500';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Curva ABC & CMV</h1>
            <p className="text-muted-foreground">Análise de rentabilidade dos produtos</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(abcData?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">{abcData?.ordersCount || 0} pedidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">CMV Total</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(abcData?.totalCMV || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {abcData?.totalRevenue ? ((abcData.totalCMV / abcData.totalRevenue) * 100).toFixed(1) : 0}% do faturamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Lucro Bruto</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(abcData?.totalProfit || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Margem média: {(abcData?.avgMargin || 0).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Produtos Analisados</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{abcData?.products?.length || 0}</div>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="bg-green-100 text-green-800">A: {abcData?.classA?.length || 0}</Badge>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">B: {abcData?.classB?.length || 0}</Badge>
                <Badge variant="outline" className="bg-red-100 text-red-800">C: {abcData?.classC?.length || 0}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas de margem baixa */}
        {abcData?.lowMarginProducts && abcData.lowMarginProducts.length > 0 && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-yellow-700 dark:text-yellow-500">Alerta: Produtos com Margem Baixa</CardTitle>
              </div>
              <CardDescription>
                {abcData.lowMarginProducts.length} produtos com margem abaixo de 30%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {abcData.lowMarginProducts.slice(0, 5).map(product => (
                  <div key={product.id} className="flex justify-between items-center p-2 bg-background rounded">
                    <span className="font-medium">{product.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        Custo: {formatCurrency(product.cost_price)} | Preço: {formatCurrency(product.price)}
                      </span>
                      <Badge variant="destructive">{product.margin.toFixed(1)}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Distribuição ABC */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribuição da Curva ABC
            </CardTitle>
            <CardDescription>
              Classificação dos produtos por contribuição no faturamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Classe A */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Classe A - Produtos Estrela</span>
                  <span className="text-muted-foreground">
                    {abcData?.classA?.length || 0} produtos ({((abcData?.classA?.length || 0) / (abcData?.products?.length || 1) * 100).toFixed(0)}%)
                  </span>
                </div>
                <Progress value={80} className="bg-green-100 [&>div]:bg-green-500" />
                <p className="text-xs text-muted-foreground">
                  Responsáveis por 80% do faturamento. Manter em estoque e dar destaque.
                </p>
              </div>

              {/* Classe B */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Classe B - Produtos Intermediários</span>
                  <span className="text-muted-foreground">
                    {abcData?.classB?.length || 0} produtos ({((abcData?.classB?.length || 0) / (abcData?.products?.length || 1) * 100).toFixed(0)}%)
                  </span>
                </div>
                <Progress value={15} className="bg-yellow-100 [&>div]:bg-yellow-500" />
                <p className="text-xs text-muted-foreground">
                  Responsáveis por 15% do faturamento. Revisar preços e promoções.
                </p>
              </div>

              {/* Classe C */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Classe C - Produtos de Baixa Performance</span>
                  <span className="text-muted-foreground">
                    {abcData?.classC?.length || 0} produtos ({((abcData?.classC?.length || 0) / (abcData?.products?.length || 1) * 100).toFixed(0)}%)
                  </span>
                </div>
                <Progress value={5} className="bg-red-100 [&>div]:bg-red-500" />
                <p className="text-xs text-muted-foreground">
                  Responsáveis por 5% do faturamento. Considerar descontinuação ou promoção agressiva.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Ranking de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="A">Classe A</TabsTrigger>
                <TabsTrigger value="B">Classe B</TabsTrigger>
                <TabsTrigger value="C">Classe C</TabsTrigger>
              </TabsList>

              {['all', 'A', 'B', 'C'].map(tab => (
                <TabsContent key={tab} value={tab} className="mt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">#</th>
                          <th className="text-left p-2">Produto</th>
                          <th className="text-left p-2">Categoria</th>
                          <th className="text-right p-2">Qtd</th>
                          <th className="text-right p-2">Receita</th>
                          <th className="text-right p-2">CMV</th>
                          <th className="text-right p-2">Lucro</th>
                          <th className="text-right p-2">Margem</th>
                          <th className="text-center p-2">Classe</th>
                        </tr>
                      </thead>
                      <tbody>
                        {abcData?.products
                          ?.filter(p => tab === 'all' || p.classification === tab)
                          .map((product, index) => (
                            <tr key={product.id} className="border-b hover:bg-muted/50">
                              <td className="p-2 text-muted-foreground">{index + 1}</td>
                              <td className="p-2 font-medium">{product.name}</td>
                              <td className="p-2 text-muted-foreground">{product.category}</td>
                              <td className="p-2 text-right">{product.quantity_sold}</td>
                              <td className="p-2 text-right">{formatCurrency(product.revenue)}</td>
                              <td className="p-2 text-right text-red-600">{formatCurrency(product.cost)}</td>
                              <td className="p-2 text-right text-green-600">{formatCurrency(product.profit)}</td>
                              <td className="p-2 text-right">
                                <span className={product.margin < 30 ? 'text-red-600' : 'text-green-600'}>
                                  {product.margin.toFixed(1)}%
                                </span>
                              </td>
                              <td className="p-2 text-center">
                                <Badge className={getClassificationColor(product.classification)}>
                                  {product.classification}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
