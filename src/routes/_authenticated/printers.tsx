import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Printer as PrinterIcon, Plus, ShieldAlert, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/use-role";

export const Route = createFileRoute("/_authenticated/printers")({
  head: () => ({
    meta: [
      { title: "Printer management — Bazz Computer Services" },
      {
        name: "description",
        content: "Register, monitor and set default printers for the Bazz production floor.",
      },
      { property: "og:title", content: "Printer management — Bazz Computer Services" },
      { property: "og:description", content: "Register and monitor Bazz shop printers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrintersPage,
});

function PrintersPage() {
  const { isStaff, loading } = useRoles();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", model: "", location: "", ip_address: "" });

  const { data: printers, isLoading } = useQuery({
    queryKey: ["printers"],
    enabled: isStaff,
    queryFn: async () => {
      const { data, error } = await supabase.from("printers").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["printers"] });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("printers").insert({
        name: form.name,
        model: form.model || null,
        location: form.location || null,
        ip_address: form.ip_address || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ name: "", model: "", location: "", ip_address: "" });
      toast.success("Printer added.");
      invalidate();
    },
    onError: () => toast.error("Couldn't add that printer."),
  });

  const setDefault = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("printers").update({ is_default: false }).neq("id", id);
      const { error } = await supabase.from("printers").update({ is_default: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Default printer updated.");
      invalidate();
    },
    onError: () => toast.error("Couldn't set the default printer."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("printers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Printer removed.");
      invalidate();
    },
    onError: () => toast.error("Couldn't remove that printer."),
  });

  if (!loading && !isStaff) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-md px-4 py-24 text-center">
          <ShieldAlert className="text-destructive mx-auto size-10" />
          <h1 className="mt-4 text-2xl font-extrabold">Staff only</h1>
          <Button variant="hero" className="mt-6" asChild>
            <Link to="/dashboard">Back to my orders</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight">Printer management</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Shop devices available to the production console.
        </p>

        <section className="glass-card mt-8 rounded-2xl p-5">
          <h2 className="text-sm font-bold">Register a printer</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {(
              [
                ["name", "Name"],
                ["model", "Model"],
                ["location", "Location"],
                ["ip_address", "IP address"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <Button
            variant="hero"
            className="mt-4"
            disabled={!form.name || add.isPending}
            onClick={() => add.mutate()}
          >
            <Plus /> Add printer
          </Button>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {isLoading && [0, 1].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          {printers?.map((p) => (
            <article key={p.id} className="glass-card rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                    <PrinterIcon className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold">{p.name}</p>
                    <p className="text-muted-foreground text-xs">{p.model ?? "Unknown model"}</p>
                  </div>
                </div>
                <Badge variant={p.status === "online" ? "default" : "secondary"}>{p.status}</Badge>
              </div>
              <dl className="text-muted-foreground mt-4 space-y-1 text-xs">
                <div>Location: {p.location ?? "—"}</div>
                <div className="font-mono">IP: {p.ip_address ?? "—"}</div>
              </dl>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant={p.is_default ? "brand" : "soft"}
                  disabled={p.is_default || setDefault.isPending}
                  onClick={() => setDefault.mutate(p.id)}
                >
                  <Star /> {p.is_default ? "Default" : "Make default"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(p.id)}
                >
                  <Trash2 /> Remove
                </Button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
