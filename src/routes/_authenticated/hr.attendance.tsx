import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarCheck, Save } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/hr/attendance")({ component: AttendancePage });

function AttendancePage() {
  const { t } = useI18n();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [employees, setEmployees] = useState<any[]>([]);
  const [records, setRecords] = useState<Record<string, any>>({});

  async function load() {
    const [{ data: e }, { data: a }] = await Promise.all([
      (supabase as any).from("hr_employees").select("id,full_name,code,base_salary").eq("status", "active").order("full_name"),
      (supabase as any).from("hr_attendance").select("*").eq("date", date),
    ]);
    setEmployees(e ?? []);
    const map: Record<string, any> = {};
    (a ?? []).forEach((r: any) => { map[r.employee_id] = r; });
    setRecords(map);
  }
  useEffect(() => { load(); }, [date]);

  function set(id: string, patch: any) {
    setRecords((old) => ({ ...old, [id]: { ...(old[id] ?? { employee_id: id, date, status: "present", overtime: 0 }), ...patch } }));
  }

  async function save() {
    const list = Object.values(records).map((r: any) => ({
      employee_id: r.employee_id, date,
      status: r.status ?? "present",
      check_in: r.check_in || null, check_out: r.check_out || null,
      hours: r.hours ? Number(r.hours) : null,
      overtime: Number(r.overtime || 0),
      notes: r.notes ?? null,
    }));
    const { error } = await (supabase as any).from("hr_attendance").upsert(list, { onConflict: "employee_id,date" });
    if (error) { toast.error(error.message); return; }
    toast.success(t("common.saved"));
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><CalendarCheck className="h-6 w-6" /><h1 className="text-2xl font-bold">{t("hr.attendance")}</h1></div>
        <div className="flex items-center gap-2">
          <Label>{t("common.date")}</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Button onClick={save}><Save className="h-4 w-4 me-1" />{t("common.save")}</Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("hr.emp.fullName")}</TableHead>
              <TableHead>{t("hr.att.status")}</TableHead>
              <TableHead>{t("hr.att.checkIn")}</TableHead>
              <TableHead>{t("hr.att.checkOut")}</TableHead>
              <TableHead>{t("hr.att.hours")}</TableHead>
              <TableHead>{t("hr.att.overtime")}</TableHead>
              <TableHead>{t("hr.att.notes")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((e) => {
              const r = records[e.id] ?? {};
              return (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.full_name}</TableCell>
                  <TableCell>
                    <Select value={r.status ?? "present"} onValueChange={(v) => set(e.id, { status: v })}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">{t("hr.att.present")}</SelectItem>
                        <SelectItem value="absent">{t("hr.att.absent")}</SelectItem>
                        <SelectItem value="leave">{t("hr.att.leave")}</SelectItem>
                        <SelectItem value="late">{t("hr.att.late")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Input type="time" value={r.check_in ? new Date(r.check_in).toISOString().slice(11,16) : ""} onChange={(ev) => set(e.id, { check_in: ev.target.value ? `${date}T${ev.target.value}:00Z` : null })} className="w-28" /></TableCell>
                  <TableCell><Input type="time" value={r.check_out ? new Date(r.check_out).toISOString().slice(11,16) : ""} onChange={(ev) => set(e.id, { check_out: ev.target.value ? `${date}T${ev.target.value}:00Z` : null })} className="w-28" /></TableCell>
                  <TableCell><Input type="number" step="0.25" value={r.hours ?? ""} onChange={(ev) => set(e.id, { hours: ev.target.value })} className="w-20" /></TableCell>
                  <TableCell><Input type="number" step="0.25" value={r.overtime ?? 0} onChange={(ev) => set(e.id, { overtime: ev.target.value })} className="w-20" /></TableCell>
                  <TableCell><Input value={r.notes ?? ""} onChange={(ev) => set(e.id, { notes: ev.target.value })} /></TableCell>
                </TableRow>
              );
            })}
            {employees.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{t("common.noData")}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
