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
      prompt = `Generate a professional food photography image of "${name}". The image should be appetizing, well-lit, restaurant quality, with a clean background. High resolution, commercial food photography style. Do not include any text in the image.`;
    } else if (type === 'category') {
      prompt = `Generate a professional icon or illustration representing the food category "${name}" for a food delivery app. Clean, modern, minimalist design with vibrant colors. Suitable for app interface. Do not include any text in the image.`;
    } else if (type === 'establishment_logo') {
      prompt = `Generate a professional restaurant logo for "${name}". Modern, clean design suitable for a food delivery app. Minimalist style with vibrant colors. Do not include any text in the image.`;
    } else if (type === 'establishment_banner') {
      prompt = `Generate a professional wide restaurant banner image for "${name}". Wide format (16:9 aspect ratio), appetizing food theme, warm lighting, commercial quality. Do not include any text in the image.`;
    }

    console.log(`Generating image for ${type}: ${name}`);
    console.log(`Prompt: ${prompt}`);

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
      throw new Error(`AI API error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI Response structure:', JSON.stringify(Object.keys(aiData)));
    console.log('AI Choices:', aiData.choices?.length);
    
    if (aiData.choices?.[0]?.message) {
      console.log('Message keys:', Object.keys(aiData.choices[0].message));
    }

    // Try different paths to extract the image
    let imageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    // Alternative: check if image is directly in the response
    if (!imageBase64 && aiData.choices?.[0]?.message?.content) {
      const content = aiData.choices[0].message.content;
      // Check if content is a base64 image
      if (typeof content === 'string' && content.startsWith('data:image')) {
        imageBase64 = content;
      }
    }

    if (!imageBase64) {
      console.error('Full AI response:', JSON.stringify(aiData).substring(0, 1000));
      throw new Error('No image generated from AI - check response structure');
    }

    console.log('Image generated successfully, base64 length:', imageBase64.length);

    // Extract base64 data (remove data:image/png;base64, prefix)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to S3 via s3-upload function
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create a blob from the image buffer
    const blob = new Blob([bytes], { type: 'image/png' });
    const file = new File([blob], `${id}-${Date.now()}.png`, { type: 'image/png' });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type === 'category' ? 'categories' : type === 'product' ? 'products' : 'establishments');
    formData.append('establishmentId', establishmentId || 'general');

    console.log('Uploading to S3...');

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

    console.log('Uploaded to S3:', imageUrl);

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
