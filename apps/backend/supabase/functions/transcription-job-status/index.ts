import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders, errorResponse, jsonResponse } from '../_shared/http.ts';

interface JobStatusRequest {
  jobId: string;
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

  const body = (await req.json()) as JobStatusRequest;
  const jobId = body.jobId?.trim();
  if (!jobId) {
    return errorResponse('jobId is required.', 'INVALID_JOB');
  }

  const { data: job, error: jobError } = await supabase
    .from('transcription_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (jobError || !job) {
    return errorResponse('Job not found.', 'NOT_FOUND', 404);
  }

  if (job.status === 'completed' && job.result) {
    return jsonResponse({ status: 'completed', result: job.result });
  }
  if (job.status === 'failed') {
    return jsonResponse({ status: 'failed', error: job.error ?? 'Transcription failed.' });
  }

  const transcriptId = job.assemblyai_transcript_id as string | undefined;
  if (!transcriptId) {
    return jsonResponse({ status: 'queued' });
  }

  const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
    headers: { Authorization: assemblyKey },
  });
  if (!pollResponse.ok) {
    const text = await pollResponse.text();
    return errorResponse(`Transcription poll failed: ${text}`, 'PROVIDER_ERROR', 502);
  }

  const payload = await pollResponse.json();
  const providerStatus = payload.status as string | undefined;
  if (providerStatus === 'completed') {
    const result = {
      words: payload.words ?? [],
      text: payload.text ?? '',
    };
    await supabase
      .from('transcription_jobs')
      .update({
        status: 'completed',
        result,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id);
    await supabase.storage.from('transcription-temp').remove([job.storage_path as string]);
    return jsonResponse({ status: 'completed', result });
  }

  if (providerStatus === 'error') {
    const message = payload.error ?? 'AssemblyAI transcription failed.';
    await supabase
      .from('transcription_jobs')
      .update({
        status: 'failed',
        error: message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id);
    await supabase.storage.from('transcription-temp').remove([job.storage_path as string]);
    return jsonResponse({ status: 'failed', error: message });
  }

  return jsonResponse({ status: 'processing' });
});
