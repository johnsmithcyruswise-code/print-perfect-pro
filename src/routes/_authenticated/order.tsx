import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  ADDONS,
  BINDINGS,
  COLOR_MODES,
  DEFAULT_SPECS,
  ECO_SCORE,
  PAPER_SIZES,
  PAPER_TYPES,
  SIDES,
  TURNAROUNDS,
  money,
  quote,
  type Specs,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/order")({
  head: () => ({
    meta: [
      { title: "New print order — Bazz Computer Services" },
      { name: "description", content: "Upload files, pick paper, size and finishing, and get an instant print quote." },
      { property: "og:title", content: "New print order — Bazz Computer Services" },
      { property: "og:description", content: "Upload files and get an instant print quote." },
    ],
  }),
  component: OrderPage,
});

const MAX_BYTES = 50 * 1024 * 1024;
const ACCEPTED = [".pdf", ".png", ".jpg", ".jpeg", ".ai", ".psd", ".zip"];
const STEPS = ["Files", "Specifications", "Review", "Checkout"];

function OrderPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [specs, setSpecs] = useState<Specs>(DEFAULT_SPECS);
  const [notes, setNotes] = useState("");
  const [coupon, setCoupon] = useState("");
  const [percentOff, setPercentOff] = useState(0);
  const [delivery, setDelivery] = useState<"pickup" | "shipping">("pickup");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const q = useMemo(() => quote(specs, percentOff), [specs, percentOff]);

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

  async function applyCoupon() {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    const { data } = await supabase
      .from("coupons")
      .select("code, percent_off")
      .eq("code", code)
      .maybeSingle();
    if (!data) {
      setPercentOff(0);
      toast.error("That coupon isn't valid.");
      return;
    }
    setPercentOff(data.percent_off);
    toast.success(`${data.code} applied — ${data.percent_off}% off`);
  }

  async function submit() {
    if (!user) return;
    if (delivery === "shipping" && address.trim().length < 8) {
      toast.error("Please enter a shipping address.");
      return;
    }
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
          addons: specs.addons,
          notes: notes || null,
          coupon_code: percentOff > 0 ? coupon.trim().toUpperCase() : null,
          unit_price: q.unitPrice,
          subtotal: q.subtotal,
          discount: q.discount,
          total: q.total,
          delivery_method: delivery,
          address: delivery === "shipping" ? address : null,
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
        done += 1;
        setProgress(10 + Math.round((done / Math.max(1, files.length)) * 80));
      }

      await supabase.from("order_events").insert({
        order_id: order.id,
        status: "pending",
        note: "Order received — awaiting payment",
      });
      setProgress(100);
      toast.success(`Order ${order.order_number} created!`);
      navigate({ to: "/dashboard" });
    } catch (err) {
      console.error(err);
      toast.error("We couldn't create that order. Please try again.");
      setSubmitting(false);
      setProgress(0);
    }
  }

  const canNext = step === 0 ? files.length > 0 : true;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight">Start a print job</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Upload, customise and get an instant quote in under three minutes.
        </p>

        <ol className="mt-8 flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button
                onClick={() => i < step && setStep(i)}
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

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          <motion.section
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-3xl p-6"
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
                  <p className="font-semibold">Drag & drop your artwork</p>
                  <p className="text-muted-foreground text-xs">
                    PDF, PNG, JPG, AI, PSD or ZIP · up to 50MB per file
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
                          onChange={(e) =>
                            setSpecs({ ...specs, customWidth: Number(e.target.value) })
                          }
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

                <Group label="Add-ons">
                  <div className="flex flex-wrap gap-2">
                    {ADDONS.map((a) => {
                      const on = specs.addons.includes(a.value);
                      return (
                        <button
                          key={a.value}
                          onClick={() =>
                            setSpecs({
                              ...specs,
                              addons: on
                                ? specs.addons.filter((x) => x !== a.value)
                                : [...specs.addons, a.value],
                            })
                          }
                          className={cn(
                            "rounded-full border px-4 py-2 text-xs font-semibold transition-colors",
                            on
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/40",
                          )}
                        >
                          {a.label}
                        </button>
                      );
                    })}
                  </div>
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
                  {q.tier < 1 && (
                    <Badge className="bg-success/15 text-success-foreground mt-2">
                      Bulk tier applied — {Math.round((1 - q.tier) * 100)}% off unit price
                    </Badge>
                  )}
                </Group>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="from-primary/10 to-brand/10 relative overflow-hidden rounded-2xl bg-gradient-to-br p-10">
                  <div className="mx-auto w-fit [perspective:900px]">
                    <div
                      className="border-border bg-card grid place-items-center rounded-lg border shadow-[var(--shadow-lift)]"
                      style={{
                        width: 200,
                        height: 260,
                        animation: "float-slow 5s ease-in-out infinite",
                      }}
                    >
                      <span className="text-muted-foreground rotate-[-20deg] text-xs font-bold tracking-widest">
                        PROOF — NOT FINAL
                      </span>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-6 text-center text-xs">
                    Interactive mockup of your {specs.paperSize} {specs.paperType} print
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes for our prepress team</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    rows={4}
                    placeholder="Bleed, colour profile, mounting instructions…"
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <Group label="Coupon">
                  <div className="flex gap-2">
                    <Input
                      value={coupon}
                      placeholder="WELCOME10"
                      className="max-w-52 font-mono uppercase"
                      onChange={(e) => setCoupon(e.target.value)}
                    />
                    <Button variant="soft" onClick={applyCoupon}>
                      Apply
                    </Button>
                  </div>
                </Group>

                <Group label="Delivery">
                  <div className="flex gap-2">
                    {(["pickup", "shipping"] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDelivery(d)}
                        className={cn(
                          "rounded-full border px-4 py-2 text-xs font-semibold capitalize",
                          delivery === d
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        {d === "pickup" ? "In-store pickup" : "Ship to me"}
                      </button>
                    ))}
                  </div>
                  {delivery === "shipping" && (
                    <Textarea
                      className="mt-3"
                      rows={3}
                      value={address}
                      placeholder="Street, city, postal code"
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  )}
                </Group>

                <p className="text-muted-foreground border-border rounded-xl border border-dashed p-4 text-xs">
                  Card payment is coming soon. Your order is placed as{" "}
                  <strong>awaiting payment</strong> and our team confirms it before printing.
                </p>

                {submitting && <Progress value={progress} />}
              </div>
            )}

            <div className="mt-8 flex justify-between gap-3">
              <Button
                variant="ghost"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0 || submitting}
              >
                <ArrowLeft /> Back
              </Button>
              {step < 3 ? (
                <Button
                  variant="hero"
                  size="lg"
                  disabled={!canNext}
                  onClick={() => setStep((s) => s + 1)}
                >
                  Continue <ArrowRight />
                </Button>
              ) : (
                <Button variant="hero" size="lg" disabled={submitting} onClick={submit}>
                  {submitting && <Loader2 className="animate-spin" />} Place order · {money(q.total)}
                </Button>
              )}
            </div>
          </motion.section>

          <aside className="glass-card h-fit rounded-3xl p-6 lg:sticky lg:top-24">
            <h2 className="text-sm font-bold tracking-wide uppercase">Live quote</h2>
            <p className="text-gradient-brand mt-2 font-mono text-4xl font-extrabold">
              {money(q.total)}
            </p>
            <dl className="text-muted-foreground mt-5 space-y-2 text-sm">
              <Row label="Unit price" value={money(q.unitPrice)} />
              <Row label="Quantity" value={String(specs.quantity)} />
              <Row label="Subtotal" value={money(q.subtotal)} />
              {q.discount > 0 && <Row label="Coupon" value={`− ${money(q.discount)}`} />}
              <Row label="Files" value={String(files.length)} />
            </dl>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd className="text-foreground font-mono">{value}</dd>
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