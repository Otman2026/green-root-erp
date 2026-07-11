import { Link } from "@tanstack/react-router";
import { AlertTriangle, Clock, Lock } from "lucide-react";
import { useOrg } from "@/hooks/use-org";
import { cn } from "@/lib/utils";

export function LicenseBanner() {
  const { license, licenseActive, daysRemaining, org, loading } = useOrg();
  if (loading || !org) return null;

  // Read-only (expired / suspended / cancelled)
  if (!licenseActive) {
    return (
      <div className="flex items-center justify-between gap-2 border-b bg-destructive/10 px-4 py-2 text-sm text-destructive">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          <span>وضع القراءة فقط — انتهى الاشتراك أو الترخيص. يرجى التجديد للاستمرار.</span>
        </div>
        <Link to="/billing" className="rounded bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground hover:opacity-90">
          تجديد الاشتراك
        </Link>
      </div>
    );
  }

  // Trial or nearing expiry
  if (license?.is_trial || (daysRemaining !== null && daysRemaining <= 7)) {
    const warn = daysRemaining !== null && daysRemaining <= 3;
    return (
      <div className={cn(
        "flex items-center justify-between gap-2 border-b px-4 py-2 text-sm",
        warn ? "bg-orange-500/10 text-orange-700 dark:text-orange-300" : "bg-primary/10 text-primary"
      )}>
        <div className="flex items-center gap-2">
          {warn ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
          <span>
            {license?.is_trial ? "نسخة تجريبية — " : "الترخيص ينتهي قريباً — "}
            {daysRemaining !== null ? `متبقٍّ ${daysRemaining} يوم` : "نشطة"}
          </span>
        </div>
        <Link to="/billing" className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90">
          ترقية
        </Link>
      </div>
    );
  }

  return null;
}
