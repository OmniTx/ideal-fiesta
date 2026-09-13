-- Foundry Artisan Coffee — initial schema (Phase 1 base)
-- Tables: menu_items, system_settings. RLS: public SELECT, authenticated CRUD.

-- ---------------------------------------------------------------------------
-- Category enum
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'menu_category') then
    create type menu_category as enum (
      'hot_coffee',
      'iced_coffee',
      'sweet_tooth',
      'hot_drinks',
      'tea',
      'shakes_frappes',
      'breakfast',
      'toasties',
      'specials',
      'spreads'
    );
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- menu_items
-- ---------------------------------------------------------------------------
create table if not exists public.menu_items (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (length(trim(name)) > 0),
  category     menu_category not null,
  description  text,
  price_single numeric(5, 2) check (price_single is null or price_single >= 0),
  price_small  numeric(5, 2) check (price_small  is null or price_small  >= 0),
  price_medium numeric(5, 2) check (price_medium is null or price_medium >= 0),
  price_large  numeric(5, 2) check (price_large  is null or price_large  >= 0),
  image_url    text,
  is_available boolean not null default true,
  is_special   boolean not null default false,
  display_order integer not null default 0,
  created_at   timestamptz not null default now(),
  constraint menu_items_has_price check (
    price_single is not null
    or price_small is not null
    or price_medium is not null
    or price_large is not null
  )
);

comment on table public.menu_items is 'Menu catalogue. Prices are GST-inclusive AUD, stored as NUMERIC(5,2).';

create index if not exists menu_items_category_order_idx
  on public.menu_items (category, display_order);

create index if not exists menu_items_specials_idx
  on public.menu_items (is_special)
  where is_special = true;

-- ---------------------------------------------------------------------------
-- system_settings (key/value JSON — theme colours, opening hours, notices)
-- ---------------------------------------------------------------------------
create table if not exists public.system_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

comment on table public.system_settings is 'Editable site configuration. Consumed by admin (theme) and the public storefront.';

insert into public.system_settings (key, value) values
  (
    'theme',
    '{"background":"#FAF6EE","foreground":"#1F1E1B","primary":"#A35D39","card":"#FFFFFF","border":"#E8E3D8"}'::jsonb
  ),
  (
    'opening_hours',
    '{"rows":[{"label":"Monday to Wednesday","value":"9am – 5:30pm"},{"label":"Thursday","value":"9am – 9pm"},{"label":"Friday","value":"9am – 5:30pm"},{"label":"Saturday","value":"9am – 5pm"},{"label":"Sunday","value":"10am – 4pm"}],"note":"Kitchen closes 30 minutes before the centre."}'::jsonb
  ),
  (
    'surcharge_notice',
    '{"enabled":false,"text":"A 10% surcharge applies on public holidays."}'::jsonb
  )
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- updated_at trigger for system_settings
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists system_settings_set_updated_at on public.system_settings;
create trigger system_settings_set_updated_at
  before update on public.system_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.menu_items enable row level security;
alter table public.system_settings enable row level security;

-- menu_items -----------------------------------------------------------------
drop policy if exists "menu_items public read" on public.menu_items;
create policy "menu_items public read"
  on public.menu_items for select
  to anon, authenticated
  using (true);

drop policy if exists "menu_items admin insert" on public.menu_items;
create policy "menu_items admin insert"
  on public.menu_items for insert
  to authenticated
  with check (true);

drop policy if exists "menu_items admin update" on public.menu_items;
create policy "menu_items admin update"
  on public.menu_items for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "menu_items admin delete" on public.menu_items;
create policy "menu_items admin delete"
  on public.menu_items for delete
  to authenticated
  using (true);

-- system_settings ------------------------------------------------------------
drop policy if exists "system_settings public read" on public.system_settings;
create policy "system_settings public read"
  on public.system_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "system_settings admin insert" on public.system_settings;
create policy "system_settings admin insert"
  on public.system_settings for insert
  to authenticated
  with check (true);

drop policy if exists "system_settings admin update" on public.system_settings;
create policy "system_settings admin update"
  on public.system_settings for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "system_settings admin delete" on public.system_settings;
create policy "system_settings admin delete"
  on public.system_settings for delete
  to authenticated
  using (true);
