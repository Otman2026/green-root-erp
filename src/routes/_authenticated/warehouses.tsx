import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Warehouse as WarehouseIcon, Pencil, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/warehouses")({ component: WarehousesPage });

type Node = { id: string; name: string; children: Node[]; kind: "wh" | "zone" | "aisle" | "rack" | "shelf" | "bin"; parentId?: string };
type Branch = { id: string; name: string };
type Warehouse = { id: string; name: string; code: string | null; branch_id: string | null };

function WarehousesPage() {
  const { t } = useI18n();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [tree, setTree] = useState<Record<string, Node[]>>({}); // warehouseId -> zones tree
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Warehouse>>({ name: "", code: "", branch_id: null });

  // Child add
  const [childDlg, setChildDlg] = useState<{ parentKind: Node["kind"]; parentId: string; whId: string } | null>(null);
  const [childName, setChildName] = useState("");
  const [childCode, setChildCode] = useState("");

  const loadAll = async () => {
    const [b, w] = await Promise.all([
      supabase.from("branches").select("id,name").order("name"),
      supabase.from("warehouses").select("*").order("created_at", { ascending: false }),
    ]);
    if (b.error) toast.error(b.error.message);
    if (w.error) toast.error(w.error.message);
    setBranches((b.data ?? []) as Branch[]);
    setWarehouses((w.data ?? []) as Warehouse[]);
  };
  useEffect(() => { loadAll(); }, []);

  const loadTree = async (whId: string) => {
    const { data: zones } = await supabase.from("warehouse_zones").select("*").eq("warehouse_id", whId);
    const zoneIds = (zones ?? []).map((z) => z.id);
    const { data: aisles } = zoneIds.length ? await supabase.from("warehouse_aisles").select("*").in("zone_id", zoneIds) : { data: [] as any[] };
    const aisleIds = (aisles ?? []).map((a) => a.id);
    const { data: racks } = aisleIds.length ? await supabase.from("warehouse_racks").select("*").in("aisle_id", aisleIds) : { data: [] as any[] };
    const rackIds = (racks ?? []).map((r) => r.id);
    const { data: shelves } = rackIds.length ? await supabase.from("warehouse_shelves").select("*").in("rack_id", rackIds) : { data: [] as any[] };
    const shelfIds = (shelves ?? []).map((s) => s.id);
    const { data: bins } = shelfIds.length ? await supabase.from("warehouse_bins").select("*").in("shelf_id", shelfIds) : { data: [] as any[] };

    const nodes: Node[] = (zones ?? []).map((z: any) => ({
      id: z.id, name: z.name, kind: "zone", parentId: whId,
      children: (aisles ?? []).filter((a: any) => a.zone_id === z.id).map((a: any) => ({
        id: a.id, name: a.name, kind: "aisle", parentId: z.id,
        children: (racks ?? []).filter((r: any) => r.aisle_id === a.id).map((r: any) => ({
          id: r.id, name: r.name, kind: "rack", parentId: a.id,
          children: (shelves ?? []).filter((s: any) => s.rack_id === r.id).map((s: any) => ({
            id: s.id, name: s.name, kind: "shelf", parentId: r.id,
            children: (bins ?? []).filter((bi: any) => bi.shelf_id === s.id).map((bi: any) => ({
              id: bi.id, name: bi.name + (bi.code ? ` · ${bi.code}` : ""), kind: "bin", parentId: s.id, children: [],
            })),
          })),
        })),
      })),
    }));
    setTree((old) => ({ ...old, [whId]: nodes }));
  };

  const toggle = (whId: string) => {
    setExpanded((e) => ({ ...e, [whId]: !e[whId] }));
    if (!tree[whId]) loadTree(whId);
  };

  const saveWh = async () => {
    if (!editing.name?.trim()) return toast.error(t("common.name"));
    const payload = { name: editing.name!, code: editing.code || null, branch_id: editing.branch_id || null };
    if (editing.id) {
      const { error } = await supabase.from("warehouses").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("warehouses").insert(payload);
      if (error) return toast.error(error.message);
    }
    setOpen(false); setEditing({ name: "", code: "", branch_id: null }); loadAll();
  };

  const delWh = async (id: string) => {
    if (!confirm(t("common.confirmDelete"))) return;
    const { error } = await supabase.from("warehouses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    loadAll();
  };

  const openAddChild = (parentKind: Node["kind"], parentId: string, whId: string) => {
    setChildDlg({ parentKind, parentId, whId });
    setChildName(""); setChildCode("");
  };

  const saveChild = async () => {
    if (!childDlg) return;
    if (!childName.trim()) return toast.error(t("common.name"));
    const map: Record<Node["kind"], { table: string; parentCol: string; hasCode?: boolean }> = {
      wh:    { table: "warehouses", parentCol: "" },
      zone:  { table: "warehouse_aisles", parentCol: "zone_id" },
      aisle: { table: "warehouse_racks", parentCol: "aisle_id" },
      rack:  { table: "warehouse_shelves", parentCol: "rack_id" },
      shelf: { table: "warehouse_bins", parentCol: "shelf_id", hasCode: true },
      bin:   { table: "", parentCol: "" },
    };
    // when parentKind is "wh" the child is a zone
    const cfg = childDlg.parentKind === "wh"
      ? { table: "warehouse_zones", parentCol: "warehouse_id", hasCode: true }
      : map[childDlg.parentKind];
    if (!cfg.table) return;
    const payload: any = { name: childName, [cfg.parentCol]: childDlg.parentId };
    if (cfg.hasCode && childCode) payload.code = childCode;
    const { error } = await (supabase.from as any)(cfg.table).insert(payload);
    if (error) return toast.error(error.message);
    setChildDlg(null);
    loadTree(childDlg.whId);
  };

  const delNode = async (n: Node, whId: string) => {
    if (!confirm(t("common.confirmDelete"))) return;
    const table = { zone: "warehouse_zones", aisle: "warehouse_aisles", rack: "warehouse_racks", shelf: "warehouse_shelves", bin: "warehouse_bins", wh: "warehouses" }[n.kind];
    const { error } = await (supabase.from as any)(table).delete().eq("id", n.id);
    if (error) return toast.error(error.message);
    loadTree(whId);
  };

  const nextKindLabel: Record<Node["kind"], string> = {
    wh: t("warehouses.zones"), zone: t("warehouses.aisles"), aisle: t("warehouses.racks"),
    rack: t("warehouses.shelves"), shelf: t("warehouses.bins"), bin: "",
  };

  const renderNode = (n: Node, whId: string, depth = 1) => (
    <div key={n.id} style={{ paddingInlineStart: depth * 16 }} className="border-s ms-2">
      <div className="flex items-center gap-2 py-1">
        <span className="text-xs uppercase text-muted-foreground w-14">{n.kind}</span>
        <span className="flex-1 text-sm">{n.name}</span>
        {n.kind !== "bin" && (
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openAddChild(n.kind, n.id, whId)}>
            <Plus className="h-3 w-3" /> {nextKindLabel[n.kind]}
          </Button>
        )}
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => delNode(n, whId)}>
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
      {n.children.map((c) => renderNode(c, whId, depth + 1))}
    </div>
  );

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <WarehouseIcon className="h-6 w-6 text-primary" /> {t("warehouses.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{warehouses.length} {t("common.total")}</p>
        </div>
        <Button onClick={() => { setEditing({ name: "", code: "", branch_id: null }); setOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> {t("warehouses.new")}
        </Button>
      </div>

      <div className="grid gap-3">
        {warehouses.map((w) => (
          <Card key={w.id} className="p-3">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" onClick={() => toggle(w.id)}>
                {expanded[w.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              <WarehouseIcon className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <div className="font-semibold">{w.name}</div>
                <div className="text-xs text-muted-foreground">
                  {w.code ?? "—"} · {branches.find((b) => b.id === w.branch_id)?.name ?? "—"}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => openAddChild("wh", w.id, w.id)} className="gap-1">
                <Plus className="h-3 w-3" /> {t("warehouses.zones")}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => { setEditing(w); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => delWh(w.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
            {expanded[w.id] && (
              <div className="mt-2">
                {(tree[w.id] ?? []).length === 0
                  ? <p className="ps-4 text-xs text-muted-foreground">{t("common.empty")}</p>
                  : (tree[w.id] ?? []).map((n) => renderNode(n, w.id))}
              </div>
            )}
          </Card>
        ))}
        {warehouses.length === 0 && <p className="text-center text-sm text-muted-foreground">{t("common.empty")}</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing.id ? t("common.edit") : t("warehouses.new")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>{t("common.name")} *</Label><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("common.code")}</Label><Input value={editing.code ?? ""} onChange={(e) => setEditing({ ...editing, code: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label>{t("nav.branches")}</Label>
              <Select value={editing.branch_id ?? "none"} onValueChange={(v) => setEditing({ ...editing, branch_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={saveWh}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!childDlg} onOpenChange={(v) => !v && setChildDlg(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("common.add")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>{t("common.name")} *</Label><Input value={childName} onChange={(e) => setChildName(e.target.value)} autoFocus /></div>
            {(childDlg?.parentKind === "wh" || childDlg?.parentKind === "shelf") && (
              <div className="space-y-1.5"><Label>{t("common.code")}</Label><Input value={childCode} onChange={(e) => setChildCode(e.target.value)} /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChildDlg(null)}>{t("common.cancel")}</Button>
            <Button onClick={saveChild}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
