import { supabase } from "@/integrations/supabase/client";

export async function logActivity(params: { action: string; entity?: string; entity_id?: string; summary?: string; meta?: any }) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("activity_log").insert({ user_id: user.id, ...params });
  } catch { /* ignore */ }
}
