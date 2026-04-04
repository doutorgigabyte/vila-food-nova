import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Loader2, XCircle, Store } from "lucide-react";
import { EstablishmentInfo } from "@/hooks/useCart";
import { cn } from "@/lib/utils";

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface StorePaymentStatus {
  establishmentId: string;
  status: PaymentStatus;
  error?: string;
}

interface VilaPaymentProgressProps {
  payments: StorePaymentStatus[];
  establishments: Record<string, EstablishmentInfo>;
  timeRemaining?: number; // seconds remaining for auto-refund
}

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Aguardando' },
  processing: { icon: Loader2, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Processando' },
  completed: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Confirmado' },
  failed: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Falhou' },
};

export function VilaPaymentProgress({
  payments,
  establishments,
  timeRemaining
}: VilaPaymentProgressProps) {
  const completedCount = payments.filter(p => p.status === 'completed').length;
  const totalCount = payments.length;
  const progressPercent = (completedCount / totalCount) * 100;
  const allCompleted = completedCount === totalCount;
  const hasFailed = payments.some(p => p.status === 'failed');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={cn(
      "border-2 transition-colors",
      allCompleted ? "border-green-500/50 bg-green-500/5" :
      hasFailed ? "border-destructive/50 bg-destructive/5" :
      "border-border/50"
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Progresso dos Pagamentos</span>
          <span className={cn(
            "text-sm font-medium",
            allCompleted ? "text-green-500" : "text-muted-foreground"
          )}>
            {completedCount}/{totalCount} confirmados
          </span>
        </CardTitle>
        <Progress value={progressPercent} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {payments.map((payment, index) => {
          const config = STATUS_CONFIG[payment.status];
          const Icon = config.icon;
          const establishment = establishments[payment.establishmentId];

          return (
            <div
              key={payment.establishmentId}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg",
                config.bg
              )}
            >
              <div className={cn("flex-shrink-0", config.color)}>
                <Icon className={cn(
                  "h-5 w-5",
                  payment.status === 'processing' && "animate-spin"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium truncate">
                    {establishment?.name || `Loja ${index + 1}`}
                  </span>
                </div>
                {payment.error && (
                  <p className="text-xs text-destructive mt-1">{payment.error}</p>
                )}
              </div>
              <span className={cn("text-sm font-medium", config.color)}>
                {config.label}
              </span>
            </div>
          );
        })}

        {timeRemaining !== undefined && !allCompleted && !hasFailed && (
          <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Tempo restante: {formatTime(timeRemaining)}</span>
          </div>
        )}

        {allCompleted && (
          <div className="flex items-center justify-center gap-2 pt-2 text-green-500 font-medium">
            <CheckCircle2 className="h-5 w-5" />
            <span>Todos os pagamentos confirmados!</span>
          </div>
        )}

        {hasFailed && (
          <p className="text-sm text-destructive text-center pt-2">
            Pagamentos não completados serão estornados automaticamente.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
