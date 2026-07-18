import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders, errorResponse, jsonResponse } from '../_shared/http.ts';

interface SummarizeRequest {
  segments: Array<{ text: string; start?: number; end?: number }>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const openRouterKey = Deno.env.get('OPENROUTER_SHARED_API_KEY');
  if (!supabaseUrl || !supabaseAnonKey || !openRouterKey) {
    return errorResponse('Server is not configured.', 'SERVER_MISCONFIGURED', 500);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return errorResponse('Authentication required.', 'AUTH_REQUIRED', 401);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return errorResponse('Invalid session.', 'AUTH_INVALID', 401);
  }

  const body = (await req.json()) as SummarizeRequest;
  const transcript = (body.segments ?? [])
    .map((segment) => segment.text)
    .join('\n')
    .trim();
  if (!transcript) {
    return errorResponse('Transcript is empty.', 'EMPTY_TRANSCRIPT');
  }

  const model = Deno.env.get('OPENROUTER_MODEL') ?? 'openai/gpt-4o-mini';
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://briefly.app',
      'X-OpenRouter-Title': 'Briefly',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content:
            'Summarize the transcript. Return JSON with keys summary, keyInsights (array of {title, detail}), mainEmoji, title.',
        },
        { role: 'user', content: transcript },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return errorResponse(`Summarization failed: ${text}`, 'PROVIDER_ERROR', 502);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    return errorResponse(
      'Summarization provider returned an empty response.',
      'PROVIDER_EMPTY',
      502,
    );
  }

  const parsed = JSON.parse(content);
  await supabase.from('usage_events').insert({
    user_id: userData.user.id,
    event_type: 'summarize',
    units: 1,
    metadata: { model },
  });

  return jsonResponse({
    summary: parsed.summary ?? '',
    keyInsights: parsed.keyInsights ?? [],
    mainEmoji: parsed.mainEmoji,
    title: parsed.title,
  });
});
