import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Cake, Gift, Send, Calendar, Phone, Mail, User, PartyPopper, Clock } from "lucide-react";
import { format, isToday, isTomorrow, isThisWeek, isThisMonth, parseISO, getDate, getMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
  total_orders?: number;
  last_order_date?: string;
  hasGreeting?: boolean;
}

export default function BirthdayList() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [greetingMessage, setGreetingMessage] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const { data: customers, isLoading } = useQuery({
    queryKey: ["birthday-customers", establishment?.id],
    queryFn: async () => {
      if (!establishment?.id) return [];

      // Buscar clientes com data de nascimento
      const { data: customersData } = await supabase
        .from("customers")
        .select("id, name, phone, email, birth_date")
        .eq("establishment_id", establishment.id)
        .not("birth_date", "is", null);

      if (!customersData) return [];

      // Buscar felicitações já enviadas este ano
      const currentYear = new Date().getFullYear();
      const { data: greetings } = await supabase
        .from("birthday_greetings")
        .select("customer_id")
        .eq("establishment_id", establishment.id)
        .eq("year", currentYear);

      const greetedCustomerIds = new Set(greetings?.map(g => g.customer_id) || []);

      // Buscar pedidos para contagem
      const { data: orders } = await supabase
        .from("orders")
        .select("customer_phone, created_at")
        .eq("establishment_id", establishment.id)
        .in("status", ["delivered"]);

      const ordersByPhone = new Map<string, { count: number; lastDate: string }>();
      orders?.forEach(order => {
        if (!order.customer_phone) return;
        const current = ordersByPhone.get(order.customer_phone);
        if (!current || order.created_at > current.lastDate) {
          ordersByPhone.set(order.customer_phone, {
            count: (current?.count || 0) + 1,
            lastDate: order.created_at,
          });
        }
      });

      return customersData.map(customer => ({
        ...customer,
        total_orders: customer.phone ? ordersByPhone.get(customer.phone)?.count || 0 : 0,
        last_order_date: customer.phone ? ordersByPhone.get(customer.phone)?.lastDate : undefined,
        hasGreeting: greetedCustomerIds.has(customer.id),
      }));
    },
    enabled: !!establishment?.id,
  });

  const sendGreetingMutation = useMutation({
    mutationFn: async (data: { customerId: string; message: string; couponCode?: string }) => {
      const currentYear = new Date().getFullYear();
      
      // Registrar felicitação
      const { error } = await supabase
        .from("birthday_greetings")
        .insert({
          customer_id: data.customerId,
          establishment_id: establishment?.id,
          year: currentYear,
          message: data.message,
          coupon_code: data.couponCode || null,
        });

      if (error) throw error;

      // TODO: Integrar com WhatsApp para envio automático
      // Por enquanto, apenas registra

      return true;
    },
    onSuccess: () => {
      toast.success("Felicitação registrada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["birthday-customers"] });
      setIsDialogOpen(false);
      setSelectedCustomer(null);
      setGreetingMessage("");
      setCouponCode("");
    },
    onError: () => {
      toast.error("Erro ao registrar felicitação");
    },
  });

  const isBirthdayToday = (birthDate: string) => {
    const today = new Date();
    const birth = parseISO(birthDate);
    return getDate(birth) === getDate(today) && getMonth(birth) === getMonth(today);
  };

  const isBirthdayThisWeek = (birthDate: string) => {
    const today = new Date();
    const birth = parseISO(birthDate);
    const birthThisYear = new Date(today.getFullYear(), getMonth(birth), getDate(birth));
    return isThisWeek(birthThisYear, { locale: ptBR });
  };

  const isBirthdayThisMonth = (birthDate: string) => {
    const today = new Date();
    const birth = parseISO(birthDate);
    return getMonth(birth) === getMonth(today);
  };

  const filterCustomers = (filter: string) => {
    if (!customers) return [];
    
    switch (filter) {
      case "today":
        return customers.filter(c => c.birth_date && isBirthdayToday(c.birth_date));
      case "week":
        return customers.filter(c => c.birth_date && isBirthdayThisWeek(c.birth_date));
      case "month":
        return customers.filter(c => c.birth_date && isBirthdayThisMonth(c.birth_date));
      default:
        return customers.sort((a, b) => {
          if (!a.birth_date || !b.birth_date) return 0;
          const aDate = parseISO(a.birth_date);
          const bDate = parseISO(b.birth_date);
          const today = new Date();
          const aThisYear = new Date(today.getFullYear(), getMonth(aDate), getDate(aDate));
          const bThisYear = new Date(today.getFullYear(), getMonth(bDate), getDate(bDate));
          if (aThisYear < today) aThisYear.setFullYear(today.getFullYear() + 1);
          if (bThisYear < today) bThisYear.setFullYear(today.getFullYear() + 1);
          return aThisYear.getTime() - bThisYear.getTime();
        });
    }
  };

  const todayBirthdays = filterCustomers("today");
  const weekBirthdays = filterCustomers("week");
  const monthBirthdays = filterCustomers("month");

  const openGreetingDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setGreetingMessage(`🎂 Feliz Aniversário, ${customer.name.split(' ')[0]}! 🎉\n\nA equipe ${establishment?.name} deseja um dia muito especial!\n\nComo presente, use o cupom ANIVERSARIO para 10% de desconto no seu próximo pedido!`);
    setCouponCode("ANIVERSARIO10");
    setIsDialogOpen(true);
  };

  const CustomerCard = ({ customer }: { customer: Customer }) => (
    <Card className={`${customer.hasGreeting ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 bg-primary/10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{customer.name}</h4>
                {isBirthdayToday(customer.birth_date!) && (
                  <Badge className="bg-pink-500">
                    <PartyPopper className="h-3 w-3 mr-1" />
                    Hoje!
                  </Badge>
                )}
                {customer.hasGreeting && (
                  <Badge variant="outline" className="text-green-600">
                    Felicitado
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(parseISO(customer.birth_date!), "dd/MM", { locale: ptBR })}
                </span>
                {customer.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {customer.phone}
                  </span>
                )}
                {customer.total_orders !== undefined && customer.total_orders > 0 && (
                  <span className="flex items-center gap-1">
                    <Gift className="h-3 w-3" />
                    {customer.total_orders} pedidos
                  </span>
                )}
              </div>
            </div>
          </div>
          {!customer.hasGreeting && (
            <Button 
              size="sm" 
              onClick={() => openGreetingDialog(customer)}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Felicitar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Cake className="h-6 w-6 text-pink-500" />
              Lista de Aniversariantes
            </h1>
            <p className="text-muted-foreground">Parabenize seus clientes e ofereça descontos especiais</p>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={todayBirthdays.length > 0 ? "border-pink-500 bg-pink-50 dark:bg-pink-950/20" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PartyPopper className="h-4 w-4 text-pink-500" />
                Aniversariantes Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-pink-600">{todayBirthdays.length}</div>
              <p className="text-xs text-muted-foreground">
                {todayBirthdays.filter(c => !c.hasGreeting).length} aguardando felicitação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Esta Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{weekBirthdays.length}</div>
              <p className="text-xs text-muted-foreground">próximos aniversariantes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Este Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{monthBirthdays.length}</div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(), "MMMM", { locale: ptBR })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de aniversariantes */}
        <Card>
          <CardHeader>
            <CardTitle>Aniversariantes</CardTitle>
            <CardDescription>
              Clientes cadastrados com data de nascimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="today">
              <TabsList>
                <TabsTrigger value="today" className="gap-2">
                  Hoje
                  {todayBirthdays.length > 0 && (
                    <Badge variant="destructive" className="ml-1">{todayBirthdays.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="week">Esta Semana</TabsTrigger>
                <TabsTrigger value="month">Este Mês</TabsTrigger>
                <TabsTrigger value="all">Todos</TabsTrigger>
              </TabsList>

              {['today', 'week', 'month', 'all'].map(tab => (
                <TabsContent key={tab} value={tab} className="mt-4">
                  <div className="space-y-3">
                    {filterCustomers(tab).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Cake className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>Nenhum aniversariante {tab === 'today' ? 'hoje' : tab === 'week' ? 'esta semana' : tab === 'month' ? 'este mês' : 'cadastrado'}</p>
                      </div>
                    ) : (
                      filterCustomers(tab).map(customer => (
                        <CustomerCard key={customer.id} customer={customer} />
                      ))
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Dialog de felicitação */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-pink-500" />
                Enviar Felicitação
              </DialogTitle>
              <DialogDescription>
                Envie uma mensagem de aniversário para {selectedCustomer?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea
                  value={greetingMessage}
                  onChange={(e) => setGreetingMessage(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label>Código do Cupom (opcional)</Label>
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Ex: ANIVERSARIO10"
                />
                <p className="text-xs text-muted-foreground">
                  Certifique-se de criar o cupom antes em Cupons & Promoções
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (selectedCustomer) {
                    sendGreetingMutation.mutate({
                      customerId: selectedCustomer.id,
                      message: greetingMessage,
                      couponCode: couponCode || undefined,
                    });
                  }
                }}
                disabled={sendGreetingMutation.isPending}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {sendGreetingMutation.isPending ? "Enviando..." : "Registrar Felicitação"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
