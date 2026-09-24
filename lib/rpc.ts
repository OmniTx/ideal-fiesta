/**
 * PostgREST reports a call to a function it cannot see as PGRST202, usually
 * because the migration that creates it has not been applied yet. Callers use
 * this to fall back to a direct table write instead of failing outright.
 */
export function isMissingFunction(
  error: { code?: string; message?: string } | null | undefined,
): boolean {
  if (!error) return false;
  return (
    error.code === "PGRST202" ||
    /could not find the function|does not exist/i.test(error.message ?? "")
  );
}
