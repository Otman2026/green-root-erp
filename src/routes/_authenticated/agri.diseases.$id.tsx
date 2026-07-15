import { Card, Badge, Button } from "@/ds";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, ShieldAlert, Sprout, Beaker, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/agri/diseases/$id")({ component: DiseaseDetail });

function DiseaseDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [disease, setDisease] = useState<any>(null);
  const [plants, setPlants] = useState<any[]>([]);
  const [pesticides, setPesticides] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const d = await supabase.from("agri_diseases").select("*").eq("id", id).maybeSingle();
      if (d.error) { toast.error(d.error.message); setLoading(false); return; }
      setDisease(d.data);

      const [links, ts] = await Promise.all([
        supabase.from("agri_plant_diseases").select("plant_id").eq("disease_id", id),
        supabase.from("agri_treatments").select("*").eq("target_type", "disease").eq("target_id", id),
      ]);
      setTreatments(ts.data ?? []);

      const plantIds = (links.data ?? []).map((x: any) => x.plant_id);
      if (plantIds.length) {
        const { data } = await supabase.from("agri_plants").select("id,common_name_ar,scientific_name").in("id", plantIds);
        setPlants(data ?? []);
      }

      // Pesticides matching disease name in target_diseases
      if (d.data?.name_ar) {
        const { data } = await supabase.from("agri_pesticides")
          .select("*")
          .ilike("target_diseases", `%${d.data.name_ar}%`);
        setPesticides(data ?? []);

        const productIds = (data ?? []).map((p: any) => p.product_id).filter(Boolean);
        if (productIds.length) {
          const { data: prods } = await supabase.from("products").select("id,name_ar,sku,stock_quantity,sale_price").in("id", productIds);
          setProducts(prods ?? []);
        }
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="p-6 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!disease) return <div className="p-6">لم يتم العثور على المرض</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button size="sm" variant="ghost" onClick={() => nav({ to: "/agri/diseases" })}><ArrowRight className="w-4 h-4" /></Button>
        <ShieldAlert className="w-6 h-6 text-red-600" />
        <div>
          <h1 className="text-2xl font-bold">{disease.name_ar}</h1>
          <p className="text-sm text-muted-foreground italic">{disease.scientific_name} {disease.name_fr && `· ${disease.name_fr}`}</p>
        </div>
        {disease.severity && <Badge variant="destructive" className="ms-auto">شدة: {disease.severity}</Badge>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4 space-y-2">
          <Row label="النوع" value={disease.type} />
          <Row label="الوصف" value={disease.description} />
          <Row label="الأعراض" value={disease.symptoms} />
          <Row label="الوقاية" value={disease.prevention} />
          <Row label="المراحل" value={disease.stages} />
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-2">مراجع</h3>
          <p className="text-sm whitespace-pre-line">{disease.refs || "—"}</p>
        </Card>
      </div>

      {plants.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2"><Sprout className="w-4 h-4 text-green-600" />المحاصيل المتأثرة</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {plants.map((p) => (
              <Link key={p.id} to="/agri/plants/$id" params={{ id: p.id }}>
                <div className="p-2 border rounded hover:bg-accent text-sm">
                  <div className="font-medium">{p.common_name_ar}</div>
                  <div className="text-xs text-muted-foreground italic">{p.scientific_name}</div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {treatments.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">🔬 بروتوكولات العلاج ({treatments.length})</h3>
          <div className="space-y-2">
            {treatments.map((t) => (
              <div key={t.id} className="p-3 border rounded text-sm space-y-1">
                <div className="font-medium">{t.title}</div>
                <div className="text-xs">طريقة: {t.method} · م.ف: {t.active_ingredient} · جرعة: {t.dosage}</div>
                <div className="text-xs text-muted-foreground">تكرار: {t.frequency} · فترة أمان: {t.safety_period}</div>
                {t.description && <p className="text-xs">{t.description}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {pesticides.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2"><Beaker className="w-4 h-4 text-purple-600" />المبيدات المناسبة</h3>
          <div className="space-y-2">
            {pesticides.map((p) => (
              <div key={p.id} className="p-2 border rounded text-sm">
                <div className="font-medium">{p.name_ar} <span className="text-xs text-muted-foreground">({p.trade_name})</span></div>
                <div className="text-xs">م.ف: {p.active_ingredient} · جرعة: {p.dosage} · PHI: {p.pre_harvest_interval_days}ي</div>
                {p.alternatives && <div className="text-xs text-muted-foreground">بدائل: {p.alternatives}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {products.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2"><Package className="w-4 h-4" />منتجات متوفرة في المخزون</h3>
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
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  if (!value) return null;
  return <div><div className="text-xs text-muted-foreground">{label}</div><div className="text-sm">{value}</div></div>;
}
