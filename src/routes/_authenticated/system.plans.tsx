import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/system/plans")({
  component: PlansPage,
});

function PlansPage() {
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase.from("plans").select("*").order("sort_order");
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async (id: string, patch: any) => {
    const { error } = await supabase.from("plans").update(patch).eq("id", id);
    if (error) toast.error(error.message); else toast.success("تم الحفظ");
  };

  return (
    <Card className="p-4">
      <table className="w-full text-sm">
        <thead className="border-b text-right text-muted-foreground">
          <tr><th className="py-2">الرمز</th><th>الاسم</th><th>شهري</th><th>سنوي</th><th>نشطة</th><th></th></tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2 font-mono">{p.code}</td>
              <td><Input defaultValue={p.name} onBlur={(e) => save(p.id, { name: e.target.value })} /></td>
              <td><Input type="number" defaultValue={p.price_monthly} className="w-24" onBlur={(e) => save(p.id, { price_monthly: Number(e.target.value) })} /></td>
              <td><Input type="number" defaultValue={p.price_yearly} className="w-24" onBlur={(e) => save(p.id, { price_yearly: Number(e.target.value) })} /></td>
              <td><Switch checked={p.is_active} onCheckedChange={(v) => { save(p.id, { is_active: v }); load(); }} /></td>
              <td className="text-xs text-muted-foreground">{p.currency}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
