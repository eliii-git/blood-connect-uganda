import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity, Ambulance, Droplets, HeartPulse, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABEL, useAccount } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatEAT, timeLeft } from "@/lib/uganda";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | BloodNet+ Uganda" },
      { name: "description", content: "Your live BloodNet+ Uganda workspace." },
      { property: "og:title", content: "Dashboard | BloodNet+ Uganda" },
      { property: "og:description", content: "Your live BloodNet+ Uganda workspace." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const account = useAccount();
  const role = account.data?.role;

  const stats = useQuery({
    queryKey: ["dashboard-stats", role],
    queryFn: async () => {
      const [open, donors, banks, units] = await Promise.all([
        supabase
          .from("emergency_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "open"),
        supabase.from("donors").select("id", { count: "exact", head: true }),
        supabase.from("blood_banks").select("id", { count: "exact", head: true }),
        supabase.from("blood_inventory").select("units"),
      ]);
      return {
        open: open.count ?? 0,
        donors: donors.count ?? 0,
        banks: banks.count ?? 0,
        units: (units.data ?? []).reduce((s, r) => s + (r.units ?? 0), 0),
      };
    },
  });

  const emergencies = useQuery({
    queryKey: ["dashboard-emergencies"],
    queryFn: async () => {
      const { data } = await supabase
        .from("emergency_requests")
        .select(
          "id, blood_type, units_needed, urgency, needed_by, created_at, hospitals(name, district)",
        )
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-muted-foreground">
          {role ? ROLE_LABEL[role] : ""} workspace &middot; East Africa Time
        </p>
        <h1 className="text-3xl font-bold">
          Hello, {account.data?.profile?.full_name?.split(" ")[0] || "there"}
        </h1>
        {account.data?.orgStatus === "pending" && (
          <Badge variant="outline" className="mt-2 border-primary text-primary">
            Awaiting administrator approval
          </Badge>
        )}
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Ambulance} label="Open emergencies" value={stats.data?.open} />
        <StatCard icon={Users} label="Registered donors" value={stats.data?.donors} />
        <StatCard icon={Droplets} label="Units in stock" value={stats.data?.units} />
        <StatCard icon={Activity} label="Blood banks" value={stats.data?.banks} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Live emergency feed</CardTitle>
            <CardDescription>Open requests across Uganda, newest first.</CardDescription>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/emergencies">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {(emergencies.data ?? []).map((e) => (
            <div
              key={e.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-4"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-primary font-display text-sm font-bold text-primary-foreground">
                {e.blood_type}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {e.hospitals?.name ?? "Unknown facility"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {e.units_needed} units &middot; {e.hospitals?.district} &middot;{" "}
                  {formatEAT(e.created_at)}
                </p>
              </div>
              <Badge variant={e.urgency === "critical" ? "destructive" : "secondary"}>
                {e.urgency}
              </Badge>
              <Badge variant="outline">{timeLeft(e.needed_by)}</Badge>
            </div>
          ))}
          {emergencies.isSuccess && !emergencies.data?.length && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              <HeartPulse className="mx-auto mb-2 size-6" /> No open emergencies right now.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: number | undefined;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Icon className="size-5 text-primary" />
        <p className="mt-3 font-display text-3xl font-bold">{value ?? "\u2014"}</p>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
