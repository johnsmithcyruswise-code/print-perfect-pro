import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { Clock, MapPin, Phone, UploadCloud, FolderOpen, ShieldCheck, Zap, Image as ImageIcon, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InstallAppButton } from "@/components/install-app";
import { SplashScreen } from "@/components/splash";
import { BrandLogo } from "@/components/brand-logo";
import { STORE, telHref } from "@/lib/pricing";
import { guestDrop } from "@/lib/guest-drop.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Planned Kid Computer Services — Drop it. We print it." },
      { name: "description", content: "Drop your document, enter your name and phone, and pick it up printed in Entebbe. No sign-up, no compression." },
      { property: "og:title", content: "Planned Kid Computer Services — Drop it. We print it." },
      { property: "og:description", content: "Faster than WhatsApp: send your file straight to the print counter in Entebbe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const toB64 = (f: File) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(",")[1] ?? "");
    r.onerror = rej;
    r.readAsDataURL(f);
  });

function TiltPaper() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-0.5, 0.5], [14, -14]), { stiffness: 150, damping: 15 });
  const ry = useSpring(useTransform(x, [-0.5, 0.5], [-18, 18]), { stiffness: 150, damping: 15 });
  return (
    <div
      className="hidden lg:block [perspective:1000px]"
      onMouseMove={(e) => {
        const b = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - b.left) / b.width - 0.5);
        y.set((e.clientY - b.top) / b.height - 0.5);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      <motion.div
        style={{ rotateX: rx, rotateY: ry }}
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-72 h-96 rounded-2xl bg-card border border-border shadow-2xl p-6 [transform-style:preserve-3d]"
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-secondary/20" />
        <div className="h-3 w-24 rounded bg-primary/70 mb-4" />
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-2 rounded bg-muted mb-3" style={{ width: `${60 + ((i * 37) % 40)}%` }} />
        ))}
        <div className="absolute -right-6 -bottom-6 rounded-xl bg-accent text-accent-foreground px-4 py-2 font-bold shadow-lg [transform:translateZ(40px)]">
          Ready ✓
        </div>
      </motion.div>
    </div>
  );
}

function DropZone() {
  const send = useServerFn(guestDrop);
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [over, setOver] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  async function submit() {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error("File too big (max 20MB)."); return; }
    if (!name.trim() || phone.trim().length < 7) { toast.error("Enter your name and phone."); return; }
    setBusy(true);
    try {
      const r = await send({ data: { name, phone, fileName: file.name, contentType: file.type, base64: await toB64(file) } });
      setCode(r.code);
      navigator.vibrate?.(200);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (code)
    return (
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-3xl border-2 border-accent bg-card p-8 text-center shadow-2xl">
        <CheckCircle2 className="size-12 mx-auto text-accent" />
        <p className="mt-3 text-muted-foreground">Sent to the counter! Show this code:</p>
        <p className="text-7xl font-black text-primary my-2">#{code}</p>
        <p className="text-sm text-muted-foreground">We'll call {phone} when it's printed.</p>
        <Button variant="outline" className="mt-5" onClick={() => { setCode(null); setFile(null); }}>Send another</Button>
      </motion.div>
    );

  return (
    <div className="rounded-3xl bg-card border border-border p-5 shadow-2xl">
      <motion.button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
        animate={{ scale: over ? 1.04 : 1 }}
        className={`relative w-full rounded-2xl border-2 border-dashed p-8 transition-colors ${over ? "border-secondary bg-secondary/10" : "border-primary/40 bg-primary/5"}`}
      >
        <motion.span
          className="absolute inset-0 rounded-2xl border-2 border-primary/30"
          animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.02, 1] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        />
        <UploadCloud className="size-12 mx-auto text-primary" />
        <p className="mt-2 font-bold text-lg text-foreground">{file ? file.name : "Tap or drop your document"}</p>
        <p className="text-sm text-muted-foreground">PDF, Word, photos — any size up to 20MB</p>
      </motion.button>
      <input ref={input} type="file" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Phone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <Button variant="hero" size="xl" className="w-full mt-4" disabled={!file || busy} onClick={submit}>
        {busy ? <Loader2 className="size-5 animate-spin" /> : <Zap className="size-5" />}
        {busy ? "Sending…" : "Send to counter"}
      </Button>
      <p className="mt-2 text-xs text-center text-muted-foreground">No sign-up. No compression. Pay when you collect.</p>
    </div>
  );
}

function Index() {
  return (
    <div className="min-h-screen flex flex-col overflow-hidden relative">
      <SplashScreen />
      <motion.div aria-hidden className="pointer-events-none absolute -top-40 -left-40 size-[32rem] rounded-full bg-primary/20 blur-3xl"
        animate={{ x: [0, 80, 0], y: [0, 60, 0] }} transition={{ duration: 14, repeat: Infinity }} />
      <motion.div aria-hidden className="pointer-events-none absolute top-40 -right-40 size-[28rem] rounded-full bg-secondary/25 blur-3xl"
        animate={{ x: [0, -70, 0], y: [0, 50, 0] }} transition={{ duration: 12, repeat: Infinity }} />

      <header className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4">
        <BrandLogo className="h-10 w-auto" />
        <div className="flex items-center gap-2 rounded-full bg-card/80 border border-border px-3 py-1 text-xs">
          <span className="relative flex size-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" /><span className="relative inline-flex size-2 rounded-full bg-accent" /></span>
          Counter open · wait ~2 min
        </div>
      </header>

      <main className="relative z-10 flex-1 grid lg:grid-cols-[1.1fr_auto] gap-10 items-center max-w-6xl w-full mx-auto px-4 sm:px-8 py-8">
        <div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-5xl sm:text-6xl font-black tracking-tight text-foreground leading-[1.05]">
            Drop it.<br /><span className="text-primary">We print it.</span><br /><span className="text-accent">You collect.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4 text-lg text-muted-foreground max-w-md">
            Faster than WhatsApp. Your file goes straight to our printer — full quality, ready before you walk in.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-6 max-w-md">
            <DropZone />
          </motion.div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="secondary" asChild><Link to="/passport"><ImageIcon className="size-4" /> Passport photo</Link></Button>
            <Button variant="outline" asChild><Link to="/documents"><FolderOpen className="size-4" /> My files</Link></Button>
            <Button variant="ghost" asChild><Link to="/admin/login"><ShieldCheck className="size-4" /> Staff</Link></Button>
            <InstallAppButton />
          </div>
        </div>
        <TiltPaper />
      </main>

      <footer className="relative z-10 border-t border-border px-4 py-8 bg-background/70">
        <div className="max-w-4xl mx-auto grid gap-6 sm:grid-cols-3 text-sm text-muted-foreground">
          <div className="space-y-1"><div className="flex items-center gap-2 text-foreground font-semibold"><MapPin className="size-4 text-primary" /> Location</div><p>{STORE.address}</p></div>
          <div className="space-y-1"><div className="flex items-center gap-2 text-foreground font-semibold"><Clock className="size-4 text-primary" /> Hours</div>{STORE.hoursList.map((h) => <p key={h.day}>{h.day}: {h.time}</p>)}</div>
          <div className="space-y-1"><div className="flex items-center gap-2 text-foreground font-semibold"><Phone className="size-4 text-primary" /> Contact</div>
            <p><a href={telHref(STORE.phone)}>{STORE.phone}</a> · <a href={telHref(STORE.phone2)}>{STORE.phone2}</a></p></div>
        </div>
        <p className="text-center text-xs mt-6 text-muted-foreground">© {new Date().getFullYear()} {STORE.name}</p>
      </footer>
    </div>
  );
}
