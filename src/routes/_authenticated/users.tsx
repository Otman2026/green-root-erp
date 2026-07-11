import { Button, Input, Card, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Switch, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, Label } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserCog, Search, Archive, ArchiveRestore, ShieldCheck, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { createEmployee } from "@/lib/employees.functions";

export const Route = createFileRoute("/_authenticated/users")({ component: UsersPage });

const ROLES = [
  "admin","owner","branch_manager","warehouse_keeper","seller","cashier",
  "accountant","purchases_manager","sales_manager","delivery","customer_service","employee",
] as const;

type Role = typeof ROLES[number];

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  email_optional: string | null;
  phone: string | null;
  is_active: boolean;
  is_archived: boolean;
}

function UsersPage() {
  const { t } = useI18n();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Record<string, Role[]>>({});
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    const [p, r] = await Promise.all([
      supabase.from("profiles").select("id,full_name,username,email_optional,phone,is_active,is_archived").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    if (p.error) toast.error(p.error.message);
    if (r.error) toast.error(r.error.message);
    setProfiles((p.data ?? []) as Profile[]);
    const map: Record<string, Role[]> = {};
    (r.data ?? []).forEach((row: any) => {
      (map[row.user_id] ||= []).push(row.role);
    });
    setRoles(map);
  };
  useEffect(() => { load(); }, []);

  const filtered = profiles.filter((p) => {
    const s = q.toLowerCase();
    return !s || (p.username ?? "").toLowerCase().includes(s) || (p.full_name ?? "").toLowerCase().includes(s) || (p.email_optional ?? "").toLowerCase().includes(s);
  });

  const toggleActive = async (p: Profile) => {
    setBusyId(p.id);
    const { error } = await supabase.from("profiles").update({ is_active: !p.is_active }).eq("id", p.id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    load();
  };
  const toggleArchive = async (p: Profile) => {
    setBusyId(p.id);
    const { error } = await supabase.from("profiles").update({ is_archived: !p.is_archived }).eq("id", p.id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    load();
  };

  const addRole = async (userId: string, role: Role) => {
    if ((roles[userId] ?? []).includes(role)) return;
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) return toast.error(error.message);
    load();
  };
  const removeRole = async (userId: string, role: Role) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <UserCog className="h-6 w-6 text-primary" /> {t("users.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{profiles.length} {t("common.total")}</p>
        </div>
        <AddEmployeeDialog onCreated={load} />
      </div>

      <Card className="p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} className="ps-9" />
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("auth.username")}</TableHead>
              <TableHead>{t("auth.fullName")}</TableHead>
              <TableHead>{t("common.email")}</TableHead>
              <TableHead>{t("users.roles")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead className="text-end">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
            ) : filtered.map((p) => (
              <TableRow key={p.id} className={p.is_archived ? "opacity-60" : ""}>
                <TableCell className="font-mono text-xs">@{p.username ?? "—"}</TableCell>
                <TableCell>{p.full_name ?? "—"}</TableCell>
                <TableCell className="text-xs" dir="ltr">{p.email_optional ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-1">
                    {(roles[p.id] ?? []).map((r) => (
                      <Badge key={r} variant="secondary" className="cursor-pointer" onClick={() => removeRole(p.id, r)} title={t("common.delete")}>
                        <ShieldCheck className="me-1 h-3 w-3" />{t(`users.role.${r}`)} ×
                      </Badge>
                    ))}
                    <Select onValueChange={(v) => addRole(p.id, v as Role)}>
                      <SelectTrigger className="h-7 w-32 text-xs"><SelectValue placeholder={`+ ${t("common.add")}`} /></SelectTrigger>
                      <SelectContent>
                        {ROLES.filter((r) => !(roles[p.id] ?? []).includes(r)).map((r) => (
                          <SelectItem key={r} value={r}>{t(`users.role.${r}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch checked={p.is_active} disabled={busyId === p.id} onCheckedChange={() => toggleActive(p)} />
                    <span className="text-xs">{p.is_active ? t("common.active") : t("common.inactive")}</span>
                  </div>
                </TableCell>
                <TableCell className="text-end">
                  <Button size="icon" variant="ghost" onClick={() => toggleArchive(p)} title={p.is_archived ? "unarchive" : "archive"}>
                    {p.is_archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function AddEmployeeDialog({ onCreated }: { onCreated: () => void }) {
  const { t } = useI18n();
  const createFn = useServerFn(createEmployee);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    email: "", password: "", fullName: "", username: "", phone: "", role: "employee",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createFn({ data: form });
      toast.success("تم إنشاء حساب الموظف");
      setOpen(false);
      setForm({ email: "", password: "", fullName: "", username: "", phone: "", role: "employee" });
      onCreated();
    } catch (err: any) {
      toast.error(err?.message ?? "فشل الإنشاء");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><UserPlus className="me-2 h-4 w-4" /> {t("common.add") ?? "إضافة"} موظف</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>إضافة حساب موظف جديد</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>الاسم الكامل *</Label><Input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
          <div><Label>البريد الإلكتروني *</Label><Input required type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>كلمة السر * (8 أحرف على الأقل)</Label><Input required type="password" dir="ltr" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>اسم المستخدم</Label><Input dir="ltr" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
            <div><Label>الهاتف</Label><Input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div>
            <Label>الدور *</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button type="submit" disabled={busy}>{busy ? "جاري الإنشاء..." : "إنشاء الحساب"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
