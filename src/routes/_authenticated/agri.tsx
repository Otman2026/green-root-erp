import { Card, Badge } from "@/ds";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Sprout, ShieldAlert, Bug, FlaskConical, Wheat, Beaker, Leaf, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/agri")({ component: AgriHub });

function AgriHub() {
  const { t } = useI18n();
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const tables = ["agri_plants", "agri_diseases", "agri_pests", "agri_weeds", "agri_fertilizers", "agri_pesticides", "agri_seeds", "agri_treatments"] as const;
      const results = await Promise.all(tables.map((tn) => supabase.from(tn).select("*", { count: "exact", head: true })));
      const c: Record<string, number> = {};
      tables.forEach((tn, i) => { c[tn] = results[i].count ?? 0; });
      setCounts(c);
    })();
  }, []);

  const cards: Array<{ to: string; icon: any; label: string; color: string; tableKey: string | null; highlight?: boolean }> = [
    { to: "/agri/search", icon: Search, label: "البحث الموحّد", color: "text-primary", tableKey: null, highlight: true },
    { to: "/agri/treatments-finder", icon: FlaskConical, label: "مستشار العلاج", color: "text-cyan-600", tableKey: null, highlight: true },
    { to: "/agri/plants", icon: Sprout, label: t("agri.plants"), color: "text-green-600", tableKey: "agri_plants" },
    { to: "/agri/diseases", icon: ShieldAlert, label: t("agri.diseases"), color: "text-red-600", tableKey: "agri_diseases" },
    { to: "/agri/pests", icon: Bug, label: t("agri.pests"), color: "text-orange-600", tableKey: "agri_pests" },
    { to: "/agri/weeds", icon: Wheat, label: "الأعشاب الضارة", color: "text-yellow-700", tableKey: "agri_weeds" },
    { to: "/agri/fertilizers", icon: FlaskConical, label: "الأسمدة", color: "text-blue-600", tableKey: "agri_fertilizers" },
    { to: "/agri/pesticides", icon: Beaker, label: "المبيدات", color: "text-purple-600", tableKey: "agri_pesticides" },
    { to: "/agri/seeds", icon: Leaf, label: "البذور والأصناف", color: "text-emerald-600", tableKey: "agri_seeds" },
    { to: "/agri/treatments", icon: FlaskConical, label: t("agri.treatments"), color: "text-cyan-600", tableKey: "agri_treatments" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="w-6 h-6" />
        <h1 className="text-2xl font-bold">{t("agri.title")}</h1>
        <Badge variant="outline" className="ms-auto">قاعدة المعرفة الزراعية</Badge>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.to} to={c.to}>
            <Card className={`p-6 hover:shadow-lg transition flex flex-col items-center gap-3 cursor-pointer ${c.highlight ? "border-primary border-2" : ""}`}>
              <c.icon className={`w-10 h-10 ${c.color}`} />
              <div className="font-semibold text-center">{c.label}</div>
              {c.tableKey && <Badge variant="secondary">{counts[c.tableKey] ?? "…"}</Badge>}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
