import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAccount } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BLOOD_TYPES, type BloodType } from "@/lib/uganda";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({
    meta: [
      { title: "Blood inventory | BloodNet+ Uganda" },
      { name: "description", content: "Track blood units and expiry dates for your blood bank." },
      { property: "og:title", content: "Blood inventory | BloodNet+ Uganda" },
      { property: "og:description", content: "Track blood units and expiry dates." },
    ],
  }),
  component: Inventory,
});

function Inventory() {
  const account = useAccount();
  const qc = useQueryClient();
  const bankId = account.data?.bloodBankId ?? null;
  const [bloodType, setBloodType] = useState<BloodType>("O+");
  const [units, setUnits] = useState("10");
  const [expiry, setExpiry] = useState("");

  const rows = useQuery({
    queryKey: ["inventory", bankId],
    queryFn: async () => {
      let q = supabase
        .from("blood_inventory")
        .select("*, blood_banks(name, district)")
        .order("expiry_date");
      if (bankId) q = q.eq("blood_bank_id", bankId);
      const { data, error } = await q.limit(300);
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!bankId) throw new Error("Only blood bank accounts can add stock");
      const { error } = await supabase.from("blood_inventory").insert({
        blood_bank_id: bankId,
        blood_type: bloodType,
        units: Math.max(0, Number(units) || 0),
        expiry_date: expiry || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Stock added");
      qc.invalidateQueries({ queryKey: ["inventory", bankId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: number }) => {
      const { error } = await supabase.from("blood_inventory").update({ units: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", bankId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blood_inventory").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Batch removed");
      qc.invalidateQueries({ queryKey: ["inventory", bankId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Blood inventory</h1>
        <p className="text-sm text-muted-foreground">
          {bankId ? "Your blood bank stock" : "Nationwide stock overview"}
        </p>
      </div>

      {bankId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add a batch</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label>Blood type</Label>
              <Select value={bloodType} onValueChange={(v) => setBloodType(v as BloodType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_TYPES.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="u">Units</Label>
              <Input id="u" type="number" min={0} value={units} onChange={(e) => setUnits(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="x">Expiry date</Label>
              <Input id="x" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={() => add.mutate()} disabled={add.isPending}>
                Add stock
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Blood bank</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(rows.data ?? []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">{r.blood_banks?.name}</TableCell>
                  <TableCell className="font-semibold">{r.blood_type}</TableCell>
                  <TableCell>
                    {bankId ? (
                      <Input
                        type="number"
                        min={0}
                        className="w-24"
                        defaultValue={r.units}
                        onBlur={(e) => {
                          const value = Number(e.target.value);
                          if (value !== r.units) update.mutate({ id: r.id, value });
                        }}
                      />
                    ) : (
                      r.units
                    )}
                  </TableCell>
                  <TableCell>{r.expiry_date ?? "\u2014"}</TableCell>
                  <TableCell>
                    {bankId && (
                      <Button size="sm" variant="ghost" onClick={() => remove.mutate(r.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}