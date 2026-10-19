-- Schéma Supabase commun : Nuage + espace Espagnol.
-- Un seul projet Supabase (et un seul compte) pour les deux outils.
-- À coller dans Supabase → SQL Editor → New query → Run.
-- Le script peut être relancé sans risque : il ne supprime aucune donnée.

-- ============================================================
-- Nuage
-- ============================================================

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

-- Accès à l'API : depuis le 30 mai 2026, les nouveaux projets Supabase n'ouvrent plus
-- automatiquement les tables à l'API, il faut l'autoriser explicitement.
-- Seuls les comptes connectés y ont accès, et les règles ci-dessus les limitent à leurs lignes.
grant select, insert, update, delete on public.user_state, public.focus_sessions to authenticated;

-- ============================================================
-- Espagnol
-- ============================================================
-- Fonctionnement prévu (voir docs/espagnol.md) : l'app garde tout sur l'appareil
-- et marche hors ligne ; la synchro envoie et récupère ligne par ligne.
--   updated_at : heure de modification sur l'appareil, départage deux appareils ;
--   synced_at  : heure d'arrivée sur le serveur, permet de ne récupérer que les nouveautés ;
--   deleted_at : une suppression est enregistrée (et donc synchronisée) au lieu d'effacer la ligne.

-- Le contenu : un mot, un verbe, une expression ou un point de grammaire.
create table if not exists public.es_items (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null default 'vocab' check (kind in ('vocab', 'verb', 'phrase', 'grammar')),
  es text not null,
  fr text not null,
  example text,
  theme text,
  -- infos propres au type : genre, verbe irrégulier, phrases à trous…
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz not null default now(),
  unique (id, user_id)
);

-- La mémorisation : un suivi de répétition espacée par élément et par compétence
-- (« recognize » es→fr, « produce » fr→es tapé, « listen » dictée, « conj:preterito »…).
-- Ainsi « hablar » peut être acquis en lecture mais encore fragile au passé simple.
create table if not exists public.es_progress (
  item_id text not null,
  skill text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- état de l'algorithme (stabilité, difficulté, répétitions, oublis…)
  srs jsonb not null default '{}'::jsonb,
  due_at timestamptz,
  suspended boolean not null default false,
  updated_at timestamptz not null default now(),
  synced_at timestamptz not null default now(),
  primary key (item_id, skill),
  -- le suivi appartient forcément au même compte que l'élément
  foreign key (item_id, user_id) references public.es_items (id, user_id) on delete cascade
);

-- L'historique : une ligne par réponse, jamais modifiée.
-- Sert aux stats, à la série de jours et plus tard à ajuster l'algorithme à ta mémoire.
create table if not exists public.es_reviews (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id text not null,
  skill text not null,
  -- 1 raté · 2 difficile · 3 correct · 4 facile
  rating smallint not null check (rating between 1 and 4),
  answer text,
  ms integer not null default 0 check (ms >= 0),
  reviewed_at timestamptz not null,
  synced_at timestamptz not null default now(),
  foreign key (item_id, user_id) references public.es_items (id, user_id) on delete cascade
);

create index if not exists es_items_user_synced_idx on public.es_items (user_id, synced_at);
create index if not exists es_progress_user_synced_idx on public.es_progress (user_id, synced_at);
create index if not exists es_reviews_user_synced_idx on public.es_reviews (user_id, synced_at);
create index if not exists es_reviews_item_idx on public.es_reviews (item_id, user_id);

-- Horodatage côté serveur, que l'app ne peut pas fausser.
create or replace function public.stamp_synced_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.synced_at := now();
  return new;
end;
$$;

-- Une écriture plus ancienne que la version enregistrée est ignorée :
-- un appareil resté hors ligne n'écrase pas une révision plus récente faite ailleurs.
create or replace function public.keep_newest()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.updated_at < old.updated_at then
    return null;
  end if;
  new.synced_at := now();
  return new;
end;
$$;

drop trigger if exists es_items_insert on public.es_items;
drop trigger if exists es_items_update on public.es_items;
create trigger es_items_insert before insert on public.es_items for each row execute function public.stamp_synced_at();
create trigger es_items_update before update on public.es_items for each row execute function public.keep_newest();

drop trigger if exists es_progress_insert on public.es_progress;
drop trigger if exists es_progress_update on public.es_progress;
create trigger es_progress_insert before insert on public.es_progress for each row execute function public.stamp_synced_at();
create trigger es_progress_update before update on public.es_progress for each row execute function public.keep_newest();

drop trigger if exists es_reviews_insert on public.es_reviews;
create trigger es_reviews_insert before insert on public.es_reviews for each row execute function public.stamp_synced_at();

-- Sécurité : chacun ne voit et ne modifie que ses propres lignes.
alter table public.es_items enable row level security;
alter table public.es_progress enable row level security;
alter table public.es_reviews enable row level security;

drop policy if exists "es_items_select_own" on public.es_items;
drop policy if exists "es_items_insert_own" on public.es_items;
drop policy if exists "es_items_update_own" on public.es_items;
drop policy if exists "es_items_delete_own" on public.es_items;
create policy "es_items_select_own" on public.es_items for select to authenticated using ((select auth.uid()) = user_id);
create policy "es_items_insert_own" on public.es_items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "es_items_update_own" on public.es_items for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "es_items_delete_own" on public.es_items for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "es_progress_select_own" on public.es_progress;
drop policy if exists "es_progress_insert_own" on public.es_progress;
drop policy if exists "es_progress_update_own" on public.es_progress;
drop policy if exists "es_progress_delete_own" on public.es_progress;
create policy "es_progress_select_own" on public.es_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "es_progress_insert_own" on public.es_progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "es_progress_update_own" on public.es_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "es_progress_delete_own" on public.es_progress for delete to authenticated using ((select auth.uid()) = user_id);

-- L'historique ne se modifie pas : lecture, ajout et suppression seulement.
drop policy if exists "es_reviews_select_own" on public.es_reviews;
drop policy if exists "es_reviews_insert_own" on public.es_reviews;
drop policy if exists "es_reviews_delete_own" on public.es_reviews;
create policy "es_reviews_select_own" on public.es_reviews for select to authenticated using ((select auth.uid()) = user_id);
create policy "es_reviews_insert_own" on public.es_reviews for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "es_reviews_delete_own" on public.es_reviews for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.es_items, public.es_progress to authenticated;
grant select, insert, delete on public.es_reviews to authenticated;
