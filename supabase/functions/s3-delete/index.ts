import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const body = await req.json();
    const { url, key, establishmentId } = body;

    // Extract key from URL if not provided directly
    let s3Key = key;
    if (!s3Key && url) {
      // Extract key from CloudFront or S3 URL
      const cloudfrontUrl = Deno.env.get('AWS_CLOUDFRONT_URL') || '';
      if (url.startsWith(cloudfrontUrl)) {
        s3Key = url.replace(cloudfrontUrl + '/', '');
      } else {
        // Try to extract from S3 URL
        const match = url.match(/\.amazonaws\.com\/(.+)$/);
        if (match) {
          s3Key = match[1];
        }
      }
    }

    if (!s3Key) {
      return new Response(
        JSON.stringify({ error: 'URL ou key do arquivo não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Attempting to delete S3 object: ${s3Key}`);

    // SECURITY: If establishmentId provided, verify ownership
    if (establishmentId) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

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

      if (establishment.owner_id !== user.id) {
        // Check if user is super_admin
        const { data: userRole } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'super_admin')
          .single();

        if (!userRole) {
          return new Response(
            JSON.stringify({ error: 'Você não tem permissão para excluir arquivos deste estabelecimento' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Get AWS credentials
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    const region = Deno.env.get('AWS_REGION') || 'sa-east-1';
    const bucketName = Deno.env.get('AWS_BUCKET_NAME');

    if (!accessKeyId || !secretAccessKey || !bucketName) {
      console.error('Missing AWS credentials');
      return new Response(
        JSON.stringify({ error: 'Configuração AWS incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build AWS Signature v4 for DELETE request
    const now = new Date();
    const host = `${bucketName}.s3.${region}.amazonaws.com`;
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);

    // Create canonical request
    const method = 'DELETE';
    const canonicalUri = '/' + s3Key;
    const canonicalQuerystring = '';
    
    // Empty payload for DELETE
    const payloadHash = await sha256Hex(new Uint8Array(0));
    
    const canonicalHeaders = 
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;
    
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    
    const canonicalRequest = 
      `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

    // Create string to sign
    const algorithm = 'AWS4-HMAC-SHA256';
    const service = 's3';
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const canonicalRequestHash = await sha256Hex(new TextEncoder().encode(canonicalRequest));
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;

    // Calculate signature
    const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
    const signature = await hmacHex(signingKey, stringToSign);

    // Create authorization header
    const authorizationHeader = 
      `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    // Make DELETE request to S3
    const s3Url = `https://${host}/${s3Key}`;
    
    const s3Response = await fetch(s3Url, {
      method: 'DELETE',
      headers: {
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        'Authorization': authorizationHeader,
      },
    });

    // S3 returns 204 No Content on successful delete
    if (!s3Response.ok && s3Response.status !== 204) {
      const errorText = await s3Response.text();
      console.error(`S3 delete failed: ${s3Response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: 'Erro ao excluir do S3', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully deleted: ${s3Key}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        deletedKey: s3Key,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Delete error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao excluir', details: errorMessage }),
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