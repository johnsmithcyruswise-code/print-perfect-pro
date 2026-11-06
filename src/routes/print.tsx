import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Camera, FileText, Images, ArrowLeft, ArrowRight, Check, CheckCircle2, FileUp, Loader2, Minus, Plus, Printer, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { sendGuestPrint } from "@/lib/bazz-print.functions";
import { MAX_PRINT_BYTES, printOptionsSchema } from "@/lib/bazz-print";
import { BazzRecentFiles } from "@/components/bazz-recent-files";
import { readRecent, saveRecent, type RecentPrint } from "@/lib/bazz-recent";
import { preparePortrait, passportSheet, type PhotoCrop } from "@/lib/bazz-photo";
const PassportCrop = lazy(() => import("@/components/bazz-passport-crop").then((module) => ({ default: module.BazzPassportCrop })));

export const Route = createFileRoute("/print")({ head: () => ({ meta: [
  { title: "Send to Print — Bazz Computer Services" }, { name: "description", content: "Send documents, pictures or passport photos to Bazz without an account." },
  { property: "og:title", content: "Send to Print — Bazz Computer Services" }, { property: "og:description", content: "Choose your file and print options. Collect at the shop." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
] }), component: PrintPage });

function PrintPage() {
  const [name, setName] = useState(""); const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"details" | "file" | "done">("details");
  const [file, setFile] = useState<File | null>(null);
  const [paperSize, setPaperSize] = useState<"A4" | "A3">("A4");
  const [colorMode, setColorMode] = useState<"bw" | "color">("bw");
  const [quantity, setQuantity] = useState(1); const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(""); const [recent, setRecent] = useState<RecentPrint[]>([]);
  const [kind, setKind] = useState<"document" | "passport">("document");
  const [portrait, setPortrait] = useState(""); const [crop, setCrop] = useState<PhotoCrop | null>(null);
  const [photoCount, setPhotoCount] = useState(4); const [progress, setProgress] = useState(""); const [preview, setPreview] = useState("");
  const photoInput = useRef<HTMLInputElement>(null); const cameraInput = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (portrait) URL.revokeObjectURL(portrait); if (preview) URL.revokeObjectURL(preview); }, [portrait, preview]);
  const [error, setError] = useState(""); const [number, setNumber] = useState("");
  const input = useRef<HTMLInputElement>(null); const send = useServerFn(sendGuestPrint);
  useEffect(() => { readRecent().then((entries) => { if (entries.length) setRecent(entries); else { try { const old = JSON.parse(localStorage.getItem("bazz-recent") ?? "[]"); if (Array.isArray(old)) setRecent(old.filter((entry) => typeof entry.number === "string" && typeof entry.file === "string").slice(0, 5)); } catch { /* no old history */ } } }).catch(() => {}); }, []);
  useEffect(() => {
    try {
      const value = document.cookie.split("; ").find((c) => c.startsWith("bazz-customer="));
      if (!value) return;
      const saved = JSON.parse(decodeURIComponent(value.slice("bazz-customer=".length)));
      if (typeof saved.name === "string" && typeof saved.phone === "string" && printOptionsSchema.safeParse({ ...saved, paperSize: "A4", colorMode: "bw", quantity: 1 }).success) { setName(saved.name); setPhone(saved.phone); setStep("file"); }
    } catch { /* Missing or invalid cookie: ask for details. */ }
  }, []);
  function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    const parsed = printOptionsSchema.safeParse({ name, phone, paperSize, colorMode, quantity });
    if (!parsed.success) { setError("Enter your name and phone number."); return; }
    document.cookie = `bazz-customer=${encodeURIComponent(JSON.stringify({ name: parsed.data.name, phone: parsed.data.phone }))}; Max-Age=2592000; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    setError(""); setStep("file");
  }
  function changeKind(next: "document" | "passport") { setKind(next); setFile(null); setPortrait(""); setCrop(null); setPreview(""); setError(""); }
  async function choosePortrait(next: File | undefined) {
    if (!next || busy) return;
    if (!["image/jpeg", "image/png"].includes(next.type) || next.size > MAX_PRINT_BYTES) { setError("Choose a JPG or PNG under 10 MB."); return; }
    setBusy(true); setError(""); setPortrait(""); setCrop(null); setFile(null); setProgress("Opening photo…");
    try { setPortrait(await preparePortrait(next, setProgress)); }
    catch { setError("Photo could not be prepared. Check your internet and choose the photo again."); }
    finally { setBusy(false); setProgress(""); }
  }
  function chooseFile(next: File | undefined) {
    if (!next) return;
    if (!/\.(pdf|jpe?g|png)$/i.test(next.name) || !["application/pdf", "image/jpeg", "image/png"].includes(next.type) || next.size > MAX_PRINT_BYTES) { setError("Choose a PDF, JPG or PNG under 10 MB."); setFile(null); return; }
    setFile(next); setPreview(next.type.startsWith("image/") ? URL.createObjectURL(next) : ""); setError("");
  }
  async function submit() {
    if (busy || (kind === "document" ? !file : !portrait || !crop)) return;
    setBusy(true); setError("");
    try {
      let upload = file; let thumbnail = "";
      if (kind === "passport" && portrait && crop) { const result = await passportSheet(portrait, crop, photoCount); upload = result.file; thumbnail = result.preview; }
      if (!upload) throw new Error("Choose a file first.");
      const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1] ?? ""); reader.onerror = reject; reader.readAsDataURL(upload); });
      const result = await send({ data: { name, phone, paperSize: kind === "passport" ? "A4" : paperSize, colorMode: kind === "passport" ? "color" : colorMode, quantity: kind === "passport" ? 1 : quantity, printKind: kind, photoCount: kind === "passport" ? photoCount : undefined, message: message.trim() || undefined, fileName: upload.name, contentType: upload.type as "application/pdf" | "image/jpeg" | "image/png", base64 } });
      setNumber(result.orderNumber); setStep("done"); setMessage("");
      const entry: RecentPrint = { number: result.orderNumber, file: upload.name, at: Date.now(), blob: upload, preview: thumbnail || undefined };
      setRecent((entries) => [entry, ...entries].slice(0, 5));
      try { await saveRecent(entry); } catch { /* Sending succeeded even if phone storage is full. */ }
      try { localStorage.setItem("bazz-recent", JSON.stringify([entry, ...recent].slice(0, 5).map(({ number, file, at }) => ({ number, file, at })))); } catch { /* phone storage unavailable */ }
    } catch (err) { setError(err instanceof Error ? err.message : "Could not send. Please try again."); } finally { setBusy(false); }
  }
  return <div className="min-h-svh bg-background">
    <header className="mx-auto flex max-w-2xl items-center justify-between px-3 py-3 sm:px-5 sm:py-5"><Button asChild variant="ghost" size="icon" className="size-12"><Link to="/" aria-label="Back home"><ArrowLeft /></Link></Button><span className="font-bold">Bazz Computer Services</span><ThemeToggle /></header>
    <main className="mx-auto max-w-xl px-4 pb-12 pt-3 sm:px-5 sm:pt-5">
      {step !== "done" && <div className="mb-8 flex items-center gap-3 text-sm font-bold"><span className={step === "details" ? "text-primary" : "text-muted-foreground"}>1 · Your details</span><ArrowRight className="size-4 text-muted-foreground" /><span className={step === "file" ? "text-primary" : "text-muted-foreground"}>2 · Print</span></div>}
      {step === "details" && <><UserRound className="mb-4 size-9 text-primary" /><h1 className="mb-7 text-3xl font-bold">Your name & phone</h1><form onSubmit={saveDetails} className="space-y-6"><div><label htmlFor="customer-name" className="mb-2 block text-lg font-semibold">Name</label><Input id="customer-name" autoComplete="name" className="h-14 text-lg" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} /></div><div><label htmlFor="customer-phone" className="mb-2 block text-lg font-semibold">Phone number</label><Input id="customer-phone" type="tel" autoComplete="tel" className="h-14 text-lg" value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={20} /></div><Button className="h-16 w-full text-xl" type="submit">Continue <ArrowRight /></Button></form></>}
      {step === "file" && <><div className="mb-6 flex items-center justify-between gap-3"><h1 className="text-3xl font-bold">{kind === "passport" ? "Passport photos" : "Print your file"}</h1><Button variant="link" onClick={() => setStep("details")}>Edit details</Button></div><p className="mb-5 text-muted-foreground">{name} · {phone}</p>
        <div className="mb-6 grid grid-cols-2 gap-3"><Button disabled={busy} variant={kind === "document" ? "default" : "outline"} aria-pressed={kind === "document"} className="h-20 flex-col whitespace-normal text-base" onClick={() => changeKind("document")}><FileText />Documents</Button><Button disabled={busy} variant={kind === "passport" ? "default" : "outline"} aria-pressed={kind === "passport"} className="h-20 flex-col whitespace-normal text-base" onClick={() => changeKind("passport")}><UserRound />Passport photos</Button></div>
        <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png" hidden onChange={(e) => { chooseFile(e.target.files?.[0]); e.target.value = ""; }} />
        <input ref={photoInput} type="file" accept="image/jpeg,image/png" hidden onChange={(e) => { if (kind === "passport") void choosePortrait(e.target.files?.[0]); else chooseFile(e.target.files?.[0]); e.target.value = ""; }} />
        <input ref={cameraInput} type="file" accept="image/jpeg,image/png" capture="user" hidden onChange={(e) => { void choosePortrait(e.target.files?.[0]); e.target.value = ""; }} />
        <div className="mb-6 grid grid-cols-2 gap-3"><Button variant="outline" className="h-24 flex-col whitespace-normal text-base" disabled={busy} onClick={() => kind === "passport" ? photoInput.current?.click() : input.current?.click()}>{kind === "passport" ? <Images className="size-8" /> : <FileUp className="size-8" />}{kind === "passport" ? "Choose photo" : "Choose document"}</Button><Button variant="outline" className="h-24 flex-col whitespace-normal text-base" disabled={busy} onClick={() => kind === "passport" ? cameraInput.current?.click() : photoInput.current?.click()}>{kind === "passport" ? <Camera className="size-8" /> : <Images className="size-8" />}{kind === "passport" ? "Take photo" : "Phone pictures"}</Button></div>
        {progress && <p role="status" className="mb-6 flex items-center justify-center gap-3 text-primary"><Loader2 className="animate-spin" />{progress}</p>}
        {kind === "passport" && portrait && <Suspense fallback={<p>Opening photo…</p>}><PassportCrop key={portrait} source={portrait} onCrop={setCrop} /></Suspense>}
        {kind === "document" && file && <div className="mb-6 overflow-hidden rounded-lg border bg-card">{preview && <img src={preview} alt="Selected photo" className="h-52 w-full object-contain" />}<p className="break-all p-4 font-bold">{file.name}</p></div>}
        {kind === "passport" && <fieldset className="mb-7"><legend className="mb-3 text-lg font-bold">How many photos?</legend><div className="grid grid-cols-4 gap-2">{[2, 4, 8, 16].map((count) => <Button key={count} disabled={busy} className="h-16 text-xl" variant={photoCount === count ? "default" : "outline"} aria-pressed={photoCount === count} onClick={() => setPhotoCount(count)}>{count}</Button>)}</div></fieldset>}
        {kind === "document" && <>
        <fieldset className="mb-7"><legend className="mb-3 text-lg font-bold">Paper size</legend><div className="grid grid-cols-2 gap-3">{(["A4", "A3"] as const).map((size) => <Button disabled={busy} key={size} aria-pressed={paperSize === size} variant={paperSize === size ? "default" : "outline"} className="h-16 text-xl" onClick={() => setPaperSize(size)}>{paperSize === size && <Check />}{size}</Button>)}</div></fieldset>
        <fieldset className="mb-7"><legend className="mb-3 text-lg font-bold">Color</legend><div className="grid grid-cols-2 gap-3">{(["bw", "color"] as const).map((mode) => <Button disabled={busy} key={mode} aria-pressed={colorMode === mode} variant={colorMode === mode ? "default" : "outline"} className="h-16 whitespace-normal text-base" onClick={() => setColorMode(mode)}>{colorMode === mode && <Check />}{mode === "bw" ? "Black & white" : "Color"}</Button>)}</div></fieldset>
        <div className="mb-8"><label htmlFor="copies" className="mb-3 block text-lg font-bold">Copies</label><div className="flex gap-3"><Button disabled={busy || quantity <= 1} aria-label="Fewer copies" variant="outline" className="size-14 shrink-0" onClick={() => setQuantity((q) => q - 1)}><Minus /></Button><Input disabled={busy} id="copies" className="h-14 text-center text-xl" type="number" min={1} max={999} value={quantity} onChange={(e) => setQuantity(Math.min(999, Math.max(1, Number(e.target.value) || 1)))} /><Button disabled={busy || quantity >= 999} aria-label="More copies" variant="outline" className="size-14 shrink-0" onClick={() => setQuantity((q) => q + 1)}><Plus /></Button></div></div>
        </>}
        <div className="mb-8"><label htmlFor="message" className="mb-3 block text-lg font-bold">Message to staff <span className="text-sm font-normal text-muted-foreground">(optional)</span></label><textarea id="message" disabled={busy} maxLength={500} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell staff anything about your file" className="w-full rounded-md border bg-card p-3 text-base" /></div>
        <p className="mb-4 text-center text-sm text-muted-foreground">Price agreed at pickup.</p><Button disabled={busy || (kind === "document" ? !file : !portrait || !crop)} variant="success" className="h-16 w-full text-xl font-bold" onClick={submit}>{busy ? <Loader2 className="animate-spin" /> : <Printer />}{busy ? progress || "Sending…" : kind === "passport" ? "Send photos" : "Send to Print"}</Button>
      </>}
      {step !== "details" && <BazzRecentFiles entries={recent} />}
      {error && <p role="alert" className="mt-5 text-destructive">{error}</p>}
      {step === "done" && <div className="py-14 text-center"><CheckCircle2 className="mx-auto mb-6 size-20 text-success" /><h1 className="text-4xl font-bold">Sent!</h1><p className="mt-6 text-muted-foreground">Your order number</p><p className="mt-2 break-all font-mono text-2xl font-bold">{number}</p><p className="mt-6 text-lg">Collect at Bazz Computer Services.</p><Button className="mt-10 h-16 w-full text-lg" onClick={() => { setFile(null); setPortrait(""); setCrop(null); setPreview(""); setStep("file"); }}>Print another file <Plus /></Button></div>}
    </main>
  </div>;
}