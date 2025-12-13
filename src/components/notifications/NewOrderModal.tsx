import { useEffect, useState } from "react";
import { ShoppingBag, X, Check, Clock, MapPin, User, VolumeX } from "lucide-react";
import { Notification } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NewOrderModalProps {
  notification: Notification;
  onClose: () => void;
  onConfirm: () => void;
}

const NewOrderModal = ({ notification, onClose, onConfirm }: NewOrderModalProps) => {
  const [isAnimating, setIsAnimating] = useState(true);
  const orderData = notification.data || {};

  // Parar animação após alguns segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop com animação */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/80 backdrop-blur-sm",
          isAnimating && "animate-pulse"
        )}
        onClick={onClose}
      />

      {/* Modal */}
      <div className={cn(
        "relative w-full max-w-md bg-card rounded-3xl shadow-2xl overflow-hidden",
        "transform transition-all duration-300",
        "animate-in zoom-in-95 fade-in",
        isAnimating && "ring-4 ring-primary ring-offset-2 ring-offset-background"
      )}>
        {/* Header animado */}
        <div className={cn(
          "bg-gradient-to-r from-primary via-primary/90 to-primary p-6 text-primary-foreground",
          isAnimating && "animate-gradient"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center",
                isAnimating && "animate-bounce"
              )}>
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Novo Pedido!</h2>
                <p className="text-sm opacity-90">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-4">
          {/* Número do pedido */}
          {orderData.order_number && (
            <div className="text-center py-3 bg-muted rounded-xl">
              <span className="text-sm text-muted-foreground">Pedido</span>
              <h3 className="text-3xl font-bold text-primary">
                #{orderData.order_number}
              </h3>
            </div>
          )}

          {/* Detalhes */}
          <div className="space-y-3">
            {/* Cliente */}
            {orderData.customer_name && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Cliente</span>
                  <p className="font-medium">{orderData.customer_name}</p>
                </div>
              </div>
            )}

            {/* Tipo de entrega */}
            {orderData.delivery_type && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Tipo</span>
                  <p className="font-medium capitalize">
                    {orderData.delivery_type === 'delivery' ? 'Entrega' : 
                     orderData.delivery_type === 'pickup' ? 'Retirada' : 'Mesa'}
                  </p>
                </div>
              </div>
            )}

            {/* Total */}
            {orderData.total && (
              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl">
                <span className="text-sm font-medium">Total do Pedido</span>
                <span className="text-2xl font-bold text-primary">
                  R$ {Number(orderData.total).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Itens do pedido */}
          {orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Itens</span>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {orderData.items.slice(0, 5).map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded-lg">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                {orderData.items.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{orderData.items.length - 5} itens
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            <VolumeX className="w-4 h-4 mr-2" />
            Ver Depois
          </Button>
          <Button
            className="flex-1"
            onClick={onConfirm}
          >
            <Check className="w-4 h-4 mr-2" />
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewOrderModal;
