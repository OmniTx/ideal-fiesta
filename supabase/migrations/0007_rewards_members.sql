-- Foundry Artisan Coffee — Foundry Rewards members.
--
-- The loyalty programme gets its own table rather than overloading
-- analytics_visitors: a member is a customer relationship, not visitor
-- telemetry, and the analytics table must stop carrying PII.
--
-- Anonymous signup is bound to the same per-browser capability token used by
-- the analytics tables (see 0005_analytics_write_hardening.sql): the browser
-- keeps the token in localStorage, sends it as `x-visitor-secret`, and RLS only
-- accepts a write to the row carrying that exact token.

create sequence if not exists public.rewards_member_code_seq;
-- The insert runs as anon, so the member_code default needs USAGE here.
grant usage on sequence public.rewards_member_code_seq to anon, authenticated;

create table if not exists public.rewards_members (
  id             uuid primary key default gen_random_uuid(),
  member_code    text not null unique
                 default ('FR-' || lpad(nextval('public.rewards_member_code_seq')::text, 4, '0')),
  first_name     text not null check (length(trim(first_name)) between 1 and 60),
  phone          text not null unique check (length(trim(phone)) between 6 and 20),
  visitor_secret text not null,
  perk_percent   numeric(4,2) not null default 10.00,
  perk_used_at   timestamptz,
  first_seen     timestamptz not null default now(),
  last_seen      timestamptz not null default now(),
  source         text
);

comment on table public.rewards_members is
  'Foundry Rewards loyalty members. Captured on the storefront with first name + mobile; the 10% welcome perk is marked redeemed by staff from the admin.';

create index if not exists rewards_members_first_seen_idx
  on public.rewards_members (first_seen desc);

create index if not exists rewards_members_perk_idx
  on public.rewards_members (perk_used_at)
  where perk_used_at is null;

alter table public.rewards_members enable row level security;

-- A member may create their own row, then read and refresh only that row.
create policy "rewards visitor insert" on public.rewards_members
  for insert to anon, authenticated
  with check (
    visitor_secret is not null
    and length(visitor_secret) >= 32
    and visitor_secret = public.request_visitor_secret()
  );

create policy "rewards visitor read own" on public.rewards_members
  for select to anon, authenticated
  using (visitor_secret is not null and visitor_secret = public.request_visitor_secret());

-- Self-update is `to anon` only: the signed-in admin path goes through the
-- admin policy below, so no other authenticated account gains access.
create policy "rewards visitor update own" on public.rewards_members
  for update to anon
  using (visitor_secret is not null and visitor_secret = public.request_visitor_secret())
  with check (visitor_secret is not null and visitor_secret = public.request_visitor_secret());

create policy "rewards admin all" on public.rewards_members
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- A member must not be able to un-redeem their own perk, or re-key their row.
-- Column-level grants are what stop this: an RLS `with check` cannot compare the
-- old and new values of a column.
revoke update (perk_used_at, member_code, visitor_secret)
  on public.rewards_members from anon;

-- ---------------------------------------------------------------------------
-- One-time backfill of leads captured through the old visitor form.
-- Left commented so this migration is inert — run it manually once the client
-- is happy to move those contacts into the rewards programme.
-- ---------------------------------------------------------------------------
--
-- insert into public.rewards_members
--        (first_name, phone, visitor_secret, source, first_seen, last_seen)
-- select coalesce(nullif(trim(v.name), ''), 'Friend'),
--        trim(v.phone),
--        coalesce(v.visitor_secret, 'legacy_' || gen_random_uuid()),
--        'legacy_visitor_form',
--        v.first_seen,
--        v.last_seen
--   from public.analytics_visitors v
--  where coalesce(trim(v.phone), '') <> ''
--    and coalesce(trim(v.phone), '') <> '0'
--  on conflict (phone) do nothing;
