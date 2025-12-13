import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { secret_key, action } = await req.json();
    
    if (secret_key !== 'vilafood-reset-2024') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: reset-driver - Reset driver password only
    if (action === 'reset-driver') {
      const driverEmail = 'entregador.teste@vilafood.delivery';
      const driverPassword = 'Teste@123';
      
      const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
      const foundUser = userData?.users.find(u => u.email === driverEmail);
      
      if (!foundUser) {
        return new Response(JSON.stringify({ error: 'Driver user not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        foundUser.id,
        { password: driverPassword }
      );
      
      if (updateError) throw updateError;
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Driver password reset',
        credentials: { email: driverEmail, password: driverPassword }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: create-driver - Create a test delivery driver
    if (action === 'create-driver') {
      const driverEmail = 'entregador.teste@vilafood.delivery';
      const driverPassword = 'Teste@123';
      const establishmentId = '4c9b12fb-a4c6-453d-87c2-6a9c9b6b1491'; // Doces e Tortas

      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users.find(u => u.email === driverEmail);
      
      let userId: string;
      
      if (existingUser) {
        userId = existingUser.id;
        // Update password
        await supabaseAdmin.auth.admin.updateUserById(userId, { password: driverPassword });
        console.log('Driver user already exists, password updated');
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: driverEmail,
          password: driverPassword,
          email_confirm: true,
          user_metadata: { full_name: 'Entregador Teste' }
        });
        
        if (createError) throw createError;
        userId = newUser.user.id;
        console.log('Created new driver user:', userId);
      }

      // Check if driver record exists
      const { data: existingDriver } = await supabaseAdmin
        .from('delivery_drivers')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!existingDriver) {
        // Create delivery driver record
        const { error: driverError } = await supabaseAdmin
          .from('delivery_drivers')
          .insert({
            user_id: userId,
            establishment_id: establishmentId,
            name: 'Entregador Teste',
            phone: '84999990001',
            email: driverEmail,
            vehicle_type: 'moto',
            license_plate: 'ABC-1234',
            is_active: true,
            is_available: true,
            pix_key: '84999990001',
            pix_key_type: 'phone'
          });

        if (driverError) throw driverError;
        console.log('Created delivery driver record');
      }

      // Link driver to establishment
      const { data: existingLink } = await supabaseAdmin
        .from('driver_establishment_links')
        .select('id')
        .eq('driver_id', userId)
        .eq('establishment_id', establishmentId)
        .single();

      if (!existingLink) {
        // Get the driver ID from delivery_drivers table
        const { data: driverRecord } = await supabaseAdmin
          .from('delivery_drivers')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (driverRecord) {
          await supabaseAdmin
            .from('driver_establishment_links')
            .insert({
              driver_id: driverRecord.id,
              establishment_id: establishmentId,
              status: 'approved',
              commission_type: 'fixed',
              fixed_fee: 5.00
            });
          console.log('Created driver-establishment link');
        }
      }

      // Add driver role
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', 'driver')
        .single();

      if (!existingRole) {
        await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: userId, role: 'driver' });
        console.log('Added driver role');
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Driver created successfully',
        credentials: {
          email: driverEmail,
          password: driverPassword,
          name: 'Entregador Teste',
          establishment: 'Doces e Tortas'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Default action: reset passwords
    const usersToReset = [
      { email: 'demo6@minhaveznodigital.com', name: 'Doces e Tortas' },
      { email: 'teste.beta.user@manus.im', name: 'Consumidor' }
    ];

    const results = [];
    const newPassword = 'Teste@123';

    for (const user of usersToReset) {
      const { data: userData, error: findError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (findError) {
        results.push({ email: user.email, success: false, error: findError.message });
        continue;
      }

      const foundUser = userData.users.find(u => u.email === user.email);
      
      if (!foundUser) {
        results.push({ email: user.email, success: false, error: 'User not found' });
        continue;
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        foundUser.id,
        { password: newPassword }
      );

      if (updateError) {
        results.push({ email: user.email, success: false, error: updateError.message });
      } else {
        results.push({ email: user.email, name: user.name, success: true });
        console.log(`Password reset for ${user.email}`);
      }
    }

    return new Response(JSON.stringify({ 
      message: 'Password reset complete',
      results,
      newPassword 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
