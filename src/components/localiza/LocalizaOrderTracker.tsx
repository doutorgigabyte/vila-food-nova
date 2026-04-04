import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Clock, ChefHat, Truck, CheckCircle, XCircle } from "lucide-react";

type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "delivering" | "delivered" | "cancelled";

interface TrackedOrder {
  id: string;
  order_number: string;
  status: OrderStatus;
  total: number;
  delivery_type: string;
  estimated_time: number | null;
  created_at: string;
  updated_at: string | null;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pendente", color: "bg-yellow-500", icon: <Clock className="w-4 h-4" /> },
  confirmed: { label: "Confirmado", color: "bg-blue-500", icon: <Package className="w-4 h-4" /> },
  preparing: { label: "Preparando", color: "bg-orange-500", icon: <ChefHat className="w-4 h-4" /> },
  ready: { label: "Pronto", color: "bg-green-500", icon: <CheckCircle className="w-4 h-4" /> },
  delivering: { label: "Em entrega", color: "bg-purple-500", icon: <Truck className="w-4 h-4" /> },
  delivered: { label: "Entregue", color: "bg-emerald-600", icon: <CheckCircle className="w-4 h-4" /> },
  cancelled: { label: "Cancelado", color: "bg-red-500", icon: <XCircle className="w-4 h-4" /> },
};

const STATUS_STEPS: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "delivering", "delivered"];

interface LocalizaOrderTrackerProps {
  orderId: string;
  onStatusChange?: (status: OrderStatus) => void;
}

export function LocalizaOrderTracker({ orderId, onStatusChange }: LocalizaOrderTrackerProps) {
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, total, delivery_type, estimated_time, created_at, updated_at")
        .eq("id", orderId)
        .single();

      if (!error && data) {
        setOrder(data as TrackedOrder);
      }
      setLoading(false);
    };

    fetchOrder();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`order-track-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const updated = payload.new as TrackedOrder;
          setOrder(updated);
          onStatusChange?.(updated.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, onStatusChange]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-2 bg-muted rounded w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return null;
  }

  const currentStatus = order.status;
  const config = STATUS_CONFIG[currentStatus];
  const currentStepIndex = STATUS_STEPS.indexOf(currentStatus);
  const isCancelled = currentStatus === "cancelled";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Pedido #{order.order_number}
          </CardTitle>
          <Badge className={`${config.color} text-white gap-1`}>
            {config.icon}
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {!isCancelled && (
          <div className="flex items-center gap-1 mb-4">
            {STATUS_STEPS.map((step, index) => (
              <div key={step} className="flex-1 flex items-center">
                <div
                  className={`h-2 w-full rounded-full ${
                    index <= currentStepIndex
                      ? STATUS_CONFIG[step].color
                      : "bg-muted"
                  }`}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            R$ {order.total.toFixed(2)}
          </span>
          {order.estimated_time && currentStatus !== "delivered" && currentStatus !== "cancelled" && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              ~{order.estimated_time} min
            </span>
          )}
          <span>
            {new Date(order.created_at).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
