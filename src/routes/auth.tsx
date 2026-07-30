import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Droplets, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { provisionAccount } from "@/lib/account.functions";
import { BLOOD_TYPES, UGANDA_DISTRICTS, UG_PHONE_REGEX, normalizeUgPhone } from "@/lib/uganda";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup", "forgot"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in | BloodNet+ Uganda" },
      {
        name: "description",
        content:
          "Sign in or register as a donor, hospital, blood bank or administrator on BloodNet+ Uganda.",
      },
      { property: "og:title", content: "Sign in | BloodNet+ Uganda" },
      {
        property: "og:description",
        content: "Access your BloodNet+ Uganda workspace.",
      },
    ],
  }),
  component: AuthPage,
});

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
});

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Use at least 8 characters").max(72),
  phone: z
    .string()
    .trim()
    .min(9, "Enter a Ugandan phone number")
    .transform(normalizeUgPhone)
    .refine((v) => UG_PHONE_REGEX.test(v), "Must be a valid +256 number"),
  role: z.enum(["donor", "hospital", "blood_bank", "admin"]),
  district: z.string().min(2),
  city: z.string().trim().min(2).max(60),
  bloodType: z.enum(BLOOD_TYPES).optional(),
  organisationName: z.string().trim().max(160).optional(),
});

const forgotSchema = z.object({ email: z.string().trim().email().max(255) });

function AuthPage() {
  const { mode = "signin" } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-hero px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-lg"
      >
        <div className="mb-6 flex items-center justify-center gap-2 font-display text-2xl font-bold text-primary-foreground">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-primary">
            <Droplets className="size-5" />
          </span>
          BloodNet+
        </div>
        <Card className="surface-lift">
          <CardHeader>
            <Tabs
              value={mode}
              onValueChange={(v) => navigate({ to: "/auth", search: { mode: v as "signin" } })}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Register</TabsTrigger>
                <TabsTrigger value="forgot">Reset</TabsTrigger>
              </TabsList>
            </Tabs>
            <CardTitle className="pt-4">
              {mode === "signup"
                ? "Create your BloodNet+ account"
                : mode === "forgot"
                  ? "Reset your password"
                  : "Welcome back"}
            </CardTitle>
            <CardDescription>
              {mode === "signup"
                ? "Choose your role. Hospitals and blood banks are reviewed by an administrator."
                : mode === "forgot"
                  ? "We will email you a secure link to set a new password."
                  : "Sign in to reach your dashboard."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === "signin" && <SignInForm />}
            {mode === "signup" && <SignUpForm />}
            {mode === "forgot" && <ForgotForm />}
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}

function SignInForm() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof signInSchema>) {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Signed in");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="you@example.ug" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Sign in
        </Button>
      </form>
    </Form>
  );
}

function SignUpForm() {
  const navigate = useNavigate();
  const provision = useServerFn(provisionAccount);
  const [busy, setBusy] = useState(false);
  const form = useForm<z.input<typeof signUpSchema>, unknown, z.output<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      phone: "",
      role: "donor",
      district: "Kampala",
      city: "Kampala",
      bloodType: "O+",
      organisationName: "",
    },
  });
  const role = form.watch("role");

  async function onSubmit(values: z.output<typeof signUpSchema>) {
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: values.fullName },
        },
      });
      if (error) throw error;
      if (!data.session) {
        toast.info("Check your email to confirm your account, then sign in.");
        navigate({ to: "/auth", search: { mode: "signin" } });
        return;
      }
      await provision({
        data: {
          role: values.role,
          fullName: values.fullName,
          phone: values.phone,
          district: values.district,
          city: values.city,
          email: values.email,
          bloodType: values.role === "donor" ? values.bloodType : null,
          organisationName: values.organisationName || null,
        },
      });
      toast.success("Account created");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>I am registering as</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="donor">Donor</SelectItem>
                  <SelectItem value="hospital">Hospital</SelectItem>
                  <SelectItem value="blood_bank">Blood bank</SelectItem>
                  <SelectItem value="admin">Administrator (first account only)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input placeholder="Namukasa Sarah" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone (+256)</FormLabel>
                <FormControl>
                  <Input placeholder="0772 123 456" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {(role === "hospital" || role === "blood_bank") && (
          <FormField
            control={form.control}
            name="organisationName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{role === "hospital" ? "Hospital name" : "Blood bank name"}</FormLabel>
                <FormControl>
                  <Input placeholder="Mulago National Referral Hospital" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="district"
            render={({ field }) => (
              <FormItem>
                <FormLabel>District</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {UGANDA_DISTRICTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Town / city</FormLabel>
                <FormControl>
                  <Input placeholder="Kampala" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {role === "donor" && (
          <FormField
            control={form.control}
            name="bloodType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Blood group</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BLOOD_TYPES.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Create account
        </Button>
      </form>
    </Form>
  );
}

function ForgotForm() {
  const [busy, setBusy] = useState(false);
  const form = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof forgotSchema>) {
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("If that email exists, a reset link is on its way.");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Send reset link
        </Button>
      </form>
    </Form>
  );
}
