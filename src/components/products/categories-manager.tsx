import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ChevronRight, Edit, FolderTree, Plus, Trash2 } from "lucide-react";
import { createCategory, deleteCategory, listCategories, updateCategory, type Category } from "@/lib/products-api";

interface Node extends Category { children: Node[] }

function buildTree(list: Category[], parent: string | null = null): Node[] {
  return list
    .filter((c) => c.parent_id === parent)
    .map((c) => ({ ...c, children: buildTree(list, c.id) }));
}

export function CategoriesManager() {
  const qc = useQueryClient();
  const { data: cats = [] } = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const tree = useMemo(() => buildTree(cats), [cats]);

  const [editing, setEditing] = useState<{ mode: "add" | "edit"; item?: Category; parentId?: string | null } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const saveMut = useMutation({
    mutationFn: async (v: { id?: string; name: string; name_ar: string; color: string; parent_id: string | null }) => {
      if (v.id) return updateCategory(v.id, { name: v.name, name_ar: v.name_ar || null, color: v.color, parent_id: v.parent_id });
      return createCategory({ name: v.name, name_ar: v.name_ar || null, color: v.color, parent_id: v.parent_id });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); toast.success("تم الحفظ"); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); toast.success("تم الحذف"); setDeleteId(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold"><FolderTree className="h-5 w-5" />التصنيفات</h3>
        <Button size="sm" onClick={() => setEditing({ mode: "add", parentId: null })}>
          <Plus className="mr-1 h-4 w-4" />تصنيف رئيسي
        </Button>
      </div>

      {tree.length === 0 ? (
        <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">لا توجد تصنيفات — أضف أول تصنيف</p>
      ) : (
        <div className="rounded-lg border p-2">
          {tree.map((n) => <TreeNode key={n.id} node={n} depth={0} onAdd={(pid) => setEditing({ mode: "add", parentId: pid })} onEdit={(c) => setEditing({ mode: "edit", item: c })} onDelete={setDeleteId} />)}
        </div>
      )}

      {editing && (
        <CategoryDialog
          open
          onOpenChange={(o) => !o && setEditing(null)}
          initial={editing.item}
          parentId={editing.parentId ?? editing.item?.parent_id ?? null}
          onSave={(v) => saveMut.mutate({ ...v, id: editing.item?.id })}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف التصنيف؟</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف جميع التصنيفات الفرعية المرتبطة به.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && delMut.mutate(deleteId)}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TreeNode({ node, depth, onAdd, onEdit, onDelete }: {
  node: Node; depth: number;
  onAdd: (pid: string) => void; onEdit: (c: Category) => void; onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <div className="group flex items-center gap-1 rounded px-2 py-1.5 hover:bg-muted/60" style={{ paddingInlineStart: `${depth * 16 + 8}px` }}>
        {node.children.length > 0 ? (
          <button type="button" onClick={() => setOpen(!open)} className="text-muted-foreground">
            <ChevronRight className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`} />
          </button>
        ) : <span className="inline-block w-4" />}
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: node.color || "hsl(var(--primary))" }} />
        <span className="flex-1 text-sm font-medium">{node.name_ar || node.name}</span>
        <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onAdd(node.id)}><Plus className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(node)}><Edit className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDelete(node.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
      {open && node.children.map((c) => <TreeNode key={c.id} node={c} depth={depth + 1} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} />)}
    </div>
  );
}

function CategoryDialog({ open, onOpenChange, initial, parentId, onSave }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  initial?: Category; parentId: string | null;
  onSave: (v: { name: string; name_ar: string; color: string; parent_id: string | null }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [nameAr, setNameAr] = useState(initial?.name_ar ?? "");
  const [color, setColor] = useState(initial?.color ?? "#22c55e");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "تعديل تصنيف" : "تصنيف جديد"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Input placeholder="الاسم بالعربية" value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
          <Input placeholder="Name (English)" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex items-center gap-2">
            <label className="text-sm">اللون</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-16 rounded border" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={() => { if (!name && !nameAr) return toast.error("أدخل الاسم"); onSave({ name: name || nameAr, name_ar: nameAr, color, parent_id: parentId }); }}>حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
