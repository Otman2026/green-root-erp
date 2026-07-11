import { useOrg } from "@/hooks/use-org";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { forwardRef, type ReactNode } from "react";

/**
 * Button that auto-disables when the organization's license is inactive (read-only mode).
 * Use as a drop-in replacement for <Button> on any add/save/delete/edit action.
 */
export const WriteButton = forwardRef<HTMLButtonElement, ButtonProps>(function WriteButton(
  { disabled, children, ...props },
  ref,
) {
  const { readOnly, loading } = useOrg();
  const { t } = useI18n();
  const blocked = readOnly && !loading;
  const btn = (
    <Button ref={ref} disabled={blocked || disabled} {...props}>
      {blocked ? <Lock className="h-4 w-4 me-2" /> : null}
      {children}
    </Button>
  );
  if (!blocked) return btn;
  return (
    <Tooltip>
      <TooltipTrigger asChild><span className="inline-block">{btn}</span></TooltipTrigger>
      <TooltipContent>{t("license.readonly.tooltip") || "الترخيص منتهي — وضع القراءة فقط"}</TooltipContent>
    </Tooltip>
  );
});

/** Wrapper that hides its children entirely when the license is inactive. */
export function WriteOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { readOnly, loading } = useOrg();
  if (readOnly && !loading) return <>{fallback}</>;
  return <>{children}</>;
}
