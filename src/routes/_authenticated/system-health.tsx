import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useRoles } from "@/hooks/use-roles";
import { Database, Download, RefreshCw, ShieldCheck, Activity } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/system-health")({
  component: SystemHealth,
});

const TABLES = [
  "products", "customers", "suppliers", "warehouses", "branches",
  "sales", "purchase_orders", "cash_boxes", "bank_accounts", "checks",
  "user_roles", "notifications",
] as const;

function SystemHealth() {
  const { t } = useI18n();
  const { isAdmin } = useRoles();
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const run = async () => {
    setLoading(true);
    const entries = await Promise.all(
      TABLES.map(async (name) => {
        const { count, error } = await supabase.from(name as any).select("id", { count: "exact", head: true });
        return [name, error ? null : (count ?? 0)] as const;
      }),
    );
    setCounts(Object.fromEntries(entries));
    setCheckedAt(new Date());
    setLoading(false);
  };

  useEffect(() => { run(); }, []);

  const exportCsv = async (name: string) => {
    const { data, error } = await supabase.from(name as any).select("*").limit(10000);
    if (error) { toast.error(error.message); return; }
    const rows = data ?? [];
    if (!rows.length) { toast.message(t("sys.empty")); return; }
    const cols = Object.keys(rows[0]);
    const csv = [cols.join(","), ...rows.map((r: any) =>
      cols.map((c) => JSON.stringify(r[c] ?? "")).join(",")
    )].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${name}-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const totalRows = Object.values(counts).reduce((s, v) => s + (v ?? 0), 0);
  const failing = Object.entries(counts).filter(([, v]) => v === null).map(([k]) => k);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("sys.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("sys.subtitle")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={run} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> {t("sys.refresh")}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">{t("sys.tables")}</div>
            <Database className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-1 text-xl font-bold">{TABLES.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">{t("sys.totalRows")}</div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-1 text-xl font-bold">{totalRows.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">{t("sys.access")}</div>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-1 text-xl font-bold">
            {failing.length === 0 ? (
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">{t("sys.ok")}</Badge>
            ) : (
              <Badge variant="destructive">{failing.length} {t("sys.blocked")}</Badge>
            )}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">{t("sys.lastCheck")}</div>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-1 text-sm">{checkedAt ? checkedAt.toLocaleString() : "—"}</div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">{t("sys.tableStatus")}</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TABLES.map((name) => {
            const v = counts[name];
            const ok = v !== null && v !== undefined;
            return (
              <div key={name} className="flex items-center justify-between rounded-md border p-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{name}</div>
                  <div className="text-xs text-muted-foreground">
                    {ok ? `${v!.toLocaleString()} ${t("sys.rows")}` : t("sys.noAccess")}
                  </div>
                </div>
                {isAdmin && ok && (
                  <Button variant="ghost" size="icon" onClick={() => exportCsv(name)} title={t("sys.exportCsv")}>
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
