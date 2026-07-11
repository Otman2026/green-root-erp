# Haytam AGRI — Design System (`@/ds`)

مصدر واحد لكل مكوّنات الواجهة. **يُمنع** استخدام ألوان/أزرار/جداول/نوافذ خارج هذا النظام في أي صفحة جديدة.

## القاعدة الذهبية
```ts
// ✅ صحيح
import { Button, PageHeader, DataTable, EmptyState } from "@/ds";

// ❌ خطأ
import { Button } from "@/components/ui/button"; // استخدم @/ds
<div className="bg-[#22c55e]">…</div>            // استخدم tokens: bg-success
```

## المحتوى
- **Tokens** — في `src/styles.css` (primary, success, warning, danger, info, mod-*).
- **Primitives** — Button, Input, Textarea, Select, Checkbox, Switch, Label, Badge (تغليف shadcn).
- **Layout** — `PageHeader`, `PageSection`, `Toolbar`, `AppShell`.
- **Data** — `DataTable`, `StatCard`, `KpiCard`, `ChartCard`.
- **Feedback** — `Alert`, `ConfirmDialog`, `EmptyState`, `LoadingState`, `ErrorState`, `StatusBadge`, `toast`.
- **Icons** — `Icon` (تغليف lucide-react بحجم/لون موحّد).

## الألوان الدلالية
| Token | Class |
|---|---|
| primary | `bg-primary text-primary-foreground` |
| success | `bg-success text-success-foreground` |
| warning | `bg-warning text-warning-foreground` |
| info    | `bg-info text-info-foreground` |
| danger  | `bg-destructive text-destructive-foreground` |
