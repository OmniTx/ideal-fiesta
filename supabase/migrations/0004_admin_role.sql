-- Foundry Artisan Coffee — privilege separation for the admin role.
--
-- Before this migration every authenticated Supabase user was a de-facto
-- administrator: the admin policies were granted `to authenticated` with
-- `using (true)` / `with check (true)`, so any account could rewrite the menu
-- and settings and read the entire customer lead table.
--
-- The admin flag now lives only in the JWT's app_metadata, which is written by
-- the service role. A signed-in user cannot grant it to themselves, so a
-- self-registered account no longer inherits admin.
--
-- Grant admin to a staff account — run once per staff member, from the SQL
-- editor or with the service-role key:
--
--   update auth.users
--      set raw_app_meta_data =
--            coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
--    where email = 'staff@example.com';
--
-- Grant the claim *before* that account signs in again: without it the
-- dashboard loses access to menu, settings and analytics.

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

comment on function public.is_admin() is
  'True only when the caller''s JWT carries app_metadata.role = ''admin''.';

grant execute on function public.is_admin() to anon, authenticated;

-- menu_items -----------------------------------------------------------------
-- Public read is unchanged; only the admin flag may write.
drop policy if exists "menu_items admin insert" on public.menu_items;
create policy "menu_items admin insert"
  on public.menu_items for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "menu_items admin update" on public.menu_items;
create policy "menu_items admin update"
  on public.menu_items for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "menu_items admin delete" on public.menu_items;
create policy "menu_items admin delete"
  on public.menu_items for delete
  to authenticated
  using (public.is_admin());

-- system_settings ------------------------------------------------------------
drop policy if exists "system_settings admin insert" on public.system_settings;
create policy "system_settings admin insert"
  on public.system_settings for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "system_settings admin update" on public.system_settings;
create policy "system_settings admin update"
  on public.system_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "system_settings admin delete" on public.system_settings;
create policy "system_settings admin delete"
  on public.system_settings for delete
  to authenticated
  using (public.is_admin());

-- Customer PII: the full visitor/lead database becomes admin-only ------------
drop policy if exists "analytics_visitors admin all" on public.analytics_visitors;
create policy "analytics_visitors admin all"
  on public.analytics_visitors for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "analytics_events admin all" on public.analytics_events;
create policy "analytics_events admin all"
  on public.analytics_events for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
