import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { computeMatch, distanceKm, type BloodType } from "@/lib/uganda";

const LocateInput = z.object({
  recipientBloodType: z.string(),
  district: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  urgency: z.enum(["low", "moderate", "high", "critical"]).default("high"),
});

export const locateDonors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => LocateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: donors, error } = await context.supabase
      .from("donors")
      .select(
        "id, full_name, blood_type, district, city, phone, latitude, longitude, is_available, last_donation_date, total_donations",
      )
      .limit(300);
    if (error) throw new Error(error.message);

    const origin =
      typeof data.lat === "number" && typeof data.lng === "number"
        ? { lat: data.lat, lng: data.lng }
        : null;

    const ranked = (donors ?? [])
      .map((d) => {
        const km =
          origin && d.latitude != null && d.longitude != null
            ? distanceKm(origin, { lat: d.latitude, lng: d.longitude })
            : null;
        const match = computeMatch({
          donorBloodType: d.blood_type as BloodType,
          recipientBloodType: data.recipientBloodType as BloodType,
          distanceKm: km,
          isAvailable: d.is_available,
          lastDonationDate: d.last_donation_date,
          urgency: data.urgency,
          requestAgeMinutes: 0,
        });
        return { donor: d, distanceKm: km, match };
      })
      .filter((r) => r.match.compatible)
      .filter((r) => (data.district ? r.donor.district === data.district : true))
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, 12);

    let briefing =
      "AI briefing unavailable right now — the ranked list below still uses the full matching engine.";
    const key = process.env.LOVABLE_API_KEY;
    if (key && ranked.length) {
      try {
        const gateway = createLovableAiGatewayProvider(key);
        const summary = ranked
          .slice(0, 8)
          .map(
            (r, i) =>
              `${i + 1}. ${r.donor.full_name} | ${r.donor.blood_type} | ${r.donor.city}, ${r.donor.district} | ${
                r.distanceKm != null ? `${r.distanceKm.toFixed(1)} km` : "distance unknown"
              } | available: ${r.donor.is_available} | score ${r.match.score} | ETA ${
                r.match.etaMinutes ?? "?"
              } min | ${r.match.reasons.join("; ")}`,
          )
          .join("\n");
        const { text } = await generateText({
          model: gateway("google/gemini-3-flash"),
          system:
            "You are the dispatch coordinator for BloodNet+, a Ugandan blood network. Be concise, practical and specific to Uganda (districts, road travel, boda/ambulance realities). Never invent donors that are not listed.",
          prompt: `Recipient needs ${data.recipientBloodType} blood, urgency ${data.urgency}${
            data.district ? `, focus district ${data.district}` : ""
          }.\n\nRanked candidates:\n${summary}\n\nIn at most 120 words: who to call first and why, a fallback plan, and one logistics warning.`,
        });
        if (text.trim()) briefing = text.trim();
      } catch {
        // fall through to the default briefing
      }
    }

    return { ranked, briefing };
  });