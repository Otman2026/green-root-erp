import { Construction } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import type { AppModule } from "@/lib/modules";

export function ModulePlaceholder({ module: m }: { module: AppModule }) {
  const { t } = useI18n();
  const Icon = m.icon;
  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center gap-3">
        <div
          className="grid h-12 w-12 place-items-center rounded-xl"
          style={{ backgroundColor: `color-mix(in oklab, var(--color-mod-${m.color}) 15%, transparent)` }}
        >
          <Icon className="h-6 w-6" style={{ color: `var(--color-mod-${m.color})` }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t(m.labelKey)}</h1>
          <p className="text-sm text-muted-foreground">{t("common.comingSoon")}</p>
        </div>
      </div>

      <Card className="card-elevated mt-6 flex flex-col items-center gap-3 p-10 text-center">
        <div
          className="grid h-14 w-14 place-items-center rounded-full"
          style={{ backgroundColor: `color-mix(in oklab, var(--color-mod-${m.color}) 15%, transparent)` }}
        >
          <Construction className="h-6 w-6" style={{ color: `var(--color-mod-${m.color})` }} />
        </div>
        <p className="max-w-md text-sm text-muted-foreground">{t("common.underDev")}</p>
      </Card>
    </div>
  );
}
