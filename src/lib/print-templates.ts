import { supabase } from "@/integrations/supabase/client";
import { fmtMoney, fmtDateTime } from "@/lib/format";

export type PrintDocType = "invoice" | "quote" | "receipt" | "delivery" | "return" | "purchase_order";

export interface PrintLine {
  name: string;
  qty: number;
  unit_price: number;
  discount?: number;
  tax?: number;
  total: number;
  sku?: string | null;
}

export interface PrintDocData {
  type: PrintDocType;
  docNo: string;
  date: string | Date;
  party?: { name?: string | null; phone?: string | null; address?: string | null; tax_id?: string | null } | null;
  lines: PrintLine[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  total: number;
  paid?: number;
  balance?: number;
  notes?: string | null;
  currency?: string;
}

let cachedSettings: any = null;
async function loadSettings() {
  if (cachedSettings) return cachedSettings;
  const { data } = await supabase.from("app_settings").select("*").eq("id", 1).maybeSingle();
  cachedSettings = data ?? {};
  return cachedSettings;
}

const TITLES: Record<PrintDocType, { ar: string; en: string }> = {
  invoice: { ar: "فاتورة", en: "INVOICE" },
  quote: { ar: "عرض سعر", en: "QUOTATION" },
  receipt: { ar: "إيصال قبض", en: "RECEIPT" },
  delivery: { ar: "إذن تسليم", en: "DELIVERY NOTE" },
  return: { ar: "مرتجع", en: "RETURN NOTE" },
  purchase_order: { ar: "أمر شراء", en: "PURCHASE ORDER" },
};

function qrDataUrl(text: string, size = 128): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
}

