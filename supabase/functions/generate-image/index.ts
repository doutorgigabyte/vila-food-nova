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
  
  // Build the S3 key - use 'generated' folder for items without establishmentId
  let s3Key: string;
  if (establishmentId && establishmentId !== 'general') {
    s3Key = `_uploads/${type}/${establishmentId}/${year}/${month}/${uniqueId}_${timestamp}.png`;
  } else {
    s3Key = `_uploads/generated/${type}/${year}/${month}/${uniqueId}_${timestamp}.png`;
  }

  const host = `${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`;
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);

  // Create canonical request
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

  // Create string to sign
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${AWS_REGION}/s3/aws4_request`;
  const stringToSign = 
    `${algorithm}\n${amzDate}\n${credentialScope}\n${await sha256Hex(canonicalRequest)}`;

  // Calculate signature
  const signingKey = await getSignatureKey(AWS_SECRET_ACCESS_KEY, dateStamp, AWS_REGION, 's3');
  const signatureBuffer = await hmac(signingKey, stringToSign);
  const signature = Array.from(signatureBuffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Create authorization header
  const authorizationHeader = 
    `${algorithm} Credential=${AWS_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  // Upload to S3
  const uploadUrl = `https://${host}/${s3Key}`;
  console.log('Uploading to S3:', uploadUrl);

  // Convert to ArrayBuffer for fetch
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

  // Return CloudFront URL if available, otherwise S3 URL
  const imageUrl = AWS_CLOUDFRONT_URL 
    ? `${AWS_CLOUDFRONT_URL}/${s3Key}`
    : uploadUrl;

  console.log('Upload successful:', imageUrl);
  return imageUrl;
}

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
    console.log('AI Response received, extracting image...');

    // Extract image from response - check multiple possible paths
    let imageBase64: string | undefined;
    
    // Path 1: images array in message
    if (aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url) {
      imageBase64 = aiData.choices[0].message.images[0].image_url.url;
      console.log('Found image in images array');
    }
    
    // Path 2: content is base64 directly
    if (!imageBase64 && aiData.choices?.[0]?.message?.content) {
      const content = aiData.choices[0].message.content;
      if (typeof content === 'string' && content.startsWith('data:image')) {
        imageBase64 = content;
        console.log('Found image in content as base64');
      }
    }

    if (!imageBase64) {
      console.error('No image found in response. Keys:', JSON.stringify(Object.keys(aiData.choices?.[0]?.message || {})));
      throw new Error('No image generated from AI');
    }

    console.log('Image extracted, base64 length:', imageBase64.length);

    // Convert base64 to binary
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload directly to S3
    const uploadType = type === 'category' ? 'categories' : type === 'product' ? 'products' : 'establishments';
    const imageUrl = await uploadToS3(bytes, `${id}.png`, 'image/png', uploadType, establishmentId);

    // Update database record
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
