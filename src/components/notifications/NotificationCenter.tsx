import { useState } from "react";
import { Bell, Check, CheckCheck, Trash2, Settings, Volume2, VolumeX } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotificationContext } from "./NotificationProvider";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { Notification, NOTIFICATION_CONFIG } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import NotificationBadge from "./NotificationBadge";

const NotificationItem = ({ 
  notification, 
  onRead, 
  onDismiss 
}: { 
  notification: Notification;
  onRead: () => void;
  onDismiss: () => void;
}) => {
  const config = NOTIFICATION_CONFIG[notification.type];

  const priorityColors = {
    critical: "border-l-destructive bg-destructive/5",
    high: "border-l-amber-500 bg-amber-500/5",
    medium: "border-l-primary bg-primary/5",
    low: "border-l-muted-foreground bg-muted/50",
  };

  return (
    <div className={cn(
      "p-4 border-l-4 rounded-r-lg transition-all",
      priorityColors[notification.priority],
      !notification.is_read && "font-medium"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold truncate">
              {notification.title}
            </h4>
            {!notification.is_read && (
              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            )}
          </div>
          {notification.message && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {notification.message}
            </p>
          )}
          <span className="text-xs text-muted-foreground mt-2 block">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onRead}
            >
              <Check className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onDismiss}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const NotificationCenter = () => {
  const [open, setOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    dismissNotification 
  } = useNotificationContext();
  
  const { preferences, updatePreferences, testSound } = useNotificationSound();

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div>
          <NotificationBadge count={unreadCount} />
        </div>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificações
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </SheetTitle>
            
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => updatePreferences({ sound_enabled: !preferences.sound_enabled })}
                title={preferences.sound_enabled ? "Desativar sons" : "Ativar sons"}
              >
                {preferences.sound_enabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
              
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  Marcar todas
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="unread" className="flex-1">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger 
              value="unread" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Não lidas ({unreadNotifications.length})
            </TabsTrigger>
            <TabsTrigger 
              value="all"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Todas ({notifications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unread" className="mt-0">
            <ScrollArea className="h-[calc(100vh-180px)]">
              {unreadNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Bell className="w-12 h-12 mb-4 opacity-50" />
                  <p>Nenhuma notificação não lida</p>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {unreadNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={() => markAsRead(notification.id)}
                      onDismiss={() => dismissNotification(notification.id)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="all" className="mt-0">
            <ScrollArea className="h-[calc(100vh-180px)]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Bell className="w-12 h-12 mb-4 opacity-50" />
                  <p>Nenhuma notificação</p>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={() => markAsRead(notification.id)}
                      onDismiss={() => dismissNotification(notification.id)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationCenter;
