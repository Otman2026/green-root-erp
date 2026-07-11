import type { LucideIcon, LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconProps extends Omit<LucideProps, "ref"> {
  as: LucideIcon;
  tone?: "default" | "muted" | "primary" | "success" | "warning" | "danger" | "info";
}

const TONE: Record<NonNullable<IconProps["tone"]>, string> = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  info: "text-info",
};

export function Icon({ as: C, tone = "default", className, size = 18, ...rest }: IconProps) {
  return <C size={size} className={cn(TONE[tone], className)} {...rest} />;
}
