import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { BookOpen, Sprout, ShieldAlert, Bug, FlaskConical } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/agri")({ component: AgriHub });

function AgriHub() {
  const { t } = useI18n();
  const cards = [
    { to: "/agri/plants", icon: Sprout, label: t("agri.plants") },
    { to: "/agri/diseases", icon: ShieldAlert, label: t("agri.diseases") },
    { to: "/agri/pests", icon: Bug, label: t("agri.pests") },
    { to: "/agri/treatments", icon: FlaskConical, label: t("agri.treatments") },
  ];
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="w-6 h-6" />
        <h1 className="text-2xl font-bold">{t("agri.title")}</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.to} to={c.to}>
            <Card className="p-6 hover:shadow-lg transition flex flex-col items-center gap-3 cursor-pointer">
              <c.icon className="w-10 h-10 text-primary" />
              <div className="font-semibold">{c.label}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
