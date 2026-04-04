import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";

interface QuotaBarProps {
  label: string;
  current: number;
  max: number | null;
  showWarning?: boolean;
  className?: string;
}

export const QuotaBar = ({ 
  label, 
  current, 
  max, 
  showWarning = true,
  className 
}: QuotaBarProps) => {
  const isUnlimited = max === null || max === -1;
  const percentage = isUnlimited ? 0 : Math.min(100, (current / max) * 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn(
          "font-medium",
          isAtLimit && "text-destructive",
          isNearLimit && !isAtLimit && "text-yellow-600"
        )}>
          {current} / {isUnlimited ? "∞" : max}
          {showWarning && isNearLimit && !isAtLimit && (
            <AlertTriangle className="inline-block ml-1 h-3 w-3" />
          )}
        </span>
      </div>
      
      {!isUnlimited && (
        <Progress 
          value={percentage} 
          className={cn(
            "h-2",
            isAtLimit && "[&>div]:bg-destructive",
            isNearLimit && !isAtLimit && "[&>div]:bg-yellow-500"
          )}
        />
      )}
      
      {isUnlimited && (
        <div className="h-2 rounded-full bg-gradient-to-r from-primary/20 to-primary/40 flex items-center justify-center">
          <span className="text-[10px] text-primary font-medium">ILIMITADO</span>
        </div>
      )}
    </div>
  );
};
