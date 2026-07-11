import { Card, CardContent, CardHeader, CardTitle } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2, KeyRound, Clock, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/system/")({
  component: SystemHome,
});

function SystemHome() {
  const [stats, setStats] = useState<{ orgs: number; activeLicenses: number; trials: number; expiringSoon: number }>({
    orgs: 0, activeLicenses: 0, trials: 0, expiringSoon: 0,
  });

  useEffect(() => {
    (async () => {
      const soon = new Date(Date.now() + 7 * 86400000).toISOString();
      const [{ count: orgs }, { count: active }, { count: trials }, { count: expiring }] = await Promise.all([
        supabase.from("organizations").select("*", { count: "exact", head: true }),
        supabase.from("licenses").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("licenses").select("*", { count: "exact", head: true }).eq("is_trial", true).eq("status", "active"),
        supabase.from("licenses").select("*", { count: "exact", head: true }).eq("status", "active").lt("expires_at", soon).gt("expires_at", new Date().toISOString()),
      ]);
      setStats({ orgs: orgs ?? 0, activeLicenses: active ?? 0, trials: trials ?? 0, expiringSoon: expiring ?? 0 });
    })();
  }, []);

  const cards = [
    { label: "المؤسسات", value: stats.orgs, icon: Building2, color: "text-blue-600" },
    { label: "تراخيص نشطة", value: stats.activeLicenses, icon: KeyRound, color: "text-green-600" },
    { label: "نسخ تجريبية", value: stats.trials, icon: Clock, color: "text-orange-600" },
    { label: "تنتهي خلال 7 أيام", value: stats.expiringSoon, icon: AlertTriangle, color: "text-red-600" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{c.label}</CardTitle>
            <c.icon className={`h-5 w-5 ${c.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{c.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
