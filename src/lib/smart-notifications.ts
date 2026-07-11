// Smart notifications scanner — generates alerts for low stock, expiring batches,
// overdue invoices, and due checks. Dedupes per-user per-day via localStorage.
import { supabase } from "@/integrations/supabase/client";

type NotifRow = {
  user_id: string;
  title: string;
  body: string | null;
  type: string;
  link: string | null;
};

const todayKey = () => new Date().toISOString().slice(0, 10);
const storageKey = (userId: string) => `smart-notif:${userId}:${todayKey()}`;

function alreadyRan(userId: string) {
  try { return localStorage.getItem(storageKey(userId)) === "1"; } catch { return false; }
}
function markRan(userId: string) {
  try { localStorage.setItem(storageKey(userId), "1"); } catch { /* ignore */ }
}

export async function scanAndNotify(userId: string): Promise<number> {
  if (!userId || alreadyRan(userId)) return 0;
  markRan(userId);

  const rows: NotifRow[] = [];
  const in7 = new Date(); in7.setDate(in7.getDate() + 7);
  const today = new Date().toISOString().slice(0, 10);
  const in7Str = in7.toISOString().slice(0, 10);

  // 1) Low stock
  const { data: prods } = await supabase
    .from("products")
    .select("id,name,stock_quantity,min_stock_alert")
    .eq("status", "active");
  const low = (prods ?? []).filter(
    (p: any) => Number(p.stock_quantity ?? 0) <= Number(p.min_stock_alert ?? 0) && Number(p.min_stock_alert ?? 0) > 0,
  );
  if (low.length > 0) {
    rows.push({
      user_id: userId,
      title: `مخزون منخفض: ${low.length} منتج`,
      body: low.slice(0, 5).map((p: any) => `• ${p.name} (${p.stock_quantity})`).join("\n"),
      type: "warning",
      link: "/inventory",
    });
  }

  // 2) Overdue unpaid sales invoices
  const { data: overdue } = await supabase
    .from("sales")
    .select("id,invoice_no,total,due_date,status")
    .lt("due_date", today)
    .neq("status", "paid")
    .limit(50);
  if ((overdue ?? []).length > 0) {
    rows.push({
      user_id: userId,
      title: `فواتير متأخرة: ${overdue!.length}`,
      body: overdue!.slice(0, 5).map((s: any) => `• ${s.invoice_no}`).join("\n"),
      type: "error",
      link: "/sales",
    });
  }

  // 3) Checks due within 7 days
  const { data: checks } = await supabase
    .from("checks")
    .select("id,check_no,amount,due_date,status")
    .gte("due_date", today)
    .lte("due_date", in7Str)
    .eq("status", "pending")
    .limit(50);
  if ((checks ?? []).length > 0) {
    rows.push({
      user_id: userId,
      title: `شيكات مستحقة قريباً: ${checks!.length}`,
      body: checks!.slice(0, 5).map((c: any) => `• ${c.check_no} — ${c.due_date}`).join("\n"),
      type: "info",
      link: "/checks",
    });
  }

  if (rows.length === 0) return 0;
  const { error } = await supabase.from("notifications").insert(rows);
  if (error) { console.warn("smart notify insert failed", error.message); return 0; }
  return rows.length;
}
