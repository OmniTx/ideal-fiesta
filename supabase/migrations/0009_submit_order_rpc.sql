-- Foundry Artisan Coffee — submit a counter ticket in one server-side transaction.
--
-- The storefront previously created a ticket with a single nested PostgREST
-- insert (`insert({ ..., order_items: [...] })`). That relies on PostgREST
-- resolving the orders -> order_items relationship from its schema cache, and
-- when it cannot, the basket fails with:
--
--   Could not find the 'order_items' column of 'orders' in the schema cache
--
-- This function does the same work inside Postgres instead: one transaction, no
-- embed, nothing for the schema cache to get wrong. It is SECURITY INVOKER on
-- purpose — the RLS policies from 0008 still gate every insert, so a caller can
-- only ever create their own ticket.

create or replace function public.submit_order(
  p_items         jsonb,
  p_customer_name text default null,
  p_note          text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_order public.orders;
  v_items jsonb;
begin
  if coalesce(jsonb_array_length(p_items), 0) = 0 then
    raise exception 'Your basket is empty.' using errcode = '22023';
  end if;

  -- The capability token comes from the request header, exactly as the RLS
  -- insert policy expects, so no token is accepted as a parameter.
  insert into public.orders (visitor_secret, customer_name, note)
  values (
    public.request_visitor_secret(),
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

  -- Re-read after the recount trigger has stamped item_count and subtotal.
  select * into v_order from public.orders where id = v_order.id;

  select coalesce(jsonb_agg(to_jsonb(i) order by i.created_at, i.name), '[]'::jsonb)
    into v_items
    from public.order_items i
   where i.order_id = v_order.id;

  return jsonb_build_object('order', to_jsonb(v_order), 'items', v_items);
end$$;

comment on function public.submit_order(jsonb, text, text) is
  'Creates a counter ticket and its lines in one transaction. Order number, day and totals are assigned by the 0008 triggers.';

revoke all on function public.submit_order(jsonb, text, text) from public;
grant execute on function public.submit_order(jsonb, text, text) to anon, authenticated;
