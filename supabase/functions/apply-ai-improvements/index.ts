import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ==================== Authentication Helper ====================
async function authenticateRequest(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    console.log("[apply-ai-improvements] Auth failed:", error?.message);
    return null;
  }
  
  return { userId: user.id };
}

// ==================== Ownership Verification ====================
async function verifyEstablishmentOwnership(userId: string, establishmentId: string): Promise<boolean> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  
  // Check if user owns the establishment
  const { data: establishment } = await supabase
    .from('establishments')
    .select('owner_id')
    .eq('id', establishmentId)
    .single();
    
  if (establishment?.owner_id === userId) {
    return true;
  }
  
  // Check if user has access via establishment_users
  const { data: userAccess } = await supabase
    .from('establishment_users')
    .select('id')
    .eq('user_id', userId)
    .eq('establishment_id', establishmentId)
    .eq('is_active', true)
    .single();
    
  if (userAccess) {
    return true;
  }
  
  // Check if user is super_admin
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'super_admin')
    .single();
    
  return !!roleData;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ==================== Authentication Required ====================
    const auth = await authenticateRequest(req);
    
    if (!auth) {
      console.log("[apply-ai-improvements] Unauthorized request rejected");
      return new Response(
        JSON.stringify({ error: "Unauthorized - authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { establishmentId, actions } = await req.json();
    
    if (!establishmentId || !actions || !Array.isArray(actions)) {
      return new Response(
        JSON.stringify({ error: "Missing establishmentId or actions" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ==================== Ownership Verification ====================
    const hasAccess = await verifyEstablishmentOwnership(auth.userId, establishmentId);
    
    if (!hasAccess) {
      console.log(`[apply-ai-improvements] Access denied for user ${auth.userId} to establishment ${establishmentId}`);
      return new Response(
        JSON.stringify({ error: "Access denied - you don't have permission for this establishment" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[apply-ai-improvements] Authenticated user ${auth.userId} applying improvements to ${establishmentId}`);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const authHeader = req.headers.get('authorization');

    const results: { action: string; success: boolean; error?: string; data?: any }[] = [];
    let totalCreditsUsed = 0;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    for (const action of actions) {
      try {
        console.log(`Processing action: ${action.type}`);

        // Handle description improvement
        if (action.type === 'improve_description') {
          // target_name contains the improved description text
          const improvedDescription = action.target_name;
          
          if (improvedDescription) {
            const { error: updateError } = await supabase
              .from('establishments')
              .update({ description: improvedDescription })
              .eq('id', action.target_id);
              
            if (updateError) {
              results.push({ action: action.type, success: false, error: updateError.message });
            } else {
              results.push({ 
                action: action.type, 
                success: true, 
                data: { newDescription: improvedDescription } 
              });
              totalCreditsUsed += 1;
            }
          } else {
            results.push({ action: action.type, success: false, error: 'No improved description provided' });
          }
        }

        if (action.type === 'generate_logo' || action.type === 'generate_banner') {
          const imageType = action.type === 'generate_logo' ? 'logo' : 'banner';
          
          const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-image`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': authHeader || ''
            },
            body: JSON.stringify({
              type: imageType,
              id: action.target_id,
              name: action.target_name || 'Estabelecimento',
              establishmentId: establishmentId
            })
          });

          if (response.ok) {
            const responseData = await response.json();
            results.push({ action: action.type, success: true, data: responseData });
            totalCreditsUsed += 2;
          } else {
            const errorText = await response.text();
            results.push({ action: action.type, success: false, error: errorText });
          }
        }

        if (action.type === 'improve_description') {
          // Generate optimized description using the establishment/product context
          const targetTable = action.target_id === establishmentId ? 'establishments' : 'products';
          const currentName = action.target_name || 'Item';

          // Generate improved description
          const improvedDesc = `${currentName} - Experimente o melhor sabor de Tamandaré. Feito com ingredientes frescos e selecionados, preparado com carinho para você.`;

          const { error: updateError } = await supabase
            .from(targetTable)
            .update({ description: improvedDesc })
            .eq('id', action.target_id);

          if (!updateError) {
            results.push({ action: action.type, success: true });
            totalCreditsUsed += 1;
          } else {
            results.push({ action: action.type, success: false, error: updateError.message });
          }
        }

        if (action.type === 'generate_all_photos') {
          // Fetch all products without photos and generate for each
          const { data: productsWithoutPhotos } = await supabase
            .from('products')
            .select('id, name')
            .eq('establishment_id', establishmentId)
            .is('image_url', null)
            .eq('is_active', true)
            .limit(10);

          if (productsWithoutPhotos) {
            for (const product of productsWithoutPhotos) {
              const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-image`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': authHeader || ''
                },
                body: JSON.stringify({
                  type: 'products',
                  id: product.id,
                  name: product.name,
                  establishmentId
                })
              });

              results.push({
                action: `generate_photo_${product.name}`,
                success: response.ok,
                error: response.ok ? undefined : await response.text()
              });
              totalCreditsUsed += 1;
              await new Promise(resolve => setTimeout(resolve, 1500));
            }
          } else {
            results.push({ action: action.type, success: true });
          }
        }

        if (action.type === 'generate_photo') {
          const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-image`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': authHeader || ''
            },
            body: JSON.stringify({
              type: 'products',
              id: action.target_id,
              name: action.target_name || 'Produto',
              establishmentId: establishmentId
            })
          });

          if (response.ok) {
            const responseData = await response.json();
            results.push({ action: action.type, success: true, data: responseData });
            totalCreditsUsed += 1;
          } else {
            const errorText = await response.text();
            results.push({ action: action.type, success: false, error: errorText });
          }
        }

        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (actionError: unknown) {
        const errorMessage = actionError instanceof Error ? actionError.message : 'Unknown error';
        console.error(`Error processing action ${action.type}:`, actionError);
        results.push({ action: action.type, success: false, error: errorMessage });
      }
    }

    await supabase
      .from('ai_profile_analyses')
      .update({ improvements_applied: true })
      .eq('establishment_id', establishmentId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (totalCreditsUsed > 0) {
      await supabase.from('ai_transactions').insert({
        establishment_id: establishmentId,
        type: 'batch_improvements',
        description: `Melhorias em lote: ${results.filter(r => r.success).length} ações aplicadas`,
        credits_used: totalCreditsUsed
      });
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({ 
        success: true,
        summary: { total: results.length, successful: successCount, failed: failCount, credits_used: totalCreditsUsed },
        results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Apply improvements error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
