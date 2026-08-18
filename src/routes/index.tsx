import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  UploadCloud,
  Leaf,
  ShieldCheck,
  Store,
  Sparkles,
  MapPin,
  Clock,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { STORE } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Planned Kid Computer Services — Print Shop, Reinvented" },
      {
        name: "description",
        content:
          "Upload artwork, choose paper and finishing, and collect in store. Same-day printing and live job tracking in Nairobi.",
      },
      { property: "og:title", content: "Planned Kid Computer Services — Print Shop, Reinvented" },
      {
        property: "og:description",
        content: "Same-day printing, live order tracking and pay-on-pickup convenience.",
      },
    ],
  }),
  component: Index,
});

function Index() {
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
                Planned Kid Computer Services turns files into finished work. Upload artwork, tune every
                spec and track your job from prepress to pickup. No online payment — our team
                confirms your quote and you settle in store.
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
                <h2 className="text-sm font-bold tracking-wide uppercase">How it works</h2>
                <ol className="mt-5 space-y-4">
                  {[
                    ["Upload your files", "PDF, images, Office docs or ZIP — up to 50MB each."],
                    ["Choose your specs", "Paper, size, colour, binding and turnaround."],
                    ["Collect & pay in store", "We confirm the quote and print — you pay at pickup."],
                  ].map(([title, body], i) => (
                    <li key={title} className="flex gap-3">
                      <span className="gradient-brand text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{title}</p>
                        <p className="text-muted-foreground text-xs">{body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="border-border text-muted-foreground mt-6 space-y-1.5 border-t pt-5 text-xs">
                  <p className="flex items-center gap-2">
                    <MapPin className="text-primary size-3.5" /> {STORE.address}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="text-primary size-3.5" /> {STORE.hours}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="text-primary size-3.5" /> {STORE.phone}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: UploadCloud, title: "Upload anything", body: "PDFs, images, Office files and archives up to 50MB each." },
              { icon: Leaf, title: "Eco scoring", body: "See the footprint of each paper stock before you commit." },
              { icon: ShieldCheck, title: "Private files", body: "Artwork is encrypted and only visible to you and our press team." },
              { icon: Store, title: "Pay on pickup", body: "No online payment — settle at the counter when you collect." },
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
        © {new Date().getFullYear()} Planned Kid Computer Services. Printing, done properly.
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

