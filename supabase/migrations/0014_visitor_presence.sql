-- Foundry Artisan Coffee — visitor presence.
--
-- "Live in the admin" was only ever `last_seen` inside a 15 minute window, and
-- `last_seen` moves on a pageview. So a customer who closed the tab an instant
-- after arriving stayed "live" for a quarter of an hour, and someone who sat
-- reading the menu without navigating looked stale.
--
-- Two additions fix both halves:
--   * an explicit "I am leaving" marker the device sends when the tab is hidden
--     or unloaded, and
--   * `track_visit` clearing that marker, so coming back makes you present again.
--
-- The admin then reads: seen recently AND (not left, or left before that).

alter table public.analytics_visitors
  add column if not exists left_at timestamptz;

comment on column public.analytics_visitors.left_at is
  'Set when the device reports it is leaving. Cleared by the next visit, so a visitor is live when last_seen is recent and left_at is null or older than last_seen.';

create index if not exists analytics_visitors_presence_idx
  on public.analytics_visitors (last_seen desc)
  where left_at is null;

-- ---------------------------------------------------------------------------
-- track_visit, restated so a returning visitor is marked present again. Same
-- behaviour as 0011 apart from clearing left_at.
-- ---------------------------------------------------------------------------
create or replace function public.track_visit(
  p_secret  text,
  p_visitor jsonb default null,
  p_event   jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id     text;
  v_stored text;
begin
  if coalesce(length(p_secret), 0) < 32 then
    raise exception 'A 32+ character capability token is required.'
      using errcode = '22023';
  end if;

  v_id := nullif(trim(coalesce(
    p_visitor ->> 'visitor_id',
    p_event   ->> 'visitor_id',
    ''
  )), '');

  if v_id is null then
    raise exception 'A visitor id is required.' using errcode = '22023';
  end if;

  select visitor_secret into v_stored
    from public.analytics_visitors
   where visitor_id = v_id;

  if p_visitor is not null then
    if v_stored is null then
      insert into public.analytics_visitors (
        visitor_id, visitor_secret, last_seen, last_ip, city, region, country,
        device_type, device_model, os, browser, screen_res, user_agent, left_at
      ) values (
        v_id,
        p_secret,
        coalesce((p_visitor ->> 'last_seen')::timestamptz, now()),
        p_visitor ->> 'last_ip',
        p_visitor ->> 'city',
        p_visitor ->> 'region',
        p_visitor ->> 'country',
        p_visitor ->> 'device_type',
        p_visitor ->> 'device_model',
        p_visitor ->> 'os',
        p_visitor ->> 'browser',
        p_visitor ->> 'screen_res',
        p_visitor ->> 'user_agent',
        null
      );
    elsif v_stored = p_secret then
      update public.analytics_visitors set
        last_seen    = coalesce((p_visitor ->> 'last_seen')::timestamptz, now()),
        last_ip      = p_visitor ->> 'last_ip',
        city         = p_visitor ->> 'city',
        region       = p_visitor ->> 'region',
        country      = p_visitor ->> 'country',
        device_type  = p_visitor ->> 'device_type',
        device_model = p_visitor ->> 'device_model',
        os           = p_visitor ->> 'os',
        browser      = p_visitor ->> 'browser',
        screen_res   = p_visitor ->> 'screen_res',
        user_agent   = p_visitor ->> 'user_agent',
        left_at      = null
       where visitor_id = v_id;
    else
      raise exception 'That visitor id belongs to another device.'
        using errcode = '42501';
    end if;
  elsif v_stored is null or v_stored <> p_secret then
    raise exception 'That visitor id belongs to another device.'
      using errcode = '42501';
  end if;

  if p_event is not null and coalesce(p_event ->> 'event_type', '') <> '' then
    insert into public.analytics_events (
      visitor_id, session_id, event_type, page_path, metadata, ip
    ) values (
      v_id,
      coalesce(nullif(p_event ->> 'session_id', ''), 'unknown'),
      p_event ->> 'event_type',
      coalesce(nullif(p_event ->> 'page_path', ''), '/'),
      coalesce(p_event -> 'metadata', '{}'::jsonb),
      p_event ->> 'ip'
    );
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- "I am leaving." Only ever touches the row carrying the token presented, so it
-- cannot be used to mark another visitor as gone.
-- ---------------------------------------------------------------------------
create or replace function public.mark_visitor_left(
  p_secret     text,
  p_visitor_id text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if coalesce(length(p_secret), 0) < 32 then
    raise exception 'A 32+ character capability token is required.'
      using errcode = '22023';
  end if;

  update public.analytics_visitors
     set left_at = now()
   where visitor_id = p_visitor_id
     and visitor_secret = p_secret;
end$$;

comment on function public.mark_visitor_left(text, text) is
  'Marks the caller''s own visitor row as left. Best effort — a torn-down tab may not deliver it.';

revoke all on function public.mark_visitor_left(text, text) from public;
grant execute on function public.mark_visitor_left(text, text) to anon, authenticated;
