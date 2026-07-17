-- Profiles and usage tracking for authenticated cloud processing.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null,
  units integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.usage_events enable row level security;

create policy "usage_select_own"
  on public.usage_events
  for select
  using (auth.uid() = user_id);

create table if not exists public.transcription_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  assemblyai_transcript_id text,
  status text not null default 'queued',
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transcription_jobs enable row level security;

create policy "transcription_jobs_select_own"
  on public.transcription_jobs
  for select
  using (auth.uid() = user_id);

create policy "transcription_jobs_insert_own"
  on public.transcription_jobs
  for insert
  with check (auth.uid() = user_id);

create policy "transcription_jobs_update_own"
  on public.transcription_jobs
  for update
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('transcription-temp', 'transcription-temp', false)
on conflict (id) do nothing;

create policy "transcription_temp_select_own"
  on storage.objects
  for select
  using (
    bucket_id = 'transcription-temp'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "transcription_temp_insert_own"
  on storage.objects
  for insert
  with check (
    bucket_id = 'transcription-temp'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "transcription_temp_update_own"
  on storage.objects
  for update
  using (
    bucket_id = 'transcription-temp'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "transcription_temp_delete_own"
  on storage.objects
  for delete
  using (
    bucket_id = 'transcription-temp'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
