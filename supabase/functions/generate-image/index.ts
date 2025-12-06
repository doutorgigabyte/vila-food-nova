import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ==================== AWS S3 Upload Helpers ====================
async function sha256Hex(data: Uint8Array | string): Promise<string> {
  const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const arrayBuffer = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(arrayBuffer).set(buffer);
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmac(key: Uint8Array, data: string): Promise<Uint8Array> {
  const keyBuffer = new ArrayBuffer(key.byteLength);
  new Uint8Array(keyBuffer).set(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
  return new Uint8Array(signature);
}

async function getSignatureKey(secretKey: string, dateStamp: string, region: string, service: string): Promise<Uint8Array> {
  const kDate = await hmac(new TextEncoder().encode('AWS4' + secretKey), dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  return await hmac(kService, 'aws4_request');
}

async function uploadToS3(fileBuffer: Uint8Array, contentType: string, type: string, establishmentId?: string): Promise<string> {
  const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID');
  const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY');
  const AWS_BUCKET_NAME = Deno.env.get('AWS_BUCKET_NAME');
  const AWS_REGION = Deno.env.get('AWS_REGION') || 'us-east-1';
  const AWS_CLOUDFRONT_URL = Deno.env.get('AWS_CLOUDFRONT_URL');

  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_BUCKET_NAME) {
    throw new Error('AWS credentials not configured');
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const uniqueId = crypto.randomUUID().split('-')[0];
  
  const s3Key = establishmentId && establishmentId !== 'general'
    ? `_uploads/${type}/${establishmentId}/${year}/${month}/${uniqueId}_${Date.now()}.png`
    : `_uploads/generated/${type}/${year}/${month}/${uniqueId}_${Date.now()}.png`;

  const host = `${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`;
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);

  const payloadHash = await sha256Hex(fileBuffer);
  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = `PUT\n/${s3Key}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${AWS_REGION}/s3/aws4_request`;
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${await sha256Hex(canonicalRequest)}`;

  const signingKey = await getSignatureKey(AWS_SECRET_ACCESS_KEY, dateStamp, AWS_REGION, 's3');
  const signature = Array.from(await hmac(signingKey, stringToSign))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  const authorizationHeader = `${algorithm} Credential=${AWS_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const uploadUrl = `https://${host}/${s3Key}`;
  console.log('Uploading to S3:', s3Key);

  // Convert Uint8Array to ArrayBuffer for fetch body
  const bodyBuffer = new ArrayBuffer(fileBuffer.byteLength);
  new Uint8Array(bodyBuffer).set(fileBuffer);

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      'Authorization': authorizationHeader,
    },
    body: bodyBuffer,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`S3 upload failed: ${uploadResponse.status} - ${errorText}`);
  }

  return AWS_CLOUDFRONT_URL ? `${AWS_CLOUDFRONT_URL}/${s3Key}` : uploadUrl;
}

// ==================== Category Color Mapping ====================
const categoryColors: Record<string, string> = {
  'pizzas': 'vibrant red and orange', 'hambúrgueres': 'golden brown and amber',
  'bebidas': 'cool blue and cyan', 'sobremesas': 'soft pink and purple',
  'salgados': 'warm yellow and gold', 'japonesa': 'deep red and black',
  'açaí': 'rich purple and berry', 'sorvetes': 'pastel pink and mint',
  'padaria': 'warm brown and cream', 'massas': 'tomato red and pasta yellow',
  'carnes': 'deep burgundy and brown', 'saladas': 'fresh green and lime',
  'lanches': 'orange and mustard', 'cafeteria': 'coffee brown and caramel',
  'doces': 'candy pink and lavender', 'sushi': 'coral orange and wasabi green',
  'frutos do mar': 'ocean blue and coral', 'vegetariano': 'leaf green and earth tones',
  'fitness': 'energetic green and white', 'mexicana': 'fiesta red and guacamole green',
};

function getCategoryColor(categoryName: string): string {
  const lowerName = categoryName.toLowerCase();
  for (const [key, color] of Object.entries(categoryColors)) {
    if (lowerName.includes(key)) return color;
  }
  const hash = lowerName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = ['vibrant teal and turquoise', 'warm coral and peach', 'electric purple and magenta',
    'sunny yellow and gold', 'forest green and emerald', 'royal blue and navy'];
  return colors[hash % colors.length];
}

