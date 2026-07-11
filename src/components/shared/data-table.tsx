import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight,
  Columns3, Download, FileText, Printer, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { exportToCSV, exportToExcel, exportToPDF, printTable } from "@/lib/export-utils";

export type Column<T> = {
  key: string;
  header: string;
  accessor: (row: T) => string | number | null | undefined | ReactNode;
  sortValue?: (row: T) => string | number;
  exportValue?: (row: T) => string | number;
  className?: string;
  sortable?: boolean;
  hideable?: boolean;
  defaultHidden?: boolean;
};

type Props<T> = {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  exportName?: string;
  exportTitle?: string;
  pageSize?: number;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  rightSlot?: ReactNode;
  emptyMessage?: string;
};

export function DataTable<T>({
  data, columns, isLoading, searchable = true, searchKeys,
  exportName = "export", exportTitle = "Export",
  pageSize: initialPageSize = 25, rowKey, onRowClick, rightSlot,
  emptyMessage = "لا توجد بيانات",
}: Props<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [hidden, setHidden] = useState<Set<string>>(
    () => new Set(columns.filter((c) => c.defaultHidden).map((c) => c.key)),
  );

  const visibleCols = columns.filter((c) => !hidden.has(c.key));

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.trim().toLowerCase();
    return data.filter((row) => {
      if (searchKeys?.length) {
        return searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(q));
      }
      return columns.some((c) => {
        const v = c.sortValue ? c.sortValue(row) : c.accessor(row);
        return typeof v !== "object" && String(v ?? "").toLowerCase().includes(q);
      });
    });
  }, [data, search, searchKeys, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filtered;
    const get = col.sortValue ?? ((r: T) => {
      const v = col.accessor(r);
      return typeof v === "string" || typeof v === "number" ? v : "";
    });
    return [...filtered].sort((a, b) => {
      const av = get(a) as string | number;
      const bv = get(b) as string | number;
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const buildExportRows = () => {
    return sorted.map((row) => {
      const obj: Record<string, string | number> = {};
      visibleCols.forEach((c) => {
        const v = c.exportValue ? c.exportValue(row) : c.sortValue ? c.sortValue(row) : (c.accessor(row) as string | number);
        obj[c.header] = typeof v === "string" || typeof v === "number" ? v : "";
      });
      return obj;
    });
  };
  const buildExportTable = () => {
    const headers = visibleCols.map((c) => c.header);
    const rows = sorted.map((row) =>
      visibleCols.map((c) => {
        const v = c.exportValue ? c.exportValue(row) : c.sortValue ? c.sortValue(row) : (c.accessor(row) as string | number);
        return typeof v === "string" || typeof v === "number" ? v : "";
      }),
    );
    return { headers, rows };
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        {searchable && (
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-2.5" />
            <Input
              placeholder="بحث..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="ps-9"
            />
          </div>
        )}
        {rightSlot}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Columns3 className="h-4 w-4" />الأعمدة
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>إظهار/إخفاء</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns.filter((c) => c.hideable !== false).map((c) => (
              <DropdownMenuCheckboxItem
                key={c.key}
                checked={!hidden.has(c.key)}
                onCheckedChange={(v) => {
                  const next = new Set(hidden);
                  if (v) next.delete(c.key); else next.add(c.key);
                  setHidden(next);
                }}
              >
                {c.header}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Download className="h-4 w-4" />تصدير
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => exportToExcel(buildExportRows(), exportName)}>
              <FileText className="mr-2 h-4 w-4" />Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportToCSV(buildExportRows(), exportName)}>
              <FileText className="mr-2 h-4 w-4" />CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              const { headers, rows } = buildExportTable();
              exportToPDF(exportTitle, headers, rows, exportName);
            }}>
              <FileText className="mr-2 h-4 w-4" />PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              const { headers, rows } = buildExportTable();
              printTable(exportTitle, headers, rows);
            }}>
              <Printer className="mr-2 h-4 w-4" />طباعة
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleCols.map((c) => (
                <TableHead key={c.key} className={cn(c.className)}>
                  {c.sortable !== false ? (
                    <button
                      className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
                      onClick={() => toggleSort(c.key)}
                    >
                      {c.header}
                      {sortKey === c.key ? (
                        sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  ) : c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {visibleCols.map((c) => (
                    <TableCell key={c.key}><div className="h-4 w-full animate-pulse rounded bg-muted" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleCols.length} className="p-8 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  className={cn(onRowClick && "cursor-pointer hover:bg-muted/40")}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {visibleCols.map((c) => (
                    <TableCell key={c.key} className={cn(c.className)}>{c.accessor(row) as ReactNode}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t p-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>
            {sorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            {" – "}
            {Math.min(currentPage * pageSize, sorted.length)} من {sorted.length}
          </span>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="h-8 w-[80px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="px-2 tabular-nums">{currentPage} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
