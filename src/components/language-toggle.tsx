import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n, type Locale } from "@/lib/i18n";

const OPTIONS: { value: Locale; label: string; native: string }[] = [
  { value: "ar", label: "العربية", native: "ع" },
  { value: "fr", label: "Français", native: "FR" },
  { value: "en", label: "English", native: "EN" },
];

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();
  const current = OPTIONS.find((o) => o.value === locale) ?? OPTIONS[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Languages className="h-4 w-4" />
          <span className="text-xs font-semibold">{current.native}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPTIONS.map((o) => (
          <DropdownMenuItem
            key={o.value}
            onClick={() => setLocale(o.value)}
            className={locale === o.value ? "bg-accent" : ""}
          >
            <span className="me-2 text-xs font-bold">{o.native}</span>
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
