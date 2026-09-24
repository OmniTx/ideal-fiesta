-- Foundry Artisan Coffee — analytics write hardening.
--
-- The storefront must write visitor telemetry and captured leads with no admin
-- session, but the previous policies let *any* anonymous client update *any*
-- row (`to anon using (true) with check (true)`). A single unfiltered PATCH
-- could blank or forge the name/phone/email of every customer lead.
--
-- Every anonymous write is now bound to a per-visitor capability token. The
-- browser keeps the token in localStorage and sends it as the `x-visitor-secret`
-- header; RLS only accepts a write to the row carrying that exact token, so a
-- visitor can reach their own record and nothing else.
--
-- Note: rows that predate this migration have no token and can no longer be
-- written. The client detects that (no token on the device) and starts a fresh
-- visitor id, leaving the historic lead rows intact and readable by admins.

alter table public.analytics_visitors
  add column if not exists visitor_secret text;

comment on column public.analytics_visitors.visitor_secret is
  'Per-visitor capability token. Sent by the browser as x-visitor-secret and matched by RLS so an anonymous client can only write its own row.';

-- The header a request presented, or '' when absent/non-JSON.
create or replace function public.request_visitor_secret()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-visitor-secret',
    ''
  )
$$;

comment on function public.request_visitor_secret() is
  'Value of the x-visitor-secret request header, or an empty string.';

-- SECURITY DEFINER so it can look at analytics_visitors past the RLS it is
-- itself enforcing.
create or replace function public.owns_visitor(p_visitor_id text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.analytics_visitors v
     where v.visitor_id = p_visitor_id
       and v.visitor_secret is not null
       and length(v.visitor_secret) >= 32
       and v.visitor_secret = public.request_visitor_secret()
  )
$$;

comment on function public.owns_visitor(text) is
  'True when the request carries the capability token stored on this visitor row.';

revoke all on function public.owns_visitor(text) from public;
grant execute on function public.owns_visitor(text) to anon, authenticated;

-- analytics_visitors ---------------------------------------------------------
-- The row may only be created while presenting its own token, which stops a
-- client from planting a row and claiming a victim's visitor_id later.
drop policy if exists "analytics_visitors public insert" on public.analytics_visitors;
create policy "analytics_visitors visitor insert"
  on public.analytics_visitors for insert
  to anon, authenticated
  with check (
    visitor_secret is not null
    and length(visitor_secret) >= 32
    and visitor_secret = public.request_visitor_secret()
  );

-- Replaces the unconditional anon UPDATE. Both the row being changed and the
-- resulting row must carry the caller's token, so no other customer's record
-- can be reached — and the token itself cannot be swapped out.
drop policy if exists "analytics_visitors public update" on public.analytics_visitors;
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

-- analytics_events -----------------------------------------------------------
-- Events may only be filed against a visitor row the caller owns.
drop policy if exists "analytics_events public insert" on public.analytics_events;
create policy "analytics_events visitor insert"
  on public.analytics_events for insert
  to anon, authenticated
  with check (public.owns_visitor(visitor_id));
