import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useNotifications, Notification, NotificationType, NOTIFICATION_CONFIG } from "@/hooks/useNotifications";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { useParams } from "react-router-dom";
import NotificationToast from "./NotificationToast";
import NewOrderModal from "./NewOrderModal";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  createNotification: (
    type: NotificationType,
    title: string,
    message?: string,
    data?: Record<string, any>
  ) => Promise<void>;
  showToast: (notification: Notification) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationContext must be used within NotificationProvider");
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
  establishmentId?: string;
}

export const NotificationProvider = ({ children, establishmentId }: NotificationProviderProps) => {
  const params = useParams();
  const estId = establishmentId || params.slug;
  
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    createNotification,
  } = useNotifications(estId);

  const { playNotification } = useNotificationSound();

  // Estado para toasts visíveis
  const [visibleToasts, setVisibleToasts] = useState<Notification[]>([]);
  
  // Estado para modal de novo pedido
  const [orderModal, setOrderModal] = useState<Notification | null>(null);

  // Processar nova notificação
  const processNotification = useCallback((notification: Notification) => {
    const config = NOTIFICATION_CONFIG[notification.type];

    // Tocar som
    playNotification(notification.type);

    // Mostrar modal para pedidos novos
    if (config.showModal && notification.type === 'new_order') {
      setOrderModal(notification);
    } else if (config.showModal) {
      // Mostrar toast chamativo
      setVisibleToasts(prev => [...prev, notification]);
    } else {
      // Toast normal
      setVisibleToasts(prev => [...prev, notification]);
    }
  }, [playNotification]);

  // Mostrar toast manualmente
  const showToast = useCallback((notification: Notification) => {
    setVisibleToasts(prev => [...prev, notification]);
  }, []);

  // Remover toast
  const removeToast = useCallback((id: string) => {
    setVisibleToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fechar modal de pedido
  const closeOrderModal = useCallback(() => {
    setOrderModal(null);
  }, []);

  // Monitorar novas notificações
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      
      // Verificar se é nova (menos de 5 segundos)
      const createdAt = new Date(latestNotification.created_at).getTime();
      const now = Date.now();
      const isNew = (now - createdAt) < 5000;

      if (isNew && !latestNotification.is_read) {
        processNotification(latestNotification);
      }
    }
  }, [notifications, processNotification]);

  // Auto-remover toasts após 5 segundos
  useEffect(() => {
    if (visibleToasts.length > 0) {
      const timer = setTimeout(() => {
        setVisibleToasts(prev => prev.slice(1));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [visibleToasts]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        createNotification,
        showToast,
      }}
    >
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        {visibleToasts.map((toast) => (
          <NotificationToast
            key={toast.id}
            notification={toast}
            onClose={() => removeToast(toast.id)}
            onRead={() => markAsRead(toast.id)}
          />
        ))}
      </div>

      {/* Modal de Novo Pedido */}
      {orderModal && (
        <NewOrderModal
          notification={orderModal}
          onClose={closeOrderModal}
          onConfirm={async () => {
            await markAsRead(orderModal.id);
            closeOrderModal();
          }}
        />
      )}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
