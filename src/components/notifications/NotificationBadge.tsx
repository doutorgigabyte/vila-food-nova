import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface NotificationBadgeProps {
  count: number;
  onClick?: () => void;
  className?: string;
  hasNew?: boolean;
}

const NotificationBadge = ({ count, onClick, className, hasNew = false }: NotificationBadgeProps) => {
  const [showPulse, setShowPulse] = useState(false);

  // Animação sutil quando há nova notificação
  useEffect(() => {
    if (hasNew && count > 0) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [hasNew, count]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn("relative", className)}
    >
      <Bell className={cn(
        "w-5 h-5 transition-transform",
        showPulse && "animate-[wiggle_0.5s_ease-in-out_3]"
      )} />
      {count > 0 && (
        <span className={cn(
          "absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full",
          "bg-destructive text-destructive-foreground",
          "text-xs font-bold flex items-center justify-center",
          "animate-in zoom-in-50"
        )}>
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Button>
  );
};

export default NotificationBadge;
