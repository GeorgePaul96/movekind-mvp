// Scaffold for Supabase Edge Function to generate AI insights securely.
// TODO: Deploy this edge function.
// Read EXPO_PUBLIC_OPENAI_API_KEY from edge function env vars.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt } = await req.json()

    // Example OpenAI call placeholder
    /*
    const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
    const MODEL = 'gpt-4o-mini';
    const key = Deno.env.get('OPENAI_API_KEY');

    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.6,
        max_tokens: 160,
        messages: [
          { role: 'system', content: 'You are a calm somatic guide. You never use guilt-based language.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    const json = await res.json();
    const insight = json.choices?.[0]?.message?.content?.trim();
    */

    const insight = null; // Default to fallback for now since it's a scaffold

    return new Response(
      JSON.stringify({ insight }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
