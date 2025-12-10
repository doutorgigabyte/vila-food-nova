import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyzeImageRequest {
  image_url?: string;
  image_base64?: string;
  analysis_type: 'payment_proof' | 'general' | 'address' | 'product';
  establishment_id?: string;
  menu_context?: string; // JSON string of menu for product matching
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      image_url, 
      image_base64, 
      analysis_type = 'general',
      menu_context 
    }: AnalyzeImageRequest = await req.json();

    if (!image_url && !image_base64) {
      return new Response(
        JSON.stringify({ success: false, error: 'image_url or image_base64 is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyze image request:', { image_url, has_base64: !!image_base64, analysis_type });

    let imageData: string;

    // If URL provided, fetch and convert to base64
    if (image_url) {
      console.log('Fetching image from URL:', image_url);
      const imageResponse = await fetch(image_url);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }
      const imageBuffer = await imageResponse.arrayBuffer();
      imageData = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
      console.log('Image fetched, size:', imageBuffer.byteLength, 'bytes');
    } else {
      imageData = image_base64!;
    }

    const geminiApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GOOGLE_API_KEY not configured');
    }

    // Build prompt based on analysis type
    let prompt = '';
    
    switch (analysis_type) {
      case 'payment_proof':
        prompt = `Analise esta imagem de comprovante de pagamento PIX.
Extraia as seguintes informações em JSON:
{
  "type": "pix_receipt" | "bank_transfer" | "other" | "not_payment",
  "amount": número (valor em reais, ex: 45.90),
  "date": "YYYY-MM-DD" ou null,
  "time": "HH:MM" ou null,
  "payer_name": "nome de quem pagou" ou null,
  "receiver_name": "nome de quem recebeu" ou null,
  "transaction_id": "código da transação" ou null,
  "bank": "nome do banco" ou null,
  "confidence": número de 0 a 1 indicando confiança na extração
}

Se não for um comprovante de pagamento, retorne:
{"type": "not_payment", "confidence": 0}

IMPORTANTE: Retorne APENAS o JSON, sem explicações.`;
        break;

      case 'address':
        prompt = `Analise esta imagem e extraia informações de endereço.
Pode ser uma foto de papel, tela de celular, ou qualquer documento com endereço.
Extraia em JSON:
{
  "found": true/false,
  "street": "nome da rua",
  "number": "número",
  "complement": "complemento" ou null,
  "neighborhood": "bairro",
  "city": "cidade",
  "state": "UF",
  "zip_code": "CEP" ou null,
  "full_address": "endereço completo formatado",
  "confidence": número de 0 a 1
}

Se não encontrar endereço: {"found": false, "confidence": 0}

IMPORTANTE: Retorne APENAS o JSON.`;
        break;

      case 'product':
        prompt = `Analise esta imagem de produto/comida.
${menu_context ? `Cardápio disponível: ${menu_context}` : ''}

Identifique o produto e retorne em JSON:
{
  "identified": true/false,
  "product_name": "nome provável do produto",
  "category": "categoria (ex: pizza, hambúrguer, bebida)",
  "description": "descrição breve do que vê na imagem",
  "matches_menu": true/false (se corresponde a algo do cardápio),
  "menu_match_name": "nome exato do produto no cardápio" ou null,
  "confidence": número de 0 a 1
}

IMPORTANTE: Retorne APENAS o JSON.`;
        break;

      default: // general
        prompt = `Analise esta imagem e descreva o que você vê.
Retorne em JSON:
{
  "description": "descrição detalhada da imagem",
  "objects": ["lista", "de", "objetos", "identificados"],
  "text_found": "qualquer texto visível na imagem" ou null,
  "category": "categoria geral (foto, documento, comprovante, produto, etc)",
  "confidence": número de 0 a 1
}

IMPORTANTE: Retorne APENAS o JSON.`;
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: imageData
                }
              },
              { text: prompt }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log('Gemini raw response:', responseText);

    // Parse JSON from response
    let extractedData;
    try {
      // Remove markdown code blocks if present
      const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
      extractedData = {
        raw_text: responseText,
        parse_error: true
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis_type,
        extracted_data: extractedData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Image analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
