import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface ScheduledOrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  observation?: string;
  additionals?: any[];
}

export interface ScheduledOrderData {
  establishment_id: string;
  customer_id?: string;
  scheduled_for: Date;
  items: ScheduledOrderItem[];
  subtotal: number;
  delivery_fee?: number;
  total: number;
  delivery_type?: 'delivery' | 'pickup';
  payment_method?: 'pix' | 'cash' | 'credit_card' | 'debit_card';
  delivery_address?: {
    cep: string;
    address: string;
    number: string;
    complement?: string;
    neighborhood: string;
    reference?: string;
  };
  notes?: string;
  recurrence?: {
    enabled: boolean;
    type: 'daily' | 'weekly' | 'custom';
    days?: number[]; // 0-6 (Sunday-Saturday)
    endDate?: string; // ISO date
  };
}

export const useScheduledOrders = () => {
  const [loading, setLoading] = useState(false);

  const createScheduledOrder = async (orderData: ScheduledOrderData) => {
    setLoading(true);

    try {
      const payload = {
        establishment_id: orderData.establishment_id,
        customer_id: orderData.customer_id || null,
        scheduled_for: orderData.scheduled_for.toISOString(),
        items: orderData.items as unknown as Json,
        subtotal: orderData.subtotal,
        delivery_fee: orderData.delivery_fee || 0,
        total: orderData.total,
        delivery_type: orderData.delivery_type || 'pickup',
        payment_method: orderData.payment_method || 'pix',
        delivery_address: orderData.delivery_address as unknown as Json || null,
        notes: orderData.notes || null,
        recurrence: orderData.recurrence as unknown as Json || null,
        status: 'pending' as const,
      };

      console.log('[useScheduledOrders] Creating scheduled order:', {
        establishment_id: payload.establishment_id,
        scheduled_for: payload.scheduled_for,
        items_count: orderData.items.length,
        total: payload.total,
      });

      const { data: scheduledOrder, error } = await supabase
        .from('scheduled_orders')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('[useScheduledOrders] Error:', error);
        throw new Error(error.message || 'Falha ao agendar pedido');
      }

      console.log('[useScheduledOrders] Scheduled order created:', scheduledOrder.id);

      // Send WhatsApp notification about scheduled order
      try {
        const { data: establishment } = await supabase
          .from('establishments')
          .select('whatsapp, name')
          .eq('id', orderData.establishment_id)
          .single();

        if (establishment?.whatsapp) {
          const formattedDate = orderData.scheduled_for.toLocaleDateString('pt-BR');
          const formattedTime = orderData.scheduled_for.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });

          await supabase.functions.invoke('whatsapp-notification', {
            body: {
              phone: establishment.whatsapp,
              message: `📅 *Novo Pedido Agendado!*\n\n` +
                `📆 Data: ${formattedDate}\n` +
                `🕐 Horário: ${formattedTime}\n` +
                `💰 Total: R$ ${orderData.total.toFixed(2)}\n` +
                `📦 Itens: ${orderData.items.length}\n\n` +
                `Acesse o painel para ver detalhes.`,
              establishment_id: orderData.establishment_id,
            }
          });
        }
      } catch (whatsappError) {
        console.warn('[useScheduledOrders] WhatsApp notification failed:', whatsappError);
        // Don't fail the order creation if WhatsApp fails
      }

      return {
        success: true,
        scheduledOrder,
      };
    } catch (error: any) {
      console.error('[useScheduledOrders] Error:', error);
      toast.error(error.message || 'Erro ao agendar pedido');
      return {
        success: false,
        error: error.message,
      };
    } finally {
      setLoading(false);
    }
  };

  const getScheduledOrders = async (establishmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('scheduled_orders')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('[useScheduledOrders] Error fetching:', error);
      return [];
    }
  };

  const cancelScheduledOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;
      toast.success('Pedido agendado cancelado');
      return { success: true };
    } catch (error: any) {
      console.error('[useScheduledOrders] Error cancelling:', error);
      toast.error('Erro ao cancelar pedido');
      return { success: false, error: error.message };
    }
  };

  return { 
    createScheduledOrder, 
    getScheduledOrders,
    cancelScheduledOrder,
    loading 
  };
};
