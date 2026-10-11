import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstallAppButton } from "@/components/install-app";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-role";
import heroVideo from "@/assets/pk-hero.mp4.asset.json";
import heroVideoWebm from "@/assets/pk-hero.webm.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Planned Kid Computer Services — Print, create, collect" },
      { name: "description", content: "Send documents, create passport photos, and follow your print jobs for collection in Entebbe." },
      { property: "og:title", content: "Planned Kid Computer Services — Print, create, collect" },
      { property: "og:description", content: "Your documents and passport photos, ready for collection in Entebbe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user } = useAuth();
  const { isStaff } = useRoles();
  return (
    <div className="relative isolate flex min-h-svh flex-col overflow-hidden bg-background text-cover-foreground">
      <video aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full object-cover object-[65%_center]" poster="/hero-poster.jpg" autoPlay muted loop playsInline>
        <source src={heroVideoWebm.url} type="video/webm" />
        <source src={heroVideo.url} type="video/mp4" />
      </video>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-cover-overlay" />
      <header className="flex items-center justify-between gap-4 px-6 py-6 sm:px-10">
        <Link to="/" aria-label="Planned Kid home"><BrandLogo className="h-12 rounded-lg bg-card p-1" /></Link>
        <div className="flex items-center gap-2">
          <InstallAppButton />
          <Button asChild variant="secondary" size="sm">
            <Link to={isStaff ? "/admin" : "/admin/login"}><ShieldCheck /> Admin</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-16 sm:px-10">
        <div className="max-w-xl">
          <p className="mb-5 flex items-center gap-2 text-sm font-semibold"><MapPin className="size-4" /> Entebbe, Uganda</p>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl">Planned Kid<br />Computer Services</h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed">Send your documents. Create passport photos. Follow your prints until collection.</p>
          <Button asChild variant="hero" size="xl" className="mt-9 h-16 min-w-60 rounded-2xl px-10 text-xl font-extrabold">
            {user ? <Link to="/dashboard" search={{ tab: "main" }}>Start <ArrowRight /></Link> : <Link to="/auth">Start <ArrowRight /></Link>}
          </Button>
        </div>
      </main>
      <footer className="px-6 pb-6 text-sm sm:px-10">Documents · Passport photos · Printing</footer>
    </div>
  );
}
