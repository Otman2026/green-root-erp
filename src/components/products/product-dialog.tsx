import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Star, Upload, Plus, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import imageCompression from "browser-image-compression";
import {
  createProduct, updateProduct, getProduct, uploadProductImage,
  deleteProductImage, setPrimaryImage, listCategories, listSuppliers,
  addBatch, deleteBatch, type ProductWithRelations,
} from "@/lib/products-api";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productId: string | null;
}

const UNITS = [
  { v: "piece", l: "قطعة" }, { v: "kg", l: "كيلوغرام" }, { v: "g", l: "غرام" },
  { v: "L", l: "لتر" }, { v: "ml", l: "ملليلتر" }, { v: "bag", l: "كيس" },
  { v: "box", l: "علبة" }, { v: "bottle", l: "زجاجة" },
];

export function ProductDialog({ open, onOpenChange, productId }: Props) {
  const qc = useQueryClient();
  const isEdit = !!productId;
  const { register, handleSubmit, reset, setValue, watch } = useForm<Record<string, string>>();

  const { data: existing } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProduct(productId!),
    enabled: !!productId && open,
  });
  const { data: cats = [] } = useQuery({ queryKey: ["categories"], queryFn: listCategories, enabled: open });
  const { data: sups = [] } = useQuery({ queryKey: ["suppliers"], queryFn: listSuppliers, enabled: open });

  useEffect(() => {
    if (open && existing) {
      reset({
        name: existing.name ?? "",
        name_ar: existing.name_ar ?? "",
        trade_name: existing.trade_name ?? "",
        scientific_name: existing.scientific_name ?? "",
        description: existing.description ?? "",
        category_id: existing.category_id ?? "",
        supplier_id: existing.supplier_id ?? "",
        brand: existing.brand ?? "",
        manufacturer: existing.manufacturer ?? "",
        origin_country: existing.origin_country ?? "",
        active_ingredient: existing.active_ingredient ?? "",
        formulation: existing.formulation ?? "",
        concentration: existing.concentration ?? "",
        unit: existing.unit ?? "piece",
        weight: existing.weight?.toString() ?? "",
        volume: existing.volume?.toString() ?? "",
        sku: existing.sku ?? "",
        barcode: existing.barcode ?? "",
        registration_number: existing.registration_number ?? "",
        stock_quantity: existing.stock_quantity?.toString() ?? "0",
        min_stock_alert: existing.min_stock_alert?.toString() ?? "0",
        purchase_price: existing.purchase_price?.toString() ?? "0",
        selling_price: existing.selling_price?.toString() ?? "0",
        currency: existing.currency ?? "MAD",
        notes: existing.notes ?? "",
      });
    } else if (open && !productId) {
      reset({ unit: "piece", currency: "MAD", stock_quantity: "0", min_stock_alert: "0", purchase_price: "0", selling_price: "0" });
    }
  }, [open, existing, productId, reset]);

  const saveMut = useMutation({
    mutationFn: async (form: Record<string, string>) => {
      const payload = {
        name: form.name,
        name_ar: form.name_ar || null,
        trade_name: form.trade_name || null,
        scientific_name: form.scientific_name || null,
        description: form.description || null,
        category_id: form.category_id || null,
        supplier_id: form.supplier_id || null,
        brand: form.brand || null,
        manufacturer: form.manufacturer || null,
        origin_country: form.origin_country || null,
        active_ingredient: form.active_ingredient || null,
        formulation: form.formulation || null,
        concentration: form.concentration || null,
        unit: form.unit || "piece",
        weight: form.weight ? Number(form.weight) : null,
        volume: form.volume ? Number(form.volume) : null,
        sku: form.sku || null,
        barcode: form.barcode || null,
        registration_number: form.registration_number || null,
        stock_quantity: Number(form.stock_quantity || 0),
        min_stock_alert: Number(form.min_stock_alert || 0),
        purchase_price: Number(form.purchase_price || 0),
        selling_price: Number(form.selling_price || 0),
        currency: form.currency || "MAD",
        notes: form.notes || null,
      };
      if (isEdit) return updateProduct(productId!, payload);
      return createProduct(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "تم تعديل المنتج" : "تم إنشاء المنتج");
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product-stats"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const barcodeValue = watch("barcode") || existing?.id || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل منتج" : "إضافة منتج جديد"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((f) => saveMut.mutate(f))}>
          <Tabs defaultValue="basic" className="mt-2">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="basic">أساسي</TabsTrigger>
              <TabsTrigger value="tech">تقني</TabsTrigger>
              <TabsTrigger value="stock">المخزون والسعر</TabsTrigger>
              <TabsTrigger value="codes">الأكواد</TabsTrigger>
              {isEdit && <TabsTrigger value="images">الصور</TabsTrigger>}
              {isEdit && <TabsTrigger value="batches">الدفعات</TabsTrigger>}
            </TabsList>

            <TabsContent value="basic" className="grid gap-3 pt-4 md:grid-cols-2">
              <Field label="الاسم *"><Input required {...register("name")} /></Field>
              <Field label="الاسم بالعربية"><Input {...register("name_ar")} /></Field>
              <Field label="الاسم التجاري"><Input {...register("trade_name")} /></Field>
              <Field label="الاسم العلمي"><Input {...register("scientific_name")} /></Field>
              <Field label="التصنيف">
                <Select value={watch("category_id") || ""} onValueChange={(v) => setValue("category_id", v)}>
                  <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent>
                    {cats.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name_ar || c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="المورد">
                <Select value={watch("supplier_id") || ""} onValueChange={(v) => setValue("supplier_id", v)}>
                  <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent>
                    {sups.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="العلامة التجارية"><Input {...register("brand")} /></Field>
              <Field label="الشركة المصنعة"><Input {...register("manufacturer")} /></Field>
              <Field label="بلد المنشأ"><Input {...register("origin_country")} /></Field>
              <div className="md:col-span-2">
                <Field label="الوصف"><Textarea rows={3} {...register("description")} /></Field>
              </div>
            </TabsContent>

            <TabsContent value="tech" className="grid gap-3 pt-4 md:grid-cols-2">
              <Field label="المادة الفعالة"><Input {...register("active_ingredient")} /></Field>
              <Field label="التركيبة"><Input {...register("formulation")} /></Field>
              <Field label="التركيز"><Input {...register("concentration")} /></Field>
              <Field label="رقم التسجيل"><Input {...register("registration_number")} /></Field>
              <Field label="الوزن"><Input type="number" step="0.001" {...register("weight")} /></Field>
              <Field label="الحجم"><Input type="number" step="0.001" {...register("volume")} /></Field>
              <Field label="وحدة القياس">
                <Select value={watch("unit") || "piece"} onValueChange={(v) => setValue("unit", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u.v} value={u.v}>{u.l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <div className="md:col-span-2">
                <Field label="ملاحظات"><Textarea rows={3} {...register("notes")} /></Field>
              </div>
            </TabsContent>

            <TabsContent value="stock" className="grid gap-3 pt-4 md:grid-cols-2">
              <Field label="الكمية في المخزون"><Input type="number" step="0.01" {...register("stock_quantity")} /></Field>
              <Field label="الحد الأدنى للتنبيه"><Input type="number" step="0.01" {...register("min_stock_alert")} /></Field>
              <Field label="سعر الشراء"><Input type="number" step="0.01" {...register("purchase_price")} /></Field>
              <Field label="سعر البيع"><Input type="number" step="0.01" {...register("selling_price")} /></Field>
              <Field label="العملة">
                <Select value={watch("currency") || "MAD"} onValueChange={(v) => setValue("currency", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MAD">درهم مغربي (MAD)</SelectItem>
                    <SelectItem value="USD">دولار (USD)</SelectItem>
                    <SelectItem value="EUR">يورو (EUR)</SelectItem>
                    <SelectItem value="SAR">ريال (SAR)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </TabsContent>

            <TabsContent value="codes" className="grid gap-3 pt-4 md:grid-cols-2">
              <Field label="SKU"><Input {...register("sku")} /></Field>
              <Field label="Barcode"><Input {...register("barcode")} /></Field>
              {barcodeValue && (
                <div className="md:col-span-2 flex justify-center rounded-lg border bg-white p-4">
                  <QRCodeSVG value={String(barcodeValue)} size={128} />
                </div>
              )}
            </TabsContent>

            {isEdit && (
              <TabsContent value="images" className="pt-4">
                <ImagesTab product={existing} />
              </TabsContent>
            )}

            {isEdit && (
              <TabsContent value="batches" className="pt-4">
                <BatchesTab product={existing} />
              </TabsContent>
            )}
          </Tabs>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={saveMut.isPending}>
              {saveMut.isPending ? "جارٍ الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

function ImagesTab({ product }: { product: ProductWithRelations | undefined }) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  if (!product) return null;
  const images = product.images ?? [];

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const f of files) {
        const compressed = await imageCompression(f, { maxSizeMB: 1, maxWidthOrHeight: 1600 });
        await uploadProductImage(product.id, compressed, images.length === 0);
      }
      toast.success("تم رفع الصور");
      qc.invalidateQueries({ queryKey: ["product", product.id] });
      qc.invalidateQueries({ queryKey: ["products"] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 text-sm hover:bg-muted/50">
        <Upload className="h-4 w-4" />
        {uploading ? "جارٍ الرفع..." : "اضغط لرفع صور (يُضغط تلقائياً)"}
        <input type="file" accept="image/*" multiple hidden onChange={onPick} disabled={uploading} />
      </label>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded-lg border">
              <img src={img.url} alt="" className="aspect-square w-full object-cover" />
              {img.is_primary && (
                <Badge className="absolute right-1 top-1 gap-1"><Star className="h-3 w-3" />رئيسية</Badge>
              )}
              <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
                {!img.is_primary && (
                  <Button size="icon" variant="secondary" className="h-7 w-7" onClick={async () => {
                    await setPrimaryImage(product.id, img.id, img.url);
                    qc.invalidateQueries({ queryKey: ["product", product.id] });
                    qc.invalidateQueries({ queryKey: ["products"] });
                  }}><Star className="h-3.5 w-3.5" /></Button>
                )}
                <Button size="icon" variant="destructive" className="h-7 w-7" onClick={async () => {
                  await deleteProductImage(img.id, img.storage_path);
                  qc.invalidateQueries({ queryKey: ["product", product.id] });
                }}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BatchesTab({ product }: { product: ProductWithRelations | undefined }) {
  const qc = useQueryClient();
  const [batch, setBatch] = useState({ batch_number: "", production_date: "", expiry_date: "", quantity: "" });
  if (!product) return null;
  const batches = product.batches ?? [];

  const add = async () => {
    if (!batch.expiry_date && !batch.batch_number) return toast.error("أدخل رقم الدفعة أو تاريخ الصلاحية");
    await addBatch({
      product_id: product.id,
      batch_number: batch.batch_number || null,
      production_date: batch.production_date || null,
      expiry_date: batch.expiry_date || null,
      quantity: Number(batch.quantity || 0),
    });
    toast.success("تمت إضافة الدفعة");
    setBatch({ batch_number: "", production_date: "", expiry_date: "", quantity: "" });
    qc.invalidateQueries({ queryKey: ["product", product.id] });
    qc.invalidateQueries({ queryKey: ["product-stats"] });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2 rounded-lg border p-3 md:grid-cols-5">
        <Input placeholder="رقم الدفعة" value={batch.batch_number} onChange={(e) => setBatch({ ...batch, batch_number: e.target.value })} />
        <Input type="date" placeholder="الإنتاج" value={batch.production_date} onChange={(e) => setBatch({ ...batch, production_date: e.target.value })} />
        <Input type="date" placeholder="الصلاحية" value={batch.expiry_date} onChange={(e) => setBatch({ ...batch, expiry_date: e.target.value })} />
        <Input type="number" placeholder="الكمية" value={batch.quantity} onChange={(e) => setBatch({ ...batch, quantity: e.target.value })} />
        <Button type="button" onClick={add}><Plus className="mr-1 h-4 w-4" />إضافة</Button>
      </div>

      {batches.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">لا توجد دفعات</p>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr><th className="p-2 text-start">رقم</th><th className="p-2 text-start">الإنتاج</th><th className="p-2 text-start">الصلاحية</th><th className="p-2 text-start">الكمية</th><th></th></tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="p-2">{b.batch_number ?? "—"}</td>
                  <td className="p-2">{b.production_date ?? "—"}</td>
                  <td className="p-2">{b.expiry_date ?? "—"}</td>
                  <td className="p-2">{b.quantity}</td>
                  <td className="p-2">
                    <Button size="icon" variant="ghost" onClick={async () => {
                      await deleteBatch(b.id);
                      qc.invalidateQueries({ queryKey: ["product", product.id] });
                    }}><X className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
