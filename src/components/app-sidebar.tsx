import { useMemo, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, Search, X } from "lucide-react";
import logo from "@/assets/logo.png";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MODULES, GROUPS, type ModuleGroup } from "@/lib/modules";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { t, dir } = useI18n();
  const { signOut, user } = useAuth();
  const { has, isAdmin, loading } = useRoles();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [q, setQ] = useState("");

  const visibleModules = useMemo(() => {
    return MODULES.filter((m) => {
      // role gate — admin sees all; while roles loading, hide role-gated items
      if (m.roles && m.roles.length) {
        if (loading) return false;
        if (!isAdmin && !has(...m.roles)) return false;
      }
      // search filter
      if (q.trim()) {
        const label = t(m.labelKey).toLowerCase();
        if (!label.includes(q.trim().toLowerCase()) && !m.key.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [q, has, isAdmin, loading, t]);

  return (
    <Sidebar collapsible="icon" side={dir === "rtl" ? "right" : "left"}>
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
        {!collapsed && (
          <div className="relative px-2 pb-2">
            <Search className="pointer-events-none absolute top-1/2 -translate-y-1/2 h-4 w-4 opacity-60"
              style={{ [dir === "rtl" ? "right" : "left"]: "1.25rem" } as any} />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("common.search")}
              className={dir === "rtl" ? "pr-8" : "pl-8"}
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                style={{ [dir === "rtl" ? "left" : "right"]: "1.25rem" } as any}
                aria-label="clear"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {GROUPS.map((g) => {
          const items = visibleModules.filter((m) => m.group === g);
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
        {!collapsed && q && visibleModules.length === 0 && (
          <div className="px-4 py-6 text-center text-xs text-muted-foreground">
            {t("common.empty")}
          </div>
        )}
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

export type _Nav = `nav.group.${ModuleGroup}`;
