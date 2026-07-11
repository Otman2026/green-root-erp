import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, Printer, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { fmtMoney, fmtDateTime, printHtml } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/quotes")({ component: QuotesPage });

function QuotesPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Record<string, string>>({});

  const load = async () => {
    const [s, c] = await Promise.all([
      supabase.from("sales").select("*").eq("type", "quote").order("created_at", { ascending: false }),
      supabase.from("customers").select("id,name"),
    ]);
    setRows((s.data ?? []) as any);
    const m: Record<string, string> = {}; (c.data ?? []).forEach((x: any) => m[x.id] = x.name); setCustomers(m);
  };
  useEffect(() => { load(); }, []);

  const convert = async (q: any) => {
    if (!confirm(t("quotes.convert") + "?")) return;
    const { data: items } = await supabase.from("sale_items").select("*").eq("sale_id", q.id);
    const { data: sale, error } = await supabase.from("sales").insert({
      type: "sale", status: "confirmed", customer_id: q.customer_id,
      subtotal: q.subtotal, discount: q.discount, tax: q.tax, total: q.total,
      parent_sale_id: q.id,
    } as any).select().single();
    if (error || !sale) return toast.error(error?.message ?? "Failed");
    if (items?.length) {
      await supabase.from("sale_items").insert(items.map((i: any) => ({
        sale_id: sale.id, product_id: i.product_id, qty: i.qty,
        unit_price: i.unit_price, discount: i.discount, tax: i.tax, total: i.total,
      })));
    }
    toast.success(sale.invoice_no); load();
  };

  const print = async (q: any) => {
    const { data: its } = await supabase.from("sale_items").select("*, products(name)").eq("sale_id", q.id);
    const rowsHtml = (its ?? []).map((l: any) => `<tr><td>${l.products?.name ?? "—"}</td><td class="r">${l.qty}</td><td class="r">${fmtMoney(l.unit_price)}</td><td class="r">${fmtMoney(l.total)}</td></tr>`).join("");
    printHtml(`<div class="head"><div><h2>Haytam AGRI</h2><div class="muted">Quote</div></div><div><b>${q.invoice_no}</b><div class="muted">${fmtDateTime(q.created_at)}</div></div></div>
      <div><b>Customer:</b> ${customers[q.customer_id ?? ""] ?? "—"}</div>
      <table><thead><tr><th>Product</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Total</th></tr></thead><tbody>${rowsHtml}</tbody></table>
      <div class="totals"><div class="grand"><span>Total</span><span>${fmtMoney(q.total)}</span></div></div>`);
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold"><FileText className="h-6 w-6 text-primary" /> {t("quotes.title")}</h1>
      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>{t("sales.invoiceNo")}</TableHead><TableHead>{t("common.date")}</TableHead><TableHead>{t("common.customer")}</TableHead><TableHead>{t("common.total")}</TableHead><TableHead className="text-end">{t("common.actions")}</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
            : rows.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-mono">{q.invoice_no}</TableCell>
                <TableCell className="text-xs">{fmtDateTime(q.created_at)}</TableCell>
                <TableCell>{customers[q.customer_id ?? ""] ?? "—"}</TableCell>
                <TableCell className="font-mono">{fmtMoney(q.total)}</TableCell>
                <TableCell className="text-end">
                  <Button size="sm" variant="ghost" onClick={() => print(q)}><Printer className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" className="ms-2 gap-1" onClick={() => convert(q)}><ArrowRightLeft className="h-4 w-4" /> {t("common.convert")}</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <p className="text-sm text-muted-foreground">{t("common.underDev")} — أنشئ عرض السعر من POS بتحويل النوع.</p>
    </div>
  );
}
