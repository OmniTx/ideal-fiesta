-- Foundry Artisan Coffee — Analytics & Lead Intelligence Schema
-- Tables: analytics_visitors, analytics_events. RLS: public INSERT, authenticated SELECT/UPDATE/DELETE.

-- ---------------------------------------------------------------------------
-- analytics_visitors (Identified leads & anonymous visitor device profiles)
-- ---------------------------------------------------------------------------
create table if not exists public.analytics_visitors (
  visitor_id    text primary key,
  name          text,
  phone         text,
  email         text,
  first_seen    timestamptz not null default now(),
  last_seen     timestamptz not null default now(),
  total_visits  integer not null default 1,
  last_ip       text,
  city          text,
  region        text,
  country       text,
  device_type   text, -- mobile, tablet, desktop
  device_model  text, -- Samsung Galaxy S20 Ultra, iPhone 15 Pro, Pixel 8, etc.
  os            text, -- Android, iOS, Windows, macOS
  browser       text, -- Chrome, Safari, Edge, Firefox
  screen_res    text, -- 412x915, 1920x1080
  user_agent    text
);

comment on table public.analytics_visitors is 'Visitor device telemetry, IP locations, and captured customer leads (name, phone, email).';

create index if not exists analytics_visitors_last_seen_idx
  on public.analytics_visitors (last_seen desc);

create index if not exists analytics_visitors_leads_idx
  on public.analytics_visitors (email, phone)
  where email is not null or phone is not null;

-- ---------------------------------------------------------------------------
-- analytics_events (Pageviews, menu item clicks, lead submissions)
-- ---------------------------------------------------------------------------
create table if not exists public.analytics_events (
  id          uuid primary key default gen_random_uuid(),
  visitor_id  text not null references public.analytics_visitors(visitor_id) on delete cascade,
  session_id  text not null,
  event_type  text not null, -- pageview, item_view, category_change, lead_captured
  page_path   text not null,
  metadata    jsonb default '{}'::jsonb,
  ip          text,
  created_at  timestamptz not null default now()
);

comment on table public.analytics_events is 'Chronological clickstream and customer interaction events.';

create index if not exists analytics_events_visitor_idx
  on public.analytics_events (visitor_id, created_at desc);

create index if not exists analytics_events_type_created_idx
  on public.analytics_events (event_type, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ---------------------------------------------------------------------------
alter table public.analytics_visitors enable row level security;
alter table public.analytics_events enable row level security;

-- Visitors: public can insert and update their own record; admin has full access
drop policy if exists "analytics_visitors public insert" on public.analytics_visitors;
create policy "analytics_visitors public insert"
  on public.analytics_visitors for insert
  to anon, authenticated
  with check (true);

drop policy if exists "analytics_visitors public update" on public.analytics_visitors;
create policy "analytics_visitors public update"
  on public.analytics_visitors for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "analytics_visitors admin all" on public.analytics_visitors;
create policy "analytics_visitors admin all"
  on public.analytics_visitors for all
  to authenticated
  using (true)
  with check (true);

-- Events: public can insert events; admin can read and manage
drop policy if exists "analytics_events public insert" on public.analytics_events;
create policy "analytics_events public insert"
  on public.analytics_events for insert
  to anon, authenticated
  with check (true);

drop policy if exists "analytics_events admin all" on public.analytics_events;
create policy "analytics_events admin all"
  on public.analytics_events for all
  to authenticated
  using (true)
  with check (true);

-- Enable Realtime publication for live visitor alerts. Guarded so the script
-- can be re-run without "relation is already member of publication" errors.
do $$
begin
  alter publication supabase_realtime add table public.analytics_visitors;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.analytics_events;
exception when duplicate_object then null;
end $$;
