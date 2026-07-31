import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Loader2, Radio, Siren } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { BloodDrop } from "@/components/brand-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAccount, useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BLOOD_TYPES, formatEAT, timeLeft, type BloodType } from "@/lib/uganda";

export const Route = createFileRoute("/_authenticated/sos")({
  head: () => ({
    meta: [
      { title: "SOS broadcast | BloodNet+ Uganda" },
      {
        name: "description",
        content:
          "Hospitals broadcast an SOS blood alert to every donor, blood bank and hospital on the BloodNet+ network.",
      },
      { property: "og:title", content: "SOS broadcast | BloodNet+ Uganda" },
      {
        property: "og:description",
        content: "One-tap nationwide blood SOS alert for Ugandan hospitals.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { mode: "signin" } });

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (roleRow?.role !== "hospital") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: SosPage,
});

function SosPage() {
  const account = useAccount();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isHospital = account.data?.role === "hospital" && !!account.data?.hospitalId;

  const [bloodType, setBloodType] = useState<BloodType>("O-");
  const [units, setUnits] = useState("4");
  const [condition, setCondition] = useState("");
  const [hours, setHours] = useState("3");
  const [notes, setNotes] = useState("");

  const recent = useQuery({
    queryKey: ["sos-feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_requests")
        .select("id, blood_type, units_needed, patient_condition, status, needed_by, created_at, hospitals(name, district)")
        .eq("urgency", "critical")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  const broadcast = useMutation({
    mutationFn: async () => {
      if (!isHospital) throw new Error("Only verified hospitals can raise an SOS");
      if (condition.trim().length < 3) throw new Error("Describe the emergency");

      const { data: request, error } = await supabase
        .from("emergency_requests")
        .insert({
          hospital_id: account.data!.hospitalId,
          created_by: user!.id,
          blood_type: bloodType,
          units_needed: Math.max(1, Number(units) || 1),
          patient_condition: condition.trim(),
          urgency: "critical",
          notes: notes.trim() || null,
          needed_by: new Date(Date.now() + Number(hours) * 3600_000).toISOString(),
        })
        .select("id")
        .single();
      if (error) throw error;

      // Alert every account on the network: donors, blood banks and hospitals.
      const { data: everyone } = await supabase.from("profiles").select("id");
      const hospitalName = account.data?.hospitalName ?? "A hospital";
      if (everyone?.length) {
        await supabase.from("notifications").insert(
          everyone.map((p) => ({
            user_id: p.id,
            title: `SOS: ${bloodType} blood needed at ${hospitalName}`,
            body: `${units} units within ${hours}h. ${condition.trim()}`,
            kind: "sos",
            link: "/emergencies",
          })),
        );
      }

      await supabase.from("audit_logs").insert({
        actor_id: user!.id,
        action: "sos.broadcast",
        entity_type: "emergency_request",
        entity_id: request.id,
        meta: { blood_type: bloodType, units_needed: units, recipients: everyone?.length ?? 0 },
      });
      return everyone?.length ?? 0;
    },
    onSuccess: (count) => {
      toast.success(`SOS broadcast to ${count} accounts across Uganda`);
      setCondition("");
      setNotes("");
      qc.invalidateQueries({ queryKey: ["sos-feed"] });
      qc.invalidateQueries({ queryKey: ["emergencies"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Siren className="size-7 text-destructive" /> SOS broadcast
        </h1>
        <p className="text-sm text-muted-foreground">
          A critical alert delivered instantly to every donor, blood bank and hospital on the
          network.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="relative overflow-hidden border-destructive/40">
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-destructive/15 blur-2xl"
            animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BloodDrop className="h-6 w-5" /> Raise a critical alert
            </CardTitle>
            <CardDescription>
              {isHospital
                ? "Use only for life-threatening shortages. Every broadcast is audit-logged."
                : "Only verified hospital accounts can broadcast an SOS."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Blood type</Label>
                <Select value={bloodType} onValueChange={(v) => setBloodType(v as BloodType)}>
                  <SelectTrigger disabled={!isHospital}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_TYPES.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sos-units">Units needed</Label>
                <Input
                  id="sos-units"
                  type="number"
                  min={1}
                  max={50}
                  value={units}
                  disabled={!isHospital}
                  onChange={(e) => setUnits(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sos-condition">Emergency</Label>
              <Input
                id="sos-condition"
                maxLength={200}
                value={condition}
                disabled={!isHospital}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="Mass casualty road crash on Jinja Road"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sos-hours">Needed within (hours)</Label>
              <Input
                id="sos-hours"
                type="number"
                min={1}
                max={24}
                value={hours}
                disabled={!isHospital}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sos-notes">Notes</Label>
              <Textarea
                id="sos-notes"
                maxLength={500}
                value={notes}
                disabled={!isHospital}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button
              variant="destructive"
              size="lg"
              className="w-full"
              disabled={!isHospital || broadcast.isPending}
              onClick={() => broadcast.mutate()}
            >
              {broadcast.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Radio className="mr-2 size-4" />
              )}
              Broadcast SOS to the whole network
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent SOS alerts</CardTitle>
            <CardDescription>Critical requests raised across Uganda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(recent.data ?? []).map((r) => (
              <div key={r.id} className="rounded-xl border border-border p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">{r.blood_type}</Badge>
                  <p className="truncate text-sm font-semibold">{r.hospitals?.name}</p>
                  <Badge variant="outline" className="ml-auto">
                    {timeLeft(r.needed_by)}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.units_needed} units &middot; {r.patient_condition}
                </p>
                <p className="text-xs text-muted-foreground">{formatEAT(r.created_at)}</p>
              </div>
            ))}
            {recent.isSuccess && !recent.data?.length && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No SOS alerts raised yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}