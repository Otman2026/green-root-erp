import { Button, Input, Label, Card, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Settings as SettingsIcon, User as UserIcon, Languages, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Locale } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  isUsernameAvailable, normalizeUsername, suggestUsernames,
} from "@/lib/username-utils";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [uStatus, setUStatus] = useState<"idle" | "ok" | "taken">("idle");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("full_name,username,phone,email_optional").eq("id", user.id).maybeSingle();
      if (data) {
        setFullName(data.full_name ?? "");
        setUsername(data.username ?? "");
        setPhone(data.phone ?? "");
        setEmail(data.email_optional ?? user.email ?? "");
      }
    })();
  }, [user]);

  const checkUsername = async () => {
    const u = normalizeUsername(username);
    if (u.length < 3) { setUStatus("idle"); setSuggestions([]); return; }
    const ok = await isUsernameAvailable(u);
    if (ok) { setUStatus("ok"); setSuggestions([]); }
    else { setUStatus("taken"); setSuggestions(await suggestUsernames(u)); }
  };

  const saveProfile = async () => {
    if (!user) return;
    setBusy(true);
    const u = normalizeUsername(username);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName || null,
      username: u || null,
      phone: phone || null,
      email_optional: email || null,
      preferred_language: locale,
    }).eq("id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("auth.success"));
  };

  const changePassword = async () => {
    if (newPassword.length < 6) return toast.error("min 6");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("auth.success"));
    setNewPassword("");
  };

  const updateAuthEmail = async () => {
    if (!email) return;
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ email });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("auth.success"));
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <SettingsIcon className="h-6 w-6 text-primary" /> {t("nav.settings")}
      </h1>

      <Card className="p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><Languages className="h-5 w-5" /> {t("settings.language")}</h2>
        <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ar">العربية</SelectItem>
            <SelectItem value="fr">Français</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><Palette className="h-5 w-5" /> {t("settings.theme")}</h2>
        <ThemeToggle />
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><UserIcon className="h-5 w-5" /> {t("settings.account")}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t("auth.fullName")}</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("auth.username")}</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} onBlur={checkUsername} />
            {uStatus === "ok" && <p className="text-[11px] text-emerald-600">{t("auth.usernameAvailable")}</p>}
            {uStatus === "taken" && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2">
                <p className="text-[11px] text-destructive">{t("auth.usernameTaken")}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <Badge key={s} variant="secondary" className="cursor-pointer" onClick={() => { setUsername(s); setUStatus("idle"); }}>{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>{t("auth.phoneOptional")}</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("auth.emailOptional")}</Label>
            <div className="flex gap-2">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button variant="outline" onClick={updateAuthEmail} disabled={busy}>Auth</Button>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={saveProfile} disabled={busy}>{t("common.save")}</Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 font-semibold">{t("auth.password")}</h2>
        <div className="flex gap-2">
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••" />
          <Button onClick={changePassword} disabled={busy || newPassword.length < 6}>{t("common.save")}</Button>
        </div>
      </Card>
    </div>
  );
}
