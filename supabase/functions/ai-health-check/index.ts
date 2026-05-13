import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { gatewayLLMChat, isGatewayEnabled } from "../_shared/gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthCheckResult {
  service: string;
  status: 'ok' | 'error' | 'not_configured';
  latency_ms?: number;
  message?: string;
  model?: string;
}

async function checkGeminiText(): Promise<HealthCheckResult> {
  const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
  
  if (!GOOGLE_API_KEY) {
    return { service: "gemini_text", status: "not_configured", message: "GOOGLE_API_KEY not set" };
  }

  const start = Date.now();
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Say 'ok' in one word" }] }],
        generationConfig: { maxOutputTokens: 10 }
      }),
    });

    const latency = Date.now() - start;

    if (response.ok) {
      return { service: "gemini_text", status: "ok", latency_ms: latency, model: "gemini-2.0-flash" };
    }
    
    const errorText = await response.text();
    return { 
      service: "gemini_text", 
      status: "error", 
      latency_ms: latency,
      message: `HTTP ${response.status}: ${errorText.substring(0, 100)}` 
    };
  } catch (error) {
    return { 
      service: "gemini_text", 
      status: "error", 
      latency_ms: Date.now() - start,
      message: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

async function checkImagen(): Promise<HealthCheckResult> {
  const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
  
  if (!GOOGLE_API_KEY) {
    return { service: "imagen", status: "not_configured", message: "GOOGLE_API_KEY not set" };
  }

  const models = ["imagen-4.0-generate-001", "imagen-3.0-generate-002"];
  
  for (const model of models) {
    const start = Date.now();
    try {
      // Just check if the model endpoint is accessible (without generating)
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${GOOGLE_API_KEY}`;
      
      const response = await fetch(url, { method: "GET" });
      const latency = Date.now() - start;

      if (response.ok) {
        return { service: "imagen", status: "ok", latency_ms: latency, model };
      }
    } catch {
      continue;
    }
  }

  return { 
    service: "imagen", 
    status: "error", 
    message: "No Imagen models available" 
  };
}

async function checkLovableAI(): Promise<HealthCheckResult> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    return { service: "lovable_ai", status: "not_configured", message: "LOVABLE_API_KEY not set" };
  }

  const start = Date.now();
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: "Say 'ok'" }],
      }),
    });

    const latency = Date.now() - start;

    if (response.ok) {
      return { service: "lovable_ai", status: "ok", latency_ms: latency, model: "gemini-2.5-flash-lite" };
    }
    
    if (response.status === 429) {
      return { service: "lovable_ai", status: "error", latency_ms: latency, message: "Rate limited" };
    }
    if (response.status === 402) {
      return { service: "lovable_ai", status: "error", latency_ms: latency, message: "Payment required" };
    }
    
    return { service: "lovable_ai", status: "error", latency_ms: latency, message: `HTTP ${response.status}` };
  } catch (error) {
    return { 
      service: "lovable_ai", 
      status: "error", 
      latency_ms: Date.now() - start,
      message: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

async function checkAWSS3(): Promise<HealthCheckResult> {
  const AWS_ACCESS_KEY_ID = Deno.env.get("AWS_ACCESS_KEY_ID");
  const AWS_BUCKET_NAME = Deno.env.get("AWS_BUCKET_NAME");

  if (!AWS_ACCESS_KEY_ID || !AWS_BUCKET_NAME) {
    return { service: "aws_s3", status: "not_configured", message: "AWS credentials not set" };
  }

  return { service: "aws_s3", status: "ok", message: `Bucket: ${AWS_BUCKET_NAME}` };
}

async function checkGateway(): Promise<HealthCheckResult> {
  if (!isGatewayEnabled()) {
    return { service: "api_gateway", status: "not_configured", message: "GATEWAY_API_URL/TOKEN not set" };
  }

  const start = Date.now();
  const result = await gatewayLLMChat({
    messages: [{ role: "user", content: "Say 'ok'" }],
    maxTokens: 10,
  });
  const latency = Date.now() - start;

  if (result.success) {
    return {
      service: "api_gateway",
      status: "ok",
      latency_ms: latency,
      model: (result.metadata?.model as string) ?? "gateway-default",
    };
  }

  if (result.statusCode === 429) return { service: "api_gateway", status: "error", latency_ms: latency, message: "Rate limited" };
  if (result.statusCode === 402) return { service: "api_gateway", status: "error", latency_ms: latency, message: "Payment required" };
  return { service: "api_gateway", status: "error", latency_ms: latency, message: result.error ?? `HTTP ${result.statusCode}` };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[ai-health-check] Starting health check...");

  // Run all checks in parallel
  const [geminiText, imagen, lovableAI, awsS3, gateway] = await Promise.all([
    checkGeminiText(),
    checkImagen(),
    checkLovableAI(),
    checkAWSS3(),
    checkGateway(),
  ]);

  const results = [geminiText, imagen, lovableAI, awsS3, gateway];

  const allOk = results.every(r => r.status === "ok" || r.status === "not_configured");
  const configured = results.filter(r => r.status !== "not_configured").length;
  const working = results.filter(r => r.status === "ok").length;

  const summary = {
    status: allOk ? "healthy" : "degraded",
    configured_services: configured,
    working_services: working,
    timestamp: new Date().toISOString(),
    services: results,
    recommendations: [] as string[]
  };

  // Add recommendations
  if (geminiText.status === "not_configured") {
    summary.recommendations.push("Configure GOOGLE_API_KEY for Gemini text/recommendations");
  }
  if (imagen.status === "error") {
    summary.recommendations.push("Check Imagen API access - using Lovable AI fallback for images");
  }
  if (lovableAI.status === "error" && lovableAI.message === "Rate limited") {
    summary.recommendations.push("Lovable AI is rate limited - consider upgrading plan");
  }
  if (gateway.status === "not_configured") {
    summary.recommendations.push("Configure GATEWAY_API_URL/GATEWAY_API_TOKEN to centralize AI routing");
  }
  if (gateway.status === "error") {
    summary.recommendations.push(`API Gateway unhealthy: ${gateway.message}`);
  }

  console.log(`[ai-health-check] Complete: ${working}/${configured} services working`);

  return new Response(
    JSON.stringify(summary),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
