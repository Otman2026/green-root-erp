import { Card, Badge } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/system/users")({
  component: UsersPage,
});

function UsersPage() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: profs }, { data: roles }, { data: mems }] = await Promise.all([
        supabase.from("profiles").select("id, username, full_name, email_optional, phone, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("organization_members").select("user_id, role, organizations(name)"),
      ]);
      const byUser = new Map<string, any>();
      (profs ?? []).forEach((p: any) => byUser.set(p.id, { ...p, roles: [], orgs: [] }));
      (roles ?? []).forEach((r: any) => byUser.get(r.user_id)?.roles.push(r.role));
      (mems ?? []).forEach((m: any) => byUser.get(m.user_id)?.orgs.push({ name: m.organizations?.name, role: m.role }));
      setRows(Array.from(byUser.values()));
    })();
  }, []);

  return (
    <Card className="p-4">
      <table className="w-full text-sm">
        <thead className="border-b text-right text-muted-foreground">
          <tr><th className="py-2">اسم المستخدم</th><th>الاسم</th><th>البريد/الهاتف</th><th>الأدوار</th><th>المؤسسات</th></tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id} className="border-b">
              <td className="py-2 font-mono">{u.username}</td>
              <td>{u.full_name}</td>
              <td className="text-xs text-muted-foreground">{u.email_optional || u.phone || "—"}</td>
              <td className="flex flex-wrap gap-1">
                {u.roles.map((r: string) => (
                  <Badge key={r} variant={r === "system_owner" ? "destructive" : "outline"}>{r}</Badge>
                ))}
              </td>
              <td className="text-xs">{u.orgs.map((o: any) => `${o.name} (${o.role})`).join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
