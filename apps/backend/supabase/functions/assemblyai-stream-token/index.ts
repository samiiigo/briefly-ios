import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders, errorResponse, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const assemblyKey = Deno.env.get('ASSEMBLYAI_API_KEY');
  if (!supabaseUrl || !supabaseAnonKey || !assemblyKey) {
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

  const tokenUrl = new URL('https://streaming.assemblyai.com/v3/token');
  tokenUrl.searchParams.set('expires_in_seconds', '300');
  const tokenResponse = await fetch(tokenUrl, {
    headers: { Authorization: assemblyKey },
  });
  if (!tokenResponse.ok) {
    const text = await tokenResponse.text();
    return errorResponse(`Token mint failed: ${text}`, 'PROVIDER_ERROR', 502);
  }

  const tokenPayload = await tokenResponse.json();
  await supabase.from('usage_events').insert({
    user_id: userData.user.id,
    event_type: 'assemblyai_stream_token',
    units: 1,
  });

  return jsonResponse({
    token: tokenPayload.token,
    expiresInSeconds: 300,
  });
});
