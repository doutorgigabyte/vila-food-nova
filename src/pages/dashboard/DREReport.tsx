import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, TrendingUp, TrendingDown, DollarSign, Calculator } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DRELine {
  label: string;
  value: number;
  type: 'header' | 'item' | 'subtotal' | 'total';
  isNegative?: boolean;
  percentage?: number;
}

export default function DREReport() {
  const { slug } = useParams();
  const [period, setPeriod] = useState("current_month");
  const [compareMode, setCompareMode] = useState(false);

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

  const getDateRange = (periodKey: string) => {
    const now = new Date();
    switch (periodKey) {
      case "current_month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last_month":
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case "last_3_months":
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case "current_year":
        return { start: startOfYear(now), end: endOfYear(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const { data: dreData, isLoading } = useQuery({
    queryKey: ["dre-report", establishment?.id, period],
    queryFn: async () => {
      if (!establishment?.id) return null;

      const { start, end } = getDateRange(period);
      const startDate = format(start, "yyyy-MM-dd");
      const endDate = format(end, "yyyy-MM-dd'T'23:59:59");

      // Buscar pedidos (receita)
      const { data: orders } = await supabase
        .from("orders")
        .select("id, total, subtotal, delivery_fee, discount, items, payment_method, created_at")
        .eq("establishment_id", establishment.id)
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .in("status", ["delivered", "ready"]);

      // Buscar produtos para calcular CMV
      const { data: products } = await supabase
        .from("products")
        .select("id, cost_price, price")
        .eq("establishment_id", establishment.id);

      // Buscar despesas (cash_flow)
      const { data: expenses } = await supabase
        .from("cash_flow")
        .select("*")
        .eq("establishment_id", establishment.id)
        .eq("type", "expense")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      // Buscar receitas extras
      const { data: revenues } = await supabase
        .from("cash_flow")
        .select("*")
        .eq("establishment_id", establishment.id)
        .eq("type", "income")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (!orders) return null;

      const productMap = new Map(products?.map(p => [p.id, p]) || []);

      // ========== RECEITA BRUTA ==========
      const receitaVendas = orders.reduce((sum, o: any) => sum + (o.subtotal || o.total || 0), 0);
      const receitaDelivery = orders.reduce((sum, o: any) => sum + (o.delivery_fee || 0), 0);
      const receitaTaxaServico = 0; // Service fee tracked separately
      const outrasReceitas = revenues?.reduce((sum, r) => sum + r.amount, 0) || 0;
      const receitaBruta = receitaVendas + receitaDelivery + receitaTaxaServico + outrasReceitas;

      // ========== DEDUÇÕES ==========
      const taxaPlataforma = receitaVendas * 0.05; // 5% da plataforma
      const descontos = orders.reduce((sum, o: any) => sum + (o.discount || 0), 0);
      
      // Taxas de cartão (estimativa 2.5% para cartões)
      const vendasCartao = orders
        .filter((o: any) => o.payment_method === 'credit_card' || o.payment_method === 'debit_card')
        .reduce((sum, o: any) => sum + (o.total || 0), 0);
      const taxasCartao = vendasCartao * 0.025;
      
      const totalDeducoes = taxaPlataforma + descontos + taxasCartao;
      const receitaLiquida = receitaBruta - totalDeducoes;

      // ========== CUSTOS (CMV) ==========
      let cmvTotal = 0;
      orders.forEach((order: any) => {
        const items = order.items as Array<{ product_id?: string; id?: string; quantity: number; price: number }>;
        items?.forEach(item => {
          const productId = item.product_id || item.id;
          const product = productMap.get(productId);
          const costPrice = product?.cost_price || (item.price * 0.4); // Estimativa 40% se não tiver custo
          cmvTotal += costPrice * (item.quantity || 1);
        });
      });
      
      const custoEmbalagens = receitaVendas * 0.02; // Estimativa 2%
      const totalCustos = cmvTotal + custoEmbalagens;
      const lucroBruto = receitaLiquida - totalCustos;

      // ========== DESPESAS OPERACIONAIS ==========
      const despesasPorCategoria: Record<string, number> = {};
      expenses?.forEach(e => {
        const cat = e.category || 'outros';
        despesasPorCategoria[cat] = (despesasPorCategoria[cat] || 0) + e.amount;
      });

      const despesaPessoal = despesasPorCategoria['salarios'] || despesasPorCategoria['pessoal'] || 0;
      const despesaAluguel = despesasPorCategoria['aluguel'] || 0;
      const despesaUtilidades = (despesasPorCategoria['luz'] || 0) + (despesasPorCategoria['agua'] || 0) + (despesasPorCategoria['gas'] || 0) + (despesasPorCategoria['utilidades'] || 0);
      const despesaMarketing = despesasPorCategoria['marketing'] || despesasPorCategoria['publicidade'] || 0;
      const despesaManutencao = despesasPorCategoria['manutencao'] || 0;
      const despesaOutras = Object.entries(despesasPorCategoria)
        .filter(([k]) => !['salarios', 'pessoal', 'aluguel', 'luz', 'agua', 'gas', 'utilidades', 'marketing', 'publicidade', 'manutencao', 'juros', 'taxas_bancarias', 'financeiro'].includes(k))
        .reduce((sum, [, v]) => sum + v, 0);

      const totalDespesasOperacionais = despesaPessoal + despesaAluguel + despesaUtilidades + despesaMarketing + despesaManutencao + despesaOutras;

      // ========== DESPESAS FINANCEIRAS ==========
      const despesaJuros = despesasPorCategoria['juros'] || 0;
      const despesaTaxasBancarias = despesasPorCategoria['taxas_bancarias'] || despesasPorCategoria['financeiro'] || 0;
      const totalDespesasFinanceiras = despesaJuros + despesaTaxasBancarias;

      const lucroOperacional = lucroBruto - totalDespesasOperacionais - totalDespesasFinanceiras;

      // ========== RESULTADO FINAL ==========
      const lucroLiquido = lucroOperacional;
      const margemBruta = receitaBruta > 0 ? (lucroBruto / receitaBruta) * 100 : 0;
      const margemLiquida = receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0;

      return {
        receitaBruta,
        receitaVendas,
        receitaDelivery,
        receitaTaxaServico,
        outrasReceitas,
        totalDeducoes,
        taxaPlataforma,
        descontos,
        taxasCartao,
        receitaLiquida,
        totalCustos,
        cmvTotal,
        custoEmbalagens,
        lucroBruto,
        totalDespesasOperacionais,
        despesaPessoal,
        despesaAluguel,
        despesaUtilidades,
        despesaMarketing,
        despesaManutencao,
        despesaOutras,
        totalDespesasFinanceiras,
        despesaJuros,
        despesaTaxasBancarias,
        lucroOperacional,
        lucroLiquido,
        margemBruta,
        margemLiquida,
        ordersCount: orders.length,
        periodLabel: format(start, "MMMM yyyy", { locale: ptBR }),
      };
    },
    enabled: !!establishment?.id,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const DRELineItem = ({ label, value, type, percentage, isNegative }: DRELine) => {
    const baseClass = "flex justify-between items-center py-2 px-3";
    const typeClasses = {
      header: "bg-muted font-bold text-base",
      item: "pl-6 text-sm",
      subtotal: "font-semibold border-t",
      total: "font-bold text-base bg-muted border-t-2 border-primary",
    };

    return (
      <div className={`${baseClass} ${typeClasses[type]}`}>
        <span>{label}</span>
        <div className="flex items-center gap-4">
          {percentage !== undefined && (
            <span className="text-xs text-muted-foreground w-16 text-right">
              {percentage.toFixed(1)}%
            </span>
          )}
          <span className={`w-32 text-right ${isNegative ? 'text-red-600' : value < 0 ? 'text-red-600' : ''}`}>
            {isNegative ? `(${formatCurrency(Math.abs(value))})` : formatCurrency(value)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title="DRE - Demonstrativo de Resultado">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              DRE - Demonstrativo de Resultado
            </h1>
            <p className="text-muted-foreground">Demonstrativo de Resultado do Exercício</p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_month">Mês Atual</SelectItem>
                <SelectItem value="last_month">Mês Anterior</SelectItem>
                <SelectItem value="last_3_months">Últimos 3 Meses</SelectItem>
                <SelectItem value="current_year">Ano Atual</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Receita Bruta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dreData?.receitaBruta || 0)}</div>
              <p className="text-xs text-muted-foreground">{dreData?.ordersCount || 0} pedidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Lucro Bruto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(dreData?.lucroBruto || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Margem: {(dreData?.margemBruta || 0).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Lucro Líquido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(dreData?.lucroLiquido || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(dreData?.lucroLiquido || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Margem: {(dreData?.margemLiquida || 0).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                CMV
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(dreData?.cmvTotal || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {dreData?.receitaBruta ? ((dreData.cmvTotal / dreData.receitaBruta) * 100).toFixed(1) : 0}% da receita
              </p>
            </CardContent>
          </Card>
        </div>

        {/* DRE Completo */}
        <Card>
          <CardHeader>
            <CardTitle>Demonstrativo de Resultado - {dreData?.periodLabel}</CardTitle>
            <CardDescription>Análise vertical com percentual sobre receita bruta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {/* RECEITA BRUTA */}
            <DRELineItem label="(+) RECEITA BRUTA" value={dreData?.receitaBruta || 0} type="header" percentage={100} />
            <DRELineItem label="Vendas de Produtos" value={dreData?.receitaVendas || 0} type="item" percentage={dreData?.receitaBruta ? (dreData.receitaVendas / dreData.receitaBruta) * 100 : 0} />
            <DRELineItem label="Taxa de Entrega" value={dreData?.receitaDelivery || 0} type="item" percentage={dreData?.receitaBruta ? (dreData.receitaDelivery / dreData.receitaBruta) * 100 : 0} />
            <DRELineItem label="Taxa de Serviço" value={dreData?.receitaTaxaServico || 0} type="item" percentage={dreData?.receitaBruta ? (dreData.receitaTaxaServico / dreData.receitaBruta) * 100 : 0} />
            <DRELineItem label="Outras Receitas" value={dreData?.outrasReceitas || 0} type="item" percentage={dreData?.receitaBruta ? (dreData.outrasReceitas / dreData.receitaBruta) * 100 : 0} />

            <Separator className="my-2" />

            {/* DEDUÇÕES */}
            <DRELineItem label="(-) DEDUÇÕES DA RECEITA" value={dreData?.totalDeducoes || 0} type="header" percentage={dreData?.receitaBruta ? (dreData.totalDeducoes / dreData.receitaBruta) * 100 : 0} isNegative />
            <DRELineItem label="Taxa da Plataforma (5%)" value={dreData?.taxaPlataforma || 0} type="item" isNegative />
            <DRELineItem label="Descontos/Cupons" value={dreData?.descontos || 0} type="item" isNegative />
            <DRELineItem label="Taxas de Cartão" value={dreData?.taxasCartao || 0} type="item" isNegative />

            <DRELineItem label="(=) RECEITA LÍQUIDA" value={dreData?.receitaLiquida || 0} type="subtotal" percentage={dreData?.receitaBruta ? (dreData.receitaLiquida / dreData.receitaBruta) * 100 : 0} />

            <Separator className="my-2" />

            {/* CUSTOS */}
            <DRELineItem label="(-) CUSTOS" value={dreData?.totalCustos || 0} type="header" percentage={dreData?.receitaBruta ? (dreData.totalCustos / dreData.receitaBruta) * 100 : 0} isNegative />
            <DRELineItem label="CMV (Custo das Mercadorias)" value={dreData?.cmvTotal || 0} type="item" isNegative />
            <DRELineItem label="Embalagens" value={dreData?.custoEmbalagens || 0} type="item" isNegative />

            <DRELineItem label="(=) LUCRO BRUTO" value={dreData?.lucroBruto || 0} type="subtotal" percentage={dreData?.margemBruta} />

            <Separator className="my-2" />

            {/* DESPESAS OPERACIONAIS */}
            <DRELineItem label="(-) DESPESAS OPERACIONAIS" value={dreData?.totalDespesasOperacionais || 0} type="header" percentage={dreData?.receitaBruta ? (dreData.totalDespesasOperacionais / dreData.receitaBruta) * 100 : 0} isNegative />
            {(dreData?.despesaPessoal || 0) > 0 && <DRELineItem label="Pessoal (Salários)" value={dreData?.despesaPessoal || 0} type="item" isNegative />}
            {(dreData?.despesaAluguel || 0) > 0 && <DRELineItem label="Aluguel" value={dreData?.despesaAluguel || 0} type="item" isNegative />}
            {(dreData?.despesaUtilidades || 0) > 0 && <DRELineItem label="Utilidades (Luz, Água, Gás)" value={dreData?.despesaUtilidades || 0} type="item" isNegative />}
            {(dreData?.despesaMarketing || 0) > 0 && <DRELineItem label="Marketing" value={dreData?.despesaMarketing || 0} type="item" isNegative />}
            {(dreData?.despesaManutencao || 0) > 0 && <DRELineItem label="Manutenção" value={dreData?.despesaManutencao || 0} type="item" isNegative />}
            {(dreData?.despesaOutras || 0) > 0 && <DRELineItem label="Outras Despesas" value={dreData?.despesaOutras || 0} type="item" isNegative />}

            <Separator className="my-2" />

            {/* DESPESAS FINANCEIRAS */}
            <DRELineItem label="(-) DESPESAS FINANCEIRAS" value={dreData?.totalDespesasFinanceiras || 0} type="header" percentage={dreData?.receitaBruta ? (dreData.totalDespesasFinanceiras / dreData.receitaBruta) * 100 : 0} isNegative />
            {(dreData?.despesaJuros || 0) > 0 && <DRELineItem label="Juros" value={dreData?.despesaJuros || 0} type="item" isNegative />}
            {(dreData?.despesaTaxasBancarias || 0) > 0 && <DRELineItem label="Taxas Bancárias" value={dreData?.despesaTaxasBancarias || 0} type="item" isNegative />}

            <DRELineItem label="(=) LUCRO OPERACIONAL" value={dreData?.lucroOperacional || 0} type="subtotal" percentage={dreData?.receitaBruta ? (dreData.lucroOperacional / dreData.receitaBruta) * 100 : 0} />

            <Separator className="my-4" />

            {/* RESULTADO FINAL */}
            <DRELineItem label="(=) LUCRO LÍQUIDO" value={dreData?.lucroLiquido || 0} type="total" percentage={dreData?.margemLiquida} />
          </CardContent>
        </Card>

        {/* Dicas */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-blue-700 dark:text-blue-400 text-base">💡 Dicas para Melhorar seus Resultados</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-blue-800 dark:text-blue-300">
            {(dreData?.margemBruta || 0) < 50 && (
              <p>• Sua margem bruta está abaixo de 50%. Revise o custo dos produtos ou aumente os preços.</p>
            )}
            {(dreData?.cmvTotal || 0) > (dreData?.receitaBruta || 1) * 0.4 && (
              <p>• O CMV está acima de 40% do faturamento. Negocie com fornecedores ou revise porções.</p>
            )}
            {(dreData?.taxasCartao || 0) > (dreData?.receitaBruta || 1) * 0.02 && (
              <p>• Incentive pagamentos via PIX para reduzir taxas de cartão.</p>
            )}
            {(dreData?.lucroLiquido || 0) < 0 && (
              <p>• Atenção: você está operando no prejuízo. Revise despesas e margens urgentemente.</p>
            )}
            {(dreData?.margemLiquida || 0) >= 15 && (
              <p>• Excelente! Sua margem líquida está saudável. Continue monitorando.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
