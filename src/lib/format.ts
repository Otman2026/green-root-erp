export function fmtMoney(v: number | string | null | undefined, currency = "MAD"): string {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  if (!isFinite(n)) return "0.00";
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export function fmtDate(v: string | Date | null | undefined): string {
  if (!v) return "—";
  try { return new Date(v).toLocaleDateString(); } catch { return "—"; }
}

export function fmtDateTime(v: string | Date | null | undefined): string {
  if (!v) return "—";
  try { return new Date(v).toLocaleString(); } catch { return "—"; }
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
}

export function downloadFile(filename: string, content: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob(["\ufeff" + content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function whatsappLink(phone: string, text: string): string {
  const p = phone.replace(/\D/g, "");
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
}

export function printHtml(html: string) {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Print</title>
    <style>
      body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;padding:24px;color:#111}
      h1,h2,h3{margin:0 0 8px} table{width:100%;border-collapse:collapse;margin-top:12px}
      th,td{border:1px solid #ddd;padding:8px;text-align:start;font-size:13px}
      th{background:#f5f5f5} .r{text-align:end} .muted{color:#666}
      .head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;border-bottom:2px solid #111;padding-bottom:8px}
      .totals{margin-top:12px;width:280px;margin-inline-start:auto}
      .totals div{display:flex;justify-content:space-between;padding:4px 0}
      .totals .grand{border-top:2px solid #111;font-weight:700;font-size:16px;padding-top:8px;margin-top:4px}
      @media print { .no-print { display:none } }
    </style></head><body>${html}
    <script>window.onload=()=>{setTimeout(()=>{window.print();},200)}<\/script>
    </body></html>`);
  w.document.close();
}
