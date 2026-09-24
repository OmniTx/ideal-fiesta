-- Foundry Artisan Coffee — order progress and customer cancellation.
--
-- Tickets gain a "preparing" step so a customer can watch progress without the
-- cafe promising a time, and a customer-initiated "cancelled" that is kept
-- distinct from a staff "void" so the two can be told apart later.
--
-- Cancellation is deliberately narrow. A customer may only cancel a ticket that
-- is still "new" — staff have not started it — and only inside a short window
-- from submission. Both rules are enforced HERE rather than in the browser,
-- because the browser is not the boundary: it can be edited, and a free drink is
-- worth editing for.

-- ---------------------------------------------------------------------------
-- Widen the status set. The 0008 constraint only knew new/served/void.
-- ---------------------------------------------------------------------------
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check
  check (status in ('new', 'preparing', 'served', 'void', 'cancelled'));

comment on column public.orders.status is
  'new = received, preparing = on the bench, served = done, void = cancelled by staff, cancelled = cancelled by the customer.';

create index if not exists orders_active_idx
  on public.orders (order_day, created_at)
  where status in ('new', 'preparing');

-- ---------------------------------------------------------------------------
-- Customer cancellation. SECURITY DEFINER, so this function is the boundary: it
-- checks the capability token itself rather than trusting a policy.
-- ---------------------------------------------------------------------------
create or replace function public.cancel_own_order(
  p_order_id uuid,
  p_secret   text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order  public.orders;
  v_window integer;
begin
  if coalesce(length(p_secret), 0) < 32 then
    raise exception 'A 32+ character capability token is required.'
      using errcode = '22023';
  end if;

  select * into v_order from public.orders where id = p_order_id;

  if not found or v_order.visitor_secret is distinct from p_secret then
    raise exception 'That ticket does not belong to this device.'
      using errcode = '42501';
  end if;

  -- Cancelling twice is not an error; it just stays cancelled.
  if v_order.status = 'cancelled' then
    return jsonb_build_object('order', to_jsonb(v_order));
  end if;

  if v_order.status <> 'new' then
    raise exception 'This ticket is already being made — please speak to the counter.'
      using errcode = '22023';
  end if;

  -- The window is editable from the admin, so it is read at call time.
  select coalesce((value ->> 'cancel_window_minutes')::int, 5)
    into v_window
    from public.system_settings
   where key = 'orders_config';
  v_window := coalesce(v_window, 5);

  if v_order.created_at < now() - make_interval(mins => v_window) then
    raise exception 'This ticket is past the cancellation window — please speak to the counter.'
      using errcode = '22023';
  end if;

  update public.orders
     set status = 'cancelled'
   where id = p_order_id
  returning * into v_order;

  return jsonb_build_object('order', to_jsonb(v_order));
end$$;

comment on function public.cancel_own_order(uuid, text) is
  'Lets a customer cancel their own ticket, only while it is still untouched and inside the configured window.';

revoke all on function public.cancel_own_order(uuid, text) from public;
grant execute on function public.cancel_own_order(uuid, text) to anon, authenticated;
