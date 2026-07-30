import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BellOff, CheckCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatEAT } from "@/lib/uganda";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications | BloodNet+ Uganda" },
      { name: "description", content: "Your BloodNet+ alerts, emergencies and status updates." },
      { property: "og:title", content: "Notifications | BloodNet+ Uganda" },
      { property: "og:description", content: "Your BloodNet+ alerts and status updates." },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const markAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
      qc.invalidateQueries({ queryKey: ["unread-count", user?.id] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <Button variant="outline" size="sm" onClick={() => markAll.mutate()}>
          <CheckCheck className="mr-1 size-4" /> Mark all read
        </Button>
      </div>
      <div className="space-y-3">
        {(list.data ?? []).map((n) => (
          <Card key={n.id} className={n.is_read ? "opacity-70" : "border-primary/40"}>
            <CardContent className="flex flex-wrap items-start gap-3 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatEAT(n.created_at)}</p>
              </div>
              <Badge variant={n.kind === "emergency" ? "destructive" : "secondary"}>{n.kind}</Badge>
              <Button size="sm" variant="ghost" onClick={() => remove.mutate(n.id)}>
                Dismiss
              </Button>
            </CardContent>
          </Card>
        ))}
        {list.isSuccess && !list.data?.length && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              <BellOff className="mx-auto mb-2 size-6" /> Nothing here yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
