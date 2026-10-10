-- Nuage — schéma Supabase pour la synchronisation entre appareils.
-- À coller dans Supabase → SQL Editor → New query → Run.

-- Réglages, tâches, notes et compteurs : un document JSON par utilisateur.
create table if not exists public.user_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Une ligne par session de focus ou de pause (pour les statistiques).
create table if not exists public.focus_sessions (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null check (type in ('focus', 'break')),
  start_at timestamptz not null,
  end_at timestamptz not null,
  ms integer not null check (ms >= 0),
  completed boolean not null default true,
  task_title text,
  created_at timestamptz not null default now()
);

create index if not exists focus_sessions_user_end_idx on public.focus_sessions (user_id, end_at);

-- Sécurité : chacun ne voit et ne modifie que ses propres lignes.
alter table public.user_state enable row level security;
alter table public.focus_sessions enable row level security;

drop policy if exists "user_state_select_own" on public.user_state;
drop policy if exists "user_state_insert_own" on public.user_state;
drop policy if exists "user_state_update_own" on public.user_state;
drop policy if exists "user_state_delete_own" on public.user_state;
create policy "user_state_select_own" on public.user_state for select using ((select auth.uid()) = user_id);
create policy "user_state_insert_own" on public.user_state for insert with check ((select auth.uid()) = user_id);
create policy "user_state_update_own" on public.user_state for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_state_delete_own" on public.user_state for delete using ((select auth.uid()) = user_id);

drop policy if exists "sessions_select_own" on public.focus_sessions;
drop policy if exists "sessions_insert_own" on public.focus_sessions;
drop policy if exists "sessions_update_own" on public.focus_sessions;
drop policy if exists "sessions_delete_own" on public.focus_sessions;
create policy "sessions_select_own" on public.focus_sessions for select using ((select auth.uid()) = user_id);
create policy "sessions_insert_own" on public.focus_sessions for insert with check ((select auth.uid()) = user_id);
create policy "sessions_update_own" on public.focus_sessions for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "sessions_delete_own" on public.focus_sessions for delete using ((select auth.uid()) = user_id);
