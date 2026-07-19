import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsBell } from "@/components/notifications-bell";
import { Button } from "@/components/ui/button";
import { GlobalSearch, useGlobalSearchHotkey } from "@/components/shared/global-search";
import { supabase } from "@/integrations/supabase/client";
import { LicenseBanner } from "@/components/license-banner";
import { useOrg } from "@/hooks/use-org";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { next: undefined } });
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  useGlobalSearchHotkey(() => setSearchOpen(true));
  const { readOnly, loading } = useOrg();
  useEffect(() => {
    document.body.classList.toggle("license-readonly", readOnly && !loading);
  }, [readOnly, loading]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-2 border-b bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="hidden gap-2 text-muted-foreground sm:inline-flex"
            >
              <Search className="h-4 w-4" />
              <span className="text-xs">بحث سريع...</span>
              <kbd className="pointer-events-none ml-2 hidden select-none rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono md:inline">⌘K</kbd>
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setSearchOpen(true)}>
                <Search className="h-4 w-4" />
              </Button>
              <NotificationsBell />
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </header>
          <LicenseBanner />
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </SidebarProvider>
  );
}

