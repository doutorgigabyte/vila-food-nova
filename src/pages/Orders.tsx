import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Package, 
  Bike,
  MessageCircle,
  RotateCcw,
  Utensils
} from "lucide-react";

// Mock orders data
const orders = [
  {
    id: 1234,
    establishment: {
      name: "Pizza do Bairro",
      logo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100",
    },
    status: "delivering",
    statusText: "Saiu para entrega",
    items: [
      { name: "Pizza Margherita", quantity: 2, price: 45.90 },
      { name: "Refrigerante 2L", quantity: 1, price: 12.90 },
    ],
    total: 110.69,
    date: "Hoje, 19:30",
    deliveryTime: "15-20 min",
  },
  {
    id: 1233,
    establishment: {
      name: "Burger House",
      logo: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=100",
    },
    status: "delivered",
    statusText: "Entregue",
    items: [
      { name: "Combo Burger Duplo", quantity: 1, price: 42.90 },
    ],
    total: 47.89,
    date: "Ontem, 20:15",
    deliveryTime: null,
  },
  {
    id: 1232,
    establishment: {
      name: "Sushi Master",
      logo: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=100",
    },
    status: "cancelled",
    statusText: "Cancelado",
    items: [
      { name: "Combo 30 Peças", quantity: 1, price: 89.90 },
    ],
    total: 97.89,
    date: "10/12/2024, 21:00",
    deliveryTime: null,
  },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return <Clock className="w-5 h-5 text-yellow-500" />;
    case "preparing":
      return <Package className="w-5 h-5 text-blue-500" />;
    case "delivering":
      return <Bike className="w-5 h-5 text-primary animate-pulse" />;
    case "delivered":
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case "cancelled":
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Clock className="w-5 h-5 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: string, statusText: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "secondary",
    preparing: "secondary",
    delivering: "default",
    delivered: "outline",
    cancelled: "destructive",
  };
  return <Badge variant={variants[status] || "secondary"}>{statusText}</Badge>;
};

const Orders = () => {
  const [activeTab, setActiveTab] = useState("all");

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return ["pending", "preparing", "delivering"].includes(order.status);
    if (activeTab === "completed") return order.status === "delivered";
    if (activeTab === "cancelled") return order.status === "cancelled";
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Link to="/marketplace" className="p-2 hover:bg-muted rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold">Meus pedidos</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="active">Ativos</TabsTrigger>
            <TabsTrigger value="completed">Concluídos</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelados</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Nenhum pedido encontrado</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {activeTab === "active" 
                    ? "Você não tem pedidos ativos no momento"
                    : "Comece a fazer pedidos para vê-los aqui"
                  }
                </p>
                <Link to="/marketplace">
                  <Button>Explorar restaurantes</Button>
                </Link>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Order Header */}
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={order.establishment.logo}
                          alt={order.establishment.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="font-medium">{order.establishment.name}</h3>
                          <p className="text-xs text-muted-foreground">{order.date}</p>
                        </div>
                      </div>
                      {getStatusBadge(order.status, order.statusText)}
                    </div>

                    {/* Order Status Progress */}
                    {order.status === "delivering" && (
                      <div className="px-4 py-3 bg-primary/5 border-b border-border">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(order.status)}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{order.statusText}</p>
                            <p className="text-xs text-muted-foreground">
                              Previsão: {order.deliveryTime}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" className="gap-2">
                            <MessageCircle className="w-4 h-4" />
                            Contato
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Order Items */}
                    <div className="p-4 space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.quantity}x {item.name}
                          </span>
                          <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-medium pt-2 border-t border-border">
                        <span>Total</span>
                        <span>R$ {order.total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Order Actions */}
                    <div className="px-4 pb-4 flex gap-2">
                      {order.status === "delivered" && (
                        <>
                          <Button variant="outline" size="sm" className="flex-1 gap-2">
                            <RotateCcw className="w-4 h-4" />
                            Pedir novamente
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            Avaliar
                          </Button>
                        </>
                      )}
                      {order.status === "cancelled" && (
                        <Button variant="outline" size="sm" className="flex-1 gap-2">
                          <RotateCcw className="w-4 h-4" />
                          Pedir novamente
                        </Button>
                      )}
                      {["pending", "preparing", "delivering"].includes(order.status) && (
                        <Link to={`/pedidos/${order.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            Ver detalhes
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Orders;
