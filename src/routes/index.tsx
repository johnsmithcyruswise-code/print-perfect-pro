import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Leaf, ShieldCheck, Truck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/site-header";
import { DEFAULT_SPECS, PAPER_SIZES, PAPER_TYPES, money, quote } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bazz Computer Services — Print Shop, Reinvented" },
      {
        name: "description",
        content:
          "Upload artwork, configure paper and finishing, and get an instant quote. Same-day printing, live job tracking and pickup or delivery.",
      },
      { property: "og:title", content: "Bazz Computer Services — Print Shop, Reinvented" },
      {
        property: "og:description",
        content: "Instant print quotes, same-day production and live order tracking.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [size, setSize] = useState("A4");
  const [type, setType] = useState("matte");
  const [qty, setQty] = useState(100);

  const estimate = useMemo(
    () => quote({ ...DEFAULT_SPECS, paperSize: size, paperType: type, quantity: qty }),
    [size, type, qty],
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden px-4 pt-16 pb-24">
          <div className="bg-primary/20 pointer-events-none absolute -top-40 -left-32 size-[28rem] rounded-full blur-[120px]" />
          <div className="bg-brand/20 pointer-events-none absolute -right-32 -bottom-40 size-[28rem] rounded-full blur-[120px]" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="border-primary/30 bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold">
                <Sparkles className="size-3.5" /> Same-day printing in Nairobi
              </span>
              <h1 className="mt-6 text-5xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
                Your print shop,{" "}
                <span className="text-gradient-brand">reinvented in the browser.</span>
              </h1>
              <p className="text-muted-foreground mt-6 max-w-lg text-lg">
                Bazz Computer Services turns files into finished work. Upload artwork, tune every
                spec, watch the price update live, and track your job from prepress to pickup.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button variant="hero" size="xl" asChild>
                  <Link to="/order">
                    Start a print job <ArrowRight />
                  </Link>
                </Button>
                <Button variant="soft" size="xl" asChild>
                  <Link to="/auth">Track an order</Link>
                </Button>
              </div>
              <dl className="mt-12 grid max-w-md grid-cols-3 gap-6">
                {[
                  ["4 hr", "Rush turnaround"],
                  ["12k+", "Jobs printed"],
                  ["99.4%", "On-time rate"],
                ].map(([v, l]) => (
                  <div key={l}>
                    <dt className="font-mono text-2xl font-extrabold">{v}</dt>
                    <dd className="text-muted-foreground text-xs">{l}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              <PrinterScene />

              <div className="glass-card mt-8 rounded-3xl p-6">
                <h2 className="text-sm font-bold tracking-wide uppercase">Instant estimate</h2>
                <div className="mt-4 space-y-4">
                  <Picker
                    label="Size"
                    options={PAPER_SIZES.filter((o) => o.value !== "custom")}
                    value={size}
                    onSelect={setSize}
                  />
                  <Picker label="Paper" options={PAPER_TYPES} value={type} onSelect={setType} />
                  <div className="space-y-2">
                    <Label htmlFor="qty">Quantity</Label>
                    <Input
                      id="qty"
                      type="number"
                      min={1}
                      value={qty}
                      className="max-w-36 font-mono"
                      onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                    />
                  </div>
                </div>
                <div className="border-border mt-6 flex items-end justify-between border-t pt-5">
                  <span className="text-muted-foreground text-xs">Estimated total</span>
                  <span className="text-gradient-brand font-mono text-3xl font-extrabold">
                    {money(estimate.total)}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Zap, title: "Live pricing", body: "Every spec change repriced instantly — no quote emails." },
              { icon: Leaf, title: "Eco scoring", body: "See the footprint of each paper stock before you commit." },
              { icon: ShieldCheck, title: "Private files", body: "Artwork is encrypted and only visible to you and our press team." },
              { icon: Truck, title: "Pickup or ship", body: "Collect in store or have it couriered the same day." },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="glass-card hover-lift rounded-2xl p-6"
              >
                <f.icon className="text-primary size-6" />
                <h3 className="mt-4 font-bold">{f.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-28">
          <div className="gradient-brand text-primary-foreground rounded-3xl px-8 py-14 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight">Ready to hit print?</h2>
            <p className="mx-auto mt-3 max-w-md text-sm opacity-90">
              Create an account and your first job can be on the press within the hour.
            </p>
            <Button variant="secondary" size="xl" className="mt-8" asChild>
              <Link to="/order">Upload your files</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-border text-muted-foreground border-t px-4 py-10 text-center text-xs">
        © {new Date().getFullYear()} Bazz Computer Services. Printing, done properly.
      </footer>
    </div>
  );
}

function PrinterScene() {
  return (
    <div className="relative grid h-72 place-items-center [perspective:1000px]">
      <div
        className="from-primary to-brand relative h-40 w-72 rounded-3xl bg-gradient-to-br shadow-[var(--shadow-lift)]"
        style={{ transform: "rotateX(52deg) rotateZ(-28deg)", transformStyle: "preserve-3d" }}
      >
        <div className="bg-background/25 absolute inset-x-8 top-5 h-3 rounded-full" />
        <div className="bg-background/60 absolute inset-x-10 bottom-6 h-8 rounded-lg" />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-card absolute top-2 left-1/2 h-24 w-40 -translate-x-1/2 rounded-md shadow-lg"
            style={{
              animation: `sheet-out 3.6s ease-in-out ${i * 1.2}s infinite`,
              transformStyle: "preserve-3d",
            }}
          />
        ))}
      </div>
      <div className={cn("bg-primary/20 absolute -bottom-2 h-6 w-56 rounded-full blur-2xl")} />
    </div>
  );
}

function Picker({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onSelect(o.value)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
              value === o.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
