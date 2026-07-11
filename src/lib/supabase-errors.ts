// Small helper: given an array of Supabase responses, log the first error found.
// Logs to console only — dashboards should not surface intrusive toasts for
// non-critical read failures (RLS, empty joins, etc.).
type MaybeRes = { error?: { message?: string; code?: string } | null } | null | undefined;

export function reportSupabaseErrors(label: string, ...results: MaybeRes[]) {
  for (const r of results) {
    if (r && r.error) {
      // eslint-disable-next-line no-console
      console.warn(`[${label}]`, r.error);
      return true;
    }
  }
  return false;
}
