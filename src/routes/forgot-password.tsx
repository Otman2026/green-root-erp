import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Sprout } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { loginIdentifierToEmail } from "@/lib/username-utils";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPage });

function ForgotPage() {
  const [identifier, setIdentifier] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const email = loginIdentifierToEmail(identifier);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else { setSent(true); toast.success("تم إرسال رابط إعادة التعيين"); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl gradient-primary text-primary-foreground">
            <Sprout className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">استرجاع كلمة المرور</h1>
          <p className="mt-1 text-sm text-muted-foreground">أدخل اسم المستخدم أو البريد الإلكتروني</p>
        </div>
        <Card className="p-6">
          {sent ? (
            <div className="space-y-3 text-center">
              <p className="text-sm">تحقق من بريدك الإلكتروني لإكمال إعادة تعيين كلمة المرور.</p>
              <Link to="/auth" search={{ next: undefined }} className="text-sm text-primary underline">العودة لتسجيل الدخول</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="id">اسم المستخدم أو البريد الإلكتروني</Label>
                <Input id="id" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>إرسال رابط الاسترجاع</Button>
              <div className="text-center">
                <Link to="/auth" search={{ next: undefined }} className="text-xs text-muted-foreground hover:underline">العودة لتسجيل الدخول</Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
