import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CustomerAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state?: string;
  zip_code?: string;
  lat?: number;
  lng?: number;
  is_default?: boolean;
}

interface RegisterCustomerRequest {
  phone: string;
  name: string;
  establishment_id: string;
  email?: string;
  address?: CustomerAddress;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { phone, name, establishment_id, email, address }: RegisterCustomerRequest = await req.json();

    if (!phone || !name || !establishment_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'phone, name and establishment_id are required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize phone number (remove non-digits, ensure country code)
    let normalizedPhone = phone.replace(/\D/g, '');
    if (normalizedPhone.length === 11 && normalizedPhone.startsWith('0')) {
      normalizedPhone = normalizedPhone.substring(1);
    }
    if (normalizedPhone.length === 10 || normalizedPhone.length === 11) {
      normalizedPhone = '55' + normalizedPhone;
    }

    console.log('Register customer request:', { phone: normalizedPhone, name, establishment_id, has_address: !!address });

    // Check if customer already exists for this establishment
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', normalizedPhone)
      .eq('establishment_id', establishment_id)
      .maybeSingle();

    if (existingCustomer) {
      console.log('Customer already exists:', existingCustomer.id);

      // If new address provided, add to addresses array
      if (address) {
        const currentAddresses = existingCustomer.addresses || [];
        
        // Check if address already exists
        const addressExists = currentAddresses.some((a: CustomerAddress) => 
          a.street === address.street && 
          a.number === address.number &&
          a.neighborhood === address.neighborhood
        );

        if (!addressExists) {
          const newAddress = { ...address, is_default: currentAddresses.length === 0 };
          const updatedAddresses = [...currentAddresses, newAddress];

          const { error: updateError } = await supabase
            .from('customers')
            .update({ 
              addresses: updatedAddresses,
              default_address: address.is_default || currentAddresses.length === 0 ? newAddress : existingCustomer.default_address,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingCustomer.id);

          if (updateError) {
            console.error('Error updating customer addresses:', updateError);
          } else {
            console.log('Address added to existing customer');
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          customer_id: existingCustomer.id,
          is_new: false,
          message: 'Cliente já cadastrado'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new customer
    const addresses = address ? [{ ...address, is_default: true }] : [];
    
    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert({
        phone: normalizedPhone,
        name: name.trim(),
        email: email?.trim() || null,
        establishment_id,
        addresses,
        default_address: address || null,
        last_location_lat: address?.lat || null,
        last_location_lng: address?.lng || null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating customer:', insertError);
      throw new Error(`Failed to create customer: ${insertError.message}`);
    }

    console.log('New customer created:', newCustomer.id);

    return new Response(
      JSON.stringify({
        success: true,
        customer_id: newCustomer.id,
        is_new: true,
        message: 'Cliente cadastrado com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Register customer error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
