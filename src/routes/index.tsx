import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Activity,
  Ambulance,
  ArrowRight,
  Building2,
  Droplets,
  HeartPulse,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BloodDrop, BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { UGANDA_DISTRICTS } from "@/lib/uganda";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BloodNet+ | Uganda's real-time blood donation network" },
      {
        name: "description",
        content:
          "Find compatible blood in minutes. BloodNet+ links donors, hospitals and blood banks across Kampala, Gulu, Mbarara and every Ugandan district.",
      },
      { property: "og:title", content: "BloodNet+ | Uganda's blood donation network" },
      {
        property: "og:description",
        content:
          "Real-time emergency blood matching for Ugandan hospitals, blood banks and donors.",
      },
    ],
  }),
  component: Landing,
});

function useNetworkStats() {
  return useQuery({
    queryKey: ["public-stats"],
    queryFn: async () => {
      const [hospitals, banks, inventory] = await Promise.all([
        supabase.from("hospitals").select("id", { count: "exact", head: true }),
        supabase.from("blood_banks").select("id", { count: "exact", head: true }),
        supabase.from("blood_inventory").select("units"),
      ]);
      const units = (inventory.data ?? []).reduce((sum, row) => sum + (row.units ?? 0), 0);
      return {
        hospitals: hospitals.count ?? 0,
        banks: banks.count ?? 0,
        units,
      };
    },
  });
}

const FEATURES = [
  {
    icon: Ambulance,
    title: "Emergency mode",
    body: "Hospitals raise a request with blood type, units and patient condition. Donors and banks are alerted the instant it is saved.",
  },
  {
    icon: Sparkles,
    title: "AI donor locator",
    body: "Donors are scored 0-100 on compatibility, distance and eligibility, then an AI coordinator tells dispatch exactly who to call first.",
  },
  {
    icon: Droplets,
    title: "Live inventory",
    body: "Blood banks track units and expiry dates per blood group, visible nationwide the moment stock changes.",
  },
  {
    icon: ShieldCheck,
    title: "SOS broadcast",
    body: "One tap sends a critical alert to every donor, blood bank and hospital in the country \u2014 fully audit-logged.",
  },
];

function Landing() {
  const stats = useNetworkStats();
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 glass">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center">
            <BrandLogo size="sm" />
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth" search={{ mode: "signin" }}>
                Sign in
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link
                to={user ? "/dashboard" : "/auth"}
                search={user ? undefined : { mode: "signup" }}
              >
                {user ? "Open dashboard" : "Join the network"}
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-hero text-primary-foreground">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-10 size-80 rounded-full bg-primary/30 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.45, 0.75, 0.45] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 bottom-0 size-72 rounded-full bg-accent/25 blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-[1.15fr_0.85fr] md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-5 border-0 bg-white/15 text-primary-foreground backdrop-blur">
              <MapPin className="mr-1 size-3" /> Built for Uganda &middot; East Africa Time
            </Badge>
            <BrandLogo size="lg" className="mb-4 text-primary-foreground" />
            <h1 className="text-4xl font-extrabold leading-[1.05] md:text-6xl">
              Compatible blood, found in minutes &mdash; not hours.
            </h1>
            <p className="mt-5 max-w-xl text-base/relaxed opacity-85 md:text-lg">
              BloodNet+ is Uganda&rsquo;s nationwide blood coordination platform. Hospitals raise
              emergencies, our matching engine ranks the nearest eligible donors and blood banks,
              and everyone stays in sync in real time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Register your account <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-primary-foreground hover:bg-white/10"
              >
                <Link to="/auth" search={{ mode: "signin" }}>
                  I already have an account
                </Link>
              </Button>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4">
              <Stat label="Facilities" value={stats.data?.hospitals} icon={Building2} />
              <Stat label="Blood banks" value={stats.data?.banks} icon={Droplets} />
              <Stat label="Units tracked" value={stats.data?.units} icon={Activity} />
            </dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="glass rounded-3xl p-6 text-foreground"
          >
            <p className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <BloodDrop className="h-4 w-3" /> Live emergency feed
            </p>
            <LivePreview />
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-3xl font-bold md:text-4xl">One platform, four roles</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Donors, hospitals, blood banks and administrators each get their own workspace with
          permissions enforced at the database level.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              whileHover={{ y: -6 }}
            >
              <Card className="h-full border-border/60 transition-shadow hover:surface-lift">
                <CardContent className="pt-6">
                  <span className="mb-4 flex size-10 items-center justify-center rounded-xl bg-gradient-accent text-accent-foreground">
                    <feature.icon className="size-5" />
                  </span>
                  <h3 className="font-display text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-2xl font-bold">Covering districts across the country</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {UGANDA_DISTRICTS.map((d) => (
              <Badge key={d} variant="outline" className="rounded-full px-3 py-1 text-sm">
                {d}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-20 text-center">
        <motion.div
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <HeartPulse className="mx-auto size-10 text-primary" />
        </motion.div>
        <h2 className="mt-5 text-3xl font-bold md:text-4xl">Every unit is three lives.</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Join thousands of Ugandans making blood available where and when it is needed.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link to="/auth" search={{ mode: "signup" }}>
            <Users className="mr-1 size-4" /> Create your free account
          </Link>
        </Button>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        BloodNet+ Uganda &middot; Kampala &middot; All times in East Africa Time (EAT)
      </footer>
    </main>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | undefined;
  icon: typeof Activity;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
      <Icon className="size-4 opacity-70" />
      <dd className="mt-2 font-display text-2xl font-bold">{value ?? "\u2014"}</dd>
      <dt className="text-xs uppercase tracking-wide opacity-70">{label}</dt>
    </div>
  );
}

function LivePreview() {
  const { data } = useQuery({
    queryKey: ["public-emergency-preview"],
    queryFn: async () => {
      const { data } = await supabase
        .from("hospitals")
        .select("name, district")
        .eq("status", "approved")
        .limit(4);
      return data ?? [];
    },
  });

  return (
    <ul className="mt-4 space-y-3">
      {(data ?? []).map((h) => (
        <li
          key={h.name}
          className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
        >
          <div>
            <p className="text-sm font-semibold">{h.name}</p>
            <p className="text-xs text-muted-foreground">{h.district} District</p>
          </div>
          <Badge variant="secondary">Connected</Badge>
        </li>
      ))}
      {!data?.length && <li className="text-sm text-muted-foreground">Loading network&hellip;</li>}
    </ul>
  );
}
