import { createClient } from "@/utils/supabase/client";
import { broadcastRealtimeEvent } from "@/lib/realtime";

/**
 * Thin wrapper over the `system_settings` key/value table. All calls run as the
 * signed-in admin through supabase-js, so RLS is what actually enforces access.
 */
export async function fetchSetting<T>(key: string): Promise<T | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data?.value as T) ?? null;
}

export async function fetchSettings(
  keys: string[],
): Promise<Record<string, unknown>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("system_settings")
    .select("key, value")
    .in("key", keys);

  if (error) throw new Error(error.message);

  return (data ?? []).reduce<Record<string, unknown>>((acc, row) => {
    acc[row.key as string] = row.value;
    return acc;
  }, {});
}

export async function saveSetting(key: string, value: unknown): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("system_settings")
    .upsert({ key, value }, { onConflict: "key" });

  if (error) throw new Error(error.message);

  void broadcastRealtimeEvent("settings_updated", { key });
}
