import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // Use Google Gemini for transcription
    const geminiApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GOOGLE_API_KEY not configured');
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inlineData: {
                  mimeType: mime_type,
                  data: audioData
                }
              },
              {
                text: `Transcreva este áudio em português brasileiro. 
Retorne APENAS o texto transcrito, sem adicionar comentários, formatação ou explicações.
Se o áudio estiver vazio ou inaudível, retorne "AUDIO_INAUDIVEL".
Se houver ruído mas conseguir entender partes, transcreva o que conseguir.`
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response:', JSON.stringify(geminiData).substring(0, 500));

    const transcribedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

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

    console.log('Transcribed text:', transcribedText);

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
