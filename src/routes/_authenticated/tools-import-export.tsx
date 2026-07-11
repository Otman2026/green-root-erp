import { Card, Button, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Upload, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tools-import-export")({ component: IEPage });

type Entity = "products" | "customers" | "suppliers";

const FIELDS: Record<Entity, string[]> = {
  products: ["name","sku","barcode","price","cost","stock_quantity","min_stock","unit","description"],
  customers: ["name","phone","email","address","balance","notes"],
  suppliers: ["name","phone","email","address","balance","notes"],
};

function toCSV(rows: any[], fields: string[]): string {
  const esc = (v: any) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
  return [fields.join(","), ...rows.map((r) => fields.map((f) => esc(r[f])).join(","))].join("\n");
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines: string[][] = []; let cur: string[] = []; let val = ""; let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) { if (c === '"' && text[i+1] === '"') { val += '"'; i++; } else if (c === '"') { inQ = false; } else { val += c; } }
    else { if (c === '"') inQ = true; else if (c === ",") { cur.push(val); val = ""; } else if (c === "\n") { cur.push(val); lines.push(cur); cur = []; val = ""; } else if (c !== "\r") val += c; }
  }
  if (val || cur.length) { cur.push(val); lines.push(cur); }
  const headers = lines.shift() ?? [];
  const rows = lines.filter((l) => l.some((c) => c.trim() !== "")).map((l) => Object.fromEntries(headers.map((h, i) => [h.trim(), (l[i] ?? "").trim()])));
  return { headers: headers.map((h) => h.trim()), rows };
}

function IEPage() {
  const { t } = useI18n();
  const [entity, setEntity] = useState<Entity>("products");
  const [importText, setImportText] = useState("");
  const [busy, setBusy] = useState(false);

  const doExport = async () => {
    setBusy(true);
    const { data, error } = await supabase.from(entity).select(FIELDS[entity].join(",")).limit(10000);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    const csv = toCSV(data ?? [], FIELDS[entity]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `${entity}-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${data?.length ?? 0} ${t("ie.exported")}`);
  };

  const doTemplate = () => {
    const csv = FIELDS[entity].join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `${entity}-template.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const onFile = (f: File) => { const r = new FileReader(); r.onload = () => setImportText(String(r.result ?? "")); r.readAsText(f); };

  const doImport = async () => {
    if (!importText.trim()) { toast.error(t("ie.pasteFirst")); return; }
    const { headers, rows } = parseCSV(importText);
    const allowed = FIELDS[entity];
    const bad = headers.filter((h) => !allowed.includes(h));
    if (bad.length) { toast.error(`${t("ie.unknownCols")}: ${bad.join(", ")}`); return; }
    const numeric = ["price","cost","stock_quantity","min_stock","balance"];
    const cleaned = rows.map((r) => {
      const o: any = {}; for (const k of headers) { let v: any = r[k]; if (v === "") v = null; else if (numeric.includes(k)) v = Number(v); o[k] = v; }
      return o;
    }).filter((o) => o.name);
    if (!cleaned.length) { toast.error(t("ie.noRows")); return; }
    setBusy(true);
    const { error } = await supabase.from(entity).insert(cleaned);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${cleaned.length} ${t("ie.imported")}`);
    setImportText("");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <div className="flex items-center gap-2"><FileText className="h-5 w-5" /><h1 className="text-2xl font-bold">{t("ie.title")}</h1></div>
      <Card className="p-4 space-y-4">
        <div><Label>{t("ie.entity")}</Label>
          <Select value={entity} onValueChange={(v) => setEntity(v as Entity)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="products">{t("nav.products")}</SelectItem>
              <SelectItem value="customers">{t("nav.customers")}</SelectItem>
              <SelectItem value="suppliers">{t("nav.suppliers")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground">{t("ie.fields")}: {FIELDS[entity].join(", ")}</div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={doExport} disabled={busy}><Download className="h-4 w-4" /> {t("ie.export")}</Button>
          <Button variant="outline" onClick={doTemplate}><FileText className="h-4 w-4" /> {t("ie.template")}</Button>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><Upload className="h-4 w-4" /> {t("ie.import")}</h2>
        <Input type="file" accept=".csv,text/csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        <Textarea rows={10} placeholder={t("ie.pastePlaceholder")} value={importText} onChange={(e) => setImportText(e.target.value)} className="font-mono text-xs" />
        <Button onClick={doImport} disabled={busy}><Upload className="h-4 w-4" /> {t("ie.import")}</Button>
      </Card>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm " + (props.className ?? "")} />;
}
