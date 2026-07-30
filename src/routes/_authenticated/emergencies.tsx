import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Ambulance, Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

export const Route = createFileRoute("/_authenticated/emergencies")({
  head: () => ({
    meta: [
      { title: "Emergency requests | BloodNet+ Uganda" },
      {
        name: "description",
        content: "Live emergency blood requests from Ugandan hospitals, with real-time responses.",
      },
      { property: "og:title", content: "Emergency requests | BloodNet+ Uganda" },
      { property: "og:description", content: "Live emergency blood requests across Uganda." },
    ],
  }),
  component: Emergencies,
});

function Emergencies() {
  const account = useAccount();
  const { user } = useAuth();
  const qc = useQueryClient();
  const role = account.data?.role;

  const list = useQuery({
    queryKey: ["emergencies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_requests")
        .select(
          "id, blood_type, units_needed, units_received, patient_condition, urgency, notes, status, needed_by, created_at, created_by, hospitals(name, district, phone)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("emergency-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "emergency_requests" }, () => {
        qc.invalidateQueries({ queryKey: ["emergencies"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const respond = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.from("emergency_responses").insert({
        request_id: requestId,
        donor_id: account.data?.donorId ?? null,
        blood_bank_id: account.data?.bloodBankId ?? null,
        responder_user_id: user!.id,
        status: "accepted",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Response sent to the hospital");
      qc.invalidateQueries({ queryKey: ["emergencies"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("emergency_requests")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request cancelled");
      qc.invalidateQueries({ queryKey: ["emergencies"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Emergency requests</h1>
          <p className="text-sm text-muted-foreground">
            Real-time blood requests from facilities across Uganda.
          </p>
        </div>
        {role === "hospital" && account.data?.hospitalId && (
          <NewEmergencyDialog hospitalId={account.data.hospitalId} />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {(list.data ?? []).map((e) => (
          <Card key={e.id} className={e.urgency === "critical" ? "border-destructive/50" : ""}>
            <CardHeader className="flex-row items-start gap-4 space-y-0">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-primary font-display font-bold text-primary-foreground">
                {e.blood_type}
              </span>
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate text-base">{e.hospitals?.name}</CardTitle>
                <CardDescription>
                  {e.units_needed} units needed &middot; {e.hospitals?.district}
                </CardDescription>
              </div>
              <Badge variant={e.urgency === "critical" ? "destructive" : "secondary"}>
                {e.urgency}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{e.patient_condition}</p>
              {e.notes && <p className="text-xs text-muted-foreground">{e.notes}</p>}
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">{e.status}</Badge>
                <Badge variant="outline">{timeLeft(e.needed_by)}</Badge>
                <span className="text-muted-foreground">Raised {formatEAT(e.created_at)}</span>
              </div>
              <div className="flex gap-2 pt-1">
                {e.status === "open" && role !== "hospital" && (
                  <Button size="sm" onClick={() => respond.mutate(e.id)} disabled={respond.isPending}>
                    {respond.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Accept request
                  </Button>
                )}
                {e.created_by === user?.id && e.status === "open" && (
                  <Button size="sm" variant="outline" onClick={() => cancel.mutate(e.id)}>
                    Cancel
                  </Button>
                )}
                {e.hospitals?.phone && (
                  <Button size="sm" variant="ghost" asChild>
                    <a href={`tel:${e.hospitals.phone}`}>Call {e.hospitals.phone}</a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {list.isSuccess && !list.data?.length && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            <Ambulance className="mx-auto mb-2 size-6" /> No emergency requests yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function NewEmergencyDialog({ hospitalId }: { hospitalId: string }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [bloodType, setBloodType] = useState<BloodType>("O-");
  const [units, setUnits] = useState("2");
  const [condition, setCondition] = useState("");
  const [urgency, setUrgency] = useState("high");
  const [hours, setHours] = useState("6");
  const [notes, setNotes] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      if (condition.trim().length < 3) throw new Error("Describe the patient condition");
      const { data, error } = await supabase
        .from("emergency_requests")
        .insert({
          hospital_id: hospitalId,
          created_by: user!.id,
          blood_type: bloodType,
          units_needed: Math.max(1, Number(units) || 1),
          patient_condition: condition.trim(),
          urgency: urgency as "high",
          notes: notes.trim() || null,
          needed_by: new Date(Date.now() + Number(hours) * 3600_000).toISOString(),
        })
        .select("id")
        .single();
      if (error) throw error;

      // Alert every compatible, available donor that has an account.
      const { data: donors } = await supabase
        .from("donors")
        .select("user_id")
        .eq("is_available", true)
        .not("user_id", "is", null);
      if (donors?.length) {
        await supabase.from("notifications").insert(
          donors.map((d) => ({
            user_id: d.user_id as string,
            title: `Urgent: ${bloodType} blood needed`,
            body: `${units} units required. ${condition.trim()}`,
            kind: "emergency",
            link: "/emergencies",
          })),
        );
      }
      await supabase.from("audit_logs").insert({
        actor_id: user!.id,
        action: "emergency.created",
        entity_type: "emergency_request",
        entity_id: data.id,
        meta: { blood_type: bloodType, units_needed: units },
      });
    },
    onSuccess: () => {
      toast.success("Emergency broadcast to the network");
      setOpen(false);
      setCondition("");
      setNotes("");
      qc.invalidateQueries({ queryKey: ["emergencies"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 size-4" /> New emergency
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Raise an emergency request</DialogTitle>
          <DialogDescription>
            Every available donor in the network is notified immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Blood type</Label>
              <Select value={bloodType} onValueChange={(v) => setBloodType(v as BloodType)}>
                <SelectTrigger>
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
              <Label htmlFor="units">Units needed</Label>
              <Input
                id="units"
                type="number"
                min={1}
                max={50}
                value={units}
                onChange={(e) => setUnits(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="condition">Patient condition</Label>
            <Input
              id="condition"
              maxLength={200}
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="Postpartum haemorrhage in maternity ward"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Urgency</Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours">Needed within (hours)</Label>
              <Input
                id="hours"
                type="number"
                min={1}
                max={72}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button className="w-full" onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending && <Loader2 className="mr-2 size-4 animate-spin" />} Broadcast
            emergency
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}