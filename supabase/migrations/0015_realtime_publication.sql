-- Foundry Artisan Coffee — put the remaining live tables in the realtime publication.
--
-- Postgres Changes only streams tables that are members of `supabase_realtime`.
-- 0003 added the analytics pair and 0008 added `orders`, but four tables the
-- admin subscribes to were never added, so those subscriptions were inert:
--
--   rewards_members  -> the members list and the dashboard's member count
--   order_items      -> ticket lines changing without the parent row changing
--   menu_items       -> the storefront's cross-device menu sync
--   system_settings  -> hours/surcharge landing on an open admin tab
--
-- All four have RLS policies that already gate what each role may receive, so
-- adding them only enables delivery of rows the subscriber is allowed to see.
-- Guarded so the file can be run as many times as you like.

do $$ begin
  alter publication supabase_realtime add table public.rewards_members;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.order_items;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.menu_items;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.system_settings;
exception when duplicate_object then null; end $$;

-- Verify with:
--   select tablename
--     from pg_publication_tables
--    where pubname = 'supabase_realtime'
--    order by tablename;
--
-- Expect: analytics_events, analytics_visitors, menu_items, order_items,
--         orders, rewards_members, system_settings
