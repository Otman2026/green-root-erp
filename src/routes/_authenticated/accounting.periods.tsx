import { Card, Button, Input, Label, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarRange, Plus, Lock, Unlock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/accounting/periods")({
  component: PeriodsPage,
});

interface PeriodRow {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  closed: boolean;
  closed_at: string | null;
}

function PeriodsPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<PeriodRow[]>([]);
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("fiscal_periods")
      .select("*")
      .order("start_date", { ascending: false });
    setRows(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!name.trim() || !start || !end) return;
    const { error } = await supabase
      .from("fiscal_periods")
      .insert({ name: name.trim(), start_date: start, end_date: end, closed: false });
    if (error) return toast.error(error.message);
    setName("");
    setStart("");
    setEnd("");
    toast.success("✓");
    load();
  };

  const setClosed = async (id: string, closed: boolean) => {
    const patch: any = { closed };
    patch.closed_at = closed ? new Date().toISOString() : null;
    const { error } = await supabase.from("fiscal_periods").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("✓");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <CalendarRange className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{t("acc.periods")}</h1>
      </div>

      <Card className="grid grid-cols-1 gap-3 p-4 md:grid-cols-[1fr_160px_160px_auto]">
        <div>
          <Label>{t("acc.periodName")}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="2026" />
        </div>
        <div>
          <Label>{t("acc.startDate")}</Label>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <Label>{t("acc.endDate")}</Label>
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button onClick={add} className="w-full">
            <Plus className="me-1 h-4 w-4" /> {t("common.add")}
          </Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("acc.periodName")}</TableHead>
              <TableHead>{t("acc.startDate")}</TableHead>
              <TableHead>{t("acc.endDate")}</TableHead>
              <TableHead>{t("acc.status")}</TableHead>
              <TableHead className="text-end">—</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.start_date}</TableCell>
                <TableCell>{r.end_date}</TableCell>
                <TableCell>
                  {r.closed ? (
                    <Badge variant="destructive">{t("acc.closed")}</Badge>
                  ) : (
                    <Badge variant="secondary">{t("acc.open")}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-end">
                  {r.closed ? (
                    <Button variant="outline" size="sm" onClick={() => setClosed(r.id, false)}>
                      <Unlock className="me-1 h-4 w-4" /> {t("acc.reopen")}
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setClosed(r.id, true)}>
                      <Lock className="me-1 h-4 w-4" /> {t("acc.close")}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  {t("common.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
