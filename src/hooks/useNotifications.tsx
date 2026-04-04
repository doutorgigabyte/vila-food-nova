import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserRole, EstablishmentRole } from "./useUserRole";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type NotificationType = 
  | 'new_order'
  | 'order_confirmed'
  | 'order_preparing'
  | 'order_ready'
  | 'order_out_for_delivery'
  | 'order_delivered'
  | 'order_cancelled'
  | 'payment_received'
  | 'payment_failed'
  | 'low_stock'
  | 'new_delivery'
  | 'delivery_assigned'
  | 'delivery_completed'
  | 'system_alert'
  | 'maintenance'
  | 'new_review'
  | 'new_customer'
  | 'table_call'
  // Admin-only notification types
  | 'admin_support_request'
  | 'admin_payment_alert'
  | 'admin_system_maintenance'
  | 'admin_new_establishment'
  // Customer-only notification types  
  | 'customer_order_update'
  | 'customer_delivery_update';

export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Notification {
  id: string;
  establishment_id: string | null;
  user_id: string | null;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string | null;
  data: Record<string, any>;
  is_read: boolean;
  is_dismissed: boolean;
  target_roles: string[];
  created_at: string;
  read_at: string | null;
  expires_at: string | null;
}

export interface NotificationConfig {
  type: NotificationType;
  title: string;
  hasSound: boolean;
  soundFile: string;
  priority: NotificationPriority;
  targetRoles: EstablishmentRole[];
  showModal: boolean;
  vibrate: boolean;
}

