import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { Barcode as BarcodeIcon, Printer, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/barcodes")({ component: BarcodesPage });

type Row = { id: string; name: string; code: string; price: number; qty: number };

function BarcodesPage() {
  const { t } = useI18n();
  const [products, setProducts] = useState<any[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [size, setSize] = useState<"sm" | "md" | "lg">("md");
  const [showName, setShowName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => { (async () => {
    const { data } = await supabase.from("products").select("id,name,sku,barcode,price").order("name").limit(500);
    setProducts(data ?? []);
  })(); }, []);

  const addProduct = (pid: string) => {
    const p = products.find((x) => x.id === pid); if (!p) return;
    const code = p.barcode || p.sku || p.id.slice(0, 12);
    setRows((r) => [...r, { id: p.id, name: p.name, code, price: Number(p.price ?? 0), qty: 1 }]);
  };
  const setQty = (i: number, q: number) => setRows((r) => r.map((x, idx) => idx === i ? { ...x, qty: Math.max(1, q) } : x));
  const setCode = (i: number, c: string) => setRows((r) => r.map((x, idx) => idx === i ? { ...x, code: c } : x));
  const del = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));

  const labels = rows.flatMap((r) => Array.from({ length: r.qty }, () => r));

  useEffect(() => {
    if (!printRef.current) return;
    printRef.current.querySelectorAll<SVGSVGElement>("svg.barcode").forEach((svg) => {
      const code = svg.dataset.code || "";
      try { JsBarcode(svg, code, { format: "CODE128", height: size === "sm" ? 30 : size === "md" ? 50 : 70, width: 1.4, fontSize: 12, margin: 4, displayValue: true }); } catch {}
    });
  }, [labels, size]);

  const doPrint = () => {
    const html = printRef.current?.innerHTML ?? "";
    const w = window.open("", "_blank"); if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Labels</title><style>
      body{font-family:sans-serif;margin:0;padding:8mm;}
      .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(${size==="sm"?"38mm":size==="md"?"55mm":"75mm"},1fr));gap:2mm;}
      .lbl{border:1px dashed #ccc;padding:2mm;text-align:center;break-inside:avoid;}
      .lbl .n{font-size:10pt;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .lbl .p{font-size:11pt;font-weight:700;}
      @media print{.lbl{border:none;}}
    </style></head><body><div class="grid">${html}</div></body></html>`);
    w.document.close(); setTimeout(() => { w.focus(); w.print(); }, 300);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      <div className="flex items-center gap-2"><BarcodeIcon className="h-5 w-5" /><h1 className="text-2xl font-bold">{t("bar.title")}</h1></div>

      <Card className="p-4 grid gap-3 md:grid-cols-4">
        <div className="md:col-span-2"><Label>{t("bar.addProduct")}</Label>
          <Select onValueChange={addProduct}>
            <SelectTrigger><SelectValue placeholder={t("bar.selectProduct")} /></SelectTrigger>
            <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} — {p.barcode || p.sku || "—"}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>{t("bar.size")}</Label>
          <Select value={size} onValueChange={(v) => setSize(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="sm">{t("bar.small")}</SelectItem><SelectItem value="md">{t("bar.medium")}</SelectItem><SelectItem value="lg">{t("bar.large")}</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="flex flex-col justify-end gap-2">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showName} onChange={(e) => setShowName(e.target.checked)} />{t("bar.showName")}</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} />{t("bar.showPrice")}</label>
        </div>
      </Card>

      {rows.length > 0 && <Card className="p-4 space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1 truncate text-sm">{r.name}</div>
            <Input value={r.code} onChange={(e) => setCode(i, e.target.value)} className="w-40 font-mono text-xs" />
            <Input type="number" min={1} value={r.qty} onChange={(e) => setQty(i, Number(e.target.value) || 1)} className="w-20" />
            <Button size="icon" variant="ghost" onClick={() => del(i)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <div className="flex justify-end pt-2"><Button onClick={doPrint}><Printer className="h-4 w-4" /> {t("bar.print")} ({labels.length})</Button></div>
      </Card>}

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">{t("bar.preview")}</h3>
        <div ref={printRef} className="grid gap-2" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${size==="sm"?"140px":size==="md"?"200px":"280px"}, 1fr))` }}>
          {labels.map((r, i) => (
            <div key={i} className="lbl border border-dashed p-2 text-center">
              {showName && <div className="n truncate text-xs font-semibold">{r.name}</div>}
              <svg className="barcode mx-auto" data-code={r.code}></svg>
              {showPrice && <div className="p text-sm font-bold">{fmtMoney(r.price)}</div>}
            </div>
          ))}
          {labels.length === 0 && <div className="col-span-full text-sm text-muted-foreground">{t("bar.empty")}</div>}
        </div>
      </Card>
    </div>
  );
}
