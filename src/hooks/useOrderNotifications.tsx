import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OrderNotificationData {
  phone: string;
  customerName: string;
  orderNumber: number;
  total: number;
  status: string;
  establishmentName: string;
  establishmentId: string;
  deliveryType?: string;
  estimatedTime?: number;
}

interface SystemNotificationData {
  phone: string;
  message: string;
  type: 'system_alert' | 'maintenance' | 'affiliate_payout';
  metadata?: Record<string, any>;
}

const STATUS_MESSAGES: Record<string, string> = {
  pending: '⏳ *Pedido Recebido!*\n\nOlá {name}! Recebemos seu pedido #{order} no valor de R$ {total}.\n\nAguarde a confirmação do estabelecimento.',
  confirmed: '✅ *Pedido Confirmado!*\n\nOlá {name}! Seu pedido #{order} foi confirmado pelo {establishment}.\n\nEm breve começaremos a preparar!',
  preparing: '👨‍🍳 *Preparando seu Pedido!*\n\nOlá {name}! O {establishment} está preparando seu pedido #{order}.\n\nTempo estimado: {time} minutos.',
  ready: '🎉 *Pedido Pronto!*\n\nOlá {name}! Seu pedido #{order} está pronto!\n\n{delivery_msg}',
  out_for_delivery: '🚚 *Saiu para Entrega!*\n\nOlá {name}! Seu pedido #{order} saiu para entrega.\n\nEm breve chegará até você!',
  delivered: '✅ *Pedido Entregue!*\n\nOlá {name}! Seu pedido #{order} foi entregue.\n\nObrigado pela preferência! 🙏',
  cancelled: '❌ *Pedido Cancelado*\n\nOlá {name}, infelizmente seu pedido #{order} foi cancelado.\n\nEm caso de dúvidas, entre em contato com o estabelecimento.',
};

export const useOrderNotifications = () => {
  const sendNotification = useCallback(async (data: OrderNotificationData) => {
    const { phone, customerName, orderNumber, total, status, establishmentName, establishmentId, deliveryType, estimatedTime } = data;

    if (!phone) {
      console.log('No phone number provided for notification');
      return { success: false, error: 'Telefone não informado' };
    }

    const template = STATUS_MESSAGES[status];
    if (!template) {
      console.log('No template for status:', status);
      return { success: false, error: 'Status não suportado' };
    }

    const deliveryMsg = deliveryType === 'pickup' 
      ? 'Venha retirar no estabelecimento!' 
      : 'Aguarde a saída para entrega.';

    const message = template
      .replace('{name}', customerName || 'Cliente')
      .replace('{order}', orderNumber.toString())
      .replace('{total}', total.toFixed(2))
      .replace('{establishment}', establishmentName)
      .replace('{time}', (estimatedTime || 30).toString())
      .replace('{delivery_msg}', deliveryMsg);

    try {
      const { data: result, error } = await supabase.functions.invoke('whatsapp-notification', {
        body: {
          phone,
          message,
          type: 'order_status',
          instanceType: 'establishment',
          establishmentId,
          metadata: {
            establishment_id: establishmentId,
            order_number: orderNumber,
            status,
          }
        }
      });

      if (error) throw error;

      console.log('Notification sent:', result);
      return { success: true, data: result };
    } catch (err: any) {
      console.error('Failed to send notification:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Enviar notificação do sistema (usando instância Doutorgigabyte)
  const sendSystemNotification = useCallback(async (data: SystemNotificationData) => {
    const { phone, message, type, metadata } = data;

    if (!phone || !message) {
      return { success: false, error: 'Telefone e mensagem são obrigatórios' };
    }

    try {
      const { data: result, error } = await supabase.functions.invoke('whatsapp-notification', {
        body: {
          phone,
          message,
          type,
          instanceType: 'system',
          metadata
        }
      });

      if (error) throw error;

      console.log('System notification sent:', result);
      return { success: true, data: result };
    } catch (err: any) {
      console.error('Failed to send system notification:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Notificar sobre atraso de pagamento
  const notifyPaymentDelay = useCallback(async (
    ownerPhone: string,
    establishmentName: string,
    daysOverdue: number
  ) => {
    const message = `⚠️ *Aviso de Pagamento*\n\nOlá! O pagamento da assinatura do estabelecimento *${establishmentName}* está ${daysOverdue} dia(s) em atraso.\n\nPor favor, regularize para evitar suspensão dos serviços.`;

    return sendSystemNotification({
      phone: ownerPhone,
      message,
      type: 'system_alert',
      metadata: { establishment_name: establishmentName, days_overdue: daysOverdue }
    });
  }, [sendSystemNotification]);

  // Notificar sobre manutenção
  const notifyMaintenance = useCallback(async (
    ownerPhone: string,
    maintenanceType: string,
    scheduledTime: string
  ) => {
    const message = `🔧 *Aviso de Manutenção*\n\n${maintenanceType}\n\nPrevisão: ${scheduledTime}\n\nAgradecemos a compreensão!`;

    return sendSystemNotification({
      phone: ownerPhone,
      message,
      type: 'maintenance',
      metadata: { maintenance_type: maintenanceType, scheduled_time: scheduledTime }
    });
  }, [sendSystemNotification]);

  const notifyOrderCreated = useCallback(async (order: any, establishment: any, customerPhone: string) => {
    return sendNotification({
      phone: customerPhone,
      customerName: order.customer?.name || 'Cliente',
      orderNumber: order.order_number,
      total: order.total,
      status: 'pending',
      establishmentName: establishment.name,
      establishmentId: establishment.id,
      deliveryType: order.delivery_type,
    });
  }, [sendNotification]);

  const notifyOrderStatusChange = useCallback(async (
    order: any, 
    newStatus: string,
    establishment: any,
    customerPhone: string
  ) => {
    return sendNotification({
      phone: customerPhone,
      customerName: order.customer?.name || 'Cliente',
      orderNumber: order.order_number,
      total: order.total,
      status: newStatus,
      establishmentName: establishment.name,
      establishmentId: establishment.id,
      deliveryType: order.delivery_type,
      estimatedTime: order.estimated_time,
    });
  }, [sendNotification]);

  return {
    sendNotification,
    sendSystemNotification,
    notifyPaymentDelay,
    notifyMaintenance,
    notifyOrderCreated,
    notifyOrderStatusChange,
  };
};
