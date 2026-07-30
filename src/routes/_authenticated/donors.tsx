import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { BLOOD_TYPES, computeMatch, type BloodType } from "@/lib/uganda";

export const Route = createFileRoute("/_authenticated/donors")({
  head: () => ({
    meta: [
      { title: "Donor network | BloodNet+ Uganda" },
      {
        name: "description",
        content: "Search and rank compatible blood donors across Uganda by match score.",
      },
      { property: "og:title", content: "Donor network | BloodNet+ Uganda" },
      { property: "og:description", content: "Rank compatible Ugandan donors by match score." },
    ],
  }),
  component: DonorNetwork,
});

function DonorNetwork() {
  const [need, setNeed] = useState<BloodType>("O-");
  const [search, setSearch] = useState("");

  const donors = useQuery({
    queryKey: ["donor-network"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donors")
        .select("*")
        .order("total_donations", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const ranked = (donors.data ?? [])
    .map((d) => ({
      donor: d,
      match: computeMatch({
        donorBloodType: d.blood_type as BloodType,
        recipientBloodType: need,
        distanceKm: null,
        isAvailable: d.is_available,
        lastDonationDate: d.last_donation_date,
        urgency: "high",
        requestAgeMinutes: 0,
      }),
    }))
    .filter((r) => r.match.compatible)
    .filter((r) =>
      search
        ? `${r.donor.full_name} ${r.donor.district} ${r.donor.city}`
            .toLowerCase()
            .includes(search.toLowerCase())
        : true,
    )
    .sort((a, b) => b.match.score - a.match.score);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Donor network</h1>
        <p className="text-sm text-muted-foreground">
          Donors compatible with the selected recipient blood group, ranked by match score.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={need} onValueChange={(v) => setNeed(v as BloodType)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BLOOD_TYPES.map((b) => (
              <SelectItem key={b} value={b}>
                Recipient {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          className="max-w-xs"
          placeholder="Search name or district"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {ranked.map(({ donor, match }) => (
          <Card key={donor.id}>
            <CardContent className="flex flex-wrap items-center gap-3 py-4">
              <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-primary font-display text-sm font-bold text-primary-foreground">
                {donor.blood_type}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{donor.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {donor.city}, {donor.district} &middot; {donor.total_donations} donations
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {match.reasons.join(" \u00b7 ")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-xl font-bold text-primary">{match.score}%</p>
                <Badge variant={donor.is_available ? "secondary" : "outline"}>
                  {donor.is_available ? "Available" : "Unavailable"}
                </Badge>
              </div>
              {donor.phone && (
                <Button size="sm" variant="outline" asChild>
                  <a href={`tel:${donor.phone}`}>Call</a>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
