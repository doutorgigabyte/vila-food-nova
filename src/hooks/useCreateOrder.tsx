import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getOrderSourceDirect, OrderSource } from './useOrderSource';

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  observation?: string;
  additionals?: any[];
  variation?: any;
}

export interface CreateOrderData {
  establishment_id: string;
  customer_id?: string;
  delivery_type: 'delivery' | 'pickup' | 'table';
  payment_method: 'pix' | 'cash' | 'credit_card' | 'debit_card';
  items: OrderItem[];
  subtotal: number;
  delivery_fee?: number;
  discount?: number;
  platform_fee?: number;
  total: number;
  delivery_address?: {
    cep: string;
    address: string;
    number: string;
    complement?: string;
    neighborhood: string;
    reference?: string;
  };
  change_for?: number;
  observations?: string;
  table_number?: string;
  order_source?: OrderSource;
  scheduled_for?: string;
  whatsapp_tracking_enabled?: boolean;
  customer_phone?: string;
  // 99Food-style fields
  cpf?: string;
  out_of_stock_action?: 'contact_me' | 'cancel_order' | 'cancel_item';
}

export const useCreateOrder = () => {
  const [loading, setLoading] = useState(false);

  const createOrder = async (orderData: CreateOrderData) => {
    setLoading(true);

    try {
      // DEBUG: Log authentication state
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('[useCreateOrder] Auth state:', {
        hasSession: !!sessionData?.session,
        userId: sessionData?.session?.user?.id || 'anonymous',
        sessionError: sessionError?.message || null,
        role: sessionData?.session?.user?.role || 'anon',
      });

      // Get the order source from session storage if not provided
      const orderSource = orderData.order_source || getOrderSourceDirect();
      
      // Find or create customer based on authenticated user
      let customerId = orderData.customer_id;
      
      if (!customerId && sessionData?.session?.user) {
        const userId = sessionData.session.user.id;
        const userEmail = sessionData.session.user.email;
        const userName = sessionData.session.user.user_metadata?.full_name || 'Cliente';
        
        // Try to find existing customer for this user
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (existingCustomer) {
          customerId = existingCustomer.id;
          console.log('[useCreateOrder] Found existing customer:', customerId);
        } else {
          // Create new customer linked to this user
          const { data: newCustomer, error: createError } = await supabase
            .from('customers')
            .insert({
              user_id: userId,
              name: userName,
              email: userEmail,
              phone: orderData.customer_phone || null,
              establishment_id: orderData.establishment_id,
            })
            .select('id')
            .single();
          
          if (newCustomer) {
            customerId = newCustomer.id;
            console.log('[useCreateOrder] Created new customer:', customerId);
          } else {
            console.warn('[useCreateOrder] Failed to create customer:', createError);
          }
        }
      }

      // DEBUG: Log the order data being sent
      const orderPayload = {
        establishment_id: orderData.establishment_id,
        customer_id: customerId || null,
        delivery_type: orderData.delivery_type,
        payment_method: orderData.payment_method,
        items: orderData.items as any,
        subtotal: orderData.subtotal,
        delivery_fee: orderData.delivery_fee || 0,
        discount: orderData.discount || 0,
        platform_fee: orderData.platform_fee || 0,
        order_source: orderSource,
        total: orderData.total,
        delivery_address: orderData.delivery_address as any || null,
        change_for: orderData.change_for || null,
        observations: orderData.observations || null,
        table_number: orderData.table_number || null,
        scheduled_for: orderData.scheduled_for || null,
        whatsapp_tracking_enabled: orderData.whatsapp_tracking_enabled ?? false,
        customer_phone: orderData.customer_phone || null,
        cpf: orderData.cpf || null,
        out_of_stock_action: orderData.out_of_stock_action || 'contact_me',
        status: 'pending' as const,
      };
      
      console.log('[useCreateOrder] Creating order with payload:', {
        establishment_id: orderPayload.establishment_id,
        delivery_type: orderPayload.delivery_type,
        payment_method: orderPayload.payment_method,
        total: orderPayload.total,
        items_count: orderPayload.items?.length || 0,
        customer_id: orderPayload.customer_id,
        has_delivery_address: !!orderPayload.delivery_address,
      });

      // DEBUG: Log full payload for debugging
      console.log('[useCreateOrder] Full payload:', JSON.stringify(orderPayload, null, 2));

      // Insert the order using RPC function to bypass RLS issues
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('create_order', {
          p_establishment_id: orderPayload.establishment_id,
          p_customer_id: orderPayload.customer_id,
          p_delivery_type: orderPayload.delivery_type,
          p_payment_method: orderPayload.payment_method,
          p_items: orderPayload.items,
          p_subtotal: orderPayload.subtotal,
          p_delivery_fee: orderPayload.delivery_fee,
          p_discount: orderPayload.discount,
          p_platform_fee: orderPayload.platform_fee,
          p_order_source: orderPayload.order_source,
          p_total: orderPayload.total,
          p_delivery_address: orderPayload.delivery_address,
          p_change_for: orderPayload.change_for,
          p_observations: orderPayload.observations,
          p_table_number: orderPayload.table_number,
          p_scheduled_for: orderPayload.scheduled_for,
          p_whatsapp_tracking_enabled: orderPayload.whatsapp_tracking_enabled,
          p_customer_phone: orderPayload.customer_phone,
          p_cpf: orderPayload.cpf,
          p_out_of_stock_action: orderPayload.out_of_stock_action,
        });

      if (rpcError) {
        console.error('[useCreateOrder] RPC error:', {
          code: rpcError.code,
          message: rpcError.message,
          details: rpcError.details,
          hint: rpcError.hint,
        });
        throw new Error(rpcError.message || 'Falha ao criar pedido');
      }

      const result = rpcResult as { success: boolean; id?: string; order_number?: number; error?: string };
      
      if (!result.success) {
        console.error('[useCreateOrder] Order creation failed:', result.error);
        throw new Error(result.error || 'Falha ao criar pedido');
      }

      // Build order object from RPC result
      const order = {
        id: result.id,
        order_number: result.order_number,
        status: 'pending' as const,
      };

      console.log('[useCreateOrder] Order created successfully:', {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
      });

      // Send WhatsApp notification to merchant (async, don't block)
      supabase.functions.invoke('notify-merchant-order', {
        body: {
          order_id: order.id,
          establishment_id: orderData.establishment_id,
          notification_type: 'new_order',
        },
      }).catch((err) => {
        console.warn('[useCreateOrder] Failed to send merchant notification:', err);
      });

      // MODELO BLINDADO: Register commission debt for cash/card-on-delivery payments
      if (orderData.payment_method === 'cash' || orderData.payment_method === 'debit_card') {
        try {
          const productsAmount = orderData.subtotal - (orderData.discount || 0);
          const platformProductFee = productsAmount * 0.05; // 5% dos produtos
          const platformServiceFee = 1; // R$1 taxa de serviço
          const totalCommissionDue = platformProductFee + platformServiceFee;

          const { error: debtError } = await supabase
            .from('establishment_commission_debt')
            .insert({
              establishment_id: orderData.establishment_id,
              order_id: order.id,
              products_amount: productsAmount,
              delivery_fee: orderData.delivery_fee || 0,
              total_order: orderData.total,
              platform_product_fee: platformProductFee,
              platform_service_fee: platformServiceFee,
              total_commission_due: totalCommissionDue,
              status: 'pending',
            });

          if (debtError) {
            console.error('[useCreateOrder] Error registering commission debt:', debtError);
            // Don't block order creation if debt registration fails
          } else {
            console.log('[useCreateOrder] Commission debt registered:', {
              order_id: order.id,
              commission_due: totalCommissionDue,
            });

            // Mark order as having commission debt created
            await supabase
              .from('orders')
              .update({ commission_debt_created: true })
              .eq('id', order.id);
          }
        } catch (debtError) {
          console.error('[useCreateOrder] Exception registering commission debt:', debtError);
        }
      }

      return {
        success: true,
        order,
        orderNumber: order.order_number,
      };
    } catch (error: any) {
      console.error('[useCreateOrder] Error:', error);
      toast.error(error.message || 'Erro ao criar pedido');
      return {
        success: false,
        error: error.message,
      };
    } finally {
      setLoading(false);
    }
  };

  const createMultipleOrders = async (orders: CreateOrderData[]) => {
    setLoading(true);
    const results: { establishment: string; orderNumber: number; success: boolean }[] = [];

    try {
      for (const orderData of orders) {
        const result = await createOrder(orderData);
        results.push({
          establishment: orderData.establishment_id,
          orderNumber: result.order?.order_number || 0,
          success: result.success,
        });
      }

      return {
        success: results.every(r => r.success),
        results,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        results,
      };
    } finally {
      setLoading(false);
    }
  };

  return { createOrder, createMultipleOrders, loading };
};
