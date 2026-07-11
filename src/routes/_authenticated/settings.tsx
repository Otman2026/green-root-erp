import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";
import { MODULES } from "@/lib/modules";
export const Route = createFileRoute("/_authenticated/settings")({
  component: () => <ModulePlaceholder module={MODULES.find((m) => m.key === "settings")!} />,
});
