import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CircleDollarSign, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { fmtMoney, toCSV, downloadFile } from "@/lib/format";
import { reportSupabaseErrors } from "@/lib/supabase-errors";

export const Route = createFileRoute("/_authenticated/debts")({ component: DebtsPage });

function DebtsPage() {
  const { t } = useI18n();
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [c, s] = await Promise.all([
        supabase.from("customers").select("id,name,phone,balance,credit_limit").gt("balance", 0).order("balance", { ascending: false }),
        supabase.from("suppliers").select("id,name,phone,balance").gt("balance", 0).order("balance", { ascending: false }),
      ]);
      reportSupabaseErrors("الديون", c, s);
      setCustomers((c.data ?? []) as any); setSuppliers((s.data ?? []) as any);
    })();
  }, []);

  const totalC = customers.reduce((s, r) => s + Number(r.balance ?? 0), 0);
  const totalS = suppliers.reduce((s, r) => s + Number(r.balance ?? 0), 0);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold"><CircleDollarSign className="h-6 w-6 text-primary" /> {t("debts.title")}</h1>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card className="p-4"><div className="text-sm text-muted-foreground">{t("debts.customers")}</div><div className="mt-2 text-2xl font-bold text-destructive">{fmtMoney(totalC)}</div></Card>
        <Card className="p-4"><div className="text-sm text-muted-foreground">{t("debts.suppliers")}</div><div className="mt-2 text-2xl font-bold text-destructive">{fmtMoney(totalS)}</div></Card>
      </div>

      <Tabs defaultValue="customers">
        <TabsList>
          <TabsTrigger value="customers">{t("debts.customers")}</TabsTrigger>
          <TabsTrigger value="suppliers">{t("debts.suppliers")}</TabsTrigger>
        </TabsList>
        <TabsContent value="customers">
          <div className="mb-3 flex justify-end"><Button variant="outline" onClick={() => downloadFile("customer-debts.csv", toCSV(customers))} className="gap-2"><Download className="h-4 w-4" /> {t("common.export")}</Button></div>
          <Card><Table>
            <TableHeader><TableRow><TableHead>{t("common.name")}</TableHead><TableHead>{t("common.phone")}</TableHead><TableHead>{t("customers.creditLimit")}</TableHead><TableHead>{t("customers.balance")}</TableHead><TableHead>{t("common.status")}</TableHead></TableRow></TableHeader>
            <TableBody>{customers.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
            : customers.map((c) => <TableRow key={c.id}><TableCell className="font-medium">{c.name}</TableCell><TableCell dir="ltr">{c.phone ?? "—"}</TableCell><TableCell className="font-mono">{fmtMoney(c.credit_limit)}</TableCell><TableCell className="font-mono text-destructive">{fmtMoney(c.balance)}</TableCell><TableCell>{Number(c.balance) > Number(c.credit_limit) ? <Badge variant="destructive">Over limit</Badge> : <Badge variant="secondary">OK</Badge>}</TableCell></TableRow>)}</TableBody>
          </Table></Card>
        </TabsContent>
        <TabsContent value="suppliers">
          <div className="mb-3 flex justify-end"><Button variant="outline" onClick={() => downloadFile("supplier-debts.csv", toCSV(suppliers))} className="gap-2"><Download className="h-4 w-4" /> {t("common.export")}</Button></div>
          <Card><Table>
            <TableHeader><TableRow><TableHead>{t("common.name")}</TableHead><TableHead>{t("common.phone")}</TableHead><TableHead>{t("common.balance")}</TableHead></TableRow></TableHeader>
            <TableBody>{suppliers.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
            : suppliers.map((s) => <TableRow key={s.id}><TableCell className="font-medium">{s.name}</TableCell><TableCell dir="ltr">{s.phone ?? "—"}</TableCell><TableCell className="font-mono text-destructive">{fmtMoney(s.balance)}</TableCell></TableRow>)}</TableBody>
          </Table></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
