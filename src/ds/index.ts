/**
 * Haytam AGRI — Design System entry point.
 * IMPORTANT: كل صفحات ووحدات التطبيق يجب أن تستورد UI من هنا فقط.
 * لا تستورد مباشرة من `@/components/ui/*` في الصفحات الجديدة.
 */

// Primitives (wrappers over shadcn)
export { Button, buttonVariants } from "@/components/ui/button";
export { Input } from "@/components/ui/input";
export { Textarea } from "@/components/ui/textarea";
export { Label } from "@/components/ui/label";
export { Checkbox } from "@/components/ui/checkbox";
export { Switch } from "@/components/ui/switch";
export { Badge } from "@/components/ui/badge";
export { Separator } from "@/components/ui/separator";
export { Skeleton } from "@/components/ui/skeleton";
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
export { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
export { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
export { Progress } from "@/components/ui/progress";
export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
export { toast } from "sonner";

// DS composites
export { Icon } from "./icon";
export { PageHeader } from "./page-header";
export { PageSection } from "./page-section";
export { Toolbar } from "./toolbar";
export { EmptyState } from "./empty-state";
export { LoadingState } from "./loading-state";
export { ErrorState } from "./error-state";
export { StatusBadge } from "./status-badge";
export { ConfirmDialog } from "./confirm-dialog";
export { DataTable } from "./data-table";
export { StatCard } from "./stat-card";
export { ChartCard } from "./chart-card";
export { KpiCard } from "@/components/shared/kpi-card";
