import { X, Bell, ShoppingBag, Truck, CreditCard, AlertTriangle, Star, Users, UtensilsCrossed } from "lucide-react";
import { Notification, NotificationType, NOTIFICATION_CONFIG } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  onRead: () => void;
}

const NOTIFICATION_ICONS: Record<NotificationType, React.ElementType> = {
  new_order: ShoppingBag,
  order_confirmed: ShoppingBag,
  order_preparing: UtensilsCrossed,
  order_ready: UtensilsCrossed,
  order_out_for_delivery: Truck,
  order_delivered: Truck,
  order_cancelled: X,
  payment_received: CreditCard,
  payment_failed: CreditCard,
  low_stock: AlertTriangle,
  new_delivery: Truck,
  delivery_assigned: Truck,
  delivery_completed: Truck,
  system_alert: AlertTriangle,
  maintenance: AlertTriangle,
  new_review: Star,
  new_customer: Users,
  table_call: Bell,
  // Admin notification types
  admin_support_request: AlertTriangle,
  admin_payment_alert: CreditCard,
  admin_system_maintenance: AlertTriangle,
  admin_new_establishment: ShoppingBag,
  // Customer notification types
  customer_order_update: ShoppingBag,
  customer_delivery_update: Truck,
};

const PRIORITY_STYLES = {
  critical: "bg-destructive text-destructive-foreground border-destructive animate-pulse",
  high: "bg-amber-500 text-white border-amber-600",
  medium: "bg-primary text-primary-foreground border-primary",
  low: "bg-muted text-foreground border-border",
};

const PRIORITY_ICON_STYLES = {
  critical: "bg-white/20 text-white",
  high: "bg-white/20 text-white",
  medium: "bg-white/20 text-white",
  low: "bg-muted-foreground/20 text-muted-foreground",
};

const NotificationToast = ({ notification, onClose, onRead }: NotificationToastProps) => {
  const config = NOTIFICATION_CONFIG[notification.type];
  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;

  const handleClick = () => {
    onRead();
    onClose();
  };

  return (
    <div
      className={cn(
        "pointer-events-auto w-80 md:w-96 rounded-xl shadow-2xl border-2 overflow-hidden",
        "transform transition-all duration-300 ease-out",
        "animate-in slide-in-from-right-full fade-in",
        PRIORITY_STYLES[notification.priority]
      )}
      role="alert"
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          PRIORITY_ICON_STYLES[notification.priority]
        )}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-sm truncate">
              {notification.title}
            </h4>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {notification.message && (
            <p className="text-sm opacity-90 mt-1 line-clamp-2">
              {notification.message}
            </p>
          )}

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs opacity-75">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>

            {notification.priority === 'critical' && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleClick}
                className="h-7 text-xs bg-white/20 hover:bg-white/30 border-0"
              >
                Ver Detalhes
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar para auto-dismiss */}
      <div className="h-1 bg-white/20">
        <div 
          className="h-full bg-white/50 animate-shrink-width"
          style={{ animationDuration: '5s' }}
        />
      </div>
    </div>
  );
};

export default NotificationToast;
