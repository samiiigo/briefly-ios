-- Account-scoped library sync: profiles trigger + folders/recordings/settings mirrors.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.account_folders (
  user_id uuid not null references auth.users (id) on delete cascade,
  folder_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, folder_id)
);

alter table public.account_folders enable row level security;

create policy "account_folders_select_own"
  on public.account_folders for select
  using (auth.uid() = user_id);

create policy "account_folders_insert_own"
  on public.account_folders for insert
  with check (auth.uid() = user_id);

create policy "account_folders_update_own"
  on public.account_folders for update
  using (auth.uid() = user_id);

create policy "account_folders_delete_own"
  on public.account_folders for delete
  using (auth.uid() = user_id);

create table if not exists public.account_recordings (
  user_id uuid not null references auth.users (id) on delete cascade,
  recording_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, recording_id)
);

alter table public.account_recordings enable row level security;

create policy "account_recordings_select_own"
  on public.account_recordings for select
  using (auth.uid() = user_id);

create policy "account_recordings_insert_own"
  on public.account_recordings for insert
  with check (auth.uid() = user_id);

create policy "account_recordings_update_own"
  on public.account_recordings for update
  using (auth.uid() = user_id);

create policy "account_recordings_delete_own"
  on public.account_recordings for delete
  using (auth.uid() = user_id);

create table if not exists public.account_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.account_settings enable row level security;

create policy "account_settings_select_own"
  on public.account_settings for select
  using (auth.uid() = user_id);

create policy "account_settings_insert_own"
  on public.account_settings for insert
  with check (auth.uid() = user_id);

create policy "account_settings_update_own"
  on public.account_settings for update
  using (auth.uid() = user_id);

create index if not exists account_recordings_user_updated_idx
  on public.account_recordings (user_id, updated_at desc);

create index if not exists account_folders_user_updated_idx
  on public.account_folders (user_id, updated_at desc);
