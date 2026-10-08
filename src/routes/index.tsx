import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  FileText,
  Lock,
  MapPin,
  Printer,
  UploadCloud,
  Wallet,
  Zap,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstallAppButton } from "@/components/install-app";
import { SplashScreen } from "@/components/splash";
import { BrandLogo } from "@/components/brand-logo";
import { STORE, telHref } from "@/lib/pricing";
import heroVideo from "@/assets/pk-hero.mp4.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Planned Kid Computer Services — Drop it. We print it. You collect." },
      {
        name: "description",
        content:
          "Upload your file from anywhere. It's already printing when you arrive at our counter in Entebbe. No sign-up forms, no WhatsApp, no compression.",
      },
      {
        property: "og:title",
        content: "Planned Kid Computer Services — Drop it. We print it. You collect.",
      },
      {
        property: "og:description",
        content: "Upload your file from anywhere. It's already printing when you arrive.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const GRAIN =
  "url(\"data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='160' height='160' filter='url(%23n)' opacity='0.5'/></svg>`,
  ) +
  "\")";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

function Landing() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToHow = () =>
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen">
      <SplashScreen />

      {/* ── Header: transparent at top, frosted after scroll ── */}
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "border-border/60 bg-background/80 border-b backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <BrandLogo className="h-10 w-auto" />
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-extrabold tracking-tight">
                Planned Kid
              </span>
              <span className="text-muted-foreground block text-[10px] font-semibold tracking-[0.18em] uppercase">
                Computer Services
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <InstallAppButton />
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex min-h-[90vh] items-center overflow-hidden pt-20 pb-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 40%, transparent 45%, color-mix(in oklch, var(--brand) 7%, transparent) 100%)",
          }}
        />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-8 lg:grid-cols-[45fr_55fr] lg:gap-16">
          {/* Left: text */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <p className="text-muted-foreground text-xs font-bold tracking-[0.22em] uppercase">
              Online printing · Entebbe
            </p>
            <h1 className="mt-4 text-5xl leading-[1.04] font-extrabold tracking-tight sm:text-6xl lg:text-[4.25rem]">
              Drop it.
              <br />
              We print it.
              <br />
              <span className="text-accent">You collect.</span>
            </h1>
            <p className="text-muted-foreground mt-5 max-w-md text-lg font-medium">
              Upload your file from anywhere. It's already printing when you arrive at
              our counter.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="bg-card border-border inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-accent" />
                </span>
                Counter open · wait ~2 min
              </span>
              <span className="bg-card border-border text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold">
                <MapPin className="text-primary size-3.5" /> Entebbe, Uganda
              </span>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="hero" size="xl">
                <Link to="/auth">Sign in to upload</Link>
              </Button>
              <Button variant="outline" size="xl" onClick={scrollToHow}>
                See how it works
              </Button>
            </div>

            <div className="text-muted-foreground mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium">
              <span className="inline-flex items-center gap-1.5">
                <Lock className="size-3.5" /> Secure upload
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FileText className="size-3.5" /> No compression
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Zap className="size-3.5" /> Ready in minutes
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Wallet className="size-3.5" /> Pay at counter
              </span>
            </div>
          </motion.div>

          {/* Right: floating hero video */}
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
            className="relative"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative overflow-hidden rounded-3xl shadow-[0_24px_70px_-18px_oklch(0.19_0.03_282/0.25)]"
            >
              <video
                className="aspect-video w-full object-cover"
                src={heroVideo.url}
                poster="/hero-poster.jpg"
                autoPlay
                muted
                loop
                playsInline
              />
              {/* left-edge fade so the media blends into the page */}
              <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r to-transparent" />
              {/* 2% grain */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
                style={{ backgroundImage: GRAIN }}
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="scroll-mt-20 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <motion.div {...fadeUp} className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              From screen to counter in three steps
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">
              No app. No WhatsApp. No waiting in line.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: UploadCloud,
                tone: "text-accent bg-accent/15",
                title: "Upload",
                copy: "PDF, Word, or photos. Up to 20MB. No compression.",
              },
              {
                icon: Printer,
                tone: "text-primary bg-primary/10",
                title: "We print",
                copy: "Your file goes straight to our counter at full quality.",
              },
              {
                icon: Store,
                tone: "text-brand bg-brand/15",
                title: "You collect",
                copy: "Walk in, pay at the counter, walk out. Simple.",
              },
            ].map((s, i) => (
              <motion.div
                key={s.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.12 }}
                className="glass-card rounded-3xl p-8 text-center"
              >
                <div
                  className={`mx-auto grid size-16 place-items-center rounded-2xl ${s.tone}`}
                >
                  <s.icon className="size-7" />
                </div>
                <h3 className="mt-5 text-lg font-extrabold">{s.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm">{s.copy}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust / social proof ── */}
      <section className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <motion.div
            {...fadeUp}
            className="glass-card mx-auto max-w-2xl rounded-3xl p-8 text-center"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="relative flex size-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-accent" />
              </span>
              <p className="text-xl font-extrabold">Counter open</p>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Current wait ~2 minutes
            </p>
            <div className="text-muted-foreground mt-5 grid gap-2 text-sm">
              {STORE.hoursList.map((h) => (
                <p key={h.day}>
                  <span className="text-foreground font-semibold">{h.day}</span> ·{" "}
                  {h.time}
                </p>
              ))}
              <p className="inline-flex items-center justify-center gap-1.5">
                <MapPin className="text-primary size-4" /> {STORE.address}
              </p>
            </div>
            <Button asChild variant="outline" className="mt-6">
              <a
                href="https://www.google.com/maps/search/?api=1&query=4GVW%2B2H5%20Entebbe%20Uganda"
                target="_blank"
                rel="noreferrer"
              >
                <MapPin className="size-4" /> Get directions
              </a>
            </Button>
          </motion.div>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { quote: "Sent my CV from home, picked it up in 10 minutes.", name: "Sarah K." },
              { quote: "No more WhatsApp back-and-forth. Just upload and go.", name: "Daniel M." },
              { quote: "Best print quality in Entebbe. Full stop.", name: "Aisha N." },
            ].map((t, i) => (
              <motion.figure
                key={t.name}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.12 }}
                className="glass-card rounded-3xl p-6"
              >
                <blockquote className="text-sm leading-relaxed font-medium">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <span className="bg-primary/10 text-primary grid size-9 place-items-center rounded-full text-xs font-extrabold">
                    {t.name.charAt(0)}
                  </span>
                  <span className="text-muted-foreground text-sm font-semibold">
                    {t.name}
                  </span>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-8">
          <motion.div {...fadeUp}>
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Ready to print?
            </h2>
            <p className="mt-3 text-lg opacity-80">
              Sign in and upload in under 30 seconds.
            </p>
            <Button asChild size="xl" className="bg-background text-primary mt-8">
              <Link to="/auth">Sign in to upload</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-border/60 border-t px-4 py-12">
        <div className="mx-auto grid max-w-6xl gap-8 text-sm sm:grid-cols-3">
          <div className="space-y-1">
            <div className="text-foreground flex items-center gap-2 font-semibold">
              <MapPin className="text-primary size-4" /> Location
            </div>
            <p className="text-muted-foreground">{STORE.address}</p>
          </div>
          <div className="space-y-1">
            <div className="text-foreground flex items-center gap-2 font-semibold">
              <Clock className="text-primary size-4" /> Hours
            </div>
            {STORE.hoursList.map((h) => (
              <p key={h.day} className="text-muted-foreground">
                {h.day}: {h.time}
              </p>
            ))}
          </div>
          <div className="space-y-1">
            <div className="text-foreground flex items-center gap-2 font-semibold">
              <FileText className="text-primary size-4" /> Contact
            </div>
            <p className="text-muted-foreground">
              <a href={telHref(STORE.phone)}>{STORE.phone}</a> ·{" "}
              <a href={telHref(STORE.phone2)}>{STORE.phone2}</a>
            </p>
          </div>
        </div>
        <p className="text-muted-foreground mt-10 text-center text-xs">
          © {new Date().getFullYear()} {STORE.name} · Entebbe, Uganda
        </p>
      </footer>
    </div>
  );
}
