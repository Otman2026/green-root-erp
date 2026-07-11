import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Percent, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/accounting/taxes")({
  component: TaxesPage,
});

interface TaxRow {
  id: string;
  name: string;
  rate: number;
  is_default: boolean;
  is_active: boolean;
}

function TaxesPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<TaxRow[]>([]);
  const [name, setName] = useState("");
  const [rate, setRate] = useState("20");
  const [isDefault, setIsDefault] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("tax_rates")
      .select("*")
      .order("created_at", { ascending: false });
    setRows(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!name.trim()) return;
    const r = Number(rate);
    if (Number.isNaN(r)) return;
    const { error } = await supabase
      .from("tax_rates")
      .insert({ name: name.trim(), rate: r, is_default: isDefault, is_active: true });
    if (error) return toast.error(error.message);
    setName("");
    setRate("20");
    setIsDefault(false);
    toast.success("✓");
    load();
  };

  const toggle = async (id: string, field: "is_active" | "is_default", val: boolean) => {
    const { error } = await supabase.from("tax_rates").update({ [field]: val }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("tax_rates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Percent className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{t("acc.taxes")}</h1>
      </div>

      <Card className="grid grid-cols-1 gap-3 p-4 md:grid-cols-[1fr_140px_140px_auto]">
        <div>
          <Label>{t("acc.taxName")}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="TVA 20%" />
        </div>
        <div>
          <Label>{t("acc.rate")}</Label>
          <Input type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
        </div>
        <div className="flex flex-col justify-end">
          <Label>{t("acc.default")}</Label>
          <div className="pt-2">
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
          </div>
        </div>
        <div className="flex items-end">
          <Button onClick={add} className="w-full">
            <Plus className="me-1 h-4 w-4" /> {t("common.add")}
          </Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("acc.taxName")}</TableHead>
              <TableHead>{t("acc.rate")}</TableHead>
              <TableHead>{t("acc.default")}</TableHead>
              <TableHead>{t("acc.active")}</TableHead>
              <TableHead className="text-end">—</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.name}</TableCell>
                <TableCell>{Number(r.rate).toFixed(2)} %</TableCell>
                <TableCell>
                  <Switch
                    checked={r.is_default}
                    onCheckedChange={(v) => toggle(r.id, "is_default", v)}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={r.is_active}
                    onCheckedChange={(v) => toggle(r.id, "is_active", v)}
                  />
                </TableCell>
                <TableCell className="text-end">
                  <Button variant="ghost" size="icon" onClick={() => remove(r.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  {t("common.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
