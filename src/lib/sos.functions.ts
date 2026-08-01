import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SosInput = z.object({
  bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
  units: z.number().int().min(1).max(50),
  condition: z.string().trim().min(3).max(200),
  hours: z.number().int().min(1).max(72),
  notes: z.string().trim().max(500).optional().nullable(),
});

/**
 * Broadcasts a critical SOS request to every account. The caller must be the
 * verified owner of a hospital; identity comes from the bearer token only.
 */
export const broadcastSos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SosInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: isHospital } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "hospital",
    });
    if (!isHospital) throw new Error("Only verified hospitals can raise an SOS");

    const { data: hospital, error: hospitalError } = await supabase
      .from("hospitals")
      .select("id, name, status")
      .eq("owner_id", userId)
      .maybeSingle();
    if (hospitalError) throw new Error("Could not verify your hospital");
    if (!hospital) throw new Error("No hospital is linked to your account");

    const { data: request, error } = await supabase
      .from("emergency_requests")
      .insert({
        hospital_id: hospital.id,
        created_by: userId,
        blood_type: data.bloodType,
        units_needed: data.units,
        patient_condition: data.condition,
        urgency: "critical",
        notes: data.notes?.trim() || null,
        needed_by: new Date(Date.now() + data.hours * 3600_000).toISOString(),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: everyone } = await supabaseAdmin.from("profiles").select("id");
    if (everyone?.length) {
      await supabaseAdmin.from("notifications").insert(
        everyone.map((p) => ({
          user_id: p.id,
          title: `SOS: ${data.bloodType} blood needed at ${hospital.name}`,
          body: `${data.units} units within ${data.hours}h. ${data.condition}`,
          kind: "sos",
          link: "/emergencies",
        })),
      );
    }

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: userId,
      action: "sos.broadcast",
      entity_type: "emergency_request",
      entity_id: request.id,
      meta: {
        blood_type: data.bloodType,
        units_needed: data.units,
        recipients: everyone?.length ?? 0,
      },
    });

    return { recipients: everyone?.length ?? 0 };
  });
