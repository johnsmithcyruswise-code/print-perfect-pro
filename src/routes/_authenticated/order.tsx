import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  UploadCloud,
  FileText,
  X,
  Check,
  Loader2,
  Leaf,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Clock,
  BellRing,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  BINDINGS,
  COLOR_MODES,
  DEFAULT_SPECS,
  ECO_SCORE,
  PAPER_SIZES,
  PAPER_TYPES,
  SIDES,
  STORE,
  TURNAROUNDS,
  type Specs,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/order")({
  head: () => ({
    meta: [
      { title: "New print order — Bazz Computer Services" },
      {
        name: "description",
        content:
          "Upload your files, choose paper, size and finishing, and submit your print job. We prepare your quote in store.",
      },
      { property: "og:title", content: "New print order — Bazz Computer Services" },
      { property: "og:description", content: "Upload files and submit a print job in three steps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrderPage,
});

const MAX_BYTES = 50 * 1024 * 1024;
const ACCEPTED = [".pdf", ".png", ".jpg", ".jpeg", ".ai", ".psd", ".docx", ".xlsx", ".pptx", ".zip"];
const STEPS = ["Upload", "Print specs", "Confirmation"];

function OrderPage() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [specs, setSpecs] = useState<Specs>({ ...DEFAULT_SPECS, quantity: 1 });
  const [notes, setNotes] = useState("");
  const [notify, setNotify] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tracking, setTracking] = useState<string | null>(null);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const accepted: File[] = [];
    for (const f of Array.from(list)) {
      const ext = `.${f.name.split(".").pop()?.toLowerCase()}`;
      if (!ACCEPTED.includes(ext)) {
        toast.error(`${f.name}: unsupported file type`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name}: larger than 50MB`);
        continue;
      }
      accepted.push(f);
      if (f.type.startsWith("image/")) {
        setPreviews((p) => ({ ...p, [f.name]: URL.createObjectURL(f) }));
      }
    }
    if (accepted.length) setFiles((prev) => [...prev, ...accepted]);
  }

  async function submit() {
    if (!user) return;
    setSubmitting(true);
    setProgress(10);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          paper_size: specs.paperSize,
          custom_width_mm: specs.customWidth ?? null,
          custom_height_mm: specs.customHeight ?? null,
          paper_type: specs.paperType,
          color_mode: specs.colorMode,
          sides: specs.sides,
          binding: specs.binding,
          quantity: specs.quantity,
          turnaround: specs.turnaround,
          addons: [],
          notes: notes || null,
          customer_notes: notes || null,
          delivery_method: "pickup",
        })
        .select()
        .single();
      if (error || !order) throw error ?? new Error("Order failed");

      let done = 0;
      for (const file of files) {
        const path = `${user.id}/${order.id}/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("print-files").upload(path, file);
        if (upErr) throw upErr;
        await supabase.from("order_files").insert({
          order_id: order.id,
          user_id: user.id,
          file_path: path,
          file_name: file.name,
          size_bytes: file.size,
          content_type: file.type || null,
        });
        await supabase.from("recent_files").insert({
          user_id: user.id,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
          file_type: file.type || null,
        });
        done += 1;
        setProgress(10 + Math.round((done / Math.max(1, files.length)) * 80));
      }

      await supabase.from("order_events").insert({
        order_id: order.id,
        status: "pending",
        note: "Order received — our team will prepare your quote",
      });
      setProgress(100);
      setTracking(order.order_number);
      setStep(2);
    } catch (err) {
      console.error(err);
      toast.error("We couldn't submit that order. Please try again.");
      setProgress(0);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight">Start a print job</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Upload, choose your specs and submit — we price the job in store when you collect.
        </p>

        <ol className="mt-8 flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button
                onClick={() => i < step && !tracking && setStep(i)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors",
                  i === step
                    ? "gradient-brand text-primary-foreground border-transparent"
                    : i < step
                      ? "border-success/40 bg-success/10 text-foreground"
                      : "border-border text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-3" /> : <span className="font-mono">{i + 1}</span>}
                {s}
              </button>
            </li>
          ))}
        </ol>

        <motion.section
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card mt-8 rounded-3xl p-6"
        >
          {step === 0 && (
            <div>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  addFiles(e.dataTransfer.files);
                }}
                onClick={() => inputRef.current?.click()}
                className="border-primary/30 bg-primary/5 hover:bg-primary/10 flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-12 text-center transition-colors"
              >
                <UploadCloud className="text-primary size-10" />
                <p className="font-semibold">Drag &amp; drop your files</p>
                <p className="text-muted-foreground text-xs">
                  PDF, PNG, JPG, AI, PSD, DOCX, XLSX, PPTX or ZIP · up to 50MB per file
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  hidden
                  accept={ACCEPTED.join(",")}
                  onChange={(e) => addFiles(e.target.files)}
                />
              </div>

              <ul className="mt-6 space-y-3">
                {files.map((f, i) => (
                  <li
                    key={`${f.name}-${i}`}
                    className="border-border bg-card flex items-center gap-3 rounded-xl border p-3"
                  >
                    {previews[f.name] ? (
                      <img
                        src={previews[f.name]}
                        alt={`Preview of ${f.name}`}
                        className="size-12 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="bg-secondary flex size-12 items-center justify-center rounded-lg">
                        <FileText className="text-primary size-5" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{f.name}</p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {(f.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${f.name}`}
                      onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <X />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-7">
              <Group label="Paper size">
                <Choices
                  options={PAPER_SIZES}
                  value={specs.paperSize}
                  onSelect={(v) => setSpecs({ ...specs, paperSize: v })}
                />
                {specs.paperSize === "custom" && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="w">Width (mm)</Label>
                      <Input
                        id="w"
                        type="number"
                        value={specs.customWidth ?? ""}
                        onChange={(e) => setSpecs({ ...specs, customWidth: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="h">Height (mm)</Label>
                      <Input
                        id="h"
                        type="number"
                        value={specs.customHeight ?? ""}
                        onChange={(e) =>
                          setSpecs({ ...specs, customHeight: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                )}
              </Group>

              <Group label="Paper type">
                <Choices
                  options={PAPER_TYPES}
                  value={specs.paperType}
                  onSelect={(v) => setSpecs({ ...specs, paperType: v })}
                />
                <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
                  <Leaf className="text-success size-3.5" /> Eco score:{" "}
                  {ECO_SCORE[specs.paperType] ?? "B"}
                </p>
              </Group>

              <Group label="Colour">
                <Choices
                  options={COLOR_MODES}
                  value={specs.colorMode}
                  onSelect={(v) => setSpecs({ ...specs, colorMode: v })}
                />
              </Group>

              <Group label="Printing side">
                <Choices
                  options={SIDES}
                  value={specs.sides}
                  onSelect={(v) => setSpecs({ ...specs, sides: v })}
                />
              </Group>

              <Group label="Binding">
                <Choices
                  options={BINDINGS}
                  value={specs.binding}
                  onSelect={(v) => setSpecs({ ...specs, binding: v })}
                />
              </Group>

              <Group label="Turnaround">
                <Choices
                  options={TURNAROUNDS}
                  value={specs.turnaround}
                  onSelect={(v) => setSpecs({ ...specs, turnaround: v })}
                />
              </Group>

              <Group label="Quantity">
                <Input
                  type="number"
                  min={1}
                  max={10000}
                  value={specs.quantity}
                  onChange={(e) =>
                    setSpecs({
                      ...specs,
                      quantity: Math.min(10000, Math.max(1, Number(e.target.value) || 1)),
                    })
                  }
                  className="max-w-40 font-mono"
                />
              </Group>

              <Group label="Special instructions">
                <Textarea
                  rows={4}
                  value={notes}
                  placeholder="Bleed, colour profile, mounting, collation…"
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Group>

              <div className="flex items-center justify-between rounded-xl border border-dashed p-4">
                <div className="flex items-center gap-2 text-sm">
                  <BellRing className="text-primary size-4" />
                  Notify me by email when my order is ready
                </div>
                <Switch checked={notify} onCheckedChange={setNotify} />
              </div>

              <p className="text-muted-foreground border-border rounded-xl border border-dashed p-4 text-xs">
                No payment now. Our team reviews your job and prepares a quote — you pay in store
                when you collect.
              </p>

              {submitting && <Progress value={progress} />}
            </div>
          )}

          {step === 2 && tracking && (
            <div className="space-y-6 text-center">
              <span className="bg-success/15 text-success mx-auto flex size-16 items-center justify-center rounded-full">
                <Check className="size-8" />
              </span>
              <div>
                <h2 className="text-xl font-extrabold">Order received</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  We'll prepare your quote and let you know when it's ready.
                </p>
              </div>
              <div className="bg-secondary mx-auto w-fit rounded-2xl px-8 py-5">
                <p className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
                  Tracking number
                </p>
                <p className="font-mono text-2xl font-extrabold">{tracking}</p>
              </div>
              <div className="text-muted-foreground mx-auto grid max-w-md gap-2 text-left text-sm">
                <p className="flex items-start gap-2">
                  <MapPin className="text-primary mt-0.5 size-4 shrink-0" /> {STORE.address}
                </p>
                <p className="flex items-start gap-2">
                  <Clock className="text-primary mt-0.5 size-4 shrink-0" /> {STORE.hours}
                </p>
              </div>
              <Button variant="hero" size="lg" asChild>
                <Link to="/dashboard">View my orders</Link>
              </Button>
            </div>
          )}

          {step < 2 && (
            <div className="mt-8 flex justify-between gap-3">
              <Button
                variant="ghost"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0 || submitting}
              >
                <ArrowLeft /> Back
              </Button>
              {step === 0 ? (
                <Button
                  variant="hero"
                  size="lg"
                  disabled={files.length === 0}
                  onClick={() => setStep(1)}
                >
                  Continue <ArrowRight />
                </Button>
              ) : (
                <Button variant="hero" size="lg" disabled={submitting} onClick={submit}>
                  {submitting && <Loader2 className="animate-spin" />} Submit order
                </Button>
              )}
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold">{label}</h3>
      {children}
    </div>
  );
}

function Choices({
  options,
  value,
  onSelect,
}: {
  options: { value: string; label: string; hint?: string }[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onSelect(o.value)}
          className={cn(
            "hover-lift rounded-xl border px-4 py-2.5 text-left text-sm transition-colors",
            value === o.value
              ? "border-primary bg-primary/10 text-primary font-semibold"
              : "border-border bg-card hover:border-primary/40",
          )}
        >
          <span className="block">{o.label}</span>
          {o.hint && <span className="text-muted-foreground block text-[11px]">{o.hint}</span>}
        </button>
      ))}
    </div>
  );
}
