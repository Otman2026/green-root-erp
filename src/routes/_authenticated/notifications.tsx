import { Card, Button, Badge } from "@/ds";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Check, Trash2, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { fmtDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/notifications")({ component: NotificationsPage });

function NotificationsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200);
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, [user?.id]);

  const markRead = async (id: string) => { await supabase.from("notifications").update({ read: true }).eq("id", id); load(); };
  const markAll = async () => { if (!user) return; await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false); toast.success(t("common.done")); load(); };
  const del = async (id: string) => { if (!confirm(t("common.confirmDelete"))) return; await supabase.from("notifications").delete().eq("id", id); load(); };
  const clearAll = async () => { if (!user) return; if (!confirm(t("notif.confirmClear"))) return; await supabase.from("notifications").delete().eq("user_id", user.id); load(); };

  const shown = filter === "unread" ? items.filter((n) => !n.read) : items;
  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2"><Bell className="h-5 w-5" /><h1 className="text-2xl font-bold">{t("notif.title")}</h1>{unreadCount > 0 && <Badge>{unreadCount}</Badge>}</div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>{t("notif.all")}</Button>
          <Button size="sm" variant={filter === "unread" ? "default" : "outline"} onClick={() => setFilter("unread")}>{t("notif.unread")}</Button>
          <Button size="sm" variant="outline" onClick={markAll}><CheckCheck className="h-4 w-4" /> {t("notif.markAll")}</Button>
          <Button size="sm" variant="outline" onClick={clearAll}><Trash2 className="h-4 w-4" /> {t("notif.clearAll")}</Button>
        </div>
      </div>
      <div className="space-y-2">
        {shown.length === 0 && <Card className="p-8 text-center text-sm text-muted-foreground">{t("notif.empty")}</Card>}
        {shown.map((n) => (
          <Card key={n.id} className={`p-4 ${!n.read ? "border-primary/50 bg-primary/5" : ""}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="font-semibold">{n.title}</span><Badge variant="outline" className="text-xs">{n.type}</Badge>{!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}</div>
                {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{fmtDate(n.created_at)}</span>
                  {n.link && <Link to={n.link} className="text-primary hover:underline">{t("notif.open")}</Link>}
                </div>
              </div>
              <div className="flex gap-1">
                {!n.read && <Button size="icon" variant="ghost" onClick={() => markRead(n.id)}><Check className="h-4 w-4" /></Button>}
                <Button size="icon" variant="ghost" onClick={() => del(n.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
