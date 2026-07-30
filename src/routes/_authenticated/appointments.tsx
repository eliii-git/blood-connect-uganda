import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccount, useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatEAT } from "@/lib/uganda";

export const Route = createFileRoute("/_authenticated/appointments")({
  head: () => ({
    meta: [
      { title: "Appointments | BloodNet+ Uganda" },
      { name: "description", content: "Book, reschedule and manage blood donation appointments." },
      { property: "og:title", content: "Appointments | BloodNet+ Uganda" },
      { property: "og:description", content: "Manage blood donation appointments in Uganda." },
    ],
  }),
  component: Appointments,
});

function Appointments() {
  const account = useAccount();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isDonor = account.data?.role === "donor";
  const [hospitalId, setHospitalId] = useState("");
  const [when, setWhen] = useState("");

  const hospitals = useQuery({
    queryKey: ["approved-hospitals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("hospitals")
        .select("id, name, district")
        .eq("status", "approved")
        .order("name");
      return data ?? [];
    },
  });

  const list = useQuery({
    queryKey: ["appointments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, hospitals(name, district), donors(full_name, blood_type)")
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const book = useMutation({
    mutationFn: async () => {
      if (!hospitalId || !when) throw new Error("Pick a hospital and a date/time");
      const { error } = await supabase.from("appointments").insert({
        donor_id: account.data?.donorId ?? null,
        donor_user_id: user!.id,
        hospital_id: hospitalId,
        scheduled_at: new Date(when).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Appointment booked");
      setWhen("");
      qc.invalidateQueries({ queryKey: ["appointments", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("appointments")
        .update({ status: status as "approved" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Appointment updated");
      qc.invalidateQueries({ queryKey: ["appointments", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Appointments</h1>

      {isDonor && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Book a donation</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label>Facility</Label>
              <Select value={hospitalId} onValueChange={setHospitalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a hospital" />
                </SelectTrigger>
                <SelectContent>
                  {hospitals.data?.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name} &middot; {h.district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="when">Date &amp; time (EAT)</Label>
              <Input
                id="when"
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
              />
            </div>
            <Button onClick={() => book.mutate()} disabled={book.isPending}>
              Book appointment
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {(list.data ?? []).map((a) => (
          <Card key={a.id}>
            <CardContent className="flex flex-wrap items-center gap-3 py-4">
              <CalendarClock className="size-5 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {a.hospitals?.name ?? "Facility"} &middot; {formatEAT(a.scheduled_at)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {a.donors?.full_name} {a.donors?.blood_type ? `(${a.donors.blood_type})` : ""}
                </p>
              </div>
              <Badge variant="outline">{a.status}</Badge>
              {!isDonor && a.status === "scheduled" && (
                <>
                  <Button
                    size="sm"
                    onClick={() => setStatus.mutate({ id: a.id, status: "approved" })}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStatus.mutate({ id: a.id, status: "rejected" })}
                  >
                    Reject
                  </Button>
                </>
              )}
              {isDonor && a.status !== "cancelled" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStatus.mutate({ id: a.id, status: "cancelled" })}
                >
                  Cancel
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        {list.isSuccess && !list.data?.length && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No appointments yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
