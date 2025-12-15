import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const { action, productName, productType, categories } = await req.json();

    if (action === 'suggest') {
      const systemPrompt = `Você é um assistente especializado em cadastro de produtos para restaurantes, supermercados, pizzarias e delivery.
      
Sua tarefa é sugerir:
1. Uma descrição atraente e comercial para o produto (máximo 150 caracteres)
2. A categoria mais adequada da lista fornecida
3. Uma estimativa de preço baseada no mercado brasileiro

Responda APENAS em JSON válido no formato:
{
  "description": "descrição do produto",
  "category": "nome da categoria",
  "price": 0.00
}`;

      const userPrompt = `Produto: ${productName}
Tipo: ${productType}
Categorias disponíveis: ${categories?.join(', ') || 'Geral'}

Sugira descrição, categoria e preço para este produto.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI Gateway error:', response.status, errorText);
        
        if (response.status === 402) {
          return new Response(JSON.stringify({ 
            error: 'Créditos de IA esgotados. Acesse Configurações > Workspace > Uso para adicionar créditos.',
            code: 'INSUFFICIENT_CREDITS'
          }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ 
            error: 'Limite de requisições excedido. Tente novamente em alguns segundos.',
            code: 'RATE_LIMITED'
          }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        throw new Error(`Erro na API de IA: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      // Parse JSON response
      let suggestions;
      try {
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found');
        }
      } catch (parseError) {
        console.error('Parse error:', parseError, 'Content:', content);
        suggestions = {
          description: `Delicioso(a) ${productName} de alta qualidade`,
          category: categories?.[0] || 'Geral',
          price: 19.90,
        };
      }

      return new Response(JSON.stringify(suggestions), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'enrich_batch') {
      // Enriquecimento de lote de produtos
      const { products } = await req.json();
      
      const enriched = await Promise.all(products.map(async (product: any) => {
        if (product.descricao) return product;
        
        try {
          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-lite',
              messages: [
                { 
                  role: 'user', 
                  content: `Crie uma descrição comercial curta (máximo 100 caracteres) para: ${product.nome}. Responda APENAS com a descrição, sem aspas.` 
                },
              ],
            }),
          });

          if (response.ok) {
            const data = await response.json();
            product.descricao = data.choices?.[0]?.message?.content?.trim() || '';
          }
        } catch (e) {
          console.error('Enrich error:', e);
        }
        
        return product;
      }));

      return new Response(JSON.stringify({ products: enriched }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
