import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders, errorResponse, jsonResponse } from '../_shared/http.ts';

interface UploadUrlRequest {
  storagePath: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
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

  const body = (await req.json()) as UploadUrlRequest;
  const storagePath = body.storagePath?.trim();
  if (!storagePath || !storagePath.startsWith(`${userData.user.id}/`)) {
    return errorResponse('Invalid storage path.', 'INVALID_PATH');
  }

  const { data, error } = await supabase.storage
    .from('transcription-temp')
    .createSignedUploadUrl(storagePath);
  if (error || !data) {
    return errorResponse(error?.message ?? 'Unable to create upload URL.', 'STORAGE_ERROR', 500);
  }

  return jsonResponse({
    signedUrl: data.signedUrl,
    storagePath,
  });
});
