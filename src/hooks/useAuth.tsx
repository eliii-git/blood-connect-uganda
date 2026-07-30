import { useQuery } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

export type AppRole = "donor" | "hospital" | "blood_bank" | "admin";

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({ user: null, session: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, session: null, loading: true });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, session, loading: false });
    });
    supabase.auth.getSession().then(({ data }) => {
      setState({ user: data.session?.user ?? null, session: data.session, loading: false });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export type AccountContext = {
  role: AppRole | null;
  profile: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    district: string | null;
    city: string | null;
    avatar_url: string | null;
    national_id_url: string | null;
    status: string;
  } | null;
  donorId: string | null;
  hospitalId: string | null;
  hospitalName: string | null;
  bloodBankId: string | null;
  bloodBankName: string | null;
  orgStatus: string | null;
};

/** Loads the signed-in user's role, profile and owned organisation record. */
export function useAccount() {
  const { user, loading } = useAuth();

  return useQuery<AccountContext>({
    queryKey: ["account", user?.id],
    enabled: !loading && !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const uid = user!.id;
      const [roleRes, profileRes, donorRes, hospitalRes, bankRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid).maybeSingle(),
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        supabase.from("donors").select("id").eq("user_id", uid).maybeSingle(),
        supabase.from("hospitals").select("id, name, status").eq("owner_id", uid).maybeSingle(),
        supabase.from("blood_banks").select("id, name, status").eq("owner_id", uid).maybeSingle(),
      ]);

      return {
        role: (roleRes.data?.role as AppRole) ?? null,
        profile: (profileRes.data as AccountContext["profile"]) ?? null,
        donorId: donorRes.data?.id ?? null,
        hospitalId: hospitalRes.data?.id ?? null,
        hospitalName: hospitalRes.data?.name ?? null,
        bloodBankId: bankRes.data?.id ?? null,
        bloodBankName: bankRes.data?.name ?? null,
        orgStatus: hospitalRes.data?.status ?? bankRes.data?.status ?? null,
      };
    },
  });
}

export const ROLE_LABEL: Record<AppRole, string> = {
  donor: "Donor",
  hospital: "Hospital",
  blood_bank: "Blood Bank",
  admin: "Administrator",
};