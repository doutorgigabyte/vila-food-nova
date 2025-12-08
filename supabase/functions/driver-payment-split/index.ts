import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SplitRequest {
  order_id: string;
  driver_id: string;
  delivery_tracking_id: string;
  delivery_fee: number;
}

// Authenticate request and return user
async function authenticateRequest(req: Request): Promise<{ userId: string; error?: string }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { userId: '', error: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return { userId: '', error: 'Invalid or expired token' };
  }

  return { userId: user.id };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const { userId, error: authError } = await authenticateRequest(req);
    if (authError) {
      console.error('[driver-payment-split] Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: authError }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    console.log(`[driver-payment-split] Authenticated user: ${userId}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: SplitRequest = await req.json();
    const { order_id, driver_id, delivery_tracking_id, delivery_fee } = body;

    console.log(`Processing payment split for order ${order_id}, driver ${driver_id}`);
    console.log(`Delivery fee: R$ ${delivery_fee}`);

    // Get driver info
    const { data: driver, error: driverError } = await supabase
      .from("delivery_drivers")
      .select("*, establishment_id")
      .eq("id", driver_id)
      .single();

    if (driverError || !driver) {
      console.error("Driver not found:", driverError);
      return new Response(
        JSON.stringify({ success: false, error: "Entregador não encontrado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Get establishment delivery config
    const { data: config } = await supabase
      .from("establishment_delivery_config")
      .select("*")
      .eq("establishment_id", driver.establishment_id)
      .single();

    // Calculate driver earnings
    let driverEarnings: number;
    let establishmentFee: number;

    if (config) {
      if (config.driver_commission_type === 'percentage') {
        driverEarnings = (delivery_fee * config.driver_commission_value) / 100;
      } else {
        driverEarnings = Math.min(config.driver_commission_value, delivery_fee);
      }
    } else {
      // Default: 70% for driver
      driverEarnings = delivery_fee * 0.7;
    }

    establishmentFee = delivery_fee - driverEarnings;

    console.log(`Driver earnings: R$ ${driverEarnings.toFixed(2)}`);
    console.log(`Establishment fee: R$ ${establishmentFee.toFixed(2)}`);

    // Update delivery_tracking with payment info
    const { error: trackingError } = await supabase
      .from("delivery_tracking")
      .update({
        delivery_fee: delivery_fee,
        driver_earnings: driverEarnings,
        establishment_fee: establishmentFee,
        payment_status: 'pending_payout',
        calculation_method: config?.calculation_method || 'fixed',
        updated_at: new Date().toISOString(),
      })
      .eq("id", delivery_tracking_id);

    if (trackingError) {
      console.error("Error updating tracking:", trackingError);
    }

    // Update driver pending balance
    const newPendingBalance = (driver.pending_balance || 0) + driverEarnings;
    
    const { error: driverUpdateError } = await supabase
      .from("delivery_drivers")
      .update({
        pending_balance: newPendingBalance,
        total_deliveries: (driver.total_deliveries || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", driver_id);

    if (driverUpdateError) {
      console.error("Error updating driver:", driverUpdateError);
    }

    // Check if auto payout is enabled
    if (config?.auto_payout) {
      const minPayout = config.min_payout_amount || 50;
      
      if (newPendingBalance >= minPayout && driver.pix_key) {
        console.log(`Triggering auto payout for driver ${driver_id}`);
        
        // Create payout record
        const { data: payout, error: payoutError } = await supabase
          .from("driver_payouts")
          .insert({
            driver_id: driver_id,
            establishment_id: driver.establishment_id,
            amount: newPendingBalance,
            pix_key: driver.pix_key,
            pix_key_type: driver.pix_key_type || 'cpf',
            status: 'pending',
          })
          .select()
          .single();

        if (payoutError) {
          console.error("Error creating payout:", payoutError);
        } else {
          console.log(`Payout created: ${payout.id}`);
        }
      }
    }

    // Create notification for driver
    const { error: notifError } = await supabase
      .from("notifications")
      .insert({
        user_id: driver.user_id,
        establishment_id: driver.establishment_id,
        type: 'payment_received',
        priority: 'medium',
        title: 'Ganhos adicionados',
        message: `R$ ${driverEarnings.toFixed(2)} foram adicionados ao seu saldo`,
        data: {
          order_id,
          delivery_tracking_id,
          amount: driverEarnings,
        },
      });

    if (notifError) {
      console.error("Error creating notification:", notifError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        driver_earnings: driverEarnings,
        establishment_fee: establishmentFee,
        new_pending_balance: newPendingBalance,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Erro interno";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
