import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper functions for AWS Signature v4
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
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
  return new Uint8Array(signature);
}

async function getSignatureKey(
  secretKey: string,
  dateStamp: string,
  region: string,
  service: string
): Promise<Uint8Array> {
  const kDate = await hmac(new TextEncoder().encode('AWS4' + secretKey), dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  const kSigning = await hmac(kService, 'aws4_request');
  return kSigning;
}

async function uploadToS3(
  fileBuffer: Uint8Array,
  fileName: string,
  contentType: string,
  type: string,
  establishmentId?: string
): Promise<string> {
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
  const timestamp = Date.now();
  const uniqueId = crypto.randomUUID().split('-')[0];
  
  let s3Key: string;
  if (establishmentId && establishmentId !== 'general') {
    s3Key = `_uploads/${type}/${establishmentId}/${year}/${month}/${uniqueId}_${timestamp}.png`;
  } else {
    s3Key = `_uploads/generated/${type}/${year}/${month}/${uniqueId}_${timestamp}.png`;
  }

  const host = `${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`;
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);

  const payloadHash = await sha256Hex(fileBuffer);
  const canonicalUri = '/' + s3Key;
  const canonicalQuerystring = '';
  const canonicalHeaders = 
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest = 
    `PUT\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${AWS_REGION}/s3/aws4_request`;
  const stringToSign = 
    `${algorithm}\n${amzDate}\n${credentialScope}\n${await sha256Hex(canonicalRequest)}`;

  const signingKey = await getSignatureKey(AWS_SECRET_ACCESS_KEY, dateStamp, AWS_REGION, 's3');
  const signatureBuffer = await hmac(signingKey, stringToSign);
  const signature = Array.from(signatureBuffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const authorizationHeader = 
    `${algorithm} Credential=${AWS_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const uploadUrl = `https://${host}/${s3Key}`;
  console.log('Uploading to S3:', uploadUrl);

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
    console.error('S3 upload error:', uploadResponse.status, errorText);
    throw new Error(`S3 upload failed: ${uploadResponse.status} - ${errorText}`);
  }

  const imageUrl = AWS_CLOUDFRONT_URL 
    ? `${AWS_CLOUDFRONT_URL}/${s3Key}`
    : uploadUrl;

  console.log('Upload successful:', imageUrl);
  return imageUrl;
}

// Category color mapping for 3D icons
const categoryColors: Record<string, string> = {
  'pizzas': 'vibrant red and orange',
  'hambúrgueres': 'golden brown and amber',
  'bebidas': 'cool blue and cyan',
  'sobremesas': 'soft pink and purple',
  'salgados': 'warm yellow and gold',
  'japonesa': 'deep red and black',
  'açaí': 'rich purple and berry',
  'sorvetes': 'pastel pink and mint',
  'padaria': 'warm brown and cream',
  'massas': 'tomato red and pasta yellow',
  'carnes': 'deep burgundy and brown',
  'saladas': 'fresh green and lime',
  'lanches': 'orange and mustard',
  'cafeteria': 'coffee brown and caramel',
  'doces': 'candy pink and lavender',
  'sushi': 'coral orange and wasabi green',
  'frutos do mar': 'ocean blue and coral',
  'vegetariano': 'leaf green and earth tones',
  'fitness': 'energetic green and white',
  'mexicana': 'fiesta red and guacamole green',
};

function getCategoryColor(categoryName: string): string {
  const lowerName = categoryName.toLowerCase();
  for (const [key, color] of Object.entries(categoryColors)) {
    if (lowerName.includes(key)) return color;
  }
  // Generate a unique color based on the category name hash
  const hash = lowerName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    'vibrant teal and turquoise',
    'warm coral and peach',
    'electric purple and magenta',
    'sunny yellow and gold',
    'forest green and emerald',
    'royal blue and navy',
    'rustic orange and terracotta',
    'dusty rose and mauve',
  ];
  return colors[hash % colors.length];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, id, name, establishmentId } = await req.json();
    
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY not configured');
    }

    // Generate prompt based on type with enhanced prompts
    let prompt = '';
    if (type === 'product') {
      prompt = `Create a professional food photography image of "${name}". 
High-end commercial food photography style. 
Appetizing presentation with perfect lighting. 
Clean, soft gradient background. 
Restaurant quality, ready for food delivery app.
Ultra high resolution. Do not include any text.`;
    } else if (type === 'category') {
      const colorScheme = getCategoryColor(name);
      prompt = `Create a 3D icon for food category "${name}".
Style: Glossy 3D icon with ${colorScheme} color scheme.
Format: Circular shape with transparent background.
Background: Soft watercolor gradient tones.
The 3D icon should be the prominent focus, modern and app-ready.
Professional UI/UX quality for food delivery app.
Do not include any text in the image.`;
    } else if (type === 'logo' || type === 'establishment_logo') {
      prompt = `Create a professional, modern business logo for "${name}".
Style: Clean, minimalist logo design suitable for a restaurant/food business.
Format: Square format (500x500), centered composition.
Design: Modern flat or subtle 3D style, vibrant appetizing colors.
The logo should convey professionalism and food quality.
Clean background, suitable for use as app icon or profile picture.
Do not include any text in the image, only iconography.`;
    } else if (type === 'banner' || type === 'establishment_banner') {
      prompt = `Create a professional wide restaurant banner image for "${name}".
Aspect ratio: Wide panoramic format (1200x400 pixels, 3:1 ratio).
Style: Appetizing food arrangement with warm, inviting lighting.
Quality: High-end commercial photography style.
Mood: Professional, welcoming restaurant atmosphere.
Show beautiful food presentation suitable for a ${name} business.
Do not include any text in the image.`;
    }

    console.log(`Generating image for ${type}: ${name}`);
    console.log(`Prompt: ${prompt}`);

    // Call Google Gemini API directly for image generation (gemini-2.5-flash-image - "Nano Banana")
    const model = 'gemini-2.5-flash-image';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_API_KEY}`;
    
    const aiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          candidateCount: 1
        }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Gemini API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.',
          retryAfter: 60
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Gemini API error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log('Gemini API Response received, extracting image...');

    // Extract image from Gemini response
    // Format: { candidates: [{ content: { parts: [{ inlineData: { mimeType: "image/png", data: "base64..." } }] } }] }
    let imageBase64: string | undefined;
    
    const candidates = aiData.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            imageBase64 = part.inlineData.data;
            break;
          }
        }
      }
    }
    
    if (imageBase64) {
      console.log('Found image in Gemini response, base64 length:', imageBase64.length);
    }

    if (!imageBase64) {
      console.error('No image found in Lovable AI response. Full response:', JSON.stringify(aiData));
      return new Response(JSON.stringify({ 
        success: false, 
        skipped: true, 
        reason: `AI não gerou imagem para "${name}"` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Convert base64 to binary
    const binaryString = atob(imageBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload directly to S3
    const uploadType = type === 'category' ? 'categories' : type === 'product' ? 'products' : 'establishments';
    const imageUrl = await uploadToS3(bytes, `${id}.png`, 'image/png', uploadType, establishmentId || id);

    // Update database record if we have an ID
    if (id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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
      } else if (type === 'logo' || type === 'establishment_logo') {
        const { error } = await supabase
          .from('establishments')
          .update({ logo_url: imageUrl })
          .eq('id', id);
        if (error) throw error;
      } else if (type === 'banner' || type === 'establishment_banner') {
        const { error } = await supabase
          .from('establishments')
          .update({ banner_url: imageUrl })
          .eq('id', id);
        if (error) throw error;
      }
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
