import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Package, Plus, Clock, CheckCircle2, Wallet, Search, RotateCcw, XCircle, UploadCloud, FileText, IdCard, Type, PenLine, FolderOpen } from "lucide-react";
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
import { NotificationBell } from "@/components/notification-bell";

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: (search: Record<string, unknown>): { tab?: "main" | "follow-up" } => ({
    tab: search["tab"] === "follow-up" ? "follow-up" : "main",
  }),
  head: () => ({
    meta: [
      { title: "Main & Follow up — Planned Kid Computer Services" },
      {
        name: "description",
        content: "Send documents, open your tools, and follow your print jobs at Planned Kid Computer Services.",
      },
      { property: "og:title", content: "Main & Follow up — Planned Kid Computer Services" },
      { property: "og:description", content: "Track your print jobs and pickup status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { tab } = Route.useSearch();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
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
        {tab === "main" ? (
        <>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Main
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Drop a file below and it goes straight to the counter.
            </p>
          </div>
          <Button variant="hero" size="lg" asChild>
            <Link to="/order">
              <Plus /> New order
            </Link>
          </Button>
        </div>

        {user && <QuickDrop userId={user.id} />}
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild variant="outline"><Link to="/documents"><FolderOpen /> My files</Link></Button>
          <Button asChild variant="outline"><Link to="/editor" search={{ id: "" }}><PenLine /> Write a document</Link></Button>
          <Button asChild variant="outline"><Link to="/text-editor"><Type /> Quick text</Link></Button>
          <Button asChild variant="outline"><Link to="/id-photo"><IdCard /> ID photos</Link></Button>
          <Button asChild variant="outline"><Link to="/passport"><IdCard /> Passport order</Link></Button>
        </div>
        </>
        ) : (
        <>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-extrabold">Follow up</h1>
          <NotificationBell />
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
        </>
        )}
      </main>
    </div>
  );
}

function QuickDrop({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const upload = useMutation({
    mutationFn: async (list: File[]) => {
      for (const file of list) {
        const path = `${userId}/vault/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
        const up = await supabase.storage
          .from("print-files")
          .upload(path, file, { contentType: file.type });
        if (up.error) throw up.error;
        const { error } = await supabase.from("files").insert({
          user_id: userId,
          folder_id: null,
          name: file.name,
          url: path,
          size: file.size,
          type: file.type || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Sent! The shop has been notified.");
      queryClient.invalidateQueries({ queryKey: ["files", userId] });
    },
    onError: () => toast.error("Upload failed. Please try again."),
  });

  const { data: recent } = useQuery({
    queryKey: ["files", userId, "recent"],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("files")
        .select("id, name, uploaded_at")
        .eq("user_id", userId)
        .order("uploaded_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  const send = (list: File[]) => {
    if (list.length) upload.mutate(list);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        send(Array.from(e.dataTransfer.files));
      }}
      className={`glass-card mt-8 rounded-3xl border-2 border-dashed p-10 text-center transition-colors ${
        over ? "border-accent bg-accent/5" : "border-primary/30"
      }`}
    >
      <UploadCloud className="text-primary mx-auto size-10" />
      <p className="mt-3 text-lg font-extrabold">Drop files for the counter</p>
      <p className="text-muted-foreground mt-1 text-sm">
        PDF, Word, photos — sent straight to the shop at full quality.
      </p>
      <Button
        variant="hero"
        size="lg"
        className="mt-5"
        disabled={upload.isPending}
        onClick={() => input.current?.click()}
      >
        {upload.isPending ? "Sending…" : "Choose files"}
      </Button>
      <input
        ref={input}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          send(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />

      <div className="mt-6 border-t pt-4">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Recent files
        </p>
        {recent && recent.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {recent.map((f) => (
              <li key={f.id} className="flex items-center justify-center gap-2 text-sm">
                <FileText className="text-muted-foreground size-3.5 shrink-0" />
                <span className="min-w-0 truncate">{f.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground mt-2 text-xs">
            No uploads yet — your first one will show up here.
          </p>
        )}
      </div>
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
