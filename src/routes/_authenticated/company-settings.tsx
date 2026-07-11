import { Card, Button, Input, Label, Textarea, Switch, Tabs, TabsContent, TabsList, TabsTrigger, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, Plus, Trash2, Save, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/company-settings")({ component: CompanySettingsPage });

function CompanySettingsPage() {
  const { t } = useI18n();
  const [s, setS] = useState<any>(null);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [newTax, setNewTax] = useState<any>({ name: "", rate: 0, is_default: false, is_active: true });

  const load = async () => {
    const [{ data: st }, { data: tx }] = await Promise.all([
      supabase.from("app_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.from("tax_rates").select("*").order("rate", { ascending: false }),
    ]);
    setS(st ?? { id: 1 });
    setTaxes(tx ?? []);
  };
  useEffect(() => { load(); }, []);

  const saveSettings = async () => {
    if (!s) return;
    setBusy(true);
    const payload = { ...s, id: 1 };
    const { error } = await supabase.from("app_settings").upsert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("common.done"));
  };

  const addTax = async () => {
    if (!newTax.name) return;
    const { error } = await supabase.from("tax_rates").insert({ ...newTax, rate: Number(newTax.rate) });
    if (error) return toast.error(error.message);
    if (newTax.is_default) await supabase.from("tax_rates").update({ is_default: false }).neq("name", newTax.name);
    setNewTax({ name: "", rate: 0, is_default: false, is_active: true });
    load();
  };

  const setDefault = async (id: string) => {
    await supabase.from("tax_rates").update({ is_default: false }).neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("tax_rates").update({ is_default: true }).eq("id", id);
    load();
  };

  const delTax = async (id: string) => {
    if (!confirm(t("common.confirmDelete"))) return;
    await supabase.from("tax_rates").delete().eq("id", id);
    load();
  };

  const printPreview = () => {
    const w = window.open("", "_blank"); if (!w) return;
    const sample = `
      <div style="font-family:sans-serif;padding:24px;max-width:800px;margin:0 auto">
        ${s?.logo_url ? `<img src="${s.logo_url}" style="max-height:60px;margin-bottom:8px"/>` : ""}
        <div style="display:flex;justify-content:space-between;border-bottom:2px solid #333;padding-bottom:8px">
          <div>
            <h2 style="margin:0">${s?.company_name ?? "Company"}</h2>
            <div style="font-size:12px;color:#555">${s?.company_address ?? ""}</div>
            <div style="font-size:12px;color:#555">${s?.company_phone ?? ""} · ${s?.company_email ?? ""}</div>
            ${s?.company_tax_id ? `<div style="font-size:12px">ICE/TAX: ${s.company_tax_id}</div>` : ""}
          </div>
          <div style="text-align:right">
            <h3 style="margin:0">FACTURE / فاتورة</h3>
            <div style="font-size:12px">${s?.invoice_prefix ?? "INV-"}0001</div>
            <div style="font-size:12px">${new Date().toLocaleDateString()}</div>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:13px">
          <thead><tr style="background:#f3f4f6"><th style="padding:6px;text-align:left">Article</th><th>Qty</th><th>Prix</th><th>Total</th></tr></thead>
          <tbody>
            <tr><td style="padding:6px;border-bottom:1px solid #eee">Produit exemple</td><td style="text-align:center">2</td><td style="text-align:right">100</td><td style="text-align:right">200</td></tr>
          </tbody>
        </table>
        <div style="text-align:right;margin-top:12px;font-size:13px">
          Sous-total: 200 ${s?.currency ?? ""}<br/>
          TVA (${s?.default_tax_rate ?? 20}%): ${(200 * (s?.default_tax_rate ?? 20) / 100).toFixed(2)} ${s?.currency ?? ""}<br/>
          <b>Total: ${(200 * (1 + (s?.default_tax_rate ?? 20) / 100)).toFixed(2)} ${s?.currency ?? ""}</b>
        </div>
        ${s?.invoice_terms ? `<div style="margin-top:16px;font-size:11px;color:#666;border-top:1px solid #eee;padding-top:8px">${s.invoice_terms}</div>` : ""}
        ${s?.invoice_footer ? `<div style="margin-top:8px;text-align:center;font-size:11px;color:#888">${s.invoice_footer}</div>` : ""}
      </div>
      <script>window.print()</script>`;
    w.document.write(sample);
    w.document.close();
  };

  if (!s) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4">
      <h1 className="flex items-center gap-2 text-2xl font-bold"><Building2 className="h-6 w-6" /> {t("cs.title")}</h1>

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">{t("cs.company")}</TabsTrigger>
          <TabsTrigger value="invoice">{t("cs.invoice")}</TabsTrigger>
          <TabsTrigger value="taxes">{t("cs.taxes")}</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-4">
          <Card className="p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>{t("cs.companyName")}</Label><Input value={s.company_name ?? ""} onChange={(e) => setS({ ...s, company_name: e.target.value })} /></div>
              <div><Label>{t("cs.taxId")}</Label><Input value={s.company_tax_id ?? ""} onChange={(e) => setS({ ...s, company_tax_id: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>{t("cs.address")}</Label><Textarea rows={2} value={s.company_address ?? ""} onChange={(e) => setS({ ...s, company_address: e.target.value })} /></div>
              <div><Label>{t("cs.phone")}</Label><Input value={s.company_phone ?? ""} onChange={(e) => setS({ ...s, company_phone: e.target.value })} /></div>
              <div><Label>{t("cs.email")}</Label><Input value={s.company_email ?? ""} onChange={(e) => setS({ ...s, company_email: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>{t("cs.logoUrl")}</Label><Input value={s.logo_url ?? ""} onChange={(e) => setS({ ...s, logo_url: e.target.value })} placeholder="https://…" /></div>
            </div>
            <div className="mt-4 flex justify-end"><Button onClick={saveSettings} disabled={busy}><Save className="h-4 w-4" /> {t("common.save")}</Button></div>
          </Card>
        </TabsContent>

        <TabsContent value="invoice" className="mt-4">
          <Card className="p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div><Label>{t("cs.currency")}</Label><Input value={s.currency ?? ""} onChange={(e) => setS({ ...s, currency: e.target.value })} /></div>
              <div><Label>{t("cs.symbol")}</Label><Input value={s.currency_symbol ?? ""} onChange={(e) => setS({ ...s, currency_symbol: e.target.value })} /></div>
              <div><Label>{t("cs.defaultTax")} (%)</Label><Input type="number" value={s.default_tax_rate ?? 0} onChange={(e) => setS({ ...s, default_tax_rate: Number(e.target.value) })} /></div>
              <div><Label>{t("cs.invoicePrefix")}</Label><Input value={s.invoice_prefix ?? ""} onChange={(e) => setS({ ...s, invoice_prefix: e.target.value })} /></div>
              <div>
                <Label>{t("cs.paper")}</Label>
                <Select value={s.print_paper ?? "A4"} onValueChange={(v) => setS({ ...s, print_paper: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="A4">A4</SelectItem><SelectItem value="A5">A5</SelectItem><SelectItem value="80mm">80mm (POS)</SelectItem><SelectItem value="58mm">58mm (POS)</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3"><Label>{t("cs.terms")}</Label><Textarea rows={3} value={s.invoice_terms ?? ""} onChange={(e) => setS({ ...s, invoice_terms: e.target.value })} /></div>
              <div className="md:col-span-3"><Label>{t("cs.footer")}</Label><Textarea rows={2} value={s.invoice_footer ?? ""} onChange={(e) => setS({ ...s, invoice_footer: e.target.value })} /></div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={printPreview}>{t("cs.preview")}</Button>
              <Button onClick={saveSettings} disabled={busy}><Save className="h-4 w-4" /> {t("common.save")}</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="taxes" className="mt-4">
          <Card className="p-5">
            <div className="mb-4 grid gap-2 md:grid-cols-5">
              <Input placeholder={t("cs.taxName")} value={newTax.name} onChange={(e) => setNewTax({ ...newTax, name: e.target.value })} />
              <Input type="number" placeholder="%" value={newTax.rate} onChange={(e) => setNewTax({ ...newTax, rate: e.target.value })} />
              <div className="flex items-center gap-2"><Switch checked={newTax.is_default} onCheckedChange={(v) => setNewTax({ ...newTax, is_default: v })} /><span className="text-sm">{t("cs.default")}</span></div>
              <div className="flex items-center gap-2"><Switch checked={newTax.is_active} onCheckedChange={(v) => setNewTax({ ...newTax, is_active: v })} /><span className="text-sm">{t("cs.active")}</span></div>
              <Button onClick={addTax}><Plus className="h-4 w-4" /> {t("cs.add")}</Button>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>{t("cs.taxName")}</TableHead><TableHead>%</TableHead><TableHead>{t("cs.status")}</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {taxes.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm">{tx.name}{tx.is_default && <Badge className="ms-2">{t("cs.default")}</Badge>}</TableCell>
                    <TableCell className="text-sm">{tx.rate}</TableCell>
                    <TableCell>{tx.is_active ? <Badge variant="outline">{t("cs.active")}</Badge> : <Badge variant="secondary">—</Badge>}</TableCell>
                    <TableCell className="flex gap-1">
                      {!tx.is_default && <Button size="icon" variant="ghost" onClick={() => setDefault(tx.id)}><Star className="h-4 w-4" /></Button>}
                      <Button size="icon" variant="ghost" onClick={() => delTax(tx.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {taxes.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground">—</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
