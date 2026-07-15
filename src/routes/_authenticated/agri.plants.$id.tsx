import { Card, Badge, Button } from "@/ds";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Sprout, ShieldAlert, Bug, FlaskConical, Beaker, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/agri/plants/$id")({ component: PlantDetail });

function PlantDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [plant, setPlant] = useState<any>(null);
  const [diseases, setDiseases] = useState<any[]>([]);
  const [pests, setPests] = useState<any[]>([]);
  const [fertilizers, setFertilizers] = useState<any[]>([]);
  const [pesticides, setPesticides] = useState<any[]>([]);
  const [varieties, setVarieties] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const p = await supabase.from("agri_plants").select("*").eq("id", id).maybeSingle();
      if (p.error) { toast.error(p.error.message); setLoading(false); return; }
      setPlant(p.data);

      // Load linked entities via junction tables
      const [pd, pp, pf, ppe, pv] = await Promise.all([
        supabase.from("agri_plant_diseases").select("disease_id").eq("plant_id", id),
        supabase.from("agri_plant_pests").select("pest_id").eq("plant_id", id),
        supabase.from("agri_plant_fertilizers").select("fertilizer_id").eq("plant_id", id),
        supabase.from("agri_plant_pesticides").select("pesticide_id").eq("plant_id", id),
        supabase.from("agri_plant_varieties").select("*").eq("plant_id", id),
      ]);
      setVarieties(pv.data ?? []);

      const diseaseIds = (pd.data ?? []).map((x: any) => x.disease_id);
      const pestIds = (pp.data ?? []).map((x: any) => x.pest_id);
      const fertIds = (pf.data ?? []).map((x: any) => x.fertilizer_id);
      const pestiIds = (ppe.data ?? []).map((x: any) => x.pesticide_id);

      const [dR, peR, fR, psR] = await Promise.all([
        diseaseIds.length ? supabase.from("agri_diseases").select("*").in("id", diseaseIds) : Promise.resolve({ data: [] }),
        pestIds.length ? supabase.from("agri_pests").select("*").in("id", pestIds) : Promise.resolve({ data: [] }),
        fertIds.length ? supabase.from("agri_fertilizers").select("*").in("id", fertIds) : Promise.resolve({ data: [] }),
        pestiIds.length ? supabase.from("agri_pesticides").select("*").in("id", pestiIds) : Promise.resolve({ data: [] }),
      ]);
      setDiseases(dR.data ?? []);
      setPests(peR.data ?? []);
      setFertilizers(fR.data ?? []);
      setPesticides(psR.data ?? []);

      // Products matching plant name in name/description
      const term = p.data?.common_name_ar;
      if (term) {
        const { data: prods } = await supabase.from("products")
          .select("id,name_ar,name_fr,sku,stock_quantity,sale_price")
          .or(`name_ar.ilike.%${term}%,description.ilike.%${term}%`)
          .limit(10);
        setProducts(prods ?? []);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="p-6 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!plant) return <div className="p-6">لم يتم العثور على المحصول</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button size="sm" variant="ghost" onClick={() => nav({ to: "/agri/plants" })}><ArrowRight className="w-4 h-4" /></Button>
        <Sprout className="w-6 h-6 text-green-600" />
        <div>
          <h1 className="text-2xl font-bold">{plant.common_name_ar}</h1>
          <p className="text-sm text-muted-foreground italic">{plant.scientific_name} {plant.common_name_fr && `· ${plant.common_name_fr}`}</p>
        </div>
      </div>

      {plant.image_url && <img src={plant.image_url} className="max-h-64 rounded-md" alt={plant.common_name_ar} />}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4 space-y-2">
          <h3 className="font-semibold">معلومات أساسية</h3>
          <Info k="العائلة" v={plant.family} />
          <Info k="دورة الحياة" v={plant.cycle} />
          <Info k="موسم الزراعة" v={plant.season} />
          <Info k="المناخ" v={plant.climate} />
          <Info k="نوع التربة" v={plant.soil} />
          <Info k="الاحتياج المائي" v={plant.water_needs} />
        </Card>
        <Card className="p-4 space-y-2">
          <h3 className="font-semibold">الوصف</h3>
          <p className="text-sm">{plant.description || "—"}</p>
        </Card>
      </div>

      {varieties.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">الأصناف ({varieties.length})</h3>
          <div className="flex flex-wrap gap-2">{varieties.map((v) => <Badge key={v.id} variant="outline">{v.name}</Badge>)}</div>
        </Card>
      )}

      <LinkedSection title="الأمراض الشائعة" icon={<ShieldAlert className="w-4 h-4 text-red-600" />} items={diseases} baseUrl="/agri/diseases" />
      <LinkedSection title="الآفات الشائعة" icon={<Bug className="w-4 h-4 text-orange-600" />} items={pests} baseUrl="/agri/pests" />

      {fertilizers.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2"><FlaskConical className="w-4 h-4 text-blue-600" />الأسمدة الموصى بها</h3>
          <div className="space-y-2">
            {fertilizers.map((f) => (
              <div key={f.id} className="p-2 border rounded flex justify-between items-center text-sm">
                <div>
                  <div className="font-medium">{f.name_ar}</div>
                  <div className="text-xs text-muted-foreground">NPK {f.n_percent ?? "?"}-{f.p_percent ?? "?"}-{f.k_percent ?? "?"} · {f.dosage ?? ""}</div>
                </div>
                <Link to="/agri/fertilizers"><Button size="sm" variant="ghost">عرض</Button></Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      {pesticides.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2"><Beaker className="w-4 h-4 text-purple-600" />المبيدات الموصى بها</h3>
          <div className="space-y-2">
            {pesticides.map((p) => (
              <div key={p.id} className="p-2 border rounded text-sm">
                <div className="font-medium">{p.name_ar} <span className="text-xs text-muted-foreground">({p.trade_name})</span></div>
                <div className="text-xs">م.ف: {p.active_ingredient} · جرعة: {p.dosage} · PHI: {p.pre_harvest_interval_days}ي</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {products.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2"><Package className="w-4 h-4" />منتجات ذات صلة في المخزون</h3>
          <div className="space-y-1">
            {products.map((p) => (
              <div key={p.id} className="p-2 border rounded flex justify-between text-sm">
                <span>{p.name_ar} <span className="text-xs text-muted-foreground">({p.sku})</span></span>
                <Badge variant={p.stock_quantity > 0 ? "default" : "destructive"}>مخزون: {p.stock_quantity ?? 0}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Button asChild variant="outline"><Link to="/agri/treatments-finder" search={{ plant: plant.common_name_ar } as any}>🔬 مستشار العلاج لهذا المحصول</Link></Button>
    </div>
  );
}

function Info({ k, v }: { k: string; v: any }) {
  return <div className="flex justify-between text-sm"><span className="text-muted-foreground">{k}</span><span>{v || "—"}</span></div>;
}

function LinkedSection({ title, icon, items, baseUrl }: { title: string; icon: React.ReactNode; items: any[]; baseUrl: "/agri/diseases" | "/agri/pests" }) {
  if (!items.length) return null;
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-2 flex items-center gap-2">{icon}{title} ({items.length})</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((it) => (
          <Link key={it.id} to={baseUrl === "/agri/diseases" ? "/agri/diseases/$id" : "/agri/pests/$id"} params={{ id: it.id }} className="block">
            <div className="p-2 border rounded hover:bg-accent text-sm">
              <div className="font-medium">{it.name_ar}</div>
              <div className="text-xs text-muted-foreground italic">{it.scientific_name}</div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

