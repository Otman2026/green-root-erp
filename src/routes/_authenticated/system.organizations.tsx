import { Card, Button, Input, Badge } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/system/organizations")({
  component: OrgsPage,
});

function OrgsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("organizations").select("*").order("created_at", { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name || !slug) return toast.error("الاسم والرابط مطلوبان");
    setLoading(true);
    const { error } = await supabase.from("organizations").insert({ name, slug: slug.toLowerCase() });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("تمت الإضافة"); setName(""); setSlug(""); load(); }
  };

  const toggle = async (id: string, status: string) => {
    const next = status === "active" ? "suspended" : "active";
    const { error } = await supabase.from("organizations").update({ status: next }).eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
          <Input placeholder="اسم المؤسسة" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="slug (مثال: acme)" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <Button onClick={create} disabled={loading}>إنشاء مؤسسة</Button>
        </div>
      </Card>
      <Card className="p-4">
        <table className="w-full text-sm">
          <thead className="border-b text-right text-muted-foreground">
            <tr><th className="py-2">الاسم</th><th>Slug</th><th>الحالة</th><th>تاريخ الإنشاء</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-b">
                <td className="py-2 font-medium">{o.name}</td>
                <td className="text-muted-foreground">{o.slug}</td>
                <td><Badge variant={o.status === "active" ? "default" : "secondary"}>{o.status}</Badge></td>
                <td className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="text-left">
                  <Button size="sm" variant="outline" onClick={() => toggle(o.id, o.status)}>
                    {o.status === "active" ? "تعليق" : "تفعيل"}
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">لا توجد مؤسسات</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
