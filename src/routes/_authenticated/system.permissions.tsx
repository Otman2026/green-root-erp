import { Card, Button } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/system/permissions")({
  component: PermissionsMatrix,
});

const ROLES = [
  "admin","owner","manager","branch_manager","warehouse_keeper","seller","cashier",
  "accountant","purchases_manager","sales_manager","delivery","customer_service","employee",
] as const;
type Role = typeof ROLES[number];
type Perm = { key: string; label: string; label_ar: string | null; category: string | null };

function PermissionsMatrix() {
  const [perms, setPerms] = useState<Perm[]>([]);
  const [grid, setGrid] = useState<Record<string, Set<string>>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [{ data: p }, { data: rp }] = await Promise.all([
      supabase.from("permissions").select("*").order("category").order("key"),
      supabase.from("role_permissions").select("*"),
    ]);
    setPerms((p ?? []) as Perm[]);
    const g: Record<string, Set<string>> = {};
    ROLES.forEach((r) => (g[r] = new Set()));
    (rp ?? []).forEach((row: any) => g[row.role]?.add(row.permission_key));
    setGrid(g);
    setDirty(false);
  };
  useEffect(() => { load(); }, []);

  const groups = useMemo(() => {
    const m = new Map<string, Perm[]>();
    perms.forEach((p) => {
      const k = p.category ?? "other";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(p);
    });
    return Array.from(m.entries());
  }, [perms]);

  const toggle = (role: Role, key: string) => {
    setGrid((prev) => {
      const s = new Set(prev[role]);
      if (s.has(key)) s.delete(key); else s.add(key);
      return { ...prev, [role]: s };
    });
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    // Replace all: delete then insert. Small table, safe.
    const rows: { role: string; permission_key: string }[] = [];
    ROLES.forEach((r) => grid[r]?.forEach((k) => rows.push({ role: r, permission_key: k })));
    const del = await supabase.from("role_permissions").delete().in("role", ROLES as any);
    if (del.error) { setSaving(false); return toast.error(del.error.message); }
    if (rows.length) {
      const ins = await supabase.from("role_permissions").insert(rows as any);
      if (ins.error) { setSaving(false); return toast.error(ins.error.message); }
    }
    setSaving(false);
    setDirty(false);
    toast.success("تم حفظ الصلاحيات");
  };

  return (
    <div className="space-y-4">
      <Card className="flex items-center justify-between p-4">
        <div>
          <h2 className="text-lg font-bold">مصفوفة الصلاحيات</h2>
          <p className="text-xs text-muted-foreground">حدد الصلاحيات لكل دور</p>
        </div>
        <Button onClick={save} disabled={!dirty || saving}>
          <Save className="me-2 h-4 w-4" /> حفظ التغييرات
        </Button>
      </Card>
      <Card className="overflow-auto p-2">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-background">
            <tr className="border-b">
              <th className="p-2 text-right">الصلاحية</th>
              {ROLES.map((r) => (
                <th key={r} className="p-2 text-center text-[10px] font-medium">{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map(([cat, list]) => (
              <>
                <tr key={`cat-${cat}`} className="bg-muted/50">
                  <td colSpan={ROLES.length + 1} className="p-1.5 font-bold text-primary">{cat}</td>
                </tr>
                {list.map((p) => (
                  <tr key={p.key} className="border-b hover:bg-muted/30">
                    <td className="p-2">
                      <div className="font-medium">{p.label_ar ?? p.label}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{p.key}</div>
                    </td>
                    {ROLES.map((r) => (
                      <td key={r} className="p-1 text-center">
                        <input
                          type="checkbox"
                          checked={grid[r]?.has(p.key) ?? false}
                          onChange={() => toggle(r, p.key)}
                          className="h-4 w-4 cursor-pointer accent-primary"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ))}
            {perms.length === 0 && (
              <tr><td colSpan={ROLES.length + 1} className="py-8 text-center text-muted-foreground">لا توجد صلاحيات</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
