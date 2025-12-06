import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  onClick?: () => void;
  className?: string;
}

const NotificationBadge = ({ count, onClick, className }: NotificationBadgeProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn("relative", className)}
    >
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span className={cn(
          "absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full",
          "bg-destructive text-destructive-foreground",
          "text-xs font-bold flex items-center justify-center",
          "animate-in zoom-in-50",
          count > 0 && "animate-pulse"
        )}>
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Button>
  );
};

export default NotificationBadge;
