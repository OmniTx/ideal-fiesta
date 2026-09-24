-- Foundry Artisan Coffee — counter order tickets.
--
-- The storefront lets a customer build a basket and submit it as a TICKET: they
-- get a short number, show it at the counter, and staff ring the basket up on
-- their own till. No money changes hands online, so there is no payment state
-- and no prep queue here — just "new", "served" and "void".
--
-- Visitors can create a ticket and re-read their own, and nothing else. They
-- cannot list other people's tickets, cannot update them, and cannot delete
-- them. Binding is by the same per-browser capability token as the analytics and
-- rewards tables (see 0005_analytics_write_hardening.sql).

-- ---------------------------------------------------------------------------
-- Per-day counter behind the human-friendly ticket numbers. RLS is on with NO
-- policies, so the table is unreachable through the API: only the SECURITY
-- DEFINER trigger below may read or write it.
-- ---------------------------------------------------------------------------
create table if not exists public.order_counters (
  order_day   date primary key,
  last_number integer not null default 0
);
alter table public.order_counters enable row level security;

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  order_day      date not null,
  order_number   integer not null,
  visitor_secret text not null,
  customer_name  text,
  status         text not null default 'new' check (status in ('new', 'served', 'void')),
  note           text,
  item_count     integer not null default 0,
  subtotal       numeric(7, 2) not null default 0,
  created_at     timestamptz not null default now(),
  served_at      timestamptz,
  unique (order_day, order_number)
);

comment on table public.orders is
  'Counter order tickets. Totals are recounted from order_items by trigger; the customer never sees a price guarantee and staff ring the basket up on their own till.';

create index if not exists orders_day_created_idx on public.orders (order_day, created_at desc);
create index if not exists orders_status_idx on public.orders (status) where status <> 'served';

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name         text not null,
  category     menu_category,
  size         text,
  modifiers    jsonb not null default '[]'::jsonb,
  unit_price   numeric(5, 2) not null check (unit_price >= 0),
  quantity     integer not null default 1 check (quantity between 1 and 20),
  line_total   numeric(7, 2) not null default 0,
  created_at   timestamptz not null default now()
);

comment on column public.order_items.modifiers is
  'Snapshot of the chosen options at submit time: [{ "label": "Oat Milk", "price": 1.00 }].';

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- Ticket numbering: atomic, race-free, resets daily on the venue wall clock.
-- The upsert takes a row lock on the day's counter, so two concurrent anonymous
-- inserts can never be handed the same number.
-- ---------------------------------------------------------------------------
create or replace function public.assign_order_number()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_day  date := (now() at time zone 'Australia/Brisbane')::date;
  v_next integer;
begin
  insert into public.order_counters (order_day, last_number)
  values (v_day, 1)
  on conflict (order_day)
    do update set last_number = public.order_counters.last_number + 1
  returning last_number into v_next;

  new.order_day := v_day;
  new.order_number := v_next;
  return new;
end$$;

drop trigger if exists orders_assign_number on public.orders;
create trigger orders_assign_number
  before insert on public.orders
  for each row execute function public.assign_order_number();

-- Line totals are derived, never trusted from the browser.
create or replace function public.price_order_item()
returns trigger
language plpgsql
as $$
begin
  new.line_total := round(new.unit_price * new.quantity, 2);
  return new;
end$$;

drop trigger if exists order_items_price on public.order_items;
create trigger order_items_price
  before insert or update on public.order_items
  for each row execute function public.price_order_item();

-- Ticket totals are recounted from the real rows, so a forged subtotal cannot
-- stick. SECURITY DEFINER because visitors hold no UPDATE policy on orders.
create or replace function public.recount_order()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order uuid := coalesce(new.order_id, old.order_id);
begin
  update public.orders o
     set item_count = s.qty,
         subtotal   = s.total
    from (
      select coalesce(sum(quantity), 0) as qty,
             coalesce(sum(line_total), 0) as total
        from public.order_items
       where order_id = v_order
    ) s
   where o.id = v_order;
  return null;
end$$;

drop trigger if exists order_items_recount on public.order_items;
create trigger order_items_recount
  after insert or update or delete on public.order_items
  for each row execute function public.recount_order();

create or replace function public.stamp_served_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'served' and old.status <> 'served' then
    new.served_at := now();
  end if;
  return new;
end$$;

drop trigger if exists orders_stamp_served on public.orders;
create trigger orders_stamp_served
  before update on public.orders
  for each row execute function public.stamp_served_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create or replace function public.owns_order(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.orders o
     where o.id = p_order_id
       and o.visitor_secret is not null
       and o.visitor_secret = public.request_visitor_secret()
  )
$$;

comment on function public.owns_order(uuid) is
  'True when the request carries the capability token stored on this order.';

revoke all on function public.owns_order(uuid) from public;
grant execute on function public.owns_order(uuid) to anon, authenticated;

-- Create and re-read your own ticket. There is deliberately no visitor UPDATE or
-- DELETE policy: a customer can never mark their own order served, edit it after
-- submission, or clear the board.
create policy "orders visitor insert" on public.orders
  for insert to anon, authenticated
  with check (
    visitor_secret is not null
    and length(visitor_secret) >= 32
    and visitor_secret = public.request_visitor_secret()
  );

create policy "orders visitor read own" on public.orders
  for select to anon, authenticated
  using (visitor_secret is not null and visitor_secret = public.request_visitor_secret());

create policy "orders admin all" on public.orders
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- order_items carry no token of their own, so they are gated on the parent order.
create policy "order_items visitor insert" on public.order_items
  for insert to anon, authenticated
  with check (public.owns_order(order_id));

create policy "order_items visitor read own" on public.order_items
  for select to anon, authenticated
  using (public.owns_order(order_id));

create policy "order_items admin all" on public.order_items
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Realtime for the bench board. Postgres Changes respects table RLS, so an admin
-- receives every ticket while an anonymous browser only ever receives its own —
-- no customer PII needs to travel over a broadcast channel.
-- ---------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null;
end $$;
