import { Input, Card, Badge } from "@/ds";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Sprout, ShieldAlert, Bug, Wheat, FlaskConical, Beaker, Leaf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/agri/search")({ component: UnifiedSearch });

type DetailKind = "plant" | "disease" | "pest";
interface Hit { id: string; kind: string; title: string; subtitle?: string; meta?: string; detailKind: DetailKind | null; listTo: string; icon: any; color: string }

function UnifiedSearch() {
  const [q, setQ] = useState("");
  const [all, setAll] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [pl, di, pe, we, fe, ps, se] = await Promise.all([
        supabase.from("agri_plants").select("id,common_name_ar,common_name_fr,scientific_name,family,cycle"),
        supabase.from("agri_diseases").select("id,name_ar,name_fr,scientific_name,type,severity"),
        supabase.from("agri_pests").select("id,name_ar,name_fr,scientific_name,type,severity"),
        supabase.from("agri_weeds").select("id,name_ar,name_fr,scientific_name,weed_type,affected_crops"),
        supabase.from("agri_fertilizers").select("id,name_ar,name_fr,type,n_percent,p_percent,k_percent,suitable_crops"),
        supabase.from("agri_pesticides").select("id,name_ar,name_fr,category,active_ingredient,target_pests,target_diseases,suitable_crops"),
        supabase.from("agri_seeds").select("id,variety_name,crop_name,company,country_of_origin,seed_type"),
      ]);
      const hits: Hit[] = [
        ...((pl.data ?? []) as any[]).map((r) => ({ id: r.id, kind: "محصول", title: r.common_name_ar, subtitle: [r.common_name_fr, r.scientific_name].filter(Boolean).join(" · "), meta: [r.family, r.cycle].filter(Boolean).join(" · "), detailKind: "plant" as DetailKind, listTo: "/agri/plants", icon: Sprout, color: "text-green-600" })),
        ...((di.data ?? []) as any[]).map((r) => ({ id: r.id, kind: "مرض", title: r.name_ar, subtitle: [r.name_fr, r.scientific_name].filter(Boolean).join(" · "), meta: `${r.type} · خطورة ${r.severity ?? "?"}`, detailKind: "disease" as DetailKind, listTo: "/agri/diseases", icon: ShieldAlert, color: "text-red-600" })),
        ...((pe.data ?? []) as any[]).map((r) => ({ id: r.id, kind: "آفة", title: r.name_ar, subtitle: [r.name_fr, r.scientific_name].filter(Boolean).join(" · "), meta: `${r.type} · خطورة ${r.severity ?? "?"}`, detailKind: "pest" as DetailKind, listTo: "/agri/pests", icon: Bug, color: "text-orange-600" })),
        ...((we.data ?? []) as any[]).map((r) => ({ id: r.id, kind: "عشبة ضارة", title: r.name_ar, subtitle: [r.name_fr, r.scientific_name].filter(Boolean).join(" · "), meta: [r.weed_type, r.affected_crops].filter(Boolean).join(" · "), detailKind: null, listTo: "/agri/weeds", icon: Wheat, color: "text-yellow-700" })),
        ...((fe.data ?? []) as any[]).map((r) => ({ id: r.id, kind: "سماد", title: r.name_ar, subtitle: r.name_fr ?? "", meta: `${r.type ?? ""} · NPK ${r.n_percent ?? 0}-${r.p_percent ?? 0}-${r.k_percent ?? 0} · ${r.suitable_crops ?? ""}`, detailKind: null, listTo: "/agri/fertilizers", icon: FlaskConical, color: "text-blue-600" })),
        ...((ps.data ?? []) as any[]).map((r) => ({ id: r.id, kind: "مبيد", title: r.name_ar, subtitle: `${r.name_fr ?? ""} · ${r.active_ingredient ?? ""}`, meta: [r.category, r.target_pests, r.target_diseases].filter(Boolean).join(" · "), detailKind: null, listTo: "/agri/pesticides", icon: Beaker, color: "text-purple-600" })),
        ...((se.data ?? []) as any[]).map((r) => ({ id: r.id, kind: "بذور", title: `${r.variety_name} — ${r.crop_name}`, subtitle: [r.company, r.country_of_origin].filter(Boolean).join(" · "), meta: r.seed_type ?? "", detailKind: null, listTo: "/agri/seeds", icon: Leaf, color: "text-emerald-600" })),
      ];
      setAll(hits);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return all.slice(0, 50);
    return all.filter((h) =>
      h.title.toLowerCase().includes(s)
      || (h.subtitle ?? "").toLowerCase().includes(s)
      || (h.meta ?? "").toLowerCase().includes(s)
      || h.kind.toLowerCase().includes(s)
    ).slice(0, 200);
  }, [q, all]);

  const groups = useMemo(() => {
    const g: Record<string, Hit[]> = {};
    for (const h of filtered) (g[h.kind] ||= []).push(h);
    return g;
  }, [filtered]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Search className="w-6 h-6" />
        <h1 className="text-2xl font-bold">البحث الموحّد في المعرفة الزراعية</h1>
      </div>

      <Card className="p-3">
        <div className="relative">
          <Search className="w-5 h-5 absolute top-3 start-3 opacity-60" />
          <Input className="ps-10 h-12 text-lg" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث في المحاصيل، الأمراض، الآفات، الأعشاب، الأسمدة، المبيدات، البذور..." />
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          {loading ? "جاري تحميل قاعدة المعرفة..." : `${all.length} عنصر متاح · ${filtered.length} نتيجة`}
        </div>
      </Card>

      {Object.entries(groups).map(([kind, hits]) => (
        <Card key={kind} className="p-4">
          <div className="font-semibold mb-3 flex items-center gap-2">
            <Badge>{kind}</Badge>
            <span className="text-sm text-muted-foreground">{hits.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {hits.map((h) => {
              const inner = (
                <Card className="p-3 hover:shadow transition flex gap-3 items-start">
                  <h.icon className={`w-5 h-5 mt-0.5 ${h.color}`} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{h.title}</div>
                    {h.subtitle && <div className="text-xs text-muted-foreground truncate italic">{h.subtitle}</div>}
                    {h.meta && <div className="text-xs text-muted-foreground truncate">{h.meta}</div>}
                  </div>
                </Card>
              );
              const key = `${h.kind}-${h.id}`;
              if (h.detailKind === "plant") return <Link key={key} to="/agri/plants/$id" params={{ id: h.id }} className="block">{inner}</Link>;
              if (h.detailKind === "disease") return <Link key={key} to="/agri/diseases/$id" params={{ id: h.id }} className="block">{inner}</Link>;
              if (h.detailKind === "pest") return <Link key={key} to="/agri/pests/$id" params={{ id: h.id }} className="block">{inner}</Link>;
              return <Link key={key} to={h.listTo as any} className="block">{inner}</Link>;
            })}
          </div>
        </Card>
      ))}

      {!loading && filtered.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">لا توجد نتائج مطابقة.</Card>
      )}
    </div>
  );
}