// Configuração de cada tipo de notificação
export const NOTIFICATION_CONFIG: Record<NotificationType, NotificationConfig> = {
  new_order: {
    type: 'new_order',
    title: 'Novo Pedido!',
    hasSound: true,
    soundFile: 'new-order.mp3',
    priority: 'critical',
    targetRoles: ['manager', 'cashier', 'attendant'],
    showModal: true,
    vibrate: true,
  },
  order_confirmed: {
    type: 'order_confirmed',
    title: 'Pedido Confirmado',
    hasSound: true,
    soundFile: 'success.mp3',
    priority: 'medium',
    targetRoles: ['manager', 'cashier'],
    showModal: false,
    vibrate: false,
  },
  order_preparing: {
    type: 'order_preparing',
    title: 'Pedido em Preparo',
    hasSound: true,
    soundFile: 'preparing.mp3',
    priority: 'medium',
    targetRoles: ['manager', 'cashier', 'waiter'],
    showModal: false,
    vibrate: false,
  },
  order_ready: {
    type: 'order_ready',
    title: 'Pedido Pronto!',
    hasSound: true,
    soundFile: 'order-ready.mp3',
    priority: 'high',
    targetRoles: ['manager', 'cashier', 'waiter', 'delivery'],
    showModal: true,
    vibrate: true,
  },
  order_out_for_delivery: {
    type: 'order_out_for_delivery',
    title: 'Pedido Saiu para Entrega',
    hasSound: true,
    soundFile: 'delivery.mp3',
    priority: 'medium',
    targetRoles: ['manager', 'cashier'],
    showModal: false,
    vibrate: false,
  },
  order_delivered: {
    type: 'order_delivered',
    title: 'Pedido Entregue',
    hasSound: true,
    soundFile: 'success.mp3',
    priority: 'low',
    targetRoles: ['manager', 'cashier'],
    showModal: false,
    vibrate: false,
  },
  order_cancelled: {
    type: 'order_cancelled',
    title: 'Pedido Cancelado',
    hasSound: true,
    soundFile: 'error.mp3',
    priority: 'high',
    targetRoles: ['manager', 'cashier'],
    showModal: true,
    vibrate: true,
  },
  payment_received: {
    type: 'payment_received',
    title: 'Pagamento Recebido',
    hasSound: true,
    soundFile: 'payment.mp3',
    priority: 'medium',
    targetRoles: ['manager', 'cashier'],
    showModal: false,
    vibrate: false,
  },
  payment_failed: {
    type: 'payment_failed',
    title: 'Falha no Pagamento',
    hasSound: true,
    soundFile: 'error.mp3',
    priority: 'high',
    targetRoles: ['manager', 'cashier'],
    showModal: true,
    vibrate: true,
  },
  low_stock: {
    type: 'low_stock',
    title: 'Estoque Baixo',
    hasSound: true,
    soundFile: 'alert.mp3',
    priority: 'medium',
    targetRoles: ['manager'],
    showModal: false,
    vibrate: false,
  },
  new_delivery: {
    type: 'new_delivery',
    title: 'Nova Entrega Disponível',
    hasSound: true,
    soundFile: 'new-order.mp3',
    priority: 'critical',
    targetRoles: ['delivery'],
    showModal: true,
    vibrate: true,
  },
  delivery_assigned: {
    type: 'delivery_assigned',
    title: 'Entrega Atribuída',
    hasSound: true,
    soundFile: 'success.mp3',
    priority: 'high',
    targetRoles: ['delivery'],
    showModal: true,
    vibrate: true,
  },
  delivery_completed: {
    type: 'delivery_completed',
    title: 'Entrega Concluída',
    hasSound: true,
    soundFile: 'success.mp3',
    priority: 'medium',
    targetRoles: ['manager', 'cashier', 'delivery'],
    showModal: false,
    vibrate: false,
  },
  system_alert: {
    type: 'system_alert',
    title: 'Alerta do Sistema',
    hasSound: true,
    soundFile: 'alert.mp3',
    priority: 'high',
    targetRoles: ['manager'],
    showModal: true,
    vibrate: true,
  },
  maintenance: {
    type: 'maintenance',
    title: 'Manutenção Programada',
    hasSound: false,
    soundFile: '',
    priority: 'low',
    targetRoles: ['manager'],
    showModal: false,
    vibrate: false,
  },
  new_review: {
    type: 'new_review',
    title: 'Nova Avaliação',
    hasSound: true,
    soundFile: 'notification.mp3',
    priority: 'low',
    targetRoles: ['manager'],
    showModal: false,
    vibrate: false,
  },
  new_customer: {
    type: 'new_customer',
    title: 'Novo Cliente',
    hasSound: false,
    soundFile: '',
    priority: 'low',
    targetRoles: ['manager'],
    showModal: false,
    vibrate: false,
  },
  table_call: {
    type: 'table_call',
    title: 'Chamada de Mesa',
    hasSound: true,
    soundFile: 'table-call.mp3',
    priority: 'critical',
    targetRoles: ['waiter', 'attendant'],
    showModal: true,
    vibrate: true,
  },
  // Admin-only notifications
  admin_support_request: {
    type: 'admin_support_request',
    title: 'Nova Solicitação de Suporte',
    hasSound: true,
    soundFile: 'notification.mp3',
    priority: 'high',
    targetRoles: [],
    showModal: false,
    vibrate: false,
  },
  admin_payment_alert: {
    type: 'admin_payment_alert',
    title: 'Alerta de Pagamento',
    hasSound: true,
    soundFile: 'alert.mp3',
    priority: 'high',
    targetRoles: [],
    showModal: true,
    vibrate: true,
  },
  admin_system_maintenance: {
    type: 'admin_system_maintenance',
    title: 'Manutenção do Sistema',
    hasSound: false,
    soundFile: '',
    priority: 'medium',
    targetRoles: [],
    showModal: false,
    vibrate: false,
  },
  admin_new_establishment: {
    type: 'admin_new_establishment',
    title: 'Novo Estabelecimento',
    hasSound: true,
    soundFile: 'success.mp3',
    priority: 'low',
    targetRoles: [],
    showModal: false,
    vibrate: false,
  },
  // Customer-only notifications
  customer_order_update: {
    type: 'customer_order_update',
    title: 'Atualização do Pedido',
    hasSound: true,
    soundFile: 'notification.mp3',
    priority: 'high',
    targetRoles: [],
    showModal: false,
    vibrate: true,
  },
  customer_delivery_update: {
    type: 'customer_delivery_update',
    title: 'Atualização da Entrega',
    hasSound: true,
    soundFile: 'delivery.mp3',
    priority: 'high',
    targetRoles: [],
    showModal: false,
    vibrate: true,
  },
};

// Admin-only notification types for filtering
const ADMIN_NOTIFICATION_TYPES: NotificationType[] = [
  'admin_support_request',
  'admin_payment_alert', 
  'admin_system_maintenance',
  'admin_new_establishment',
];

// Customer-only notification types
const CUSTOMER_NOTIFICATION_TYPES: NotificationType[] = [
  'customer_order_update',
  'customer_delivery_update',
];

export interface NotificationContextOptions {
  isInAdminContext?: boolean;
  isInEstablishmentContext?: boolean;
}

