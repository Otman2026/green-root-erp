import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Package, Plus, Search, Download, Upload, Printer, Trash2, Edit,
  Archive, ArchiveRestore, AlertTriangle, TrendingDown, CalendarX,
  Clock, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  listProducts, listCategories, listSuppliers, getProductStats,
  archiveProduct, restoreProduct, deleteProduct, createProduct,
} from "@/lib/products-api";
import { ProductDialog } from "@/components/products/product-dialog";
import { CategoriesManager } from "@/components/products/categories-manager";
import { SuppliersManager } from "@/components/products/suppliers-manager";

export const Route = createFileRoute("/_authenticated/products")({ component: ProductsPage });

function ProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [supplierId, setSupplierId] = useState<string>("");
  const [status, setStatus] = useState<string>("active");
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filters = useMemo(() => ({
    search: search.trim() || undefined,
    categoryId: categoryId || undefined,
    supplierId: supplierId || undefined,
    status: status || undefined,
  }), [search, categoryId, supplierId, status]);

  const { data: products = [], isLoading } = useQuery({ queryKey: ["products", filters], queryFn: () => listProducts(filters) });
  const { data: stats } = useQuery({ queryKey: ["product-stats"], queryFn: getProductStats });
  const { data: cats = [] } = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const { data: sups = [] } = useQuery({ queryKey: ["suppliers"], queryFn: listSuppliers });

  const archiveMut = useMutation({
    mutationFn: archiveProduct,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success("تمت الأرشفة"); },
  });
  const restoreMut = useMutation({
    mutationFn: restoreProduct,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success("تمت الاستعادة"); },
  });
  const deleteMut = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product-stats"] });
      toast.success("تم الحذف");
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const exportExcel = () => {
    const rows = products.map((p) => ({
      SKU: p.sku, "الاسم": p.name_ar || p.name, "التصنيف": p.category?.name_ar || p.category?.name || "",
      "المورد": p.supplier?.name || "", "العلامة": p.brand, "المادة الفعالة": p.active_ingredient,
      "الوحدة": p.unit, "المخزون": p.stock_quantity, "الحد الأدنى": p.min_stock_alert,
      "سعر الشراء": p.purchase_price, "سعر البيع": p.selling_price, "العملة": p.currency,
      "Barcode": p.barcode, "الحالة": p.status,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, `haytam-agri-products-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const importExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]]);
    let ok = 0, fail = 0;
    for (const r of rows) {
      try {
        await createProduct({
          name: String(r["الاسم"] || r["name"] || r["Name"] || ""),
          name_ar: (r["الاسم"] as string) || null,
          sku: (r["SKU"] as string) || null,
          barcode: (r["Barcode"] as string) || null,
          brand: (r["العلامة"] as string) || null,
          active_ingredient: (r["المادة الفعالة"] as string) || null,
          unit: (r["الوحدة"] as string) || "piece",
          stock_quantity: Number(r["المخزون"] || 0),
          min_stock_alert: Number(r["الحد الأدنى"] || 0),
          purchase_price: Number(r["سعر الشراء"] || 0),
          selling_price: Number(r["سعر البيع"] || 0),
          currency: (r["العملة"] as string) || "MAD",
        });
        ok++;
      } catch { fail++; }
    }
    e.target.value = "";
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["product-stats"] });
    toast.success(`استيراد: ${ok} ناجح، ${fail} فاشل`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Haytam AGRI - Products", 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [["SKU", "Name", "Category", "Stock", "Price"]],
      body: products.map((p) => [
        p.sku ?? "", p.name, p.category?.name ?? "", String(p.stock_quantity), `${p.selling_price} ${p.currency}`,
      ]),
    });
    doc.save(`haytam-agri-products-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Package className="h-7 w-7" style={{ color: "var(--color-mod-products)" }} />
            المنتجات
          </h1>
          <p className="text-sm text-muted-foreground">إدارة كاملة لجميع المنتجات الزراعية</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setCreating(true)} className="gap-1"><Plus className="h-4 w-4" />منتج جديد</Button>
          <Button variant="outline" size="sm" onClick={exportExcel}><Download className="mr-1 h-4 w-4" />Excel</Button>
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent">
            <Upload className="h-4 w-4" />استيراد
            <input type="file" accept=".xlsx,.xls,.csv" hidden onChange={importExcel} />
          </label>
          <Button variant="outline" size="sm" onClick={exportPDF}><Printer className="mr-1 h-4 w-4" />PDF</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard icon={Package} label="إجمالي المنتجات" value={stats?.total ?? 0} color="mod-products" />
        <KpiCard icon={TrendingDown} label="مخزون منخفض" value={stats?.lowStock ?? 0} color="mod-warehouses" />
        <KpiCard icon={Clock} label="قارب على الانتهاء" value={stats?.expiringSoon ?? 0} color="mod-sales" />
        <KpiCard icon={CalendarX} label="منتهي الصلاحية" value={stats?.expired ?? 0} color="destructive" />
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">المنتجات</TabsTrigger>
          <TabsTrigger value="categories">التصنيفات</TabsTrigger>
          <TabsTrigger value="suppliers">الموردون</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card><CardContent className="flex flex-wrap gap-2 p-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute inset-y-0 my-auto h-4 w-4 text-muted-foreground start-2.5" />
              <Input placeholder="بحث بالاسم، المادة الفعالة، الباركود..." value={search} onChange={(e) => setSearch(e.target.value)} className="ps-8" />
            </div>
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[180px]"><Filter className="mr-1 h-3.5 w-3.5" /><SelectValue placeholder="التصنيف" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل التصنيفات</SelectItem>
                {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name_ar || c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={supplierId} onValueChange={(v) => setSupplierId(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="المورد" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الموردين</SelectItem>
                {sups.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="archived">مؤرشف</SelectItem>
              </SelectContent>
            </Select>
          </CardContent></Card>

          {/* Products list */}
          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <Card key={i} className="h-40 animate-pulse" />)}
            </div>
          ) : products.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center gap-2 p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">لا توجد منتجات — أضف أول منتج</p>
              <Button onClick={() => setCreating(true)}><Plus className="mr-1 h-4 w-4" />منتج جديد</Button>
            </CardContent></Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => {
                const low = Number(p.stock_quantity) <= Number(p.min_stock_alert ?? 0);
                return (
                  <Card key={p.id} className="group overflow-hidden transition-shadow hover:shadow-lg">
                    <div className="flex gap-3 p-3">
                      <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-md bg-muted">
                        {p.primary_image_url || p.images?.[0]?.url ? (
                          <img src={p.primary_image_url ?? p.images?.[0]?.url ?? ""} className="h-full w-full object-cover" alt="" />
                        ) : (
                          <Package className="h-8 w-8 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{p.name_ar || p.name}</p>
                            {p.trade_name && <p className="truncate text-xs text-muted-foreground">{p.trade_name}</p>}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-7 w-7">⋯</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditing(p.id)}><Edit className="mr-2 h-4 w-4" />تعديل</DropdownMenuItem>
                              {p.status === "active" ? (
                                <DropdownMenuItem onClick={() => archiveMut.mutate(p.id)}><Archive className="mr-2 h-4 w-4" />أرشفة</DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => restoreMut.mutate(p.id)}><ArchiveRestore className="mr-2 h-4 w-4" />استعادة</DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(p.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {p.category && (
                            <Badge variant="secondary" style={{ background: `color-mix(in oklab, ${p.category.color || "hsl(var(--primary))"} 15%, transparent)` }}>
                              {p.category.name_ar || p.category.name}
                            </Badge>
                          )}
                          {low && <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />مخزون منخفض</Badge>}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">المخزون: <b className="text-foreground">{p.stock_quantity}</b> {p.unit}</span>
                          <span className="font-bold">{Number(p.selling_price).toLocaleString()} {p.currency}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories"><CategoriesManager /></TabsContent>
        <TabsContent value="suppliers"><SuppliersManager /></TabsContent>
      </Tabs>

      <ProductDialog
        open={creating || !!editing}
        onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}
        productId={editing}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المنتج نهائياً؟</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف المنتج مع جميع صوره ودفعاته. هذا الإجراء لا يمكن التراجع عنه.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMut.mutate(deleteId)}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; color: string }) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="grid h-11 w-11 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, var(--color-${color}) 15%, transparent)` }}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
