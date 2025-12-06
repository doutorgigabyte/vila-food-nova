import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, id, name, establishmentId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Generate prompt based on type
    let prompt = '';
    if (type === 'product') {
      prompt = `Professional food photography of ${name}. Appetizing, well-lit, restaurant quality, clean white background, high resolution, commercial food photography style.`;
    } else if (type === 'category') {
      prompt = `Professional icon or illustration representing the category "${name}" for a food delivery app. Clean, modern, minimalist design, vibrant colors, suitable for app interface.`;
    } else if (type === 'establishment_logo') {
      prompt = `Professional restaurant logo for "${name}". Modern, clean design, suitable for food delivery app, minimalist style.`;
    } else if (type === 'establishment_banner') {
      prompt = `Professional restaurant banner image for "${name}". Wide format, appetizing food theme, warm lighting, commercial quality.`;
    }

    console.log(`Generating image for ${type}: ${name}`);

    // Call Lovable AI to generate image
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          { role: 'user', content: prompt }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const imageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      throw new Error('No image generated from AI');
    }

    // Extract base64 data (remove data:image/png;base64, prefix)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload to S3 via s3-upload function
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create a blob from the image buffer
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    const file = new File([blob], `${id}-${Date.now()}.png`, { type: 'image/png' });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type === 'category' ? 'categories' : type === 'product' ? 'products' : 'establishments');
    formData.append('establishmentId', establishmentId || 'general');

    const uploadResponse = await fetch(`${supabaseUrl}/functions/v1/s3-upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const uploadError = await uploadResponse.text();
      console.error('S3 upload error:', uploadError);
      throw new Error(`S3 upload failed: ${uploadError}`);
    }

    const uploadResult = await uploadResponse.json();
    const imageUrl = uploadResult.url;

    // Update database record
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (type === 'product') {
      const { error } = await supabase
        .from('products')
        .update({ image_url: imageUrl })
        .eq('id', id);
      if (error) throw error;
    } else if (type === 'category') {
      const { error } = await supabase
        .from('categories')
        .update({ image_url: imageUrl })
        .eq('id', id);
      if (error) throw error;
    } else if (type === 'establishment_logo') {
      const { error } = await supabase
        .from('establishments')
        .update({ logo_url: imageUrl })
        .eq('id', id);
      if (error) throw error;
    } else if (type === 'establishment_banner') {
      const { error } = await supabase
        .from('establishments')
        .update({ banner_url: imageUrl })
        .eq('id', id);
      if (error) throw error;
    }

    console.log(`Successfully generated and saved image for ${type}: ${name}`);

    return new Response(JSON.stringify({ 
      success: true, 
      imageUrl,
      type,
      id,
      name
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error generating image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate image';
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
