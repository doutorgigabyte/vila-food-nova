import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allowed file types for security
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov'];
const ALLOWED_EXTENSIONS = [...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_VIDEO_EXTENSIONS];

const ALLOWED_IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_CONTENT_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_CONTENT_TYPES = [...ALLOWED_IMAGE_CONTENT_TYPES, ...ALLOWED_VIDEO_CONTENT_TYPES];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Verify user authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'products';
    const establishmentId = formData.get('establishmentId') as string;

    if (!file) {
      console.error('No file provided in request');
      return new Response(
        JSON.stringify({ error: 'Arquivo não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Create admin client for authorization checks
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if user is super_admin (can upload without establishmentId)
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single();

    const isSuperAdmin = !!userRole;

    // If not super_admin, establishmentId is required
    if (!establishmentId || establishmentId === 'general') {
      if (!isSuperAdmin) {
        return new Response(
          JSON.stringify({ error: 'ID do estabelecimento é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // Super admin uploading without establishment - use 'system' folder
    } else {
      // Verify establishment exists and user has access
      const { data: establishment, error: estError } = await supabaseAdmin
        .from('establishments')
        .select('owner_id')
        .eq('id', establishmentId)
        .single();

      if (estError || !establishment) {
        return new Response(
          JSON.stringify({ error: 'Estabelecimento não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (establishment.owner_id !== user.id && !isSuperAdmin) {
        return new Response(
          JSON.stringify({ error: 'Você não tem permissão para fazer upload neste estabelecimento' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Use establishmentId or 'system' for super_admin without establishment
    const uploadEstablishmentId = establishmentId && establishmentId !== 'general' 
      ? establishmentId 
      : 'system';

    // SECURITY: Validate file size based on type
    const isVideo = ALLOWED_VIDEO_CONTENT_TYPES.includes(file.type);
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / 1024 / 1024;
      return new Response(
        JSON.stringify({ error: `Arquivo muito grande. Máximo permitido: ${maxSizeMB}MB` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Validate file extension
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return new Response(
        JSON.stringify({ error: `Tipo de arquivo não permitido. Permitidos: ${ALLOWED_EXTENSIONS.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Validate content type
    const contentType = file.type || 'application/octet-stream';
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return new Response(
        JSON.stringify({ error: `Tipo de conteúdo não permitido. Permitidos: ${ALLOWED_CONTENT_TYPES.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing upload: ${file.name}, type: ${type}, establishment: ${establishmentId}, user: ${user.id}`);

    // Get AWS credentials from environment
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    const region = Deno.env.get('AWS_REGION') || 'sa-east-1';
    const bucketName = Deno.env.get('AWS_BUCKET_NAME');
    const cloudfrontUrl = Deno.env.get('AWS_CLOUDFRONT_URL');

    if (!accessKeyId || !secretAccessKey || !bucketName) {
      console.error('Missing AWS credentials');
      return new Response(
        JSON.stringify({ error: 'Configuração AWS incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const fileName = `${timestamp}_${random}.${extension}`;

    // Build S3 path following VilFood pattern
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const key = `_uploads/${type}/${uploadEstablishmentId}/${year}/${month}/${fileName}`;

    console.log(`Uploading to S3: ${key}`);

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const body = new Uint8Array(arrayBuffer);

    // Build AWS Signature v4
    const service = 's3';
    const host = `${bucketName}.s3.${region}.amazonaws.com`;
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);

    // Create canonical request
    const method = 'PUT';
    const canonicalUri = '/' + key;
    const canonicalQuerystring = '';
    
    // Hash the payload
    const payloadHash = await sha256Hex(body);
    
    const canonicalHeaders = 
      `content-type:${contentType}\n` +
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;
    
    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
    
    const canonicalRequest = 
      `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

    // Create string to sign
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const canonicalRequestHash = await sha256Hex(new TextEncoder().encode(canonicalRequest));
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;

    // Calculate signature
    const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
    const signature = await hmacHex(signingKey, stringToSign);

    // Create authorization header
    const authorizationHeader = 
      `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    // Make request to S3
    const s3Url = `https://${host}/${key}`;
    
    const s3Response = await fetch(s3Url, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        'Authorization': authorizationHeader,
      },
      body: body,
    });

    if (!s3Response.ok) {
      const errorText = await s3Response.text();
      console.error(`S3 upload failed: ${s3Response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: 'Erro ao enviar para S3', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Upload successful: ${key}`);

    // Return URL (CloudFront if configured, otherwise S3)
    const imageUrl = cloudfrontUrl 
      ? `${cloudfrontUrl}/${key}`
      : `https://${host}/${key}`;

    return new Response(
      JSON.stringify({ 
        url: imageUrl,
        key: key,
        bucket: bucketName,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Upload error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Erro interno no upload', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

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

async function hmacHex(key: Uint8Array, data: string): Promise<string> {
  const result = await hmac(key, data);
  return Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('');
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
