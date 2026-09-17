import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Package, Plus, Clock, CheckCircle2, Wallet, Search, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { LocationConsent } from "@/components/location-consent";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { STATUS_FLOW, STATUS_LABEL } from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My orders — Planned Kid Computer Services" },
      {
        name: "description",
        content: "Track your print jobs, quotes and pickup status at Planned Kid Computer Services.",
      },
      { property: "og:title", content: "My orders — Planned Kid Computer Services" },
      { property: "og:description", content: "Track your print jobs and pickup status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order cancelled.");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: () => toast.error("Couldn't cancel that order."),
  });

  const reorder = useMutation({
    mutationFn: async (id: string) => {
      const source = orders?.find((o) => o.id === id);
      if (!source || !user) throw new Error("missing order");
      const { data, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          paper_size: source.paper_size,
          custom_width_mm: source.custom_width_mm,
          custom_height_mm: source.custom_height_mm,
          paper_type: source.paper_type,
          color_mode: source.color_mode,
          sides: source.sides,
          binding: source.binding,
          quantity: source.quantity,
          turnaround: source.turnaround,
          addons: source.addons,
          notes: source.notes,
          customer_notes: source.customer_notes,
          delivery_method: source.delivery_method,
        })
        .select("id, order_number")
        .single();
      if (error || !data) throw error ?? new Error("reorder failed");
      const { data: files } = await supabase
        .from("order_files")
        .select("file_path, file_name, size_bytes, content_type")
        .eq("order_id", id);
      if (files?.length) {
        await supabase.from("order_files").insert(
          files.map((f) => ({ ...f, order_id: data.id, user_id: user.id })),
        );
      }
      await supabase
        .from("order_events")
        .insert({ order_id: data.id, status: "pending", note: "Re-order submitted" });
      return data.order_number;
    },
    onSuccess: (number) => {
      toast.success(`Re-order created — ${number}`);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: () => toast.error("Couldn't duplicate that order."),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders ?? [];
    return (orders ?? []).filter((o) => o.order_number.toLowerCase().includes(q));
  }, [orders, search]);

  const active = orders?.filter((o) => !["completed", "shipped", "cancelled"].includes(o.status)) ?? [];
  const done = orders?.filter((o) => ["completed", "shipped"].includes(o.status)) ?? [];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <LocationConsent />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Your print jobs</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Everything you've sent to the PK press floor.
            </p>
          </div>
          <Button variant="hero" size="lg" asChild>
            <Link to="/order">
              <Plus /> New order
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat icon={Clock} label="In production" value={String(active.length)} />
          <Stat icon={CheckCircle2} label="Completed" value={String(done.length)} />
          <Stat icon={Wallet} label="All orders" value={String(orders?.length ?? 0)} />
        </div>

        <div className="relative mt-8 max-w-sm">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            className="pl-9 font-mono"
            placeholder="Search by tracking number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <section className="mt-6 space-y-4">
          {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}

          {!isLoading && orders?.length === 0 && (
            <div className="glass-card flex flex-col items-center gap-4 rounded-3xl p-14 text-center">
              <Package className="text-primary size-10" />
              <p className="font-semibold">No orders yet</p>
              <p className="text-muted-foreground text-sm">
                Upload your first file and we'll have it on the press today.
              </p>
              <Button variant="brand" asChild>
                <Link to="/order">Start printing</Link>
              </Button>
            </div>
          )}

          {filtered.map((o, i) => {
            const stepIndex = Math.max(
              0,
              STATUS_FLOW.findIndex((s) => s === o.status),
            );
            const cancellable = o.status === "pending";
            return (
              <motion.article
                key={o.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card rounded-2xl p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-bold">{o.order_number}</p>
                    <p className="text-muted-foreground text-xs">
                      {o.quantity} × {o.paper_size.toUpperCase()} {o.paper_type} ·{" "}
                      {new Date(o.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{STATUS_LABEL[o.status] ?? o.status}</Badge>
                    <span className="text-muted-foreground text-xs font-medium">
                      {o.turnaround ? `${o.turnaround} turnaround` : "In store"}
                    </span>
                  </div>
                </div>

                {o.status !== "cancelled" && (
                  <ol className="mt-5 flex gap-1">
                    {STATUS_FLOW.map((s, idx) => (
                      <li key={s} className="flex-1">
                        <div
                          className={
                            idx <= stepIndex
                              ? "gradient-brand h-1.5 rounded-full"
                              : "bg-muted h-1.5 rounded-full"
                          }
                        />
                        <span className="text-muted-foreground mt-1.5 block text-[10px]">
                          {STATUS_LABEL[s]}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}

                {o.customer_notes && (
                  <p className="text-muted-foreground mt-4 text-xs">
                    Your notes: {o.customer_notes}
                  </p>
                )}
                {o.staff_notes && (
                  <p className="bg-secondary mt-3 rounded-lg p-3 text-xs">
                    <strong>From the shop:</strong> {o.staff_notes}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="soft"
                    disabled={reorder.isPending}
                    onClick={() => reorder.mutate(o.id)}
                  >
                    <RotateCcw /> Re-order
                  </Button>
                  {cancellable && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={cancel.isPending}
                      onClick={() => cancel.mutate(o.id)}
                    >
                      <XCircle /> Cancel
                    </Button>
                  )}
                </div>
              </motion.article>
            );
          })}
        </section>
      </main>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <Icon className="text-primary size-5" />
      <p className="text-muted-foreground mt-3 text-xs font-semibold tracking-wide uppercase">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-extrabold">{value}</p>
    </div>
  );
}
