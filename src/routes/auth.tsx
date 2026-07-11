import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useI18n } from "@/lib/i18n";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import {
  isUsernameAvailable, suggestUsernames, loginIdentifierToEmail,
  normalizeUsername, usernameToEmail,
} from "@/lib/username-utils";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // sign in
  const [identifier, setIdentifier] = useState("");
  const [inPassword, setInPassword] = useState("");

  // sign up
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [upEmail, setUpEmail] = useState("");
  const [upPhone, setUpPhone] = useState("");
  const [upPassword, setUpPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const [uStatus, setUStatus] = useState<"idle" | "checking" | "ok" | "taken">("idle");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  // Debounced username availability + suggestions
  useEffect(() => {
    const u = normalizeUsername(username);
    if (u.length < 3) { setUStatus("idle"); setSuggestions([]); return; }
    setUStatus("checking");
    const timer = setTimeout(async () => {
      const ok = await isUsernameAvailable(u);
      if (ok) { setUStatus("ok"); setSuggestions([]); }
      else {
        setUStatus("taken");
        const s = await suggestUsernames(u);
        setSuggestions(s);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [username]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const uname = normalizeUsername(identifier);
    const { data: allowed } = await supabase.rpc("check_rate_limit" as any, { _username: uname, _max_attempts: 5, _window_minutes: 15 });
    if (allowed === false) {
      setBusy(false);
      toast.error(t("auth.rateLimited") || "تم حظرك مؤقتاً بسبب محاولات متكررة. حاول بعد 15 دقيقة.");
      return;
    }
    const primaryEmail = loginIdentifierToEmail(identifier);
    let { error } = await supabase.auth.signInWithPassword({ email: primaryEmail, password: inPassword });

    // Fallback: if signing in with a username, also try the real email stored on the profile.
    if (error && !identifier.includes("@")) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("email_optional")
        .ilike("username", uname)
        .maybeSingle();
      if (prof?.email_optional) {
        const retry = await supabase.auth.signInWithPassword({ email: prof.email_optional, password: inPassword });
        error = retry.error;
      }
    }

    await supabase.rpc("log_auth_attempt" as any, { _username: uname, _success: !error, _ip: null });
    setBusy(false);
    if (error) toast.error(error.message);
    else navigate({ to: "/dashboard" });
  };


  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = normalizeUsername(username);
    if (u.length < 3) { toast.error(t("auth.usernameHint")); return; }
    if (uStatus === "taken") { toast.error(t("auth.usernameTaken")); return; }
    setBusy(true);
    const email = upEmail.trim() || usernameToEmail(u);
    const { error } = await supabase.auth.signUp({
      email,
      password: upPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: fullName || u,
          username: u,
          phone: upPhone || null,
          preferred_language: locale,
        },
      },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(t("auth.success")); navigate({ to: "/dashboard" }); }
  };

  const google = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) toast.error(res.error.message);
    else if (!res.redirected) navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="absolute top-4 end-4 flex gap-1">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white p-2 shadow-md ring-1 ring-border">
            <img src={logo} alt="Haytam AGRI" className="h-full w-full object-contain" width={64} height={64} />
          </div>
          <h1 className="mt-4 text-2xl font-bold">{t("auth.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.subtitle")}</p>
        </div>

        <Card className="card-elevated p-6">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t("auth.signIn")}</TabsTrigger>
              <TabsTrigger value="signup">{t("auth.signUp")}</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-4">
              <form onSubmit={signIn} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="in-id">{t("auth.usernameOrEmail")}</Label>
                  <Input id="in-id" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="in-pass">{t("auth.password")}</Label>
                  <Input id="in-pass" type="password" required value={inPassword} onChange={(e) => setInPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>{t("auth.signIn")}</Button>
                <div className="text-center">
                  <a href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary hover:underline">
                    نسيت كلمة المرور؟
                  </a>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-4">
              <form onSubmit={signUp} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="up-name">{t("auth.fullName")}</Label>
                  <Input id="up-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="up-user">{t("auth.username")} *</Label>
                  <div className="relative">
                    <Input
                      id="up-user"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="haytam_agri"
                    />
                    {uStatus === "checking" && (
                      <Loader2 className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{t("auth.usernameHint")}</p>
                  {uStatus === "ok" && (
                    <p className="text-[11px] text-emerald-600">{t("auth.usernameAvailable")}</p>
                  )}
                  {uStatus === "taken" && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2">
                      <p className="text-[11px] text-destructive">{t("auth.usernameTaken")}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {suggestions.map((s) => (
                          <Badge
                            key={s}
                            variant="secondary"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                            onClick={() => setUsername(s)}
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="up-email">{t("auth.emailOptional")}</Label>
                    <Input id="up-email" type="email" value={upEmail} onChange={(e) => setUpEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="up-phone">{t("auth.phoneOptional")}</Label>
                    <Input id="up-phone" type="tel" value={upPhone} onChange={(e) => setUpPhone(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="up-pass">{t("auth.password")}</Label>
                  <Input id="up-pass" type="password" required minLength={6} value={upPassword} onChange={(e) => setUpPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={busy || uStatus === "taken" || uStatus === "checking"}>
                  {t("auth.signUp")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>{t("auth.or")}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full gap-2" onClick={google}>
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            {t("auth.google")}
          </Button>
        </Card>
      </div>
    </div>
  );
}
