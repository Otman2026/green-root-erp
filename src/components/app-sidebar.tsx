import { Link, useRouterState } from "@tanstack/react-router";
import { Sprout, LogOut } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { MODULES, GROUPS, type ModuleGroup } from "@/lib/modules";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { t } = useI18n();
  const { signOut, user } = useAuth();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg gradient-primary text-primary-foreground">
            <Sprout className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-bold">{t("app.name")}</span>
              <span className="truncate text-[10px] text-muted-foreground">ERP</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {GROUPS.map((g) => {
          const items = MODULES.filter((m) => m.group === g);
          if (!items.length) return null;
          return (
            <SidebarGroup key={g}>
              {!collapsed && <SidebarGroupLabel>{t(`nav.group.${g}` as const)}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((m) => {
                    const active = pathname === m.path;
                    const Icon = m.icon;
                    return (
                      <SidebarMenuItem key={m.key}>
                        <SidebarMenuButton asChild isActive={active} tooltip={t(m.labelKey)}>
                          <Link to={m.path} className="flex items-center gap-2">
                            <Icon
                              className="h-4 w-4 shrink-0"
                              style={{ color: `var(--color-mod-${m.color})` }}
                            />
                            {!collapsed && <span className="truncate">{t(m.labelKey)}</span>}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <div className="flex items-center justify-between gap-2 px-2 py-2">
          {!collapsed && (
            <div className="flex min-w-0 flex-col text-xs">
              <span className="truncate font-medium">{user?.email ?? "—"}</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={signOut} aria-label={t("auth.signOut")}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

// Group label helper — TypeScript sees `nav.group.${ModuleGroup}` literal keys.
export type _Nav = `nav.group.${ModuleGroup}`;
