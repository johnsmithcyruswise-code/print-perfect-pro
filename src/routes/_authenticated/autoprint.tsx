import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Maximize2,
  Minimize2,
  Printer as PrinterIcon,
  RefreshCcw,
  ShieldAlert,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-role";
import { printOrderTicket, type OrderTicket } from "@/lib/qz-print";
import { STATUS_LABEL } from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/autoprint")({
  head: () => ({
    meta: [
      { title: "AutoPrint station — Planned Kid Computer Services" },
      {
        name: "description",
        content: "Counter workstation: live job queue, one-tap ticket printing and status advance.",
      },
      { property: "og:title", content: "AutoPrint station — Planned Kid Computer Services" },
      { property: "og:description", content: "Live print queue for the shop counter." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AutoPrintStation,
});

const QUEUE_STATUSES = ["pending", "processing", "printing", "ready"] as const;
const NEXT: Record<string, string> = {
  pending: "processing",
  processing: "printing",
  printing: "ready",
  ready: "completed",
};

function chime() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.55);
    setTimeout(() => void ctx.close(), 900);
  } catch {
    /* audio is optional */
  }
}

function AutoPrintStation() {
  const { user } = useAuth();
  const { isStaff, loading } = useRoles();
  const queryClient = useQueryClient();
  const [sound, setSound] = useState(true);
  const [kiosk, setKiosk] = useState(false);
  const soundRef = useRef(sound);
  soundRef.current = sound;

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["autoprint-queue"],
    enabled: isStaff,
    refetchInterval: 20000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, order_number, user_id, status, order_type, quantity, paper_size, paper_type, color_mode, sides, binding, turnaround, staff_notes, customer_notes, created_at",
        )
        .in("status", QUEUE_STATUSES as unknown as string[])
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!isStaff) return;
    const channel = supabase
      .channel("autoprint-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === "INSERT") {
          if (soundRef.current) chime();
          toast.success("New job in the queue");
        }
        queryClient.invalidateQueries({ queryKey: ["autoprint-queue"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isStaff, queryClient]);

  const advance = useMutation({
    mutationFn: async (order: { id: string; status: string; user_id: string }) => {
      const next = NEXT[order.status] ?? "completed";
      const { error } = await supabase
        .from("orders")
        .update({ status: next as never })
        .eq("id", order.id);
      if (error) throw error;
      await supabase
        .from("order_events")
        .insert({ order_id: order.id, status: next as never, note: "AutoPrint station" });
      if (next === "ready") {
        await supabase.from("notifications").insert({
          user_id: order.user_id,
          order_id: order.id,
          type: "app",
          subject: "Your order is ready for collection",
        });
      }
      return next;
    },
    onSuccess: (next) => {
      toast.success(`Moved to ${STATUS_LABEL[next] ?? next}`);
      queryClient.invalidateQueries({ queryKey: ["autoprint-queue"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: () => toast.error("Could not update that job."),
  });

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    (jobs ?? []).forEach((j) => {
      map[j.status] = (map[j.status] ?? 0) + 1;
    });
    return map;
  }, [jobs]);

  async function toggleKiosk() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setKiosk(true);
      } else {
        await document.exitFullscreen();
        setKiosk(false);
      }
    } catch {
      setKiosk((k) => !k);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-5xl px-4 py-10">
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <ShieldAlert className="text-muted-foreground mx-auto size-10" />
          <h1 className="mt-4 text-xl font-bold">Staff only</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            The counter station is for our team. Head back to your orders.
          </p>
          <Button asChild className="mt-6" variant="hero">
            <Link to="/dashboard">My orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {!kiosk && <SiteHeader />}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="display-heading text-3xl font-bold">AutoPrint station</h1>
            <p className="text-muted-foreground">
              Live counter queue — print the ticket, then move each job along.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setSound((s) => !s)} aria-label="Sound">
              {sound ? <Volume2 /> : <VolumeX />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Refresh"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["autoprint-queue"] })}
            >
              <RefreshCcw />
            </Button>
            <Button variant="outline" onClick={toggleKiosk}>
              {kiosk ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              {kiosk ? "Exit full screen" : "Full screen"}
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {QUEUE_STATUSES.map((s) => (
            <div key={s} className="glass-card rounded-2xl p-4">
              <p className="text-muted-foreground text-xs uppercase">{STATUS_LABEL[s] ?? s}</p>
              <p className="text-3xl font-bold">{counts[s] ?? 0}</p>
            </div>
          ))}
        </div>

        {isLoading && <Skeleton className="mt-6 h-32 w-full rounded-2xl" />}

        <div className="mt-6 grid gap-3">
          {(jobs ?? []).map((job) => (
            <div
              key={job.id}
              className="glass-card flex flex-wrap items-center gap-4 rounded-2xl p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold">{job.order_number}</span>
                  <Badge variant="secondary">{STATUS_LABEL[job.status] ?? job.status}</Badge>
                  <Badge variant="outline">{job.order_type}</Badge>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  {job.quantity} × {job.paper_size} · {job.paper_type} · {job.color_mode} ·{" "}
                  {job.sides} · {job.binding} · {job.turnaround}
                </p>
                {job.customer_notes && (
                  <p className="mt-1 text-xs italic">“{job.customer_notes}”</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!user) return;
                    const res = await printOrderTicket(job as unknown as OrderTicket, user.id);
                    res.ok ? toast.success(res.message) : toast.error(res.message);
                  }}
                >
                  <PrinterIcon className="size-4" /> Print ticket
                </Button>
                <Button
                  variant="hero"
                  onClick={() =>
                    advance.mutate({ id: job.id, status: job.status, user_id: job.user_id })
                  }
                  disabled={advance.isPending}
                >
                  Move to {STATUS_LABEL[NEXT[job.status] ?? "completed"]}
                </Button>
              </div>
            </div>
          ))}
          {!isLoading && (jobs ?? []).length === 0 && (
            <p className="text-muted-foreground rounded-2xl border border-dashed p-10 text-center">
              The queue is empty. New jobs appear here the moment a customer submits one.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
