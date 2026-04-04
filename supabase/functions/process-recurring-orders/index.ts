import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RecurrenceConfig {
  enabled: boolean;
  type: 'daily' | 'weekly' | 'custom';
  days?: number[];
  endDate?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const todayStr = today.toISOString().split('T')[0];

    console.log(`Processing recurring orders for ${todayStr}, day of week: ${dayOfWeek}`);

    // Fetch all recurring scheduled orders that should be processed today
    const { data: scheduledOrders, error: fetchError } = await supabase
      .from('scheduled_orders')
      .select('*')
      .eq('status', 'pending')
      .not('recurrence', 'is', null);

    if (fetchError) {
      console.error('Error fetching scheduled orders:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${scheduledOrders?.length || 0} recurring orders to check`);

    const ordersToCreate: any[] = [];

    for (const scheduledOrder of scheduledOrders || []) {
      const recurrence = scheduledOrder.recurrence as RecurrenceConfig;
      
      if (!recurrence?.enabled) continue;

      // Check if recurrence has ended
      if (recurrence.endDate && new Date(recurrence.endDate) < today) {
        console.log(`Skipping order ${scheduledOrder.id} - recurrence ended`);
        continue;
      }

      let shouldCreateToday = false;

      switch (recurrence.type) {
        case 'daily':
          shouldCreateToday = true;
          break;
        case 'weekly':
          // Monday to Friday (1-5)
          shouldCreateToday = dayOfWeek >= 1 && dayOfWeek <= 5;
          break;
        case 'custom':
          // Check if today's day is in the custom days array
          shouldCreateToday = recurrence.days?.includes(dayOfWeek) || false;
          break;
      }

      if (shouldCreateToday) {
        console.log(`Order ${scheduledOrder.id} should be created today`);
        ordersToCreate.push(scheduledOrder);
      }
    }

    console.log(`Creating ${ordersToCreate.length} orders for today`);

    const createdOrders: string[] = [];

    for (const scheduledOrder of ordersToCreate) {
      // Create the actual order
      const { data: newOrder, error: createError } = await supabase
        .from('orders')
        .insert({
          establishment_id: scheduledOrder.establishment_id,
          customer_id: scheduledOrder.customer_id,
          items: scheduledOrder.items,
          subtotal: scheduledOrder.total,
          total: scheduledOrder.total,
          status: 'pending',
          delivery_type: scheduledOrder.delivery_type || 'delivery',
          delivery_address: scheduledOrder.delivery_address,
          customer_name: scheduledOrder.customer_name,
          customer_phone: scheduledOrder.customer_phone,
          notes: `Pedido recorrente criado automaticamente (ID original: ${scheduledOrder.id})`,
          payment_method: scheduledOrder.payment_method || 'pix',
          scheduled_for: scheduledOrder.scheduled_time,
        })
        .select()
        .single();

      if (createError) {
        console.error(`Error creating order from scheduled ${scheduledOrder.id}:`, createError);
        continue;
      }

      console.log(`Created order ${newOrder.id} from scheduled order ${scheduledOrder.id}`);
      createdOrders.push(newOrder.id);

      // Update the scheduled order's last processed date
      await supabase
        .from('scheduled_orders')
        .update({ 
          updated_at: new Date().toISOString(),
        })
        .eq('id', scheduledOrder.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        date: todayStr,
        processedCount: ordersToCreate.length,
        createdOrders,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing recurring orders:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
