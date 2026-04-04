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
    const { 
      product_id, 
      instance_name, 
      remote_jid,
      establishment_id 
    } = await req.json();

    if (!product_id || !instance_name || !remote_jid || !establishment_id) {
      throw new Error('Missing required fields: product_id, instance_name, remote_jid, establishment_id');
    }

    console.log('Sending product photo:', { product_id, instance_name, remote_jid });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Buscar produto com dados completos
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, description, price, promotional_price, image_url')
      .eq('id', product_id)
      .eq('establishment_id', establishment_id)
      .single();

    if (productError || !product) {
      console.error('Product not found:', productError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Produto não encontrado',
        message: 'Desculpe, não encontrei esse produto.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar dados do estabelecimento para Evolution API
    const { data: establishment, error: estError } = await supabase
      .from('establishments')
      .select('evolution_api_token')
      .eq('id', establishment_id)
      .single();

    if (estError || !establishment?.evolution_api_token) {
      console.error('Establishment not found or no API token:', estError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Configuração de WhatsApp não encontrada',
        message: `*${product.name}*\n\n${product.description || ''}\n\n💰 *R$ ${(product.promotional_price || product.price).toFixed(2).replace('.', ',')}*`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se tem imagem
    if (!product.image_url) {
      // Retornar apenas texto se não tiver imagem
      const textCaption = `*${product.name}*\n\n${product.description || ''}\n\n💰 *R$ ${(product.promotional_price || product.price).toFixed(2).replace('.', ',')}*\n\n✨ Digite a quantidade desejada!`;
      
      return new Response(JSON.stringify({ 
        success: true, 
        has_image: false,
        message: textCaption,
        product: {
          id: product.id,
          name: product.name,
          price: product.promotional_price || product.price
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Baixar imagem do CloudFront/URL
    console.log('Downloading image from:', product.image_url);
    
    let imageBase64: string;
    let mimeType = 'image/jpeg';
    
    try {
      const imageResponse = await fetch(product.image_url);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`);
      }
      
      const contentType = imageResponse.headers.get('content-type');
      if (contentType) {
        mimeType = contentType.split(';')[0];
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      const uint8Array = new Uint8Array(imageBuffer);
      
      // Convert to base64
      let binary = '';
      const chunkSize = 32768;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      imageBase64 = btoa(binary);
      
      console.log('Image downloaded successfully, size:', uint8Array.length);
    } catch (imgError) {
      console.error('Error downloading image:', imgError);
      // Retornar texto se falhar download
      const textCaption = `*${product.name}*\n\n${product.description || ''}\n\n💰 *R$ ${(product.promotional_price || product.price).toFixed(2).replace('.', ',')}*\n\n✨ Digite a quantidade desejada!`;
      
      return new Response(JSON.stringify({ 
        success: true, 
        has_image: false,
        message: textCaption,
        product: {
          id: product.id,
          name: product.name,
          price: product.promotional_price || product.price
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Formatar caption
    const price = product.promotional_price || product.price;
    const priceFormatted = `R$ ${price.toFixed(2).replace('.', ',')}`;
    
    let caption = `*${product.name}*\n\n`;
    if (product.description) {
      caption += `${product.description}\n\n`;
    }
    caption += `💰 *${priceFormatted}*\n\n`;
    caption += `✨ Digite a quantidade desejada ou pergunte mais detalhes!`;

    // Enviar via Evolution API
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL') || 'https://press.vilafood.delivery';
    
    console.log('Sending image via Evolution API to:', remote_jid);
    
    const sendResponse = await fetch(`${evolutionApiUrl}/message/sendMedia/${instance_name}`, {
      method: 'POST',
      headers: {
        'apikey': establishment.evolution_api_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: remote_jid,
        mediatype: 'image',
        mimetype: mimeType,
        caption: caption,
        media: `data:${mimeType};base64,${imageBase64}`
      })
    });

    const sendResult = await sendResponse.json();
    console.log('Evolution API response:', sendResult);

    if (sendResult.key?.id) {
      return new Response(JSON.stringify({ 
        success: true, 
        has_image: true,
        message_id: sendResult.key.id,
        message: `Foto do produto '${product.name}' enviada com sucesso!`,
        product: {
          id: product.id,
          name: product.name,
          price: price
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.error('Failed to send image:', sendResult);
      // Fallback para texto
      return new Response(JSON.stringify({ 
        success: true, 
        has_image: false,
        message: caption,
        product: {
          id: product.id,
          name: product.name,
          price: price
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error sending product photo:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Não foi possível enviar a foto do produto.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
