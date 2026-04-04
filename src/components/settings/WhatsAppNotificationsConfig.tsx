import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle,
  ShoppingBag,
  Truck,
  CreditCard,
  Star,
  AlertTriangle,
  Clock,
  CheckCircle2
} from "lucide-react";

interface NotificationType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  priority: "alta" | "média" | "baixa";
}

interface WhatsAppNotificationsConfigProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  notifications: Record<string, boolean>;
  onNotificationChange: (id: string, enabled: boolean) => void;
}

export const WhatsAppNotificationsConfig = ({
  enabled,
  onEnabledChange,
  notifications,
  onNotificationChange
}: WhatsAppNotificationsConfigProps) => {
  const notificationTypes: NotificationType[] = [
    {
      id: "new_order",
      name: "Novo Pedido Recebido",
      description: "Quando um cliente faz um novo pedido",
      icon: <ShoppingBag className="w-4 h-4" />,
      enabled: notifications.new_order ?? true,
      priority: "alta"
    },
    {
      id: "order_ready",
      name: "Pedido Pronto para Entrega",
      description: "Quando o pedido é marcado como pronto na cozinha",
      icon: <CheckCircle2 className="w-4 h-4" />,
      enabled: notifications.order_ready ?? true,
      priority: "média"
    },
    {
      id: "payment_confirmed",
      name: "Pagamento Confirmado",
      description: "Quando um pagamento PIX ou cartão é aprovado",
      icon: <CreditCard className="w-4 h-4" />,
      enabled: notifications.payment_confirmed ?? true,
      priority: "alta"
    },
    {
      id: "delivery_assigned",
      name: "Entregador Aceito",
      description: "Quando um entregador aceita a corrida",
      icon: <Truck className="w-4 h-4" />,
      enabled: notifications.delivery_assigned ?? false,
      priority: "média"
    },
    {
      id: "delivery_completed",
      name: "Entrega Concluída",
      description: "Quando o pedido é entregue ao cliente",
      icon: <CheckCircle2 className="w-4 h-4" />,
      enabled: notifications.delivery_completed ?? false,
      priority: "baixa"
    },
    {
      id: "review_received",
      name: "Avaliação Recebida",
      description: "Quando um cliente avalia o pedido",
      icon: <Star className="w-4 h-4" />,
      enabled: notifications.review_received ?? false,
      priority: "baixa"
    },
    {
      id: "low_stock",
      name: "Estoque Baixo",
      description: "Quando um produto atinge estoque mínimo",
      icon: <AlertTriangle className="w-4 h-4" />,
      enabled: notifications.low_stock ?? false,
      priority: "média"
    },
    {
      id: "scheduled_order",
      name: "Pedido Agendado",
      description: "Lembrete de pedidos agendados para o dia",
      icon: <Clock className="w-4 h-4" />,
      enabled: notifications.scheduled_order ?? false,
      priority: "média"
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta": return "bg-red-500/10 text-red-500 border-red-500/30";
      case "média": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
      case "baixa": return "bg-green-500/10 text-green-500 border-green-500/30";
      default: return "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-green-500" />
          Alertas para Você (WhatsApp)
        </CardTitle>
        <CardDescription>
          Receba alertas de novos pedidos e eventos importantes diretamente no seu WhatsApp pessoal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-green-500/5 border-green-500/20">
          <div>
            <p className="font-medium flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-green-500" />
              Ativar Notificações WhatsApp
            </p>
            <p className="text-sm text-muted-foreground">
              Receber mensagens no número cadastrado
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>

        {/* Notification Types */}
        {enabled && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Selecione quais notificações receber:</Label>
            
            <div className="space-y-2">
              {notificationTypes.map((notif) => (
                <div 
                  key={notif.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      {notif.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{notif.name}</p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPriorityColor(notif.priority)}`}
                        >
                          {notif.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{notif.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications[notif.id] ?? notif.enabled}
                    onCheckedChange={(checked) => onNotificationChange(notif.id, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {!enabled && (
          <div className="p-4 border rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground text-center">
              Ative as notificações por WhatsApp para ver as opções disponíveis
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
