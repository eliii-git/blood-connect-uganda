import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Compass, Loader2, MapPin, Phone, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locateDonors } from "@/lib/locator.functions";
import { BLOOD_TYPES, UGANDA_DISTRICTS, type BloodType } from "@/lib/uganda";

export const Route = createFileRoute("/_authenticated/locator")({
  head: () => ({
    meta: [
      { title: "AI donor locator | BloodNet+ Uganda" },
      {
        name: "description",
        content:
          "Locate the nearest eligible blood donors in Uganda with AI-ranked dispatch guidance.",
      },
      { property: "og:title", content: "AI donor locator | BloodNet+ Uganda" },
      {
        property: "og:description",
        content: "AI-ranked nearest eligible donors with ETA and dispatch guidance.",
      },
    ],
  }),
  component: Locator,
});

function Locator() {
  const [bloodType, setBloodType] = useState<BloodType>("O-");
  const [district, setDistrict] = useState<string>("all");
  const [urgency, setUrgency] = useState<"low" | "moderate" | "high" | "critical">("high");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const run = useServerFn(locateDonors);
  const search = useMutation({
    mutationFn: async () =>
      run({
        data: {
          recipientBloodType: bloodType,
          district: district === "all" ? null : district,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          urgency,
        },
      }),
    onError: (e: Error) => toast.error(e.message),
  });

  function useMyLocation() {
    if (!("geolocation" in navigator)) return toast.error("Location is not available here");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success("Location locked — distances and ETAs are now live");
      },
      () => toast.error("Could not read your location"),
    );
  }

  const result = search.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Compass className="size-7 text-primary" /> AI donor locator
        </h1>
        <p className="text-sm text-muted-foreground">
          Rank the nearest eligible donors and get an AI dispatch briefing for Ugandan road
          conditions.
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <Select value={bloodType} onValueChange={(v) => setBloodType(v as BloodType)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BLOOD_TYPES.map((b) => (
                <SelectItem key={b} value={b}>
                  Needs {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All districts</SelectItem>
              {UGANDA_DISTRICTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={urgency} onValueChange={(v) => setUrgency(v as typeof urgency)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={useMyLocation}>
            <MapPin className="mr-1 size-4" />
            {coords ? "Location locked" : "Use my location"}
          </Button>
          <Button onClick={() => search.mutate()} disabled={search.isPending}>
            {search.isPending ? (
              <Loader2 className="mr-1 size-4 animate-spin" />
            ) : (
              <Sparkles className="mr-1 size-4" />
            )}
            Locate donors
          </Button>
        </CardContent>
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-4 text-primary" /> AI dispatch briefing
              </CardTitle>
              <CardDescription>Generated from the live ranked candidate list.</CardDescription>
            </CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm leading-relaxed">
              {result.briefing}
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {(result?.ranked ?? []).map((r, i) => (
          <motion.div
            key={r.donor.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card className="h-full transition-shadow hover:surface-lift">
              <CardContent className="flex flex-wrap items-center gap-3 py-4">
                <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-primary font-display text-sm font-bold text-primary-foreground">
                  {r.donor.blood_type}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.donor.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.donor.city}, {r.donor.district}
                    {r.distanceKm != null && ` \u00b7 ${r.distanceKm.toFixed(1)} km`}
                    {r.match.etaMinutes != null && ` \u00b7 ~${r.match.etaMinutes} min`}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.match.reasons.join(" \u00b7 ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl font-bold text-primary">{r.match.score}%</p>
                  <Badge variant={r.donor.is_available ? "secondary" : "outline"}>
                    {r.donor.is_available ? "Available" : "Unavailable"}
                  </Badge>
                </div>
                {r.donor.phone && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`tel:${r.donor.phone}`}>
                      <Phone className="mr-1 size-3.5" /> Call
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {search.isSuccess && !result?.ranked.length && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No compatible donors matched those filters.
          </CardContent>
        </Card>
      )}
    </div>
  );
}