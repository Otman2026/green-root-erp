import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Edit, Plus, Trash2, Truck } from "lucide-react";
import { createSupplier, deleteSupplier, listSuppliers, updateSupplier, type Supplier } from "@/lib/products-api";

export function SuppliersManager() {
  const qc = useQueryClient();
  const { data: sups = [] } = useQuery({ queryKey: ["suppliers"], queryFn: listSuppliers });
  const [editing, setEditing] = useState<Supplier | "new" | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const saveMut = useMutation({
    mutationFn: async (v: Partial<Supplier> & { name: string }) => {
      if (editing && editing !== "new") return updateSupplier(editing.id, v);
      return createSupplier(v);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); toast.success("تم الحفظ"); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); toast.success("تم الحذف"); setDeleteId(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold"><Truck className="h-5 w-5" />الموردون</h3>
        <Button size="sm" onClick={() => setEditing("new")}><Plus className="mr-1 h-4 w-4" />مورد جديد</Button>
      </div>

      {sups.length === 0 ? (
        <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">لا يوجد موردون</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr><th className="p-2 text-start">الاسم</th><th className="p-2 text-start">جهة الاتصال</th><th className="p-2 text-start">الهاتف</th><th className="p-2 text-start">البريد</th><th className="p-2 text-start">المدينة</th><th className="p-2"></th></tr>
            </thead>
            <tbody>
              {sups.map((s) => (
                <tr key={s.id} className="border-t hover:bg-muted/30">
                  <td className="p-2 font-medium">{s.name}</td>
                  <td className="p-2">{s.contact_person ?? "—"}</td>
                  <td className="p-2">{s.phone ?? "—"}</td>
                  <td className="p-2">{s.email ?? "—"}</td>
                  <td className="p-2">{s.city ?? "—"}</td>
                  <td className="p-2">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(s)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <SupplierDialog
          initial={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSave={(v) => saveMut.mutate(v)}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>حذف المورد؟</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && delMut.mutate(deleteId)}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SupplierDialog({ initial, onClose, onSave }: { initial?: Supplier; onClose: () => void; onSave: (v: Partial<Supplier> & { name: string }) => void }) {
  const [f, setF] = useState({
    name: initial?.name ?? "", contact_person: initial?.contact_person ?? "",
    phone: initial?.phone ?? "", email: initial?.email ?? "",
    address: initial?.address ?? "", city: initial?.city ?? "",
    country: initial?.country ?? "", tax_number: initial?.tax_number ?? "",
    notes: initial?.notes ?? "",
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{initial ? "تعديل مورد" : "مورد جديد"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="اسم المورد *" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <Input placeholder="جهة الاتصال" value={f.contact_person} onChange={(e) => setF({ ...f, contact_person: e.target.value })} />
          <Input placeholder="الهاتف" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <Input placeholder="البريد الإلكتروني" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <Input placeholder="المدينة" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
          <Input placeholder="الدولة" value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} />
          <Input placeholder="الرقم الضريبي" value={f.tax_number} onChange={(e) => setF({ ...f, tax_number: e.target.value })} />
          <Input placeholder="العنوان" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
          <div className="md:col-span-2"><Textarea placeholder="ملاحظات" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={() => { if (!f.name) return toast.error("أدخل اسم المورد"); onSave(f); }}>حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
