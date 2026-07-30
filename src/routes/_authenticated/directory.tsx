import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/directory")({
  head: () => ({
    meta: [
      { title: "Facilities directory | BloodNet+ Uganda" },
      {
        name: "description",
        content: "Hospitals and blood banks on the BloodNet+ network across Ugandan districts.",
      },
      { property: "og:title", content: "Facilities directory | BloodNet+ Uganda" },
      { property: "og:description", content: "Hospitals and blood banks across Uganda." },
    ],
  }),
  component: Directory,
});

function Directory() {
  const facilities = useQuery({
    queryKey: ["facilities"],
    queryFn: async () => {
      const [h, b] = await Promise.all([
        supabase.from("hospitals").select("*").eq("status", "approved").order("name"),
        supabase.from("blood_banks").select("*").eq("status", "approved").order("name"),
      ]);
      return { hospitals: h.data ?? [], banks: b.data ?? [] };
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Facilities directory</h1>
        <p className="text-sm text-muted-foreground">
          Approved hospitals and blood banks on the network.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Hospitals</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {facilities.data?.hospitals.map((h) => (
            <Card key={h.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{h.name}</CardTitle>
                <CardDescription>
                  {h.city}, {h.district}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Hospital</Badge>
                {h.phone && (
                  <Button size="sm" variant="ghost" asChild>
                    <a href={`tel:${h.phone}`}>{h.phone}</a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Blood banks</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {facilities.data?.banks.map((b) => (
            <Card key={b.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{b.name}</CardTitle>
                <CardDescription>
                  {b.city}, {b.district}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2">
                {b.phone && (
                  <Button size="sm" variant="ghost" asChild>
                    <a href={`tel:${b.phone}`}>{b.phone}</a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
