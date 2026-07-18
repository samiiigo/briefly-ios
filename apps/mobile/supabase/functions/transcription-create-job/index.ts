import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders, errorResponse, jsonResponse } from '../_shared/http.ts';

interface CreateJobRequest {
  storagePath: string;
}

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

  const body = (await req.json()) as CreateJobRequest;
  const storagePath = body.storagePath?.trim();
  if (!storagePath || !storagePath.startsWith(`${userData.user.id}/`)) {
    return errorResponse('Invalid storage path.', 'INVALID_PATH');
  }

  const { data: signedDownload, error: signedError } = await supabase.storage
    .from('transcription-temp')
    .createSignedUrl(storagePath, 3600);
  if (signedError || !signedDownload?.signedUrl) {
    return errorResponse(signedError?.message ?? 'Unable to sign audio URL.', 'STORAGE_ERROR', 500);
  }

  const { data: jobRow, error: insertError } = await supabase
    .from('transcription_jobs')
    .insert({
      user_id: userData.user.id,
      storage_path: storagePath,
      status: 'processing',
    })
    .select('id')
    .single();
  if (insertError || !jobRow) {
    return errorResponse(insertError?.message ?? 'Unable to create job.', 'DB_ERROR', 500);
  }

  const createResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      Authorization: assemblyKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: signedDownload.signedUrl,
      punctuate: true,
      format_text: true,
      language_detection: true,
      speech_models: ['universal-3-pro', 'universal-2'],
    }),
  });

  if (!createResponse.ok) {
    const text = await createResponse.text();
    await supabase
      .from('transcription_jobs')
      .update({ status: 'failed', error: text, updated_at: new Date().toISOString() })
      .eq('id', jobRow.id);
    return errorResponse(`Transcription create failed: ${text}`, 'PROVIDER_ERROR', 502);
  }

  const createPayload = await createResponse.json();
  const transcriptId = createPayload.id as string | undefined;
  if (!transcriptId) {
    return errorResponse('AssemblyAI did not return a transcript id.', 'PROVIDER_ERROR', 502);
  }

  await supabase
    .from('transcription_jobs')
    .update({
      assemblyai_transcript_id: transcriptId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobRow.id);

  await supabase.from('usage_events').insert({
    user_id: userData.user.id,
    event_type: 'transcription_job',
    units: 1,
    metadata: { jobId: jobRow.id },
  });

  return jsonResponse({ jobId: jobRow.id });
});
