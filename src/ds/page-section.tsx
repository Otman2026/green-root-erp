import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface PageSectionProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  padded?: boolean;
}

export function PageSection({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  padded = true,
}: PageSectionProps) {
  return (
    <Card className={cn("card-elevated border-border/60", className)}>
      {(title || actions) && (
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div className="min-w-0">
            {title && <CardTitle className="truncate text-base">{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </CardHeader>
      )}
      <CardContent className={cn(padded ? "" : "p-0", bodyClassName)}>{children}</CardContent>
    </Card>
  );
}
