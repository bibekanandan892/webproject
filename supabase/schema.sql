-- bibekananda.in portfolio vote schema
-- Run this once in the Supabase SQL editor after creating a new project.
-- Free tier is sufficient.

-- ============================================================================
-- 1. Votes table: one row per variant, with a counter.
-- ============================================================================
create table if not exists public.votes (
  variant_id text primary key,
  count int not null default 0,
  updated_at timestamptz not null default now()
);

-- Seed all 6 variants with count = 0. Safe to re-run.
insert into public.votes (variant_id, count) values
  ('terminal-dark', 0),
  ('kobweb-classic', 0),
  ('bento-ios', 0),
  ('editorial-serif', 0),
  ('liquid-glass', 0),
  ('spatial-3d', 0)
on conflict (variant_id) do nothing;

-- ============================================================================
-- 2. Site config: single row holding which variant is the "main" one
--    rendered at / for everyone.
-- ============================================================================
create table if not exists public.site_config (
  id int primary key default 1,
  main_variant_id text not null default 'terminal-dark',
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into public.site_config (id, main_variant_id)
values (1, 'terminal-dark')
on conflict (id) do nothing;

-- ============================================================================
-- 3. RPC: increment / decrement a vote atomically.
--    Browser calls this instead of read-modify-write to avoid races.
-- ============================================================================
create or replace function public.bump_vote(p_variant_id text, p_delta int)
returns int
language plpgsql
security definer
as $$
declare
  new_count int;
begin
  update public.votes
     set count = greatest(0, count + p_delta),
         updated_at = now()
   where variant_id = p_variant_id
  returning count into new_count;

  if new_count is null then
    -- Variant wasn't seeded; insert defensively.
    insert into public.votes (variant_id, count)
    values (p_variant_id, greatest(0, p_delta))
    on conflict (variant_id) do update
      set count = greatest(0, public.votes.count + p_delta),
          updated_at = now()
    returning count into new_count;
  end if;

  return new_count;
end;
$$;

-- ============================================================================
-- 4. Row-Level Security.
--    Public low-stakes voting toy. Anyone can read and vote.
--    Admin password is enforced client-side only (explicit user decision).
-- ============================================================================
alter table public.votes enable row level security;
alter table public.site_config enable row level security;

drop policy if exists "anyone can read votes" on public.votes;
create policy "anyone can read votes"
  on public.votes for select
  using (true);

drop policy if exists "anyone can read site_config" on public.site_config;
create policy "anyone can read site_config"
  on public.site_config for select
  using (true);

drop policy if exists "anyone can update site_config" on public.site_config;
create policy "anyone can update site_config"
  on public.site_config for update
  using (true)
  with check (true);

-- Direct writes on votes are blocked; only the bump_vote RPC can mutate.

-- ============================================================================
-- Done. Copy URL + anon key from Project Settings -> API into .env.local
-- as NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
-- ============================================================================
