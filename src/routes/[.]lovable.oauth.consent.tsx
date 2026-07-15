import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Typed wrapper for the beta `supabase.auth.oauth` namespace.
type OAuthResult = {
  data: {
    client?: { name?: string; client_uri?: string } | null;
    redirect_url?: string | null;
    redirect_to?: string | null;
    scope?: string | null;
    requested_scopes?: string[] | null;
  } | null;
  error: { message: string } | null;
};
function oauthApi() {
  return (supabase.auth as unknown as {
    oauth: {
      getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
      approveAuthorization: (id: string) => Promise<OAuthResult>;
      denyAuthorization: (id: string) => Promise<OAuthResult>;
    };
  }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/auth", search: { next } as never });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate } as never);
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="max-w-md p-6 text-center">
        <h1 className="text-lg font-semibold">تعذر تحميل طلب التفويض</h1>
        <p className="mt-2 text-sm text-muted-foreground">{String((error as Error)?.message ?? error)}</p>
      </Card>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState<null | "approve" | "deny">(null);
  const [error, setError] = useState<string | null>(null);

  const clientName = details?.client?.name ?? "تطبيق خارجي";

  async function decide(approve: boolean) {
    setError(null);
    setBusy(approve ? "approve" : "deny");
    const api = oauthApi();
    const { data, error } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (error) {
      setBusy(null);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(null);
      setError("لم يُرجع خادم التفويض عنوان توجيه.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6" dir="rtl">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-xl font-bold">ربط {clientName} بحسابك</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          سيتمكّن <strong>{clientName}</strong> من استخدام تطبيق Haytam AGRI نيابةً عنك:
          البحث في المنتجات والعملاء والموردين، مراجعة المبيعات، وإضافة عملاء جدد.
          الوصول يخضع لصلاحياتك داخل التطبيق ولن يتجاوزها.
        </p>
        {error && (
          <p role="alert" className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
            {error}
          </p>
        )}
        <div className="mt-6 flex gap-2">
          <Button className="flex-1" disabled={!!busy} onClick={() => decide(true)}>
            {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : "السماح"}
          </Button>
          <Button variant="outline" className="flex-1" disabled={!!busy} onClick={() => decide(false)}>
            {busy === "deny" ? <Loader2 className="h-4 w-4 animate-spin" /> : "رفض"}
          </Button>
        </div>
      </Card>
    </main>
  );
}
