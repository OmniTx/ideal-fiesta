-- Foundry Artisan Coffee — Realtime Authorization.
--
-- Both channel topics are now private, so Realtime evaluates RLS on
-- realtime.messages when a client joins. Realtime enables RLS on that table by
-- default, so only policies are needed here.
--
--   foundry-live-sync  — storefront sync (menu, settings). No customer data
--                        ever crosses it, so anon may read and write.
--   foundry-admin-live — customer-activity pings for the dashboard. Anon may
--                        publish the opaque signal, but only admins may read it.
--
-- IMPORTANT: to make the private admin topic actually enforceable, also disable
-- "Allow public access" in the Supabase dashboard — Realtime Settings → Allow
-- public access. With it left on, a client can still join the topic as a
-- non-private channel. The payloads carry no PII either way.

-- Storefront topic -----------------------------------------------------------
drop policy if exists "foundry storefront read" on realtime.messages;
create policy "foundry storefront read"
  on realtime.messages for select
  to anon, authenticated
  using (
    (select realtime.topic()) = 'foundry-live-sync'
    and realtime.messages.extension = 'broadcast'
  );

drop policy if exists "foundry storefront write" on realtime.messages;
create policy "foundry storefront write"
  on realtime.messages for insert
  to anon, authenticated
  with check (
    (select realtime.topic()) = 'foundry-live-sync'
    and realtime.messages.extension = 'broadcast'
  );

-- Customer-activity topic (admin eyes only) ----------------------------------
drop policy if exists "foundry admin channel read" on realtime.messages;
create policy "foundry admin channel read"
  on realtime.messages for select
  to authenticated
  using (
    (select realtime.topic()) = 'foundry-admin-live'
    and realtime.messages.extension = 'broadcast'
    and public.is_admin()
  );

drop policy if exists "foundry admin channel write" on realtime.messages;
create policy "foundry admin channel write"
  on realtime.messages for insert
  to anon, authenticated
  with check (
    (select realtime.topic()) = 'foundry-admin-live'
    and realtime.messages.extension = 'broadcast'
  );
