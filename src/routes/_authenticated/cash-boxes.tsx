import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, PiggyBank, ArrowUp, ArrowDown, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { fmtMoney, fmtDate, todayISO } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/cash-boxes")({ component: CashBoxesPage });

interface Box { id: string; name: string; code: string|null; currency: string; balance: number; is_active: boolean; }

function CashBoxesPage() {
  const { t } = useI18n();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [selected, setSelected] = useState<Box | null>(null);
  const [movs, setMovs] = useState<any[]>([]);
  const [openBox, setOpenBox] = useState(false);
  const [openMov, setOpenMov] = useState(false);
  const [newBox, setNewBox] = useState({ name: "", code: "", currency: "MAD" });
  const [mov, setMov] = useState<any>({ direction: "in", amount: 0, tx_date: todayISO(), reason: "", counter_box_id: "" });

  const loadBoxes = async () => {
    const { data } = await (supabase as any).from("cash_boxes").select("*").order("name");
    setBoxes((data ?? []) as Box[]);
  };
  const loadMovs = async (boxId: string) => {
    const { data } = await (supabase as any).from("cash_movements").select("*").eq("box_id", boxId).order("tx_date", { ascending: false }).limit(100);
    setMovs(data ?? []);
  };
  useEffect(() => { loadBoxes(); }, []);
  useEffect(() => { if (selected) loadMovs(selected.id); }, [selected?.id]);

  const saveBox = async () => {
    if (!newBox.name.trim()) return;
    const { error } = await (supabase as any).from("cash_boxes").insert({ name: newBox.name, code: newBox.code || null, currency: newBox.currency });
    if (error) return toast.error(error.message);
    setOpenBox(false); setNewBox({ name: "", code: "", currency: "MAD" }); loadBoxes();
  };
  const saveMov = async () => {
    if (!selected || !mov.amount) return;
    const payload: any = { box_id: selected.id, direction: mov.direction, amount: Number(mov.amount), tx_date: mov.tx_date, reason: mov.reason || null };
    if (mov.direction === "transfer" && mov.counter_box_id) { payload.direction = "out"; payload.counter_box_id = mov.counter_box_id; }
    const { error } = await (supabase as any).from("cash_movements").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("✓"); setOpenMov(false); setMov({ direction: "in", amount: 0, tx_date: todayISO(), reason: "", counter_box_id: "" });
    loadBoxes(); loadMovs(selected.id);
    // refresh selected balance
    const b = (await (supabase as any).from("cash_boxes").select("*").eq("id", selected.id).single()).data;
    if (b) setSelected(b);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <PiggyBank className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{t("acc.cashBoxes")}</h1>
        <div className="ms-auto"><Button onClick={() => setOpenBox(true)}><Plus className="me-1 h-4 w-4" />{t("acc.newBox")}</Button></div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {boxes.map((b) => (
          <Card key={b.id} className={`cursor-pointer p-4 transition hover:shadow ${selected?.id === b.id ? "ring-2 ring-primary" : ""}`} onClick={() => setSelected(b)}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold">{b.name}</div>
                <div className="text-xs text-muted-foreground">{b.code} • {b.currency}</div>
              </div>
              <Badge variant={b.is_active ? "default" : "outline"}>{b.is_active ? t("common.active") : t("common.inactive")}</Badge>
            </div>
            <div className="mt-3 text-2xl font-bold">{fmtMoney(b.balance)}</div>
          </Card>
        ))}
      </div>

      {selected && (
        <Card>
          <div className="flex items-center justify-between border-b p-3">
            <div className="font-bold">{selected.name} — {t("acc.movements")}</div>
            <Button size="sm" onClick={() => setOpenMov(true)}><Plus className="me-1 h-4 w-4" />{t("acc.newMovement")}</Button>
          </div>
          <Table>
            <TableHeader><TableRow>
              <TableHead>{t("common.date")}</TableHead>
              <TableHead>{t("common.type")}</TableHead>
              <TableHead>{t("common.reason")}</TableHead>
              <TableHead>{t("receipts.amount")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {movs.map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell>{fmtDate(m.tx_date)}</TableCell>
                  <TableCell>{m.direction === "in" ? <Badge className="bg-emerald-500"><ArrowDown className="me-1 h-3 w-3" />{t("receipts.in")}</Badge> : <Badge className="bg-rose-500"><ArrowUp className="me-1 h-3 w-3" />{t("receipts.out")}</Badge>}</TableCell>
                  <TableCell>{m.reason}</TableCell>
                  <TableCell className="font-semibold">{fmtMoney(m.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={openBox} onOpenChange={setOpenBox}>
        <DialogContent><DialogHeader><DialogTitle>{t("acc.newBox")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{t("common.name")}</Label><Input value={newBox.name} onChange={(e) => setNewBox({ ...newBox, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t("common.code")}</Label><Input value={newBox.code} onChange={(e) => setNewBox({ ...newBox, code: e.target.value })} /></div>
              <div><Label>{t("acc.currency")}</Label><Input value={newBox.currency} onChange={(e) => setNewBox({ ...newBox, currency: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={saveBox}>{t("common.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openMov} onOpenChange={setOpenMov}>
        <DialogContent><DialogHeader><DialogTitle>{t("acc.newMovement")}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("common.type")}</Label>
              <Select value={mov.direction} onValueChange={(v) => setMov({ ...mov, direction: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">{t("receipts.in")}</SelectItem>
                  <SelectItem value="out">{t("receipts.out")}</SelectItem>
                  <SelectItem value="transfer">{t("acc.transfer")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>{t("common.date")}</Label><Input type="date" value={mov.tx_date} onChange={(e) => setMov({ ...mov, tx_date: e.target.value })} /></div>
            <div><Label>{t("receipts.amount")}</Label><Input type="number" step="0.01" value={mov.amount} onChange={(e) => setMov({ ...mov, amount: e.target.value })} /></div>
            {mov.direction === "transfer" && (
              <div><Label>{t("acc.toBox")}</Label>
                <Select value={mov.counter_box_id} onValueChange={(v) => setMov({ ...mov, counter_box_id: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{boxes.filter(b => b.id !== selected?.id).map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="col-span-2"><Label>{t("common.reason")}</Label><Textarea rows={2} value={mov.reason} onChange={(e) => setMov({ ...mov, reason: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={saveMov}>{t("common.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
