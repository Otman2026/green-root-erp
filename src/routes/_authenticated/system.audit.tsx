import { Card } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/system/audit")({
  component: AuditPage,
});

function AuditPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => setRows(data ?? []));
  }, []);

  return (
    <Card className="p-4">
      <table className="w-full text-sm">
        <thead className="border-b text-right text-muted-foreground">
          <tr><th className="py-2">الوقت</th><th>الإجراء</th><th>الكيان</th><th>المستخدم</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="py-2 text-xs">{new Date(r.created_at).toLocaleString()}</td>
              <td className="font-mono text-xs">{r.action}</td>
              <td className="text-xs text-muted-foreground">{r.entity} {r.entity_id}</td>
              <td className="font-mono text-xs">{r.user_id?.slice(0, 8)}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">لا توجد سجلات بعد</td></tr>}
        </tbody>
      </table>
    </Card>
  );
}
