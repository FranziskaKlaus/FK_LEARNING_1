-- ============================================================================
-- Planning App V2 — Supabase schema
-- ----------------------------------------------------------------------------
-- Run this ONCE in your Supabase project:  SQL Editor → New query → paste → Run
--
-- Design note: the whole plan lives as ONE structured JSON document per user
-- (the `data` column). This makes auto-save a single atomic write and makes
-- Claude's reads/writes trivial. The data is still fully structured
-- (Areas → Goals → Milestones → Tasks → Subtasks); we can normalise into
-- separate tables later with no data loss.
-- ============================================================================

-- 1) The single table that holds everything ----------------------------------
create table if not exists public.plans (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text not null default 'app'   -- 'app' | 'claude' | 'digest'
);

-- 2) Row-Level Security: a user can only see/touch their own row -------------
alter table public.plans enable row level security;

drop policy if exists "own plan select" on public.plans;
create policy "own plan select" on public.plans
  for select using (auth.uid() = user_id);

drop policy if exists "own plan insert" on public.plans;
create policy "own plan insert" on public.plans
  for insert with check (auth.uid() = user_id);

drop policy if exists "own plan update" on public.plans;
create policy "own plan update" on public.plans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3) Realtime: let the app receive live updates across devices ---------------
alter publication supabase_realtime add table public.plans;

-- 4) Keep updated_at fresh on every write ------------------------------------
create or replace function public.touch_plans_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_touch_plans on public.plans;
create trigger trg_touch_plans before update on public.plans
  for each row execute function public.touch_plans_updated_at();

-- ============================================================================
-- That's it. The app creates the user's row on first login and seeds it with
-- the starter scaffold defined in index.html (SEED_PLAN). "Start fresh" means
-- areas + goals scaffold with empty task lists, ready for you to fill in.
-- ============================================================================
