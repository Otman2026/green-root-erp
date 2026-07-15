import { Card, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FlaskConical, Package, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/agri/treatments-finder")({ component: TreatmentFinder });

function TreatmentFinder() {
  const [plants, setPlants] = useState<any[]>([]);
  const [diseases, setDiseases] = useState<any[]>([]);
  const [pests, setPests] = useState<any[]>([]);
  const [plantId, setPlantId] = useState<string>("");
  const [targetKind, setTargetKind] = useState<"disease" | "pest">("disease");
  const [targetId, setTargetId] = useState<string>("");
  const [treatments, setTreatments] = useState<any[]>([]);
  const [pesticides, setPesticides] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const [p, d, pe] = await Promise.all([
        supabase.from("agri_plants").select("id,common_name_ar").order("common_name_ar"),
        supabase.from("agri_diseases").select("id,name_ar").order("name_ar"),
        supabase.from("agri_pests").select("id,name_ar").order("name_ar"),
      ]);
      setPlants(p.data ?? []);
      setDiseases(d.data ?? []);
      setPests(pe.data ?? []);
    })();
  }, []);

  const search = async () => {
    if (!targetId) return;
    setLoading(true);
    const targetList = targetKind === "disease" ? diseases : pests;
    const target = targetList.find((x) => x.id === targetId);
    if (!target) { setLoading(false); return; }

    const [ts, ps] = await Promise.all([
      supabase.from("agri_treatments").select("*").eq("target_type", targetKind).eq("target_id", targetId),
      supabase.from("agri_pesticides").select("*").ilike(targetKind === "disease" ? "target_diseases" : "target_pests", `%${target.name_ar}%`),
    ]);
    setTreatments(ts.data ?? []);
    setPesticides(ps.data ?? []);

    const productIds = (ps.data ?? []).map((x: any) => x.product_id).filter(Boolean);
    if (productIds.length) {
      const { data: prods } = await supabase.from("products").select("id,name_ar,sku,stock_quantity,sale_price").in("id", productIds);
      setProducts(prods ?? []);
    } else {
      setProducts([]);
    }
    setLoading(false);
  };

  const inStock = (pid: string) => products.find((p) => p.id === pid);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <FlaskConical className="w-6 h-6 text-cyan-600" />
        <h1 className="text-2xl font-bold">مستشار العلاج</h1>
      </div>
      <p className="text-sm text-muted-foreground">اختر المحصول والمشكلة (مرض/آفة) للحصول على بروتوكولات علاج، مبيدات مناسبة، ومنتجات متوفرة في مخزونك.</p>

      <Card className="p-4 grid gap-3 md:grid-cols-4">
        <div>
          <label className="text-xs mb-1 block">المحصول</label>
          <Select value={plantId} onValueChange={setPlantId}>
            <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
            <SelectContent>{plants.map((p) => <SelectItem key={p.id} value={p.id}>{p.common_name_ar}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs mb-1 block">نوع المشكلة</label>
          <Select value={targetKind} onValueChange={(v) => { setTargetKind(v as any); setTargetId(""); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="disease">مرض</SelectItem>
              <SelectItem value="pest">آفة</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs mb-1 block">{targetKind === "disease" ? "المرض" : "الآفة"}</label>
          <Select value={targetId} onValueChange={setTargetId}>
            <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
            <SelectContent>
              {(targetKind === "disease" ? diseases : pests).map((x) => <SelectItem key={x.id} value={x.id}>{x.name_ar}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button className="w-full" onClick={search} disabled={!targetId || loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "بحث"}
          </Button>
        </div>
      </Card>

      {treatments.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">بروتوكولات العلاج ({treatments.length})</h3>
          <div className="space-y-2">
            {treatments.map((t) => (
              <div key={t.id} className="p-3 border rounded text-sm space-y-1">
                <div className="font-medium">{t.title}</div>
                <div className="text-xs">طريقة: {t.method} · م.ف: {t.active_ingredient} · جرعة: {t.dosage} · تكرار: {t.frequency}</div>
                <div className="text-xs text-muted-foreground">فترة الأمان: {t.safety_period}</div>
                {t.description && <p className="text-xs">{t.description}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {pesticides.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">المبيدات المتاحة ({pesticides.length})</h3>
          <div className="space-y-2">
            {pesticides.map((p) => {
              const stock = p.product_id ? inStock(p.product_id) : null;
              return (
                <div key={p.id} className="p-2 border rounded text-sm flex justify-between items-center">
                  <div>
                    <div className="font-medium">{p.name_ar} <span className="text-xs text-muted-foreground">({p.trade_name})</span></div>
                    <div className="text-xs">م.ف: {p.active_ingredient} · جرعة: {p.dosage} · PHI: {p.pre_harvest_interval_days}ي</div>
                    {p.alternatives && <div className="text-xs text-muted-foreground">بدائل: {p.alternatives}</div>}
                  </div>
                  {stock && (
                    <div className="text-end">
                      <Badge variant={stock.stock_quantity > 0 ? "default" : "destructive"} className="gap-1">
                        <Package className="w-3 h-3" />مخزون: {stock.stock_quantity}
                      </Badge>
                      {stock.sale_price && <div className="text-xs mt-1">{stock.sale_price} د.ج</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {targetId && !loading && treatments.length === 0 && pesticides.length === 0 && (
        <Card className="p-6 text-center text-sm text-muted-foreground">لا توجد بروتوكولات أو مبيدات مسجلة لهذا الاختيار بعد.</Card>
      )}
    </div>
  );
}
