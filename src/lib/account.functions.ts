import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ProvisionInput = z.object({
  role: z.enum(["donor", "hospital", "blood_bank", "admin"]),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(20).optional().nullable(),
  district: z.string().trim().min(2).max(60),
  city: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(255),
  bloodType: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .optional()
    .nullable(),
  organisationName: z.string().trim().max(160).optional().nullable(),
});

/**
 * Creates the profile, role row and role-specific record for a freshly
 * registered account. Runs with elevated privileges because the caller has no
 * role yet, so the caller's identity is taken from the verified bearer token
 * only - never from the request body.
 */
export const provisionAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProvisionInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const existing = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    if (existing.data) return { role: existing.data.role, created: false };

    let role = data.role;
    if (role === "admin") {
      const { count } = await supabaseAdmin
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");
      // Only the very first account on the platform may bootstrap as admin.
      if ((count ?? 0) > 0) role = "donor";
    }

    const autoApprove = role === "donor" || role === "admin";

    const profile = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone ?? null,
      district: data.district,
      city: data.city,
      status: autoApprove ? "approved" : "pending",
    });
    if (profile.error) throw new Error(profile.error.message);

    const roleRow = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role });
    if (roleRow.error) throw new Error(roleRow.error.message);

    if (role === "donor") {
      const donor = await supabaseAdmin.from("donors").insert({
        user_id: userId,
        full_name: data.fullName,
        phone: data.phone ?? null,
        blood_type: data.bloodType ?? "O+",
        district: data.district,
        city: data.city,
        status: "approved",
      });
      if (donor.error) throw new Error(donor.error.message);
    }

    if (role === "hospital") {
      const hospital = await supabaseAdmin.from("hospitals").insert({
        owner_id: userId,
        name: data.organisationName || `${data.fullName} Hospital`,
        district: data.district,
        city: data.city,
        phone: data.phone ?? null,
        email: data.email,
        status: "pending",
      });
      if (hospital.error) throw new Error(hospital.error.message);
    }

    if (role === "blood_bank") {
      const bank = await supabaseAdmin.from("blood_banks").insert({
        owner_id: userId,
        name: data.organisationName || `${data.fullName} Blood Bank`,
        district: data.district,
        city: data.city,
        phone: data.phone ?? null,
        email: data.email,
        status: "pending",
      });
      if (bank.error) throw new Error(bank.error.message);
    }

    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title: "Welcome to BloodNet+",
      body:
        role === "donor"
          ? "Your donor account is active. Keep your availability up to date so hospitals can reach you."
          : "Your organisation account was created and is awaiting administrator approval.",
      kind: "success",
    });

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: userId,
      action: "account.provisioned",
      entity_type: "user",
      entity_id: userId,
      meta: { role, district: data.district },
    });

    return { role, created: true };
  });