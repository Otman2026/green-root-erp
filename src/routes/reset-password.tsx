import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sprout } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/reset-password")({ component: ResetPage });

function ResetPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Supabase auto-processes the recovery hash and fires a PASSWORD_RECOVERY event.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pass.length < 6) return toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    if (pass !== confirm) return toast.error("كلمتا المرور غير متطابقتين");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pass });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("تم تحديث كلمة المرور"); navigate({ to: "/dashboard" }); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl gradient-primary text-primary-foreground">
            <Sprout className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">تعيين كلمة مرور جديدة</h1>
        </div>
        <Card className="p-6">
          {!ready ? (
            <p className="text-center text-sm text-muted-foreground">جاري التحقق من الرابط...</p>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="p1">كلمة المرور الجديدة</Label>
                <Input id="p1" type="password" required minLength={6} value={pass} onChange={(e) => setPass(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p2">تأكيد كلمة المرور</Label>
                <Input id="p2" type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>تحديث كلمة المرور</Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