// ==================== Prompt Generation ====================
function generatePrompt(type: string, name: string): { prompt: string; aspectRatio: string } {
  switch (type) {
    case 'product':
      return {
        prompt: `Professional food photography of "${name}". High-end commercial style, appetizing presentation, soft gradient background, restaurant quality, ready for delivery app. Ultra high resolution):1.4, no text.`,
        aspectRatio: '1:1'
      };
    case 'category':
      const colorScheme = getCategoryColor(name);
      return {
        prompt: `3D glossy icon for food category "${name}". ${colorScheme} color scheme, circular shape, soft watercolor gradient background, modern app-ready UI/UX quality, no text.`,
        aspectRatio: '1:1'
      };
    case 'logo':
    case 'establishment_logo':
      return {
        prompt: `Professional minimalist business logo for "${name}" restaurant/food business. Clean modern flat design, vibrant appetizing colors, centered composition, suitable as app icon, no text.`,
        aspectRatio: '1:1'
      };
    case 'banner':
    case 'establishment_banner':
      return {
        prompt: `Professional wide restaurant banner for "${name}". Panoramic format, appetizing food arrangement, warm inviting lighting, high-end commercial photography, welcoming atmosphere, no text.`,
        aspectRatio: '16:9'
      };
    default:
      return { prompt: `Professional image of ${name}, high quality, no text.`, aspectRatio: '1:1' };
  }
}

// ==================== Imagen 4.0 API Call ====================
async function generateImageWithImagen(prompt: string, aspectRatio: string): Promise<Uint8Array> {
  const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
  if (!GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY not configured');
  }

  // Try Imagen 4.0 first, fallback to 3.0 if needed
  const models = ['imagen-4.0-generate-001', 'imagen-3.0-generate-002'];
  
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${GOOGLE_API_KEY}`;
    
    console.log(`Trying model: ${model}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: aspectRatio,
          personGeneration: 'dont_allow'
        }
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const base64Image = data.predictions?.[0]?.bytesBase64Encoded;
      
      if (base64Image) {
        console.log(`Image generated successfully with ${model}`);
        const binaryString = atob(base64Image);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      }
    }
    
    const errorText = await response.text();
    console.log(`Model ${model} failed: ${response.status} - ${errorText.substring(0, 200)}`);
    
    if (response.status === 429) {
      throw new Error('RATE_LIMIT');
    }
  }

  throw new Error('All Imagen models failed to generate image');
}

// ==================== Fallback: Lovable AI Gateway ====================
async function generateImageWithLovable(prompt: string): Promise<Uint8Array> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  console.log('Using Lovable AI Gateway fallback...');

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-image-preview',
      messages: [{ role: 'user', content: prompt }],
      modalities: ['image', 'text']
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) throw new Error('RATE_LIMIT');
    if (response.status === 402) throw new Error('PAYMENT_REQUIRED');
    throw new Error(`Lovable AI error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  
  if (imageUrl && imageUrl.startsWith('data:image')) {
    const base64Match = imageUrl.match(/^data:image\/[^;]+;base64,(.+)$/);
    if (base64Match?.[1]) {
      const binaryString = atob(base64Match[1]);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
  }

  throw new Error('No image in Lovable AI response');
}

// ==================== Main Handler ====================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, id, name, establishmentId } = await req.json();
    
    if (!name || !type) {
      return new Response(JSON.stringify({ error: 'name and type are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[generate-image] Generating ${type} for: ${name}`);
    const { prompt, aspectRatio } = generatePrompt(type, name);

    // Try Imagen 4.0 first, then fallback to Lovable AI
    let imageBytes: Uint8Array;
    let engine = 'imagen';
    
    try {
      imageBytes = await generateImageWithImagen(prompt, aspectRatio);
    } catch (imagenError) {
      console.log('Imagen failed, trying Lovable AI fallback:', imagenError);
      
      if (imagenError instanceof Error && imagenError.message === 'RATE_LIMIT') {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Try again in 60 seconds.',
          retryAfter: 60
        }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      try {
        imageBytes = await generateImageWithLovable(prompt);
        engine = 'lovable';
      } catch (lovableError) {
        if (lovableError instanceof Error) {
          if (lovableError.message === 'RATE_LIMIT') {
            return new Response(JSON.stringify({ 
              error: 'Rate limit exceeded on all engines.',
              retryAfter: 60
            }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
          if (lovableError.message === 'PAYMENT_REQUIRED') {
            return new Response(JSON.stringify({ 
              error: 'Payment required for Lovable AI'
            }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }
        throw lovableError;
      }
    }

    // Upload to S3
    const uploadType = type === 'category' ? 'categories' : type === 'product' ? 'products' : 'establishments';
    const s3ImageUrl = await uploadToS3(imageBytes, 'image/png', uploadType, establishmentId || id);
    console.log(`[generate-image] Uploaded to S3: ${s3ImageUrl} (engine: ${engine})`);

    // Update database if ID provided
    if (id) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const table = type === 'product' ? 'products' : type === 'category' ? 'categories' : 'establishments';
      const column = (type === 'logo' || type === 'establishment_logo') ? 'logo_url' 
                   : (type === 'banner' || type === 'establishment_banner') ? 'banner_url' 
                   : 'image_url';

      const { error } = await supabase.from(table).update({ [column]: s3ImageUrl }).eq('id', id);
      if (error) console.error('DB update error:', error);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      imageUrl: s3ImageUrl,
      engine,
      type,
      id,
      name
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[generate-image] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to generate image' 
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
