import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Building2, KeyRound, Package as PackageIcon, ScrollText, Users, Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/system")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    const isOwner = (roles ?? []).some((r: any) => r.role === "system_owner");
    if (!isOwner) throw redirect({ to: "/dashboard" });
  },
  component: SystemLayout,
});

const NAV: { to: string; label: string; icon: typeof Shield; exact?: boolean }[] = [
  { to: "/system", label: "نظرة عامة", icon: Shield, exact: true },
  { to: "/system/organizations", label: "المؤسسات", icon: Building2 },
  { to: "/system/licenses", label: "التراخيص", icon: KeyRound },
  { to: "/system/plans", label: "الخطط", icon: PackageIcon },
  { to: "/system/users", label: "المستخدمون", icon: Users },
  { to: "/system/permissions", label: "الصلاحيات", icon: Lock },
  { to: "/system/audit", label: "سجل التدقيق", icon: ScrollText },
];

function SystemLayout() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border bg-gradient-to-r from-primary/10 to-transparent p-4">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold">لوحة مدير النظام</h1>
          <p className="text-xs text-muted-foreground">Haytam AGRI — System Owner</p>
        </div>
      </div>
      <nav className="flex flex-wrap gap-2 border-b pb-2">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to as any}
            activeOptions={{ exact: n.exact }}
            activeProps={{ className: "bg-primary text-primary-foreground" }}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            <n.icon className="h-4 w-4" />
            {n.label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
