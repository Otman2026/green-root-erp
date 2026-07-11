import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Building, ArrowUp, ArrowDown, Check } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/banks")({ component: BanksPage });

interface Bank { id: string; name: string; bank_name: string; account_number: string|null; rib: string|null; currency: string; balance: number; is_active: boolean; }

function BanksPage() {
  const { t } = useI18n();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selected, setSelected] = useState<Bank | null>(null);
  const [txs, setTxs] = useState<any[]>([]);
  const [openBank, setOpenBank] = useState(false);
  const [openTx, setOpenTx] = useState(false);
  const [newBank, setNewBank] = useState({ name: "", bank_name: "", account_number: "", rib: "", iban: "", currency: "MAD" });
  const [tx, setTx] = useState<any>({ tx_type: "deposit", direction: "in", amount: 0, tx_date: todayISO(), reference: "", description: "" });

  const loadBanks = async () => {
    const { data } = await (supabase as any).from("bank_accounts").select("*").order("name");
    setBanks((data ?? []) as Bank[]);
  };
  const loadTxs = async (id: string) => {
    const { data } = await (supabase as any).from("bank_transactions").select("*").eq("bank_id", id).order("tx_date", { ascending: false }).limit(100);
    setTxs(data ?? []);
  };
  useEffect(() => { loadBanks(); }, []);
  useEffect(() => { if (selected) loadTxs(selected.id); }, [selected?.id]);

  const saveBank = async () => {
    if (!newBank.name.trim() || !newBank.bank_name.trim()) return;
    const { error } = await (supabase as any).from("bank_accounts").insert(newBank);
    if (error) return toast.error(error.message);
    setOpenBank(false); setNewBank({ name: "", bank_name: "", account_number: "", rib: "", iban: "", currency: "MAD" }); loadBanks();
  };
  const saveTx = async () => {
    if (!selected || !tx.amount) return;
    const { error } = await (supabase as any).from("bank_transactions").insert({ ...tx, bank_id: selected.id, amount: Number(tx.amount) });
    if (error) return toast.error(error.message);
    toast.success("✓"); setOpenTx(false); setTx({ tx_type: "deposit", direction: "in", amount: 0, tx_date: todayISO(), reference: "", description: "" });
    loadBanks(); loadTxs(selected.id);
    const b = (await (supabase as any).from("bank_accounts").select("*").eq("id", selected.id).single()).data;
    if (b) setSelected(b);
  };
  const toggleReconcile = async (id: string, cur: boolean) => {
    await (supabase as any).from("bank_transactions").update({ reconciled: !cur, reconciled_at: !cur ? new Date().toISOString() : null }).eq("id", id);
    if (selected) loadTxs(selected.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Building className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{t("acc.banks")}</h1>
        <div className="ms-auto"><Button onClick={() => setOpenBank(true)}><Plus className="me-1 h-4 w-4" />{t("acc.newBank")}</Button></div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {banks.map((b) => (
          <Card key={b.id} className={`cursor-pointer p-4 transition hover:shadow ${selected?.id === b.id ? "ring-2 ring-primary" : ""}`} onClick={() => setSelected(b)}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold">{b.name}</div>
                <div className="text-xs text-muted-foreground">{b.bank_name} • {b.currency}</div>
                {b.rib && <div className="text-[10px] font-mono">{b.rib}</div>}
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
            <div className="font-bold">{selected.name} — {t("acc.transactions")}</div>
            <Button size="sm" onClick={() => setOpenTx(true)}><Plus className="me-1 h-4 w-4" />{t("acc.newTx")}</Button>
          </div>
          <Table>
            <TableHeader><TableRow>
              <TableHead>{t("common.date")}</TableHead>
              <TableHead>{t("common.type")}</TableHead>
              <TableHead>{t("acc.reference")}</TableHead>
              <TableHead>{t("receipts.amount")}</TableHead>
              <TableHead>{t("acc.reconciled")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {txs.map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell>{fmtDate(m.tx_date)}</TableCell>
                  <TableCell>
                    {m.direction === "in"
                      ? <Badge className="bg-emerald-500"><ArrowDown className="me-1 h-3 w-3" />{m.tx_type}</Badge>
                      : <Badge className="bg-rose-500"><ArrowUp className="me-1 h-3 w-3" />{m.tx_type}</Badge>}
                  </TableCell>
                  <TableCell>{m.reference} — <span className="text-muted-foreground">{m.description}</span></TableCell>
                  <TableCell className="font-semibold">{fmtMoney(m.amount)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant={m.reconciled ? "default" : "outline"} onClick={() => toggleReconcile(m.id, m.reconciled)}>
                      <Check className="me-1 h-3 w-3" />{m.reconciled ? "✓" : "—"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={openBank} onOpenChange={setOpenBank}>
        <DialogContent><DialogHeader><DialogTitle>{t("acc.newBank")}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>{t("common.name")}</Label><Input value={newBank.name} onChange={(e) => setNewBank({ ...newBank, name: e.target.value })} /></div>
            <div><Label>{t("acc.bankName")}</Label><Input value={newBank.bank_name} onChange={(e) => setNewBank({ ...newBank, bank_name: e.target.value })} /></div>
            <div><Label>{t("acc.currency")}</Label><Input value={newBank.currency} onChange={(e) => setNewBank({ ...newBank, currency: e.target.value })} /></div>
            <div><Label>{t("acc.accountNumber")}</Label><Input value={newBank.account_number} onChange={(e) => setNewBank({ ...newBank, account_number: e.target.value })} /></div>
            <div><Label>RIB</Label><Input value={newBank.rib} onChange={(e) => setNewBank({ ...newBank, rib: e.target.value })} /></div>
            <div className="col-span-2"><Label>IBAN</Label><Input value={newBank.iban} onChange={(e) => setNewBank({ ...newBank, iban: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={saveBank}>{t("common.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openTx} onOpenChange={setOpenTx}>
        <DialogContent><DialogHeader><DialogTitle>{t("acc.newTx")}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("common.type")}</Label>
              <Select value={tx.tx_type} onValueChange={(v) => setTx({ ...tx, tx_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["deposit","withdrawal","transfer","fee","interest","other"].map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>{t("acc.direction")}</Label>
              <Select value={tx.direction} onValueChange={(v) => setTx({ ...tx, direction: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">{t("receipts.in")}</SelectItem>
                  <SelectItem value="out">{t("receipts.out")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>{t("receipts.amount")}</Label><Input type="number" step="0.01" value={tx.amount} onChange={(e) => setTx({ ...tx, amount: e.target.value })} /></div>
            <div><Label>{t("common.date")}</Label><Input type="date" value={tx.tx_date} onChange={(e) => setTx({ ...tx, tx_date: e.target.value })} /></div>
            <div className="col-span-2"><Label>{t("acc.reference")}</Label><Input value={tx.reference} onChange={(e) => setTx({ ...tx, reference: e.target.value })} /></div>
            <div className="col-span-2"><Label>{t("common.notes")}</Label><Textarea rows={2} value={tx.description} onChange={(e) => setTx({ ...tx, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={saveTx}>{t("common.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
