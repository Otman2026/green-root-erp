import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, fr, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

interface Notif {
  id: string;
  title: string;
  body: string | null;
  type: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export function NotificationsBell() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const unread = items.filter((n) => !n.read).length;
  const dfLocale = locale === "ar" ? ar : locale === "fr" ? fr : enUS;

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    if (!error) setItems((data ?? []) as Notif[]);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const channel = supabase
      .channel(`notif:${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (p) => {
        setItems((prev) => [p.new as Notif, ...prev].slice(0, 30));
        const n = p.new as Notif;
        toast(n.title, { description: n.body ?? undefined });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (p) => {
        setItems((prev) => prev.map((x) => (x.id === (p.new as Notif).id ? (p.new as Notif) : x)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (p) => {
        setItems((prev) => prev.filter((x) => x.id !== (p.old as Notif).id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };
  const markAll = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  };
  const remove = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <Badge className="absolute -top-1 -end-1 h-5 min-w-5 rounded-full px-1 text-[10px]" variant="destructive">
              {unread > 99 ? "99+" : unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="text-sm font-semibold">🔔 {t("nav.notifications" as any) || "Notifications"}</div>
          {unread > 0 && (
            <Button size="sm" variant="ghost" onClick={markAll} className="h-7 text-xs">
              <CheckCheck className="me-1 h-3.5 w-3.5" /> {t("notifications.markAllRead" as any) || "Mark all"}
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {items.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">{t("common.empty")}</div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li key={n.id} className={`px-3 py-2 text-sm ${!n.read ? "bg-muted/40" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{n.title}</div>
                      {n.body && <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</div>}
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: dfLocale })}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      {!n.read && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => markRead(n.id)} aria-label="read">
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(n.id)} aria-label="delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
