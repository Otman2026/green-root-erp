import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  left?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Toolbar({ left, right, children, className }: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/50 px-3 py-2 backdrop-blur",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">{left ?? children}</div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}
