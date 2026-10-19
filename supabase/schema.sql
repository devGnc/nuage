-- Schéma Supabase de Nuage : le Pomodoro et les outils de révision (espagnol, puis d'autres matières).
-- Un seul projet Supabase et un seul compte pour tous les outils.
-- À coller dans Supabase → SQL Editor → New query → Run.
-- Le script peut être relancé sans risque : il ne supprime aucune donnée.

-- ============================================================
-- Pomodoro (réglages communs, tâches, notes, sessions)
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
-- Révisions (toutes matières : espagnol, puis d'autres outils)
-- ============================================================
-- Fonctionnement prévu (voir docs/espagnol.md) : l'app garde tout sur l'appareil
-- et marche hors ligne ; la synchro envoie et récupère ligne par ligne.
--   subject    : la matière (« es » pour l'espagnol), une seule série de tables pour toutes ;
--   id         : unique par compte, ce qui permet des identifiants stables pour le contenu
--                importé (« anki:… ») ou fourni avec l'app (« nuage:… ») : réimporter ne crée
--                pas de doublon, même depuis deux appareils ;
--   updated_at : heure de modification sur l'appareil, départage deux appareils ;
--   synced_at  : heure d'arrivée sur le serveur, permet de ne récupérer que les nouveautés ;
--   deleted_at : une suppression est enregistrée (et donc synchronisée) au lieu d'effacer la ligne.

-- Le contenu : un mot, un verbe, une expression, une fiche de grammaire, une question de cours…
create table if not exists public.study_items (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  subject text not null,
  -- « vocab », « verb », « phrase », « grammar »… libre, selon la matière
  kind text not null default 'card',
  -- pour une langue : le mot étranger et sa traduction ; sinon : question et réponse
  front text not null,
  back text not null,
  example text,
  topic text,
  -- origine : « nuage » (contenu fourni avec l'app), « anki », « perso »…
  source text,
  -- infos propres au type : niveau, genre, traduction anglaise, variante d'Amérique latine…
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- La mémorisation : un suivi de répétition espacée par élément et par compétence
-- (« recognize » espagnol → français, « produce » réponse tapée, « listen » dictée,
-- « conj:preterito » conjugaison à un temps…). « hablar » peut ainsi être acquis
-- en lecture mais encore fragile au passé simple.
create table if not exists public.study_progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id text not null,
  skill text not null,
  -- état de l'algorithme (stabilité, difficulté, répétitions, oublis…)
  srs jsonb not null default '{}'::jsonb,
  due_at timestamptz,
  suspended boolean not null default false,
  updated_at timestamptz not null default now(),
  synced_at timestamptz not null default now(),
  primary key (user_id, item_id, skill),
  foreign key (user_id, item_id) references public.study_items (user_id, id) on delete cascade
);

-- L'historique : une ligne par réponse, jamais modifiée.
-- Sert aux stats, aux objectifs et plus tard à ajuster l'algorithme à ta mémoire.
create table if not exists public.study_reviews (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  item_id text not null,
  skill text not null,
  -- 1 raté · 2 difficile · 3 correct · 4 facile
  rating smallint not null check (rating between 1 and 4),
  answer text,
  ms integer not null default 0 check (ms >= 0),
  reviewed_at timestamptz not null,
  synced_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, item_id) references public.study_items (user_id, id) on delete cascade
);

create index if not exists study_items_user_synced_idx on public.study_items (user_id, synced_at);
create index if not exists study_progress_user_synced_idx on public.study_progress (user_id, synced_at);
create index if not exists study_reviews_user_synced_idx on public.study_reviews (user_id, synced_at);
create index if not exists study_reviews_item_idx on public.study_reviews (user_id, item_id);

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

drop trigger if exists study_items_insert on public.study_items;
drop trigger if exists study_items_update on public.study_items;
create trigger study_items_insert before insert on public.study_items for each row execute function public.stamp_synced_at();
create trigger study_items_update before update on public.study_items for each row execute function public.keep_newest();

drop trigger if exists study_progress_insert on public.study_progress;
drop trigger if exists study_progress_update on public.study_progress;
create trigger study_progress_insert before insert on public.study_progress for each row execute function public.stamp_synced_at();
create trigger study_progress_update before update on public.study_progress for each row execute function public.keep_newest();

drop trigger if exists study_reviews_insert on public.study_reviews;
create trigger study_reviews_insert before insert on public.study_reviews for each row execute function public.stamp_synced_at();

-- Sécurité : chacun ne voit et ne modifie que ses propres lignes.
alter table public.study_items enable row level security;
alter table public.study_progress enable row level security;
alter table public.study_reviews enable row level security;

drop policy if exists "study_items_select_own" on public.study_items;
drop policy if exists "study_items_insert_own" on public.study_items;
drop policy if exists "study_items_update_own" on public.study_items;
drop policy if exists "study_items_delete_own" on public.study_items;
create policy "study_items_select_own" on public.study_items for select to authenticated using ((select auth.uid()) = user_id);
create policy "study_items_insert_own" on public.study_items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "study_items_update_own" on public.study_items for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "study_items_delete_own" on public.study_items for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "study_progress_select_own" on public.study_progress;
drop policy if exists "study_progress_insert_own" on public.study_progress;
drop policy if exists "study_progress_update_own" on public.study_progress;
drop policy if exists "study_progress_delete_own" on public.study_progress;
create policy "study_progress_select_own" on public.study_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "study_progress_insert_own" on public.study_progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "study_progress_update_own" on public.study_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "study_progress_delete_own" on public.study_progress for delete to authenticated using ((select auth.uid()) = user_id);

-- L'historique ne se modifie pas : lecture, ajout et suppression seulement.
drop policy if exists "study_reviews_select_own" on public.study_reviews;
drop policy if exists "study_reviews_insert_own" on public.study_reviews;
drop policy if exists "study_reviews_delete_own" on public.study_reviews;
create policy "study_reviews_select_own" on public.study_reviews for select to authenticated using ((select auth.uid()) = user_id);
create policy "study_reviews_insert_own" on public.study_reviews for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "study_reviews_delete_own" on public.study_reviews for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.study_items, public.study_progress to authenticated;
grant select, insert, delete on public.study_reviews to authenticated;
