import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ShieldAlert, Printer as PrinterIcon, Package, Timer, Wallet, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/use-role";
import { STATUS_FLOW, STATUS_LABEL, STORE, money } from "@/lib/pricing";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Staff console — Planned Kid Computer Services" },
      {
        name: "description",
        content: "Kanban production board, quoting and printer assignment for PK staff.",
      },
      { property: "og:title", content: "Staff console — Planned Kid Computer Services" },
      { property: "og:description", content: "Production board and quoting for PK staff." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

type OrderStatus = Database["public"]["Enums"]["order_status"];

type OrderPatch = {
  status?: OrderStatus;
  staff_price?: number | null;
  staff_notes?: string | null;
  assigned_printer_id?: string | null;
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  quantity: number;
  paper_size: string;
  paper_type: string;
  color_mode: string;
  sides: string;
  binding: string;
  turnaround: string;
  customer_notes: string | null;
  staff_notes: string | null;
  staff_price: number | null;
  assigned_printer_id: string | null;
  created_at: string;
};

function AdminPage() {
  const { isStaff, loading } = useRoles();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Order | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    enabled: isStaff,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Order[];
    },
  });

  const { data: printers } = useQuery({
    queryKey: ["printers"],
    enabled: isStaff,
    queryFn: async () => {
      const { data, error } = await supabase.from("printers").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: OrderPatch }) => {
      const { error } = await supabase.from("orders").update(patch).eq("id", id);
      if (error) throw error;
      if (patch.status) {
        await supabase
          .from("order_events")
          .insert({ order_id: id, status: patch.status, note: "Updated by staff" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order updated.");
    },
    onError: () => toast.error("Update failed."),
  });

  const kpis = useMemo(() => {
    const list = orders ?? [];
    const today = new Date().toDateString();
    return {
      today: list.filter((o) => new Date(o.created_at).toDateString() === today).length,
      pending: list.filter((o) => o.status === "pending").length,
      revenue: list
        .filter((o) => o.status === "completed")
        .reduce((s, o) => s + Number(o.staff_price ?? 0), 0),
      queue: list.filter((o) => ["processing", "printing"].includes(o.status)).length,
    };
  }, [orders]);

  if (!loading && !isStaff) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-md px-4 py-24 text-center">
          <ShieldAlert className="text-destructive mx-auto size-10" />
          <h1 className="mt-4 text-2xl font-extrabold">Staff only</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            This console is limited to PK team members.
          </p>
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
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Production console</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Quote, schedule and move jobs across the press floor.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="soft" asChild>
              <Link to="/printers">
                <PrinterIcon /> Printers
              </Link>
            </Button>
            <Button variant="outline" onClick={adminSignOut}>
              <LogOut /> Log out
            </Button>
          </div>

        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={Package} label="Orders today" value={String(kpis.today)} />
          <Kpi icon={Timer} label="Awaiting quote" value={String(kpis.pending)} />
          <Kpi icon={PrinterIcon} label="On the press" value={String(kpis.queue)} />
          <Kpi icon={Wallet} label="Completed revenue" value={money(kpis.revenue)} />
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-5">
          {STATUS_FLOW.map((status) => {
            const column = (orders ?? []).filter((o) => o.status === status);
            return (
              <section key={status} className="bg-secondary/50 rounded-2xl p-3">
                <header className="mb-3 flex items-center justify-between px-1">
                  <h2 className="text-xs font-bold tracking-wide uppercase">
                    {STATUS_LABEL[status]}
                  </h2>
                  <span className="text-muted-foreground font-mono text-xs">{column.length}</span>
                </header>
                <div className="space-y-2">
                  {isLoading && <Skeleton className="h-24 w-full rounded-xl" />}
                  {column.map((o) => (
                    <motion.button
                      key={o.id}
                      layout
                      onClick={() => setSelected(o)}
                      className="bg-card border-border hover:border-primary/50 w-full rounded-xl border p-3 text-left transition-colors"
                    >
                      <p className="font-mono text-xs font-bold">{o.order_number}</p>
                      <p className="text-muted-foreground mt-1 text-[11px]">
                        {o.quantity} × {o.paper_size.toUpperCase()} · {o.paper_type}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge variant="secondary" className="text-[10px]">
                          {o.turnaround}
                        </Badge>
                        <span className="font-mono text-[11px] font-semibold">
                          {o.staff_price != null ? money(Number(o.staff_price)) : "—"}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                  {!isLoading && column.length === 0 && (
                    <p className="text-muted-foreground px-1 py-6 text-center text-[11px]">Empty</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <OrderDetail
              order={selected}
              printers={printers ?? []}
              onSave={(patch) => {
                update.mutate({ id: selected.id, patch });
                setSelected({ ...selected, ...(patch as Partial<Order>) });
              }}
              saving={update.isPending}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function OrderDetail({
  order,
  printers,
  onSave,
  saving,
}: {
  order: Order;
  printers: { id: string; name: string; status: string; location: string | null }[];
  onSave: (patch: OrderPatch) => void;
  saving: boolean;
}) {
  const [price, setPrice] = useState(order.staff_price != null ? String(order.staff_price) : "");
  const [staffNotes, setStaffNotes] = useState(order.staff_notes ?? "");
  const [printerId, setPrinterId] = useState(order.assigned_printer_id ?? "");

  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-mono">{order.order_number}</SheetTitle>
        <SheetDescription>
          Received {new Date(order.created_at).toLocaleString()}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-6 px-4 pb-8">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Spec label="Quantity" value={String(order.quantity)} />
          <Spec label="Size" value={order.paper_size.toUpperCase()} />
          <Spec label="Paper" value={order.paper_type} />
          <Spec label="Colour" value={order.color_mode} />
          <Spec label="Sides" value={order.sides} />
          <Spec label="Binding" value={order.binding} />
          <Spec label="Turnaround" value={order.turnaround} />
          <Spec label="Status" value={STATUS_LABEL[order.status] ?? order.status} />
        </dl>

        {order.customer_notes && (
          <p className="bg-secondary rounded-lg p-3 text-xs">
            <strong>Customer notes:</strong> {order.customer_notes}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="price">Quoted price (KES)</Label>
          <Input
            id="price"
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="font-mono"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="staff-notes">Notes to customer</Label>
          <Textarea
            id="staff-notes"
            rows={3}
            value={staffNotes}
            onChange={(e) => setStaffNotes(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Assign printer</Label>
          <Select value={printerId || "none"} onValueChange={(v) => setPrinterId(v === "none" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {printers.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} · {p.location ?? "—"} ({p.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>


        <Button
          variant="hero"
          className="w-full"
          disabled={saving}
          onClick={() =>
            onSave({
              staff_price: price === "" ? null : Number(price),
              staff_notes: staffNotes || null,
              assigned_printer_id: printerId || null,
            })
          }
        >
          <Save /> Save changes
        </Button>

        <div>
          <p className="mb-2 text-xs font-bold tracking-wide uppercase">Move to</p>
          <div className="flex flex-wrap gap-2">
            {[...STATUS_FLOW, "cancelled"].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={order.status === s ? "brand" : "soft"}
                disabled={saving || order.status === s}
                onClick={() => onSave({ status: s as OrderStatus })}
              >
                {STATUS_LABEL[s]}
              </Button>
            ))}
          </div>
        </div>

        <PrintHistory order={order} printers={printers} />
      </div>
    </>
  );
}

function PrintHistory({
  order,
  printers,
}: {
  order: Order;
  printers: { id: string; name: string; status: string; location: string | null }[];
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: logs } = useQuery({
    queryKey: ["print-logs", order.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("print_logs")
        .select("*")
        .eq("order_id", order.id)
        .order("printed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const log = useMutation({
    mutationFn: async (status: "success" | "failed") => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const { error } = await supabase.from("print_logs").insert({
        order_id: order.id,
        printer_id: order.assigned_printer_id,
        operator_id: auth.user.id,
        pages_printed: order.quantity,
        status,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["print-logs", order.id] }),
  });

  const printerName = (id: string | null) =>
    printers.find((p) => p.id === id)?.name ?? "Unassigned";

  function printSummary() {
    const w = window.open("", "_blank", "width=720,height=900");
    if (!w) {
      toast.error("Allow pop-ups to print the summary.");
      log.mutate("failed");
      return;
    }
    w.document.write(`<!doctype html><html><head><title>${order.order_number}</title>
      <style>body{font-family:system-ui,sans-serif;padding:32px;color:#111}
      h1{font-size:20px;margin:0 0 4px}h2{font-size:12px;color:#666;margin:0 0 24px;font-weight:600}
      table{width:100%;border-collapse:collapse;font-size:13px}
      td{padding:6px 0;border-bottom:1px solid #eee}
      td:first-child{color:#666;width:45%;text-transform:uppercase;font-size:11px;letter-spacing:.04em}
      footer{margin-top:32px;font-size:11px;color:#666}</style></head><body>
      <h1>${STORE.name}</h1><h2>${STORE.address} · ${STORE.phone}</h2>
      <table>
        <tr><td>Order</td><td>${order.order_number}</td></tr>
        <tr><td>Received</td><td>${new Date(order.created_at).toLocaleString()}</td></tr>
        <tr><td>Quantity</td><td>${order.quantity}</td></tr>
        <tr><td>Paper</td><td>${order.paper_size.toUpperCase()} · ${order.paper_type}</td></tr>
        <tr><td>Colour</td><td>${order.color_mode}</td></tr>
        <tr><td>Sides</td><td>${order.sides}</td></tr>
        <tr><td>Binding</td><td>${order.binding}</td></tr>
        <tr><td>Turnaround</td><td>${order.turnaround}</td></tr>
        <tr><td>Printer</td><td>${printerName(order.assigned_printer_id)}</td></tr>
        <tr><td>Quoted price</td><td>${order.staff_price != null ? money(Number(order.staff_price)) : "—"}</td></tr>
        <tr><td>Status</td><td>${STATUS_LABEL[order.status] ?? order.status}</td></tr>
      </table>
      <footer>Printed ${new Date().toLocaleString()} — ${STORE.name}</footer>
      </body></html>`);
    w.document.close();
    w.focus();
    w.print();
    log.mutate("success");
    toast.success("Summary sent to printer and logged.");
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold tracking-wide uppercase">Print history</p>
        <Button size="sm" variant="soft" onClick={() => setOpen(true)}>
          <PrinterIcon /> Print summary
        </Button>
      </div>
      <ul className="mt-3 space-y-2">
        {(logs ?? []).map((l) => (
          <li key={l.id} className="bg-secondary rounded-lg p-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{printerName(l.printer_id)}</span>
              <Badge variant={l.status === "failed" ? "destructive" : "secondary"}>
                {l.status ?? "success"}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {new Date(l.printed_at).toLocaleString()} · {l.pages_printed} page(s)
            </p>
          </li>
        ))}
        {(logs ?? []).length === 0 && (
          <li className="text-muted-foreground text-xs">Nothing printed yet.</li>
        )}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print order summary</DialogTitle>
            <DialogDescription>
              A clean job ticket for {order.order_number} will open in your browser print dialog and
              be recorded in print history.
            </DialogDescription>
          </DialogHeader>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Spec label="Quantity" value={String(order.quantity)} />
            <Spec label="Printer" value={printerName(order.assigned_printer_id)} />
          </dl>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="hero"
              onClick={() => {
                setOpen(false);
                printSummary();
              }}
            >
              <PrinterIcon /> Print now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary rounded-lg p-2.5">
      <dt className="text-muted-foreground text-[10px] tracking-wide uppercase">{label}</dt>
      <dd className="text-xs font-semibold capitalize">{value}</dd>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
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
