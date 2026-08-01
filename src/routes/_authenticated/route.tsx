import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  Ambulance,
  Bell,
  Building2,
  CalendarClock,
  Compass,
  Droplets,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  ShieldCheck,
  Siren,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { BrandLogo } from "@/components/brand-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABEL, useAccount, useAuth, type AppRole } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { mode: "signin" } });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; roles: AppRole[] };

const NAV: NavItem[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["donor", "hospital", "blood_bank", "admin"],
  },
  {
    to: "/emergencies",
    label: "Emergencies",
    icon: Ambulance,
    roles: ["donor", "hospital", "blood_bank", "admin"],
  },
  {
    to: "/sos",
    label: "SOS broadcast",
    icon: Siren,
    roles: ["hospital"],
  },
  {
    to: "/locator",
    label: "AI donor locator",
    icon: Compass,
    roles: ["hospital", "blood_bank", "admin"],
  },
  {
    to: "/donors",
    label: "Donor network",
    icon: Users,
    roles: ["hospital", "blood_bank", "admin"],
  },
  { to: "/inventory", label: "Inventory", icon: Droplets, roles: ["blood_bank", "admin"] },
  {
    to: "/appointments",
    label: "Appointments",
    icon: CalendarClock,
    roles: ["donor", "hospital", "blood_bank", "admin"],
  },
  {
    to: "/directory",
    label: "Facilities map",
    icon: Building2,
    roles: ["donor", "hospital", "blood_bank", "admin"],
  },
  {
    to: "/messages",
    label: "Messages",
    icon: MessageSquare,
    roles: ["donor", "hospital", "blood_bank", "admin"],
  },
  {
    to: "/notifications",
    label: "Notifications",
    icon: Bell,
    roles: ["donor", "hospital", "blood_bank", "admin"],
  },
  { to: "/admin", label: "Administration", icon: ShieldCheck, roles: ["admin"] },
  {
    to: "/profile",
    label: "Profile & settings",
    icon: UserRound,
    roles: ["donor", "hospital", "blood_bank", "admin"],
  },
];

function AuthenticatedLayout() {
  const { user } = useAuth();
  const account = useAccount();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const role = account.data?.role ?? null;

  const unread = useQuery({
    queryKey: ["unread-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      return count ?? 0;
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["unread-count", user.id] });
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`sos-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as { kind?: string; title?: string; body?: string };
          if (row.kind !== "sos") return;
          toast.error(row.title ?? "SOS alert", {
            description: row.body,
            duration: 15000,
            action: { label: "Respond", onClick: () => navigate({ to: "/emergencies" }) },
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { mode: "signin" }, replace: true });
  }

  const items = NAV.filter((item) => (role ? item.roles.includes(role) : false));

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <Link to="/" className="flex h-16 items-center gap-2 px-5 font-display text-lg font-bold">
          <BrandLogo size="sm" />
        </Link>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main">
          {account.isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full bg-sidebar-accent" />
              ))
            : items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  activeProps={{
                    className:
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold bg-sidebar-accent text-sidebar-accent-foreground",
                  }}
                >
                  <item.icon className="size-4" />
                  {item.label}
                  {item.to === "/notifications" && (unread.data ?? 0) > 0 && (
                    <Badge className="ml-auto h-5 min-w-5 justify-center px-1">{unread.data}</Badge>
                  )}
                </Link>
              ))}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <p className="truncate text-sm font-medium">
            {account.data?.profile?.full_name || user?.email}
          </p>
          <p className="text-xs text-sidebar-foreground/60">
            {role ? ROLE_LABEL[role] : "Setting up\u2026"}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="mt-3 w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="mr-2 size-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:hidden">
          <Link to="/dashboard">
            <BrandLogo size="sm" />
          </Link>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={signOut}>
            <LogOut className="size-4" />
          </Button>
        </header>
        <nav
          className="flex gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2 md:hidden"
          aria-label="Sections"
        >
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground"
              activeProps={{
                className:
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          {account.isLoading ? <PageSkeleton /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
