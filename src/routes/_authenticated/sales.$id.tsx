import { Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from "@/ds";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Printer, Ban, Undo2, MessageCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { fmtMoney, fmtDateTime, whatsappLink } from "@/lib/format";
import { printDocument } from "@/lib/print-templates";
import { PageHeader } from "@/components/shared/page-header";

export const Route = createFileRoute("/_authenticated/sales/$id")({
  component: SaleDetailPage,
  errorComponent: ({ error }) => (
    <div className="p-6 text-center">
      <p className="text-destructive">{error.message}</p>
      <Button asChild variant="outline" className="mt-4"><Link to="/sales">Back</Link></Button>
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-6 text-center">
      <p className="text-muted-foreground">Sale not found</p>
      <Button asChild variant="outline" className="mt-4"><Link to="/sales">Back</Link></Button>
    </div>
  ),
});

interface Sale {
  id: string; invoice_no: string; type: string; status: string;
  customer_id: string | null; subtotal: number; discount: number; tax: number;
  total: number; paid: number; balance: number;
  payment_method: string | null; notes: string | null;
  created_at: string;
}
interface SaleItem { id: string; qty: number; unit_price: number; discount: number; tax: number; total: number; products: { name: string; sku: string | null } | null }
interface Payment { id: string; method: string; amount: number; reference: string | null; paid_at: string }
interface Customer { id: string; name: string; phone: string | null; address: string | null }

function SaleDetailPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { t } = useI18n();
  const [sale, setSale] = useState<Sale | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: s, error } = await supabase.from("sales").select("*").eq("id", id).maybeSingle();
    if (error) { toast.error(error.message); setLoading(false); return; }
    if (!s) { setSale(null); setLoading(false); return; }
    setSale(s as any);
    const [i, p, c] = await Promise.all([
      supabase.from("sale_items").select("*, products(name,sku)").eq("sale_id", id),
      supabase.from("sale_payments").select("*").eq("sale_id", id).order("paid_at"),
      s.customer_id ? supabase.from("customers").select("id,name,phone,address").eq("id", s.customer_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    setItems((i.data ?? []) as any);
    setPayments((p.data ?? []) as any);
    setCustomer((c.data ?? null) as any);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const doPrint = async () => {
    if (!sale) return;
    await printDocument({
      type: sale.type === "return" ? "return" : sale.type === "quote" ? "quote" : "invoice",
      docNo: sale.invoice_no, date: sale.created_at,
      party: customer ?? { name: t("pos.walkIn") },
      lines: items.map((l) => ({
        name: l.products?.name ?? "—", sku: l.products?.sku ?? null,
        qty: Number(l.qty), unit_price: Number(l.unit_price),
        discount: Number(l.discount ?? 0), tax: Number(l.tax ?? 0), total: Number(l.total),
      })),
      subtotal: Number(sale.subtotal), total: Number(sale.total),
      paid: Number(sale.paid), balance: Number(sale.balance),
      notes: sale.notes,
    });
  };

  const doWhatsapp = () => {
    if (!customer?.phone) return toast.error(t("common.empty"));
    const msg = `${sale?.invoice_no}\n${t("common.total")}: ${fmtMoney(sale?.total ?? 0)}\n${t("common.balance")}: ${fmtMoney(sale?.balance ?? 0)}`;
    window.open(whatsappLink(customer.phone, msg), "_blank");
  };

  const doVoid = async () => {
    if (!sale || sale.status === "void") return;
    if (!confirm(t("common.confirmDelete"))) return;
    const { error } = await supabase.rpc("void_sale", { _sale_id: sale.id });
    if (error) return toast.error(error.message);
    toast.success(t("auth.success"));
    load();
  };

  const doReturn = async () => {
    if (!sale) return;
    if (sale.type === "return") return toast.error(t("common.empty"));
    if (!confirm(t("sales.confirmReturn"))) return;
    const { data: ret, error } = await supabase.from("sales").insert({
      type: "return", status: "confirmed", customer_id: sale.customer_id,
      parent_sale_id: sale.id, subtotal: sale.total, total: sale.total,
    } as any).select().single();
    if (error || !ret) return toast.error(error?.message ?? "Failed");
    if (items.length) {
      await supabase.from("sale_items").insert(items.map((it) => ({
        sale_id: ret.id, product_id: (it as any).product_id,
        qty: it.qty, unit_price: it.unit_price, discount: 0, tax: 0, total: it.total,
      })));
    }
    toast.success(t("auth.success"));
    router.navigate({ to: "/sales/$id", params: { id: ret.id } });
  };

  if (loading) return <div className="p-6 text-center text-muted-foreground">{t("common.loading") || "…"}</div>;
  if (!sale) return <div className="p-6 text-center text-muted-foreground">{t("common.empty")}</div>;

  const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "outline", confirmed: "secondary", paid: "default", partial: "outline", void: "destructive",
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <PageHeader
        icon={FileText}
        title={sale.invoice_no}
        subtitle={`${t(`sales.type.${sale.type}`)} — ${fmtDateTime(sale.created_at)}`}
        colorVar="primary"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/sales"><ArrowLeft className="me-1 h-4 w-4" /> {t("common.back") || "Back"}</Link></Button>
            <Button size="sm" variant="outline" onClick={doPrint}><Printer className="me-1 h-4 w-4" /> {t("common.print") || "Print"}</Button>
            {customer?.phone && <Button size="sm" variant="outline" onClick={doWhatsapp}><MessageCircle className="me-1 h-4 w-4" /> WhatsApp</Button>}
            {sale.status !== "void" && sale.type !== "return" && <Button size="sm" variant="outline" onClick={doReturn}><Undo2 className="me-1 h-4 w-4" /> {t("sales.return")}</Button>}
            {sale.status !== "void" && <Button size="sm" variant="destructive" onClick={doVoid}><Ban className="me-1 h-4 w-4" /> {t("sales.status.void")}</Button>}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="space-y-2 p-4">
          <div className="text-xs uppercase text-muted-foreground">{t("common.status")}</div>
          <Badge variant={statusColor[sale.status] ?? "outline"}>{t(`sales.status.${sale.status}`)}</Badge>
          {sale.payment_method && <div className="text-sm text-muted-foreground">{t(`pos.method.${sale.payment_method}`)}</div>}
        </Card>
        <Card className="space-y-1 p-4">
          <div className="text-xs uppercase text-muted-foreground">{t("common.customer")}</div>
          <div className="font-medium">{customer?.name ?? t("pos.walkIn")}</div>
          {customer?.phone && <div className="text-sm text-muted-foreground">{customer.phone}</div>}
          {customer?.address && <div className="text-xs text-muted-foreground">{customer.address}</div>}
        </Card>
        <Card className="space-y-1 p-4">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("pos.subtotal")}</span><span className="font-mono">{fmtMoney(sale.subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("pos.discount")}</span><span className="font-mono">-{fmtMoney(sale.discount)}</span></div>
          <div className="flex justify-between border-t pt-1 text-base font-bold"><span>{t("common.total")}</span><span className="font-mono">{fmtMoney(sale.total)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("pos.paid") || "Paid"}</span><span className="font-mono">{fmtMoney(sale.paid)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("common.balance")}</span><span className={Number(sale.balance) > 0 ? "font-mono text-destructive font-bold" : "font-mono"}>{fmtMoney(sale.balance)}</span></div>
        </Card>
      </div>

      <Card>
        <div className="border-b p-3 font-semibold">{t("common.items") || "Items"}</div>
        <Table>
          <TableHeader><TableRow>
            <TableHead>{t("common.product") || "Product"}</TableHead>
            <TableHead>{t("common.quantity")}</TableHead>
            <TableHead>{t("common.price")}</TableHead>
            <TableHead>{t("pos.discount")}</TableHead>
            <TableHead>{t("common.total")}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {items.map((i) => (
              <TableRow key={i.id}>
                <TableCell>
                  <div>{i.products?.name ?? "—"}</div>
                  {i.products?.sku && <div className="text-xs text-muted-foreground">{i.products.sku}</div>}
                </TableCell>
                <TableCell className="font-mono">{i.qty}</TableCell>
                <TableCell className="font-mono">{fmtMoney(i.unit_price)}</TableCell>
                <TableCell className="font-mono">{fmtMoney(i.discount)}</TableCell>
                <TableCell className="font-mono">{fmtMoney(i.total)}</TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      {payments.length > 0 && (
        <Card>
          <div className="border-b p-3 font-semibold">{t("customers.tabs.payments")}</div>
          <Table>
            <TableHeader><TableRow>
              <TableHead>{t("common.date")}</TableHead>
              <TableHead>{t("pos.method")}</TableHead>
              <TableHead>{t("receipts.amount")}</TableHead>
              <TableHead>Reference</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs">{fmtDateTime(p.paid_at)}</TableCell>
                  <TableCell>{t(`pos.method.${p.method}`)}</TableCell>
                  <TableCell className="font-mono">{fmtMoney(p.amount)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.reference ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {sale.notes && <Card className="p-4"><div className="mb-1 text-xs uppercase text-muted-foreground">{t("common.notes") || "Notes"}</div><p className="whitespace-pre-wrap text-sm">{sale.notes}</p></Card>}
    </div>
  );
}