export const useNotifications = (establishmentId?: string, contextOptions?: NotificationContextOptions) => {
  const { user } = useAuth();
  const { establishmentRole, appRole } = useUserRole();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Context passed from provider (which has access to Router)
  const isInAdminContext = contextOptions?.isInAdminContext ?? false;
  const isInEstablishmentContext = contextOptions?.isInEstablishmentContext ?? false;

  // Verificar se é um cliente comum (sem role de estabelecimento)
  const isCustomer = !establishmentRole && appRole !== 'super_admin';

  // Buscar notificações iniciais
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(50);

      // Clientes comuns só veem suas próprias notificações (user_id específico)
      if (isCustomer) {
        query = query.eq('user_id', user.id);
      } else if (isInAdminContext && appRole === 'super_admin') {
        // Super admin em contexto admin - filtragem por tipo será feita client-side
        // Não aplicamos filtro de establishment_id para ver notificações admin globais
      } else if (establishmentId) {
        // Staff do estabelecimento vê notificações do estabelecimento
        query = query.eq('establishment_id', establishmentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filtrar por role do usuário (só aplica para staff, não clientes)
      const filteredNotifications = (data || []).filter((n: any) => {
        // Clientes só veem notificações destinadas a eles (já filtrado pela query)
        if (isCustomer) {
          // Verificar se é uma notificação para cliente
          return n.target_roles?.includes('customer') || !n.target_roles?.length;
        }
        
        // Super admin em contexto admin só vê notificações admin
        if (isInAdminContext && appRole === 'super_admin') {
          return ADMIN_NOTIFICATION_TYPES.includes(n.type);
        }
        
        // Super admin em contexto de estabelecimento vê tudo do estabelecimento
        if (appRole === 'super_admin' && isInEstablishmentContext) return true;
        
        // Se não tem target_roles, é para todos do estabelecimento
        if (!n.target_roles || n.target_roles.length === 0) return true;
        
        // Verificar se o role do usuário está nos target_roles
        if (establishmentRole && n.target_roles.includes(establishmentRole)) return true;
        
        // Owner (manager) vê tudo do estabelecimento
        if (establishmentRole === 'manager') return true;
        
        return false;
      }) as Notification[];

      setNotifications(filteredNotifications);
      setUnreadCount(filteredNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, establishmentId, appRole, establishmentRole, isCustomer, isInAdminContext, isInEstablishmentContext]);

  // Marcar como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (!error) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!establishmentId) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('establishment_id', establishmentId)
      .eq('is_read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  }, [establishmentId]);

  // Dispensar notificação
  const dismissNotification = useCallback(async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_dismissed: true })
      .eq('id', notificationId);

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return notification && !notification.is_read ? Math.max(0, prev - 1) : prev;
      });
    }
  }, [notifications]);

  // Criar notificação
  const createNotification = useCallback(async (
    type: NotificationType,
    title: string,
    message?: string,
    data?: Record<string, any>,
    targetEstablishmentId?: string
  ) => {
    const config = NOTIFICATION_CONFIG[type];
    
    const { error } = await supabase
      .from('notifications')
      .insert([{
        establishment_id: targetEstablishmentId || establishmentId,
        type: type as any,
        priority: config.priority,
        title,
        message,
        data: data || {},
        target_roles: config.targetRoles,
      }]);

    if (error) {
      console.error('Error creating notification:', error);
    }
  }, [establishmentId]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Definir filtro baseado no tipo de usuário
    let realtimeFilter: string | undefined;
    if (isCustomer) {
      realtimeFilter = `user_id=eq.${user.id}`;
    } else if (establishmentId) {
      realtimeFilter = `establishment_id=eq.${establishmentId}`;
    }

    // Criar canal para realtime
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: realtimeFilter,
        },
        (payload: RealtimePostgresChangesPayload<Notification>) => {
          const newNotification = payload.new as Notification;
          
          // Verificar se o usuário deve receber esta notificação
          let shouldReceive = false;
          
          if (isCustomer) {
            // Cliente só recebe notificações direcionadas a ele
            shouldReceive = newNotification.user_id === user.id && 
              (newNotification.target_roles?.includes('customer') || !newNotification.target_roles?.length);
          } else if (isInAdminContext && appRole === 'super_admin') {
            // Super admin em contexto admin só recebe notificações admin
            shouldReceive = ADMIN_NOTIFICATION_TYPES.includes(newNotification.type);
          } else if (isInEstablishmentContext && appRole === 'super_admin') {
            // Super admin em contexto de estabelecimento recebe notificações do estabelecimento
            shouldReceive = newNotification.establishment_id === establishmentId;
          } else {
            shouldReceive = 
              !newNotification.target_roles?.length ||
              (establishmentRole && newNotification.target_roles.includes(establishmentRole)) ||
              establishmentRole === 'manager';
          }

          if (shouldReceive) {
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, establishmentId, appRole, establishmentRole, isCustomer, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    createNotification,
    refetch: fetchNotifications,
  };
};
