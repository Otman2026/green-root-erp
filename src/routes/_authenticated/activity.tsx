import { Card, Button, Input, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { History, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/activity")({ component: ActivityPage });

function ActivityPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("activity_log").select("*, profiles:user_id(full_name,username)").order("created_at", { ascending: false }).limit(500);
    setRows(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const shown = rows.filter((r) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return [r.action, r.entity, r.entity_id, r.summary, r.profiles?.full_name, r.profiles?.username].some((v) => (v ?? "").toString().toLowerCase().includes(s));
  });

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2"><History className="h-5 w-5" /><h1 className="text-2xl font-bold">{t("act.title")}</h1></div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}><RefreshCw className={"h-4 w-4 " + (loading ? "animate-spin" : "")} /></Button>
      </div>
      <Card className="p-4">
        <Input placeholder={t("act.search")} value={q} onChange={(e) => setQ(e.target.value)} className="mb-3" />
        <div className="overflow-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>{t("act.when")}</TableHead>
              <TableHead>{t("act.user")}</TableHead>
              <TableHead>{t("act.action")}</TableHead>
              <TableHead>{t("act.entity")}</TableHead>
              <TableHead>{t("act.summary")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {shown.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-xs">{fmtDate(r.created_at)}</TableCell>
                  <TableCell className="text-sm">{r.profiles?.full_name || r.profiles?.username || "—"}</TableCell>
                  <TableCell><Badge variant="outline">{r.action}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.entity ? `${r.entity}${r.entity_id ? ` #${String(r.entity_id).slice(0,8)}` : ""}` : "—"}</TableCell>
                  <TableCell className="text-sm">{r.summary || "—"}</TableCell>
                </TableRow>
              ))}
              {shown.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground">{t("act.empty")}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
