import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Clock, MapPin, Phone, Store, UploadCloud, FolderOpen, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstallAppButton } from "@/components/install-app";
import { SplashScreen } from "@/components/splash";
import { BrandLogo } from "@/components/brand-logo";
import { STORE, telHref } from "@/lib/pricing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Planned Kid Computer Services — We plan, you collect." },
      {
        name: "description",
        content:
          "Upload artwork, choose paper and finishing, and collect in store. Same-day printing and live job tracking in Entebbe, Uganda.",
      },
      { property: "og:title", content: "Planned Kid Computer Services — We plan, you collect." },
      {
        property: "og:description",
        content: "Same-day printing, live order tracking and pay-on-pickup convenience in Entebbe.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <SplashScreen />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center max-w-xl"
        >
          <BrandLogo className="h-20 w-auto mb-6" />
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            {STORE.tagline}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Upload files, choose your specs, and collect finished prints in store. No prices shown online — our team confirms every quote before printing.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Button variant="hero" size="xl" asChild className="min-w-[180px]">
              <Link to="/order">
                <UploadCloud className="size-5" /> New order
              </Link>
            </Button>
            <Button variant="secondary" size="xl" asChild className="min-w-[180px]">
              <Link to="/documents">
                <FolderOpen className="size-5" /> My files
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild className="min-w-[180px]">
              <Link to="/admin/login">
                <ShieldCheck className="size-5" /> Staff login
              </Link>
            </Button>
          </div>

          <div className="mt-6">
            <InstallAppButton />
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-border px-4 py-10">
        <div className="max-w-4xl mx-auto grid gap-8 sm:grid-cols-3 text-sm text-muted-foreground">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <MapPin className="size-4 text-primary" /> Location
            </div>
            <p>{STORE.address}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Clock className="size-4 text-primary" /> Hours
            </div>
            {STORE.hoursList.map((h) => (
              <p key={h.day}>{h.day}: {h.time}</p>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Phone className="size-4 text-primary" /> Contact
            </div>
            <p>
              <a href={telHref(STORE.phone)} className="hover:text-foreground">{STORE.phone}</a>
              <span className="mx-2">·</span>
              <a href={telHref(STORE.phone2)} className="hover:text-foreground">{STORE.phone2}</a>
            </p>
            <p className="break-all">{STORE.email}</p>
          </div>
        </div>
        <p className="text-center text-xs mt-8 text-muted-foreground">
          © {new Date().getFullYear()} {STORE.name}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
