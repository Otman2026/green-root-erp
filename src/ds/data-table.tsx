import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "./empty-state";
import { LoadingState } from "./loading-state";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  className?: string;
  headClassName?: string;
  align?: "start" | "center" | "end";
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[] | undefined;
  loading?: boolean;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  emptyAction?: ReactNode;
  getRowKey?: (row: T, index: number) => string | number;
  onRowClick?: (row: T) => void;
  className?: string;
  dense?: boolean;
}

const ALIGN: Record<NonNullable<DataTableColumn<unknown>["align"]>, string> = {
  start: "text-start",
  center: "text-center",
  end: "text-end",
};

export function DataTable<T>({
  columns,
  rows,
  loading,
  emptyTitle,
  emptyDescription,
  emptyAction,
  getRowKey,
  onRowClick,
  className,
  dense,
}: DataTableProps<T>) {
  if (loading) return <LoadingState />;
  if (!rows || rows.length === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
    );
  }
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border/60 bg-card", className)}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead
                  key={c.key}
                  className={cn(
                    c.align && ALIGN[c.align],
                    c.headClassName,
                  )}
                >
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow
                key={getRowKey ? getRowKey(row, i) : i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && "cursor-pointer")}
              >
                {columns.map((c) => (
                  <TableCell
                    key={c.key}
                    className={cn(
                      dense ? "py-2" : "py-3",
                      c.align && ALIGN[c.align],
                      c.className,
                    )}
                  >
                    {c.cell(row, i)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
