import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatEAT } from "@/lib/uganda";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administration | BloodNet+ Uganda" },
      { name: "description", content: "Approve facilities and review BloodNet+ audit activity." },
      { property: "og:title", content: "Administration | BloodNet+ Uganda" },
      { property: "og:description", content: "Approve facilities and review audit activity." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const qc = useQueryClient();

  const pending = useQuery({
    queryKey: ["admin-pending"],
    queryFn: async () => {
      const [h, b] = await Promise.all([
        supabase.from("hospitals").select("*").order("created_at", { ascending: false }),
        supabase.from("blood_banks").select("*").order("created_at", { ascending: false }),
      ]);
      return { hospitals: h.data ?? [], banks: b.data ?? [] };
    },
  });

  const audit = useQuery({
    queryKey: ["admin-audit"],
    queryFn: async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      return data ?? [];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({
      table,
      id,
      status,
    }: {
      table: "hospitals" | "blood_banks";
      id: string;
      status: "approved" | "rejected";
    }) => {
      const { error } = await supabase.from(table).update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Facility updated");
      qc.invalidateQueries({ queryKey: ["admin-pending"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = [
    ...(pending.data?.hospitals.map((h) => ({ ...h, table: "hospitals" as const })) ?? []),
    ...(pending.data?.banks.map((b) => ({ ...b, table: "blood_banks" as const })) ?? []),
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Administration</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Facility approvals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((f) => (
            <div
              key={f.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{f.name}</p>
                <p className="text-xs text-muted-foreground">
                  {f.district} &middot; {f.table === "hospitals" ? "Hospital" : "Blood bank"}
                </p>
              </div>
              <Badge variant={f.status === "approved" ? "secondary" : "outline"}>{f.status}</Badge>
              <Button
                size="sm"
                onClick={() => setStatus.mutate({ table: f.table, id: f.id, status: "approved" })}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStatus.mutate({ table: f.table, id: f.id, status: "rejected" })}
              >
                Reject
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit trail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {audit.data?.map((a) => (
            <p key={a.id} className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{a.action}</span> &middot;{" "}
              {a.entity_type} &middot; {formatEAT(a.created_at)}
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
