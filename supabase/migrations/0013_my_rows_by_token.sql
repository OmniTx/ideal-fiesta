-- Foundry Artisan Coffee — read your own rows by capability token.
--
-- 0011 took the WRITE path off the `x-visitor-secret` request header because the
-- storefront's own requests could not be relied on to carry it. The READ path
-- was left behind, and it has the same problem:
--
--   orders visitor read own          -> visitor_secret = request_visitor_secret()
--   rewards_members visitor read own -> visitor_secret = request_visitor_secret()
--
-- So a customer could submit a ticket and see it (the just-submitted row is held
-- in local state), then never see it move: the refetch returned nothing, and
-- Postgres Changes filters rows through that same SELECT policy, so realtime
-- delivered nothing either. The two symptoms have one cause.
--
-- These functions take the token as a parameter and compare it in SQL. Both are
-- SECURITY INVOKER's opposite — DEFINER — so the comparison inside is the
-- boundary: a caller only ever gets rows carrying the token it presented.

-- ---------------------------------------------------------------------------
-- This device's tickets, with their lines, shaped like a PostgREST embed so the
-- client's Order type is unchanged.
-- ---------------------------------------------------------------------------
create or replace function public.my_orders(
  p_secret text,
  p_limit  integer default 20
)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    jsonb_agg(entry.order_json order by entry.created_at desc),
    '[]'::jsonb
  )
    from (
      select
        o.created_at,
        (to_jsonb(o) - 'visitor_secret') || jsonb_build_object(
          'order_items',
          coalesce(
            (
              select jsonb_agg(to_jsonb(i) order by i.created_at, i.name)
                from public.order_items i
               where i.order_id = o.id
            ),
            '[]'::jsonb
          )
        ) as order_json
        from public.orders o
       where coalesce(length(p_secret), 0) >= 32
         and o.visitor_secret = p_secret
       order by o.created_at desc
       limit greatest(1, least(100, coalesce(p_limit, 20)))
    ) as entry
$$;

comment on function public.my_orders(text, integer) is
  'Returns the tickets belonging to the capability token presented.';

revoke all on function public.my_orders(text, integer) from public;
grant execute on function public.my_orders(text, integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- This device's Foundry Rewards membership, if any.
-- ---------------------------------------------------------------------------
create or replace function public.my_membership(p_secret text)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (
      select to_jsonb(m) - 'visitor_secret'
        from public.rewards_members m
       where coalesce(length(p_secret), 0) >= 32
         and m.visitor_secret = p_secret
       order by m.first_seen desc
       limit 1
    ),
    'null'::jsonb
  )
$$;

comment on function public.my_membership(text) is
  'Returns the rewards member belonging to the capability token presented.';

revoke all on function public.my_membership(text) from public;
grant execute on function public.my_membership(text) to anon, authenticated;