export async function printDocument(doc: PrintDocData) {
  const s = await loadSettings();
  const title = TITLES[doc.type];
  const cur = doc.currency ?? s?.currency_code ?? "MAD";

  const linesHtml = doc.lines.map((l, i) => `
    <tr>
      <td class="c">${i + 1}</td>
      <td>${escapeHtml(l.name)}${l.sku ? `<div class="muted">${escapeHtml(l.sku)}</div>` : ""}</td>
      <td class="r">${l.qty}</td>
      <td class="r">${fmtMoney(l.unit_price, cur)}</td>
      ${doc.lines.some((x) => x.discount) ? `<td class="r">${fmtMoney(l.discount ?? 0, cur)}</td>` : ""}
      ${doc.lines.some((x) => x.tax) ? `<td class="r">${fmtMoney(l.tax ?? 0, cur)}</td>` : ""}
      <td class="r"><b>${fmtMoney(l.total, cur)}</b></td>
    </tr>
  `).join("");

  const anyDisc = doc.lines.some((x) => x.discount);
  const anyTax = doc.lines.some((x) => x.tax);

  const qr = qrDataUrl(`${doc.type.toUpperCase()}|${doc.docNo}|${fmtMoney(doc.total, cur)}|${new Date(doc.date).toISOString()}`);

  const html = `
    <!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${title.ar} — ${escapeHtml(doc.docNo)}</title>
    <style>
      *{box-sizing:border-box}
      body{font-family:'Segoe UI',Tahoma,system-ui,sans-serif;padding:24px;color:#111;max-width:900px;margin:0 auto;background:#fff}
      .hdr{display:grid;grid-template-columns:1fr auto;gap:16px;border-bottom:3px double #16a34a;padding-bottom:12px;margin-bottom:16px}
      .brand h1{margin:0;color:#16a34a;font-size:22px}
      .brand .meta{font-size:12px;color:#555;line-height:1.6;margin-top:4px}
      .doc-title{text-align:end}
      .doc-title h2{margin:0;font-size:26px;color:#111;letter-spacing:2px}
      .doc-title .no{font-family:monospace;font-size:14px;background:#f3f4f6;padding:2px 8px;border-radius:4px;display:inline-block;margin-top:4px}
      .doc-title .date{font-size:12px;color:#666;margin-top:4px}
      .parties{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
      .box{border:1px solid #e5e7eb;border-radius:6px;padding:10px 12px;background:#fafafa}
      .box h4{margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#16a34a}
      .box .name{font-weight:700}
      .box .info{font-size:12px;color:#555;line-height:1.6}
      table{width:100%;border-collapse:collapse;margin-top:8px;font-size:13px}
      thead th{background:#16a34a;color:#fff;padding:8px;text-align:start;font-weight:600;font-size:12px}
      tbody td{border-bottom:1px solid #eee;padding:8px}
      tbody tr:nth-child(even){background:#fafafa}
      .r{text-align:end} .c{text-align:center;width:32px} .muted{color:#888;font-size:11px}
      .totals-wrap{display:grid;grid-template-columns:auto 260px;gap:16px;margin-top:16px;align-items:flex-start}
      .qr{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:10px;color:#666}
      .totals{border:1px solid #e5e7eb;border-radius:6px;overflow:hidden}
      .totals div{display:flex;justify-content:space-between;padding:6px 12px;font-size:13px}
      .totals div + div{border-top:1px solid #f0f0f0}
      .totals .grand{background:#16a34a;color:#fff;font-weight:700;font-size:16px}
      .totals .paid{color:#16a34a}
      .totals .bal{color:#dc2626;font-weight:600}
      .notes{margin-top:16px;padding:10px;background:#fef9c3;border-inline-start:4px solid #eab308;font-size:12px;border-radius:4px}
      .footer{margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb;display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;text-align:center;font-size:11px;color:#666}
      .sig{margin-top:40px;border-top:1px solid #999;padding-top:4px}
      @media print { body{padding:12px} .no-print{display:none} @page{size:A4;margin:12mm} }
    </style></head><body>
      <div class="hdr">
        <div class="brand">
          ${s?.logo_url ? `<img src="${escapeAttr(s.logo_url)}" style="max-height:56px;margin-bottom:4px" alt=""/>` : ""}
          <h1>${escapeHtml(s?.company_name ?? "Haytam AGRI")}</h1>
          <div class="meta">
            ${s?.company_address ? `<div>${escapeHtml(s.company_address)}</div>` : ""}
            ${s?.company_phone ? `<div>☎ ${escapeHtml(s.company_phone)}</div>` : ""}
            ${s?.company_email ? `<div>✉ ${escapeHtml(s.company_email)}</div>` : ""}
            ${s?.company_tax_id ? `<div>ICE/TAX: <b>${escapeHtml(s.company_tax_id)}</b></div>` : ""}
          </div>
        </div>
        <div class="doc-title">
          <h2>${title.ar}</h2>
          <div style="font-size:11px;color:#666">${title.en}</div>
          <div class="no">${escapeHtml(doc.docNo)}</div>
          <div class="date">${fmtDateTime(doc.date)}</div>
        </div>
      </div>

      ${doc.party ? `
      <div class="parties">
        <div class="box">
          <h4>${doc.type === "purchase_order" ? "المورد / Supplier" : "العميل / Customer"}</h4>
          <div class="name">${escapeHtml(doc.party.name ?? "—")}</div>
          <div class="info">
            ${doc.party.phone ? `<div>☎ ${escapeHtml(doc.party.phone)}</div>` : ""}
            ${doc.party.address ? `<div>${escapeHtml(doc.party.address)}</div>` : ""}
            ${doc.party.tax_id ? `<div>ICE: ${escapeHtml(doc.party.tax_id)}</div>` : ""}
          </div>
        </div>
        <div class="box">
          <h4>ملخص / Summary</h4>
          <div class="info">
            <div>عدد البنود: <b>${doc.lines.length}</b></div>
            <div>الإجمالي: <b>${fmtMoney(doc.total, cur)}</b></div>
            ${doc.balance !== undefined ? `<div>المتبقي: <b style="color:${Number(doc.balance) > 0 ? "#dc2626" : "#16a34a"}">${fmtMoney(doc.balance, cur)}</b></div>` : ""}
          </div>
        </div>
      </div>` : ""}

      <table>
        <thead><tr>
          <th class="c">#</th>
          <th>الصنف / Item</th>
          <th class="r">الكمية</th>
          <th class="r">السعر</th>
          ${anyDisc ? `<th class="r">خصم</th>` : ""}
          ${anyTax ? `<th class="r">ضريبة</th>` : ""}
          <th class="r">الإجمالي</th>
        </tr></thead>
        <tbody>${linesHtml || `<tr><td colspan="7" class="c muted">لا توجد بنود</td></tr>`}</tbody>
      </table>

      <div class="totals-wrap">
        <div class="qr"><img src="${qr}" width="100" height="100" alt="QR"/><span>${escapeHtml(doc.docNo)}</span></div>
        <div class="totals">
          ${doc.subtotal !== undefined ? `<div><span>المجموع الفرعي</span><span>${fmtMoney(doc.subtotal, cur)}</span></div>` : ""}
          ${doc.discount ? `<div><span>خصم</span><span>- ${fmtMoney(doc.discount, cur)}</span></div>` : ""}
          ${doc.tax ? `<div><span>ضريبة</span><span>${fmtMoney(doc.tax, cur)}</span></div>` : ""}
          <div class="grand"><span>الإجمالي</span><span>${fmtMoney(doc.total, cur)}</span></div>
          ${doc.paid !== undefined ? `<div class="paid"><span>المدفوع</span><span>${fmtMoney(doc.paid, cur)}</span></div>` : ""}
          ${doc.balance !== undefined && Number(doc.balance) !== 0 ? `<div class="bal"><span>المتبقي</span><span>${fmtMoney(doc.balance, cur)}</span></div>` : ""}
        </div>
      </div>

      ${doc.notes ? `<div class="notes"><b>ملاحظات:</b> ${escapeHtml(doc.notes)}</div>` : ""}

      <div class="footer">
        <div><div class="sig">التوقيع</div></div>
        <div>${s?.print_footer ?? "شكراً لتعاملكم معنا"}</div>
        <div><div class="sig">الختم</div></div>
      </div>

      <script>window.onload=()=>setTimeout(()=>window.print(),300);<\/script>
    </body></html>`;

  const w = window.open("", "_blank", "width=1000,height=800");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
function escapeAttr(s: string): string { return escapeHtml(s); }
