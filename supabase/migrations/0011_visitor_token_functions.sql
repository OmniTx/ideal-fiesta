-- Foundry Artisan Coffee — take the visitor token out of the request header.
--
-- Every policy from 0005/0007/0008 checks
--   visitor_secret = public.request_visitor_secret()
-- which reads the `x-visitor-secret` request header out of PostgREST's
-- request.headers GUC. When a request is made by hand that works — proved with
-- diagnose_visitor_secret(), which echoed the header back correctly. But the
-- storefront's own requests are still refused by every policy that relies on it,
-- and that indirection has cost far more than it is worth.
--
-- These functions take the token as a PARAMETER instead and compare it in SQL.
-- They are SECURITY DEFINER, so the comparison inside the function IS the
-- security boundary and it is explicit: a caller must present a 32+ character
-- token, may only touch the row carrying that exact token, and may only create a
-- row that carries it. The header-based policies stay exactly as they are as
-- defence in depth for anything writing to the tables directly.

-- ---------------------------------------------------------------------------
-- Analytics: one call per pageview or item tap, visitor row and event together.
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
        device_type, device_model, os, browser, screen_res, user_agent
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
        p_visitor ->> 'user_agent'
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
        user_agent   = p_visitor ->> 'user_agent'
       where visitor_id = v_id;
    else
      raise exception 'That visitor id belongs to another device.'
        using errcode = '42501';
    end if;
  elsif v_stored is null or v_stored <> p_secret then
    -- An event for a row this caller does not hold the token for.
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

comment on function public.track_visit(text, jsonb, jsonb) is
  'Records a visitor snapshot and/or one analytics event, authorised by the capability token passed in the payload.';

revoke all on function public.track_visit(text, jsonb, jsonb) from public;
grant execute on function public.track_visit(text, jsonb, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Foundry Rewards: replaces the upsert against rewards_members.
-- ---------------------------------------------------------------------------
create or replace function public.register_rewards_member(
  p_secret     text,
  p_first_name text,
  p_phone      text,
  p_source     text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_member public.rewards_members;
begin
  if coalesce(length(p_secret), 0) < 32 then
    raise exception 'A 32+ character capability token is required.'
      using errcode = '22023';
  end if;
  if coalesce(trim(p_first_name), '') = '' or coalesce(trim(p_phone), '') = '' then
    raise exception 'A first name and mobile number are required.'
      using errcode = '22023';
  end if;

  select * into v_member
    from public.rewards_members
   where phone = trim(p_phone);

  if found then
    -- Already on the list. Only the device holding the token gets the member
    -- back; anyone else is told politely and learns nothing.
    if v_member.visitor_secret = p_secret then
      update public.rewards_members
         set last_seen = now()
       where id = v_member.id
       returning * into v_member;
      return jsonb_build_object('status', 'joined', 'member', to_jsonb(v_member));
    end if;
    return jsonb_build_object('status', 'already_member');
  end if;

  insert into public.rewards_members (first_name, phone, visitor_secret, source)
  values (
    trim(p_first_name),
    trim(p_phone),
    p_secret,
    nullif(trim(coalesce(p_source, '')), '')
  )
  returning * into v_member;

  return jsonb_build_object('status', 'joined', 'member', to_jsonb(v_member));
end$$;

comment on function public.register_rewards_member(text, text, text, text) is
  'Joins the caller to Foundry Rewards, authorised by the capability token passed in the payload.';

revoke all on function public.register_rewards_member(text, text, text, text) from public;
grant execute on function public.register_rewards_member(text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Orders: same function as 0009, now accepting the token as a parameter.
-- The old 3-argument signature is dropped so there is no ambiguity.
-- ---------------------------------------------------------------------------
create or replace function public.submit_order(
  p_items         jsonb,
  p_customer_name text default null,
  p_note          text default null,
  p_secret        text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_order public.orders;
  v_items jsonb;
  v_secret text := coalesce(nullif(p_secret, ''), public.request_visitor_secret());
begin
  if coalesce(jsonb_array_length(p_items), 0) = 0 then
    raise exception 'Your basket is empty.' using errcode = '22023';
  end if;

  if coalesce(length(v_secret), 0) < 32 then
    raise exception 'A 32+ character capability token is required.'
      using errcode = '22023';
  end if;

  insert into public.orders (visitor_secret, customer_name, note)
  values (
    v_secret,
    nullif(trim(coalesce(p_customer_name, '')), ''),
    nullif(trim(coalesce(p_note, '')), '')
  )
  returning * into v_order;

  insert into public.order_items
    (order_id, menu_item_id, name, category, size, modifiers, unit_price, quantity)
  select
    v_order.id,
    nullif(item ->> 'menu_item_id', '')::uuid,
    item ->> 'name',
    nullif(item ->> 'category', '')::menu_category,
    nullif(item ->> 'size', ''),
    coalesce(item -> 'modifiers', '[]'::jsonb),
    (item ->> 'unit_price')::numeric(5, 2),
    greatest(1, least(20, coalesce((item ->> 'quantity')::int, 1)))
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) as item;

  select * into v_order from public.orders where id = v_order.id;

  select coalesce(jsonb_agg(to_jsonb(i) order by i.created_at, i.name), '[]'::jsonb)
    into v_items
    from public.order_items i
   where i.order_id = v_order.id;

  return jsonb_build_object('order', to_jsonb(v_order), 'items', v_items);
end$$;

drop function if exists public.submit_order(jsonb, text, text);

comment on function public.submit_order(jsonb, text, text, text) is
  'Creates a counter ticket and its lines in one transaction. Order number, day and totals come from the 0008 triggers.';
