import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAccount, useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile & settings | BloodNet+ Uganda" },
      { name: "description", content: "Update your BloodNet+ profile and donor availability." },
      { property: "og:title", content: "Profile & settings | BloodNet+ Uganda" },
      { property: "og:description", content: "Update your BloodNet+ profile details." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { user } = useAuth();
  const account = useAccount();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    if (account.data?.profile) {
      setFullName(account.data.profile.full_name ?? "");
      setPhone(account.data.profile.phone ?? "");
    }
    if (account.data?.donorAvailable !== null && account.data?.donorAvailable !== undefined) {
      setAvailable(account.data.donorAvailable);
    }
  }, [account.data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim().slice(0, 100), phone: phone.trim().slice(0, 20) })
        .eq("id", user!.id);
      if (error) throw error;
      if (account.data?.donorId) {
        const { error: dErr } = await supabase
          .from("donors")
          .update({ full_name: fullName.trim(), phone: phone.trim(), is_available: available })
          .eq("id", account.data.donorId);
        if (dErr) throw dErr;
      }
    },
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-bold">Profile &amp; settings</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (+256)</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          {account.data?.donorId && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Available to donate</p>
                <p className="text-xs text-muted-foreground">
                  Turn off to stop receiving emergency alerts.
                </p>
              </div>
              <Switch checked={available} onCheckedChange={setAvailable} />
            </div>
          )}
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            Save changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
