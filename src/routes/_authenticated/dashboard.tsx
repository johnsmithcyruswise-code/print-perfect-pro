import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Package, Plus, Clock, CheckCircle2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { STATUS_FLOW, STATUS_LABEL, money } from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My orders — Bazz Computer Services" },
      { name: "description", content: "Track your print jobs, live status and order history at Bazz Computer Services." },
      { property: "og:title", content: "My orders — Bazz Computer Services" },
      { property: "og:description", content: "Track your print jobs and order history." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const active = orders?.filter((o) => !["shipped", "cancelled"].includes(o.status)) ?? [];
  const done = orders?.filter((o) => o.status === "shipped") ?? [];
  const spend = done.reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Your print jobs</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Everything you've sent to the Bazz press floor.
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
          <Stat icon={Wallet} label="Lifetime spend" value={money(spend)} />
        </div>

        <section className="mt-10 space-y-4">
          {isLoading &&
            [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}

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

          {orders?.map((o, i) => {
            const stepIndex = Math.max(
              0,
              STATUS_FLOW.findIndex((s) => s === o.status),
            );
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
                    <Badge variant="secondary" className="capitalize">
                      {o.status.replace(/_/g, " ")}
                    </Badge>
                    <span className="font-mono text-lg font-bold">{money(Number(o.total))}</span>
                  </div>
                </div>

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