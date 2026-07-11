import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import {
  Package, Users, Truck, ShoppingCart, Receipt, Sparkles, LayoutDashboard,
} from "lucide-react";
import { MODULES } from "@/lib/modules";
import { useI18n } from "@/lib/i18n";

type Result = {
  type: "product" | "customer" | "supplier" | "sale";
  id: string;
  label: string;
  sub?: string;
  to: string;
};

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    if (!q.trim() || q.trim().length < 2) { setResults([]); return; }
    const ctl = new AbortController();
    const term = q.trim();
    const like = `%${term}%`;
    (async () => {
      try {
        const [p, c, s, sa] = await Promise.all([
          supabase.from("products").select("id,name,name_ar,sku").or(`name.ilike.${like},name_ar.ilike.${like},sku.ilike.${like}`).limit(6),
          supabase.from("customers").select("id,name,phone").or(`name.ilike.${like},phone.ilike.${like}`).limit(6),
          supabase.from("suppliers").select("id,name,phone").or(`name.ilike.${like},phone.ilike.${like}`).limit(6),
          supabase.from("sales").select("id,invoice_number,total").ilike("invoice_number", like).limit(6),
        ]);
        if (ctl.signal.aborted) return;
        const out: Result[] = [];
        (p.data ?? []).forEach((r) => out.push({ type: "product", id: r.id, label: r.name_ar || r.name || "", sub: r.sku || "", to: "/products" }));
        (c.data ?? []).forEach((r) => out.push({ type: "customer", id: r.id, label: r.name || "", sub: r.phone || "", to: "/customers" }));
        (s.data ?? []).forEach((r) => out.push({ type: "supplier", id: r.id, label: r.name || "", sub: r.phone || "", to: "/suppliers" }));
        (sa.data ?? []).forEach((r) => out.push({ type: "sale", id: r.id, label: r.invoice_number || "", sub: `${r.total} MAD`, to: "/sales" }));
        setResults(out);
      } catch { /* ignore */ }
    })();
    return () => ctl.abort();
  }, [q]);

  const iconFor = (t: Result["type"]) =>
    t === "product" ? Package : t === "customer" ? Users : t === "supplier" ? Truck : Receipt;

  const goto = (to: string) => { onOpenChange(false); navigate({ to: to as never }); };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="ابحث عن منتج، عميل، مورد، فاتورة، أو صفحة..."
        value={q}
        onValueChange={setQ}
      />
      <CommandList>
        <CommandEmpty>لا نتائج</CommandEmpty>

        {results.length > 0 && (
          <>
            <CommandGroup heading="النتائج">
              {results.map((r) => {
                const Icon = iconFor(r.type);
                return (
                  <CommandItem key={`${r.type}-${r.id}`} onSelect={() => goto(r.to)}>
                    <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{r.label}</span>
                    {r.sub && <span className="text-xs text-muted-foreground">{r.sub}</span>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="التنقل السريع">
          <CommandItem onSelect={() => goto("/dashboard")}>
            <LayoutDashboard className="mr-2 h-4 w-4" />لوحة التحكم
          </CommandItem>
          <CommandItem onSelect={() => goto("/pos")}>
            <ShoppingCart className="mr-2 h-4 w-4" />نقطة البيع
          </CommandItem>
          <CommandItem onSelect={() => goto("/ai")}>
            <Sparkles className="mr-2 h-4 w-4" />التشخيص بالذكاء الاصطناعي
          </CommandItem>
          {MODULES.slice(0, 20).map((m) => (
            <CommandItem key={m.key} onSelect={() => goto(m.href)}>
              <m.icon className="mr-2 h-4 w-4" />
              {t(m.labelKey)}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function useGlobalSearchHotkey(onOpen: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onOpen]);
}
