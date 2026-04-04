import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart3, TrendingUp, DollarSign, ShoppingCart, Store, Users, 
  Calendar, Download, Filter, Loader2, Package, MapPin
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";

interface ReportData {
  totalOrders: number;
  totalRevenue: number;
  avgTicket: number;
  totalEstablishments: number;
  activeEstablishments: number;
  totalUsers: number;
  ordersByStatus: { status: string; count: number }[];
  revenueByDay: { date: string; revenue: number; orders: number }[];
  topEstablishments: { name: string; orders: number; revenue: number }[];
  ordersByVila: { vila: string; orders: number }[];
}

const COLORS = ['#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedVila, setSelectedVila] = useState<string>("all");
  const [selectedEstablishment, setSelectedEstablishment] = useState<string>("all");
  const [vilas, setVilas] = useState<{ id: string; name: string }[]>([]);
  const [establishments, setEstablishments] = useState<{ id: string; name: string }[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [dateFrom, dateTo, selectedVila, selectedEstablishment]);

  const fetchFilters = async () => {
    const [vilasRes, estRes] = await Promise.all([
      supabase.from("vilas").select("id, name").eq("is_active", true),
      supabase.from("establishments").select("id, name").eq("status", "active").order("name")
    ]);

    if (vilasRes.data) setVilas(vilasRes.data);
    if (estRes.data) setEstablishments(estRes.data);
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let ordersQuery = supabase
        .from("orders")
        .select("*, establishments(name, vila_id)")
        .gte("created_at", `${dateFrom}T00:00:00`)
        .lte("created_at", `${dateTo}T23:59:59`);

      if (selectedEstablishment !== "all") {
        ordersQuery = ordersQuery.eq("establishment_id", selectedEstablishment);
      }

      const { data: orders } = await ordersQuery;

      // Filter by vila if selected
      let filteredOrders = orders || [];
      if (selectedVila !== "all") {
        filteredOrders = filteredOrders.filter(
          (o: any) => o.establishments?.vila_id === selectedVila
        );
      }

      // Calculate metrics
      const totalOrders = filteredOrders.length;
      const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Orders by status
      const statusCounts: Record<string, number> = {};
      filteredOrders.forEach((o) => {
        const status = o.status || "pending";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status: translateStatus(status),
        count
      }));

      // Revenue by day
      const revenueByDayMap: Record<string, { revenue: number; orders: number }> = {};
      filteredOrders.forEach((o) => {
        const day = format(new Date(o.created_at), 'dd/MM');
        if (!revenueByDayMap[day]) {
          revenueByDayMap[day] = { revenue: 0, orders: 0 };
        }
        revenueByDayMap[day].revenue += o.total || 0;
        revenueByDayMap[day].orders += 1;
      });
      const revenueByDay = Object.entries(revenueByDayMap).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders
      }));

      // Top establishments
      const estRevenue: Record<string, { name: string; orders: number; revenue: number }> = {};
      filteredOrders.forEach((o: any) => {
        const name = o.establishments?.name || "Desconhecido";
        if (!estRevenue[name]) {
          estRevenue[name] = { name, orders: 0, revenue: 0 };
        }
        estRevenue[name].orders += 1;
        estRevenue[name].revenue += o.total || 0;
      });
      const topEstablishments = Object.values(estRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Orders by Vila
      const vilaOrders: Record<string, number> = {};
      filteredOrders.forEach((o: any) => {
        const vilaId = o.establishments?.vila_id;
        const vilaName = vilas.find(v => v.id === vilaId)?.name || "Sem Vila";
        vilaOrders[vilaName] = (vilaOrders[vilaName] || 0) + 1;
      });
      const ordersByVila = Object.entries(vilaOrders).map(([vila, orders]) => ({
        vila,
        orders
      }));

      // Get totals
      const { count: totalEstablishments } = await supabase
        .from("establishments")
        .select("*", { count: "exact", head: true });
      
      const { count: activeEstablishments } = await supabase
        .from("establishments")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      setReportData({
        totalOrders,
        totalRevenue,
        avgTicket,
        totalEstablishments: totalEstablishments || 0,
        activeEstablishments: activeEstablishments || 0,
        totalUsers: totalUsers || 0,
        ordersByStatus,
        revenueByDay,
        topEstablishments,
        ordersByVila
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const translateStatus = (status: string) => {
    const map: Record<string, string> = {
      pending: "Pendente",
      confirmed: "Confirmado",
      preparing: "Preparando",
      ready: "Pronto",
      delivering: "Em entrega",
      delivered: "Entregue",
      cancelled: "Cancelado"
    };
    return map[status] || status;
  };

  const setQuickPeriod = (period: string) => {
    const today = new Date();
    switch (period) {
      case "today":
        setDateFrom(format(today, 'yyyy-MM-dd'));
        setDateTo(format(today, 'yyyy-MM-dd'));
        break;
      case "week":
        setDateFrom(format(subDays(today, 7), 'yyyy-MM-dd'));
        setDateTo(format(today, 'yyyy-MM-dd'));
        break;
      case "month":
        setDateFrom(format(startOfMonth(today), 'yyyy-MM-dd'));
        setDateTo(format(endOfMonth(today), 'yyyy-MM-dd'));
        break;
      case "quarter":
        setDateFrom(format(subDays(today, 90), 'yyyy-MM-dd'));
        setDateTo(format(today, 'yyyy-MM-dd'));
        break;
    }
  };

  return (
    <AdminLayout title="Relatórios">
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="w-4 h-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <Label>Vila</Label>
                <Select value={selectedVila} onValueChange={setSelectedVila}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as vilas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as vilas</SelectItem>
                    {vilas.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estabelecimento</Label>
                <Select value={selectedEstablishment} onValueChange={setSelectedEstablishment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {establishments.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Período rápido</Label>
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" onClick={() => setQuickPeriod("today")}>Hoje</Button>
                  <Button size="sm" variant="outline" onClick={() => setQuickPeriod("week")}>7d</Button>
                  <Button size="sm" variant="outline" onClick={() => setQuickPeriod("month")}>Mês</Button>
                  <Button size="sm" variant="outline" onClick={() => setQuickPeriod("quarter")}>90d</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : reportData && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Pedidos</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{reportData.totalOrders}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">Faturamento</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    R$ {reportData.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-muted-foreground">Ticket Médio</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    R$ {reportData.avgTicket.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-orange-500" />
                    <span className="text-xs text-muted-foreground">Lojas</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    {reportData.activeEstablishments}/{reportData.totalEstablishments}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-muted-foreground">Usuários</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{reportData.totalUsers}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-muted-foreground">Vilas</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{vilas.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="revenue" className="space-y-4">
              <TabsList className="flex-wrap h-auto gap-1">
                <TabsTrigger value="revenue">Faturamento</TabsTrigger>
                <TabsTrigger value="status">Por Status</TabsTrigger>
                <TabsTrigger value="top">Top Lojas</TabsTrigger>
                <TabsTrigger value="vilas">Por Vila</TabsTrigger>
              </TabsList>

              <TabsContent value="revenue">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Faturamento por Dia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reportData.revenueByDay.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={reportData.revenueByDay}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#FF6B35" 
                            strokeWidth={2}
                            dot={{ fill: '#FF6B35' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Sem dados para o período selecionado
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="status">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Pedidos por Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reportData.ordersByStatus.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={reportData.ordersByStatus}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#FF6B35" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Sem dados para o período selecionado
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="top">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Top 10 Estabelecimentos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reportData.topEstablishments.length > 0 ? (
                      <div className="space-y-3">
                        {reportData.topEstablishments.map((est, index) => (
                          <div key={est.name} className="flex items-center gap-3">
                            <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                              {index + 1}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{est.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {est.orders} pedidos
                              </p>
                            </div>
                            <p className="font-semibold text-primary">
                              R$ {est.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Sem dados para o período selecionado
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="vilas">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Pedidos por Vila</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reportData.ordersByVila.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={reportData.ordersByVila}
                            dataKey="orders"
                            nameKey="vila"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={({ vila, orders }) => `${vila}: ${orders}`}
                          >
                            {reportData.ordersByVila.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Sem dados para o período selecionado
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
