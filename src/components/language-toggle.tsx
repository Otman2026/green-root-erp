import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
      className="gap-2"
    >
      <Languages className="h-4 w-4" />
      <span className="text-xs font-semibold">{locale === "ar" ? "EN" : "ع"}</span>
    </Button>
  );
}
