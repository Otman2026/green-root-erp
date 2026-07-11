import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type OrgMember = { organization_id: string; role: "owner" | "manager" | "employee" };
export type Organization = { id: string; name: string; slug: string; status: string };
export type License = {
  id: string;
  organization_id: string;
  plan_id: string | null;
  license_key: string;
  status: "active" | "suspended" | "expired" | "cancelled";
  is_trial: boolean;
  starts_at: string;
  expires_at: string | null;
};

export function useOrg() {
  const { user } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [member, setMember] = useState<OrgMember | null>(null);
  const [license, setLicense] = useState<License | null>(null);
  const [isSystemOwner, setIsSystemOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setOrg(null); setLicense(null); setMember(null); setIsSystemOwner(false); setLoading(false); return; }
    setLoading(true);
    const [{ data: mem }, { data: roles }] = await Promise.all([
      supabase.from("organization_members").select("organization_id, role").eq("user_id", user.id).order("role", { ascending: false }).limit(1),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);
    const so = (roles ?? []).some((r: any) => r.role === "system_owner");
    setIsSystemOwner(so);
    const m = mem?.[0] as OrgMember | undefined;
    if (!m) { setOrg(null); setLicense(null); setMember(null); setLoading(false); return; }
    setMember(m);
    const [{ data: o }, { data: lics }] = await Promise.all([
      supabase.from("organizations").select("id, name, slug, status").eq("id", m.organization_id).maybeSingle(),
      supabase.from("licenses").select("*").eq("organization_id", m.organization_id).order("expires_at", { ascending: false, nullsFirst: false }).limit(1),
    ]);
    setOrg(o as Organization | null);
    setLicense((lics?.[0] ?? null) as License | null);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const licenseActive = !!license && license.status === "active"
    && (!license.expires_at || new Date(license.expires_at) > new Date());
  const daysRemaining = license?.expires_at
    ? Math.max(0, Math.ceil((new Date(license.expires_at).getTime() - Date.now()) / 86400000))
    : null;
  const readOnly = !licenseActive;

  return { org, member, license, isSystemOwner, licenseActive, readOnly, daysRemaining, loading, refresh };
}
