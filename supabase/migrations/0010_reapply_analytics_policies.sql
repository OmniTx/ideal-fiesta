-- Foundry Artisan Coffee — re-apply the analytics write policies, idempotently.
--
-- 0005 dropped the policies from 0003 (named "... public insert"/"... public
-- update") and created differently named ones ("... visitor insert"/"... visitor
-- update"). That is fine on a fresh database but NOT re-runnable: the second run
-- has nothing to drop under the old names and then collides on the create with
--   ERROR: 42710: policy "analytics_visitors visitor insert" already exists
-- 0005 has been corrected, but it cannot repair a database that already ran it
-- part-way, because it aborts before reaching its creates. This file does: it
-- drops BOTH the old and new names for each policy before creating it, so it can
-- be run as many times as you like.
--
-- It also installs a small diagnostic so you can see what the server actually
-- receives, instead of us guessing which half is broken.

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------
drop policy if exists "analytics_visitors public insert" on public.analytics_visitors;
drop policy if exists "analytics_visitors visitor insert" on public.analytics_visitors;
create policy "analytics_visitors visitor insert"
  on public.analytics_visitors for insert
  to anon, authenticated
  with check (
    visitor_secret is not null
    and length(visitor_secret) >= 32
    and visitor_secret = public.request_visitor_secret()
  );

drop policy if exists "analytics_visitors public update" on public.analytics_visitors;
drop policy if exists "analytics_visitors visitor update" on public.analytics_visitors;
create policy "analytics_visitors visitor update"
  on public.analytics_visitors for update
  to anon, authenticated
  using (
    visitor_secret is not null
    and visitor_secret = public.request_visitor_secret()
  )
  with check (
    visitor_secret is not null
    and visitor_secret = public.request_visitor_secret()
  );

drop policy if exists "analytics_events public insert" on public.analytics_events;
drop policy if exists "analytics_events visitor insert" on public.analytics_events;
create policy "analytics_events visitor insert"
  on public.analytics_events for insert
  to anon, authenticated
  with check (public.owns_visitor(visitor_id));

-- ---------------------------------------------------------------------------
-- Diagnostic: reports what THIS request looks like from inside the database.
--
-- Call it from the browser console ON the site, sending the same header the app
-- sends:
--
--   fetch("<SUPABASE_URL>/rest/v1/rpc/diagnose_visitor_secret", {
--     method: "POST",
--     headers: {
--       apikey: "<ANON_KEY>", Authorization: "Bearer <ANON_KEY>",
--       "Content-Type": "application/json",
--       "x-visitor-secret": "TESTVALUE123"
--     },
--     body: "{}"
--   }).then(r => r.json()).then(console.log)
--
-- Expect: {"request_visitor_secret":"TESTVALUE123","header_keys":[...]}
-- If request_visitor_secret comes back "" and x-visitor-secret is absent from
-- header_keys, the custom header is not reaching PostgREST and the ownership
-- check has to move off the header entirely.
--
-- Purely read-only, and it only ever echoes the caller's own headers. Drop it
-- with the statement at the bottom of this file once the issue is closed.
-- ---------------------------------------------------------------------------
create or replace function public.diagnose_visitor_secret()
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'request_visitor_secret', public.request_visitor_secret(),
    'headers_present', nullif(current_setting('request.headers', true), '') is not null,
    'header_keys', coalesce(
      (
        select jsonb_agg(key order by key)
          from jsonb_object_keys(
                 coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb)
               ) as key
      ),
      '[]'::jsonb
    )
  )
$$;

comment on function public.diagnose_visitor_secret() is
  'Temporary diagnostic: echoes the visitor secret and header names this request carried.';

revoke all on function public.diagnose_visitor_secret() from public;
grant execute on function public.diagnose_visitor_secret() to anon, authenticated;

-- Once everything works, tidy up with:
--   drop function if exists public.diagnose_visitor_secret();
