import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import heroVideo from "@/assets/pk-hero.mp4.asset.json";
import heroVideoWebm from "@/assets/pk-hero.webm.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bazz Computer Services — Simple printing" },
      { name: "description", content: "Send your PDF or photo to Bazz. No account needed. Collect and pay at the shop." },
      { property: "og:title", content: "Bazz Computer Services — Simple printing" },
      { property: "og:description", content: "Send your file. We print. You collect." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative isolate flex min-h-svh flex-col overflow-hidden bg-background text-cover-foreground">
      <video aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full object-cover object-[65%_center]" poster="/hero-poster.jpg" autoPlay muted loop playsInline>
        <source src={heroVideoWebm.url} type="video/webm" />
        <source src={heroVideo.url} type="video/mp4" />
      </video>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-cover-overlay" />
      <header className="flex items-center justify-between gap-4 px-6 py-6 sm:px-10">
        <Link to="/" aria-label="Bazz home" className="flex items-center gap-3 font-bold"><Printer className="size-7" /> Bazz</Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-16 sm:px-10">
        <div className="max-w-xl">
          <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl">Bazz<br />Computer Services</h1>
          <p className="mt-6 max-w-md text-xl leading-relaxed">Send your file.<br />We print. You collect.</p>
          <Button asChild variant="success" size="xl" className="mt-9 h-20 w-full max-w-sm rounded-lg px-10 text-2xl font-extrabold">
            <Link to="/print">Start <ArrowRight /></Link>
          </Button>
        </div>
      </main>
      <footer className="flex justify-between gap-4 px-6 pb-6 text-sm sm:px-10"><span>No account needed</span><Link to="/admin/login" className="text-xs opacity-75">Staff</Link></footer>
    </div>
  );
}
