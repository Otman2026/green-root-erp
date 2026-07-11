// Small helper: given an array of Supabase responses, toast the first error found.
import { toast } from "sonner";

type MaybeRes = { error?: { message?: string } | null } | null | undefined;

export function reportSupabaseErrors(label: string, ...results: MaybeRes[]) {
  for (const r of results) {
    if (r && r.error) {
      toast.error(`${label}: ${r.error.message ?? "خطأ غير معروف"}`);
      // eslint-disable-next-line no-console
      console.warn(`[${label}]`, r.error);
      return true;
    }
  }
  return false;
}
