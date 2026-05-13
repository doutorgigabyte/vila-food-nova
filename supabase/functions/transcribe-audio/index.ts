import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { gatewayLLMChat, isGatewayEnabled, type MultimodalContentPart } from "../_shared/gateway.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranscribeRequest {
  audio_url?: string;
  audio_base64?: string;
  mime_type?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio_url, audio_base64, mime_type = 'audio/ogg' }: TranscribeRequest = await req.json();

    if (!audio_url && !audio_base64) {
      return new Response(
        JSON.stringify({ success: false, error: 'audio_url or audio_base64 is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Transcribe request received:', { audio_url, has_base64: !!audio_base64, mime_type });

    let audioData: string;

    // If URL provided, fetch and convert to base64
    if (audio_url) {
      console.log('Fetching audio from URL:', audio_url);
      const audioResponse = await fetch(audio_url);
      if (!audioResponse.ok) {
        throw new Error(`Failed to fetch audio: ${audioResponse.status}`);
      }
      const audioBuffer = await audioResponse.arrayBuffer();
      audioData = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
      console.log('Audio fetched, size:', audioBuffer.byteLength, 'bytes');
    } else {
      audioData = audio_base64!;
    }

    const audioContent: MultimodalContentPart[] = [
      { type: 'audio', audio: { data: audioData, format: mime_type.replace('audio/', '') } },
      {
        type: 'text',
        text: `Transcreva este áudio em português brasileiro.
Retorne APENAS o texto transcrito, sem adicionar comentários, formatação ou explicações.
Se o áudio estiver vazio ou inaudível, retorne "AUDIO_INAUDIVEL".
Se houver ruído mas conseguir entender partes, transcreva o que conseguir.`,
      },
    ];

    let transcribedText = '';

    if (isGatewayEnabled()) {
      const result = await gatewayLLMChat({
        messages: [{ role: 'user', content: audioContent }],
      });
      if (!result.success) {
        if (result.statusCode === 429) {
          return new Response(
            JSON.stringify({ success: false, error: 'Rate limit excedido, tente novamente em instantes.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (result.statusCode === 402) {
          return new Response(
            JSON.stringify({ success: false, error: 'Créditos insuficientes.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.warn('[transcribe-audio] Gateway failed, falling back to Lovable:', result.error);
      } else {
        transcribedText = result.data?.content ?? '';
      }
    }

    if (!transcribedText) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        throw new Error('LOVABLE_API_KEY not configured and gateway unavailable');
      }
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: audioContent }],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ success: false, error: 'Rate limit excedido, tente novamente em instantes.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ success: false, error: 'Créditos insuficientes.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const errorText = await response.text();
        console.error('Lovable AI error:', errorText);
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const data = await response.json();
      transcribedText = data.choices?.[0]?.message?.content || '';
    }

    console.log('Transcribed text:', transcribedText);

    if (!transcribedText || transcribedText === 'AUDIO_INAUDIVEL') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Não foi possível transcrever o áudio. Tente enviar novamente.',
          text: ''
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        text: transcribedText.trim(),
        language: 'pt-BR'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Transcription error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});