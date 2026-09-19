import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ListOrdered,
  ImageIcon,
  FolderOpen,
  Printer as PrinterIcon,
  Printer,
  Settings,
  LogOut,
  ShieldAlert,
  Package,
  Timer,
  Wallet,
  Save,
  Check,
  X,
  Trash2,
  Download,
  ChevronRight,
  Bell,
} from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BrandLogo } from "@/components/brand-logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-role";
import { STATUS_FLOW, STATUS_LABEL, STORE } from "@/lib/pricing";
import { cleanOldStorage } from "@/lib/admin.functions";
import { printOrderTicket } from "@/lib/qz-print";
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

type Order = {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  order_type: string;
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
  location_lat: number | null;
  location_lng: number | null;
  created_at: string;
};

type FileRow = {
  id: string;
  user_id: string;
  order_id: string | null;
  folder_id: string | null;
  name: string;
  url: string;
  size: number;
  type: string | null;
  uploaded_at: string;
};

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ListOrdered },
  { id: "passport", label: "Passport Photos", icon: ImageIcon },
  { id: "files", label: "Customer Files", icon: FolderOpen },
  { id: "printers", label: "Printers", icon: PrinterIcon },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type TabId = (typeof TABS)[number]["id"];

function AdminPage() {
  const { isStaff, loading } = useRoles();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("dashboard");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  async function adminSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  }

  // Realtime notifications for new orders
  useEffect(() => {
    const playPing = () => {
      try {
        const audio = new Audio(
          "data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU" + "A".repeat(64)
        );
        audio.volume = 0.4;
        void audio.play();
      } catch {}
    };
    const channel = supabase
      .channel("admin-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          playPing();
          toast.info(`New order received: ${(payload.new as any).order_number}`, {
            icon: <Bell className="size-4" />,
          });
          queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);


  if (!loading && !isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <main className="max-w-md text-center">
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
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <BrandLogo className="h-8 w-auto" />
          <span className="font-bold text-sm">Staff Console</span>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                tab === t.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              <t.icon className="size-4" /> {t.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full justify-start" onClick={adminSignOut}>
            <LogOut className="size-4" /> Log out
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <BrandLogo className="h-8 w-auto" />
          <select
            value={tab}
            onChange={(e) => setTab(e.target.value as TabId)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {TABS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </header>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {tab === "dashboard" && <DashboardTab />}
          {tab === "orders" && <OrdersTab onSelect={setSelectedOrder} />}
          {tab === "passport" && <PassportTab />}
          {tab === "files" && <FilesTab />}
          {tab === "printers" && <PrintersTab />}
          {tab === "settings" && <SettingsTab />}
        </div>
      </main>

      <OrderSheet order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}

function DashboardTab() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Order[];
    },
  });

  const kpis = useMemo(() => {
    const list = orders ?? [];
    const today = new Date().toDateString();
    return {
      today: list.filter((o) => new Date(o.created_at).toDateString() === today).length,
      pending: list.filter((o) => o.status === "pending").length,
      completed: list.filter((o) => o.status === "completed").length,
      queue: list.filter((o) => ["processing", "printing"].includes(o.status)).length,
    };
  }, [orders]);

  const chart = useMemo(() => {
    const list = orders ?? [];
    const days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-KE", { weekday: "short" });
      const count = list.filter((o) => new Date(o.created_at).toDateString() === d.toDateString()).length;
      days.push({ label, count });
    }
    return days;
  }, [orders]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">Overview of production and recent activity.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Package} label="Orders today" value={String(kpis.today)} />
        <Kpi icon={Timer} label="Awaiting quote" value={String(kpis.pending)} />
        <Kpi icon={PrinterIcon} label="On the press" value={String(kpis.queue)} />
        <Kpi icon={Wallet} label="Completed jobs" value={String(kpis.completed)} />
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-sm font-bold tracking-wide uppercase mb-4">Orders last 7 days</h2>
        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : (
          <div className="flex items-end gap-2 h-40">
            {chart.map((d) => {
              const max = Math.max(...chart.map((c) => c.count), 1);
              const pct = (d.count / max) * 100;
              return (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-primary/80 rounded-t-md min-h-[4px]"
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{d.label}</span>
                  <span className="text-xs font-semibold">{d.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function OrdersTab({ onSelect }: { onSelect: (o: Order) => void }) {
  const [filter, setFilter] = useState("");
  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Order[];
    },
  });

  const filtered = useMemo(() => {
    let list = (orders ?? []).filter((o) => o.order_type !== "passport");
    if (filter.trim()) {
      const q = filter.toLowerCase();
      list = list.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.status.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1 text-sm">Search, quote and move print jobs.</p>
        </div>
        <Input
          placeholder="Search order number or status"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
      </div>
      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : (
        <div className="space-y-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={() => onSelect(o)}
              className="glass-card w-full rounded-2xl p-4 text-left hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold">{o.order_number}</span>
                <StatusBadge status={o.status} />
              </div>
              <p className="text-muted-foreground text-xs mt-1">
                {o.quantity} × {o.paper_size.toUpperCase()} · {o.paper_type} · {o.turnaround}
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                {new Date(o.created_at).toLocaleString()}
              </p>
            </button>
          ))}
          {!isLoading && filtered.length === 0 && (
            <p className="text-muted-foreground rounded-2xl border border-dashed p-10 text-center text-sm">
              No orders found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PassportTab() {
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-passport"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_files(*)")
        .eq("order_type", "passport")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as (Order & { order_files: any[] })[];
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
      await supabase.from("order_events").insert({
        order_id: id,
        status,
        note: status === "ready" ? "Passport photo approved" : "Passport photo rejected",
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-passport"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Passport Photos</h1>
        <p className="text-muted-foreground mt-1 text-sm">Review and approve passport orders.</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(orders ?? []).map((o) => (
            <div key={o.id} className="glass-card rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm">{o.order_number}</span>
                <StatusBadge status={o.status} />
              </div>
              <div className="aspect-[3/4] rounded-xl border border-border bg-black/5 overflow-hidden">
                {o.order_files?.[0] ? (
                  <PassportImage path={o.order_files[0].file_path} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                    No image
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="hero"
                  size="sm"
                  className="flex-1"
                  disabled={o.status === "ready"}
                  onClick={() => update.mutate({ id: o.id, status: "ready" })}
                >
                  <Check className="size-4" /> Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={o.status === "cancelled"}
                  onClick={() => update.mutate({ id: o.id, status: "cancelled" })}
                >
                  <X className="size-4" /> Reject
                </Button>
              </div>
            </div>
          ))}
          {!isLoading && (orders ?? []).length === 0 && (
            <p className="text-muted-foreground col-span-full rounded-2xl border border-dashed p-10 text-center text-sm">
              No passport orders yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PassportImage({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    supabase.storage.from("print-files").createSignedUrl(path, 120).then(({ data, error }) => {
      if (data && !error) setUrl(data.signedUrl);
    });
  }, [path]);
  if (!url) return <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Loading…</div>;
  return <img src={url} alt="Passport" className="h-full w-full object-contain" />;
}

function FilesTab() {
  const { data: files, isLoading } = useQuery({
    queryKey: ["admin-files"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("files")
        .select("id, user_id, order_id, folder_id, name, url, size, type, uploaded_at")
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data as FileRow[];
    },
  });

  async function download(file: FileRow) {
    const { data, error } = await supabase.storage.from("print-files").createSignedUrl(file.url, 60);
    if (error || !data) {
      toast.error("Could not generate download link.");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Customer Files</h1>
        <p className="text-muted-foreground mt-1 text-sm">Browse and download files uploaded by customers.</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : (
        <div className="space-y-2">
          {(files ?? []).map((f) => (
            <div key={f.id} className="glass-card rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold truncate">{f.name}</p>
                <p className="text-muted-foreground text-xs">
                  {new Date(f.uploaded_at).toLocaleString()} · {(f.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button variant="soft" size="sm" onClick={() => download(f)}>
                <Download className="size-4" /> Download
              </Button>
            </div>
          ))}
          {!isLoading && (files ?? []).length === 0 && (
            <p className="text-muted-foreground rounded-2xl border border-dashed p-10 text-center text-sm">
              No files uploaded yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PrintersTab() {
  const { data: printers, isLoading } = useQuery({
    queryKey: ["printers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("printers").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Printers</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage registered printers and scan for local devices.</p>
        </div>
        <Button variant="hero" asChild>
          <Link to="/printers">Open printer manager</Link>
        </Button>
      </div>
      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(printers ?? []).map((p: any) => (
            <div key={p.id} className="glass-card rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold">{p.name}</span>
                <Badge variant={p.status === "online" ? "secondary" : "outline"}>{p.status}</Badge>
              </div>
              <p className="text-muted-foreground text-xs">{p.model ?? "—"}</p>
              <p className="text-muted-foreground text-xs">{p.location ?? "No location"}</p>
            </div>
          ))}
          {!isLoading && (printers ?? []).length === 0 && (
            <p className="text-muted-foreground col-span-full rounded-2xl border border-dashed p-10 text-center text-sm">
              No printers registered.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SettingsTab() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [cleaning, setCleaning] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: next, current_password: current });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    setCurrent("");
    setNext("");
  }

  async function cleanStorage() {
    setCleaning(true);
    try {
      const result = await cleanOldStorage({});
      toast.success(`Cleaned ${result.removed} old file(s)`);
    } catch (err: any) {
      toast.error(err.message ?? "Cleanup failed");
    } finally {
      setCleaning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Account and storage maintenance.</p>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold tracking-wide uppercase">Change password</h2>
        <form onSubmit={changePassword} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="current">Current password</Label>
            <Input id="current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="next">New password</Label>
            <Input id="next" type="password" value={next} onChange={(e) => setNext(e.target.value)} required />
          </div>
          <Button type="submit" variant="hero">Update password</Button>
        </form>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold tracking-wide uppercase">Storage cleanup</h2>
        <p className="text-muted-foreground text-sm">
          Delete files older than 7 days from storage and the database.
        </p>
        <Button variant="outline" onClick={cleanStorage} disabled={cleaning}>
          {cleaning ? "Cleaning…" : "Clean old files"}
        </Button>
      </div>
    </div>
  );
}

function OrderSheet({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [price, setPrice] = useState("");
  const [staffNotes, setStaffNotes] = useState("");
  const [printerId, setPrinterId] = useState("");

  useEffect(() => {
    if (order) {
      setPrice(order.staff_price != null ? String(order.staff_price) : "");
      setStaffNotes(order.staff_notes ?? "");
      setPrinterId(order.assigned_printer_id ?? "");
    }
  }, [order]);

  const { data: printers } = useQuery({
    queryKey: ["printers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("printers").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      if (!order) throw new Error("No order");
      const { error } = await supabase.from("orders").update(patch as any).eq("id", order.id);
      if (error) throw error;
      if (patch["status"]) {
        const status = patch["status"] as OrderStatus;
        await supabase.from("order_events").insert({
          order_id: order.id,
          status,
          note: "Updated by staff",
        });
        if (status === "ready") {
          await supabase.from("notifications").insert({
            user_id: order.user_id,
            order_id: order.id,
            type: "app",
            subject: "Your order is ready for collection",
            message: `Order ${order.order_number} is ready. Come by the store during opening hours.`,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order updated");
    },
    onError: () => toast.error("Update failed"),
  });

  if (!order) return null;

  return (
    <Sheet open={!!order} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-mono">{order.order_number}</SheetTitle>
          <SheetDescription>Received {new Date(order.created_at).toLocaleString()}</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-4 pb-8 mt-6">
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

          {order.location_lat != null && order.location_lng != null && (
            <p className="bg-secondary rounded-lg p-3 text-xs">
              <strong>Location:</strong>{" "}
              <a
                href={`https://www.google.com/maps?q=${order.location_lat},${order.location_lng}`}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                {order.location_lat.toFixed(5)}, {order.location_lng.toFixed(5)}
              </a>
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="price">Internal reference number (staff only)</Label>
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
                {(printers ?? []).map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="hero"
            className="w-full"
            disabled={update.isPending}
            onClick={() =>
              update.mutate({
                staff_price: price === "" ? null : Number(price),
                staff_notes: staffNotes || null,
                assigned_printer_id: printerId || null,
              })
            }
          >
            <Save /> Save changes
          </Button>

          <PrintTicketButton order={order} />

          <div>
            <p className="mb-2 text-xs font-bold tracking-wide uppercase">Move to</p>
            <div className="flex flex-wrap gap-2">
              {[...STATUS_FLOW, "cancelled"].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={order.status === s ? "brand" : "soft"}
                  disabled={update.isPending || order.status === s}
                  onClick={() => update.mutate({ status: s })}
                >
                  {STATUS_LABEL[s]}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function PrintTicketButton({ order }: { order: Order }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  if (!user) return null;
  return (
    <Button
      variant="soft"
      className="w-full"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const result = await printOrderTicket(order, user.id);
        setBusy(false);
        if (result.ok) toast.success(result.message);
        else toast.error(result.message);
      }}
    >
      <Printer className="size-4" />
      {busy ? "Connecting to printer…" : "Print ticket"}
    </Button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    printing: "bg-purple-100 text-purple-800",
    ready: "bg-green-100 text-green-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${variants[status] ?? variants["pending"]}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
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
      <p className="text-muted-foreground mt-3 text-xs font-semibold tracking-wide uppercase">{label}</p>
      <p className="mt-1 font-mono text-2xl font-extrabold">{value}</p>
    </div>
  );
}
