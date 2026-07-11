import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type AppRole =
  | "system_owner"
  | "admin" | "owner" | "manager" | "branch_manager"
  | "warehouse_keeper" | "seller" | "cashier" | "accountant"
  | "purchases_manager" | "sales_manager" | "delivery"
  | "customer_service" | "employee";

export function useRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setRoles([]); setLoading(false); return; }
    let alive = true;
    supabase.from("user_roles").select("role").eq("user_id", user.id).then(({ data }) => {
      if (!alive) return;
      setRoles(((data ?? []).map((r: any) => r.role)) as AppRole[]);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [user?.id]);

  const has = (...r: AppRole[]) => r.some((x) => roles.includes(x));
  const isAdmin = has("admin", "owner");
  return { roles, has, isAdmin, loading };
}
