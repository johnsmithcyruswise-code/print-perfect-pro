import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Printer as PrinterIcon,
  Plus,
  ShieldAlert,
  Trash2,
  Star,
  Search,
  Pencil,
  Usb,
  Bluetooth,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/use-role";
import {
  listPairedUsbPrinters,
  localScanSupported,
  requestBluetoothPrinter,
  requestUsbPrinter,
  type DetectedPrinter,
} from "@/lib/local-printers";

export const Route = createFileRoute("/_authenticated/printers")({
  head: () => ({
    meta: [
      { title: "Printer management — Planned Kid Computer Services" },
      {
        name: "description",
        content: "Register, scan, monitor and set default printers for the PK production floor.",
      },
      { property: "og:title", content: "Printer management — Planned Kid Computer Services" },
      { property: "og:description", content: "Register and monitor PK shop printers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrintersPage,
});

const STATUSES = ["online", "offline", "busy"] as const;

type PrinterForm = {
  id?: string;
  name: string;
  model: string;
  location: string;
  ip_address: string;
  status: string;
  is_default: boolean;
};

const EMPTY: PrinterForm = {
  name: "",
  model: "",
  location: "",
  ip_address: "",
  status: "offline",
  is_default: false,
};

function PrintersPage() {
  const { isStaff, loading } = useRoles();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PrinterForm | null>(null);
  const [detected, setDetected] = useState<DetectedPrinter[]>([]);
  const [scanning, setScanning] = useState(false);
  const support = localScanSupported();

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

  const save = useMutation({
    mutationFn: async (p: PrinterForm) => {
      const payload = {
        name: p.name,
        model: p.model || null,
        location: p.location || null,
        ip_address: p.ip_address || null,
        status: p.status,
        is_default: p.is_default,
      };
      if (p.is_default) {
        await supabase.from("printers").update({ is_default: false }).neq("id", p.id ?? "");
      }
      const { error } = p.id
        ? await supabase.from("printers").update(payload).eq("id", p.id)
        : await supabase.from("printers").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Printer saved.");
      setForm(null);
      invalidate();
    },
    onError: () => toast.error("Couldn't save that printer."),
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

  async function scan() {
    if (!support.usb && !support.bluetooth) {
      toast.info("Manual entry only – your browser doesn't support local scanning");
      return;
    }
    setScanning(true);
    const found: DetectedPrinter[] = [];
    try {
      if (support.usb) {
        found.push(...(await listPairedUsbPrinters()));
        try {
          const picked = await requestUsbPrinter();
          if (!found.some((f) => f.id === picked.id)) found.push(picked);
        } catch {
          /* user cancelled the USB chooser */
        }
      }
      if (support.bluetooth) {
        try {
          found.push(await requestBluetoothPrinter());
        } catch {
          /* user cancelled the Bluetooth chooser */
        }
      }
      setDetected(found);
      toast[found.length ? "success" : "info"](
        found.length ? `${found.length} local device(s) detected.` : "No local devices selected.",
      );
    } catch {
      toast.error("Local scan failed on this device.");
    } finally {
      setScanning(false);
    }
  }

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
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Printer management</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Shop devices available to the production console.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="soft" onClick={scan} disabled={scanning}>
              <Search /> {scanning ? "Scanning…" : "Scan for local printers"}
            </Button>
            <Button variant="hero" onClick={() => setForm({ ...EMPTY })}>
              <Plus /> Add printer
            </Button>
          </div>
        </div>

        {!support.usb && !support.bluetooth && (
          <p className="bg-secondary text-muted-foreground mt-4 rounded-xl p-3 text-xs">
            Manual entry only – your browser doesn't support local scanning.
          </p>
        )}

        {detected.length > 0 && (
          <section className="glass-card mt-6 rounded-2xl p-5">
            <h2 className="text-sm font-bold">Detected local devices</h2>
            <ul className="mt-3 space-y-2">
              {detected.map((d) => (
                <li
                  key={d.id}
                  className="border-border flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
                >
                  <div className="flex items-center gap-3">
                    {d.type === "USB" ? (
                      <Usb className="text-primary size-4" />
                    ) : (
                      <Bluetooth className="text-primary size-4" />
                    )}
                    <div>
                      <p className="text-sm font-semibold">{d.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {d.type} · {d.status}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="soft"
                    onClick={() =>
                      setForm({
                        ...EMPTY,
                        name: d.name,
                        model: d.model,
                        location: d.type === "USB" ? "Front Desk" : "",
                        status: d.status.toLowerCase(),
                      })
                    }
                  >
                    <Plus /> Add to system
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="glass-card mt-8 overflow-x-auto rounded-2xl p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>IP address</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              )}
              {printers?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-semibold">
                    <span className="flex items-center gap-2">
                      <PrinterIcon className="text-primary size-4" />
                      {p.name}
                    </span>
                  </TableCell>
                  <TableCell>{p.model ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{p.ip_address ?? "—"}</TableCell>
                  <TableCell>{p.location ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "online" ? "default" : "secondary"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {p.is_default ? (
                      <Badge variant="default">Default</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={setDefault.isPending}
                        onClick={() => setDefault.mutate(p.id)}
                      >
                        <Star /> Set
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setForm({
                          id: p.id,
                          name: p.name,
                          model: p.model ?? "",
                          location: p.location ?? "",
                          ip_address: p.ip_address ?? "",
                          status: p.status,
                          is_default: p.is_default,
                        })
                      }
                    >
                      <Pencil /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(p.id)}
                    >
                      <Trash2 /> Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && (printers?.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground py-10 text-center text-sm">
                    No printers yet — add one or scan for local devices.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </section>
      </main>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent>
          {form && (
            <>
              <DialogHeader>
                <DialogTitle>{form.id ? "Edit printer" : "Add printer"}</DialogTitle>
                <DialogDescription>
                  These devices appear when staff assign jobs to a press.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["name", "Printer name *"],
                    ["model", "Model"],
                    ["ip_address", "IP address"],
                    ["location", "Location"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      value={form[key]}
                      placeholder={key === "location" ? "Front Desk" : undefined}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <label className="mt-6 flex items-center gap-2 text-sm font-medium">
                  <Checkbox
                    checked={form.is_default}
                    onCheckedChange={(c) => setForm({ ...form, is_default: c === true })}
                  />
                  Set as default
                </label>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setForm(null)}>
                  Cancel
                </Button>
                <Button
                  variant="hero"
                  disabled={!form.name || save.isPending}
                  onClick={() => save.mutate(form)}
                >
                  Save printer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
