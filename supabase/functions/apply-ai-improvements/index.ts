import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { establishmentId, actions } = await req.json();
    
    if (!establishmentId || !actions || !Array.isArray(actions)) {
      return new Response(
        JSON.stringify({ error: "Missing establishmentId or actions" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

    const results: { action: string; success: boolean; error?: string }[] = [];
    let totalCreditsUsed = 0;

    for (const action of actions) {
      try {
        console.log(`Processing action: ${action.type}`);

        if (action.type === 'generate_logo' || action.type === 'generate_banner') {
          const imageType = action.type === 'generate_logo' ? 'logo' : 'banner';
          
          const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: imageType,
              id: action.target_id,
              name: action.target_name || 'Estabelecimento',
              establishmentId: establishmentId
            })
          });

          if (response.ok) {
            results.push({ action: action.type, success: true });
            totalCreditsUsed += 2;
          } else {
            const errorText = await response.text();
            results.push({ action: action.type, success: false, error: errorText });
          }
        }

        if (action.type === 'generate_photo') {
          const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'products',
              id: action.target_id,
              name: action.target_name || 'Produto',
              establishmentId: establishmentId
            })
          });

          if (response.ok) {
            results.push({ action: action.type, success: true });
            totalCreditsUsed += 1;
          } else {
            const errorText = await response.text();
            results.push({ action: action.type, success: false, error: errorText });
          }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (actionError: unknown) {
        const errorMessage = actionError instanceof Error ? actionError.message : 'Unknown error';
        console.error(`Error processing action ${action.type}:`, actionError);
        results.push({ action: action.type, success: false, error: errorMessage });
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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