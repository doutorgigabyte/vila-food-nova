import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ==================== Authentication Helpers ====================
async function authenticateRequest(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    console.error('Auth error:', error?.message);
    return null;
  }

  return { userId: user.id };
}

async function verifyEstablishmentOwnership(userId: string, establishmentId: string): Promise<boolean> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Check if user is owner
  const { data: establishment } = await supabase
    .from('establishments')
    .select('owner_id')
    .eq('id', establishmentId)
    .single();

  if (establishment?.owner_id === userId) return true;

  // Check if user is an active establishment user
  const { data: estUser } = await supabase
    .from('establishment_users')
    .select('id')
    .eq('establishment_id', establishmentId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (estUser) return true;

  // Check if user is super admin
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'super_admin')
    .single();

  return !!roleData;
}

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

// ==================== Prompt Generation for Pollinations ====================
function generatePollinationsPrompt(type: string, name: string): { description: string; width: number; height: number } {
  const encodeName = encodeURIComponent(name);
  
  switch (type) {
    case 'product':
      return {
        description: `professional%20food%20photography%20${encodeName}%20appetizing%20delicious%20commercial%20quality%20soft%20gradient%20background%20restaurant%20presentation%20high%20resolution`,
        width: 512,
        height: 512
      };
    case 'category': {
      const colorScheme = getCategoryColor(name).replace(/ /g, '%20');
      return {
        description: `3D%20glossy%20food%20icon%20${encodeName}%20${colorScheme}%20circular%20shape%20watercolor%20gradient%20background%20modern%20app%20UI%20design`,
        width: 512,
        height: 512
      };
    }
    case 'logo':
    case 'establishment_logo':
      return {
        description: `minimalist%20restaurant%20logo%20${encodeName}%20clean%20modern%20flat%20design%20vibrant%20colors%20centered%20composition%20professional%20business`,
        width: 512,
        height: 512
      };
    case 'banner':
    case 'establishment_banner':
      return {
        description: `professional%20restaurant%20banner%20${encodeName}%20panoramic%20appetizing%20food%20warm%20lighting%20commercial%20photography%20welcoming%20atmosphere`,
        width: 1024,
        height: 576
      };
    default:
      return {
        description: `professional%20image%20${encodeName}%20high%20quality`,
        width: 512,
        height: 512
      };
  }
}

// ==================== Pollinations.ai Image Generation ====================
async function generateImageWithPollinations(type: string, name: string): Promise<Uint8Array> {
  const { description, width, height } = generatePollinationsPrompt(type, name);
  
  // Add seed for reproducibility and nologo to avoid watermarks
  const seed = Math.floor(Math.random() * 1000000);
  const url = `https://image.pollinations.ai/prompt/${description}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
  
  console.log(`Generating image with Pollinations.ai: ${url.substring(0, 150)}...`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'image/png,image/jpeg,image/*',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Pollinations failed: ${response.status} - ${errorText.substring(0, 200)}`);
    throw new Error(`Pollinations API error: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  if (bytes.length < 1000) {
    throw new Error('Pollinations returned invalid/empty image');
  }

  console.log(`✅ Image generated successfully with Pollinations.ai (${bytes.length} bytes)`);
  return bytes;
}

// ==================== Main Handler ====================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const auth = await authenticateRequest(req);
    if (!auth) {
      console.log('[generate-image] Unauthorized request - no valid auth token');
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { type, id, name, establishmentId } = await req.json();
    
    if (!name || !type) {
      return new Response(JSON.stringify({ error: 'name and type are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify ownership if establishmentId is provided
    const targetEstablishmentId = establishmentId || id;
    if (targetEstablishmentId && targetEstablishmentId !== 'general') {
      const hasAccess = await verifyEstablishmentOwnership(auth.userId, targetEstablishmentId);
      if (!hasAccess) {
        console.log(`[generate-image] Access denied for user ${auth.userId} to establishment ${targetEstablishmentId}`);
        return new Response(JSON.stringify({ error: 'Access denied to this establishment' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    console.log(`[generate-image] User ${auth.userId} generating ${type} for: ${name}`);

    // Use Pollinations.ai for image generation (free, no rate limits)
    const imageBytes = await generateImageWithPollinations(type, name);

    // Upload to S3
    const uploadType = type === 'category' ? 'categories' : type === 'product' ? 'products' : 'establishments';
    const s3ImageUrl = await uploadToS3(imageBytes, 'image/png', uploadType, establishmentId || id);
    console.log(`[generate-image] Uploaded to S3: ${s3ImageUrl}`);

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
      engine: 'pollinations.ai',
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
