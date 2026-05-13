import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { gatewayLLMChat, isGatewayEnabled } from "../_shared/gateway.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractCustomerRequest {
  text: string;
  establishment_city?: string;
  establishment_state?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, establishment_city, establishment_state }: ExtractCustomerRequest = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ success: false, error: 'text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Extract customer data from text:', text.substring(0, 100));

    const cityContext = establishment_city ? `A cidade padrão é ${establishment_city}${establishment_state ? `, ${establishment_state}` : ''}.` : '';

    const messages = [
      {
        role: 'system' as const,
        content: `Você é um assistente que extrai dados de cadastro de cliente a partir de texto livre ou transcrição de áudio.
${cityContext}
Extraia as informações e retorne APENAS um JSON válido, sem explicações.`,
      },
      {
        role: 'user' as const,
        content: `Extraia os dados do cliente deste texto:

"${text}"

Retorne um JSON com esta estrutura:
{
  "success": true/false,
  "name": "nome completo do cliente" ou null,
  "street": "nome da rua/avenida" ou null,
  "number": "número" ou null,
  "complement": "complemento (apto, bloco, etc)" ou null,
  "neighborhood": "bairro" ou null,
  "city": "cidade" ou null,
  "state": "UF (2 letras)" ou null,
  "zip_code": "CEP formatado" ou null,
  "reference": "ponto de referência" ou null,
  "missing_fields": ["lista de campos não informados mas necessários"],
  "confidence": número de 0 a 1
}

Se não conseguir extrair dados suficientes, retorne success: false com os campos que conseguiu.
Campos mínimos necessários: name, street, number, neighborhood.`,
      },
    ];

    let responseText = '';

    if (isGatewayEnabled()) {
      const result = await gatewayLLMChat({ messages, temperature: 0.1 });
      if (!result.success) {
        if (result.statusCode === 429) {
          return new Response(
            JSON.stringify({ success: false, error: 'Rate limit excedido.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (result.statusCode === 402) {
          return new Response(
            JSON.stringify({ success: false, error: 'Créditos insuficientes.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.warn('[extract-customer-data] Gateway failed, falling back to Lovable:', result.error);
      } else {
        responseText = result.data?.content ?? '';
      }
    }

    if (!responseText) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        throw new Error('LOVABLE_API_KEY not configured and gateway unavailable');
      }
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ success: false, error: 'Rate limit excedido.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ success: false, error: 'Créditos insuficientes.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const errorText = await response.text();
        console.error('Lovable AI error:', errorText);
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const data = await response.json();
      responseText = data.choices?.[0]?.message?.content || '';
    }

    console.log('AI extracted:', responseText);

    let extractedData;
    try {
      const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(cleanJson);
    } catch {
      console.error('Failed to parse response as JSON');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Não foi possível extrair os dados. Tente novamente.',
          raw_response: responseText
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate minimum required fields
    const hasMinimumFields = extractedData.name && 
      extractedData.street && 
      extractedData.number && 
      extractedData.neighborhood;

    if (!hasMinimumFields) {
      extractedData.success = false;
      extractedData.missing_fields = [];
      if (!extractedData.name) extractedData.missing_fields.push('nome');
      if (!extractedData.street) extractedData.missing_fields.push('rua');
      if (!extractedData.number) extractedData.missing_fields.push('número');
      if (!extractedData.neighborhood) extractedData.missing_fields.push('bairro');
    }

    // Apply default city if not provided
    if (!extractedData.city && establishment_city) {
      extractedData.city = establishment_city;
    }
    if (!extractedData.state && establishment_state) {
      extractedData.state = establishment_state;
    }

    // Format full address for confirmation
    const addressParts = [
      extractedData.street,
      extractedData.number,
      extractedData.complement,
      extractedData.neighborhood,
      extractedData.city,
      extractedData.state
    ].filter(Boolean);
    
    extractedData.formatted_address = addressParts.join(', ');

    return new Response(
      JSON.stringify(extractedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Extract customer error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
