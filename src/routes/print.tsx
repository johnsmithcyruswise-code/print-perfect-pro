import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, FileUp, Loader2, Minus, Plus, Printer, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { sendGuestPrint } from "@/lib/bazz-print.functions";
import { MAX_PRINT_BYTES, printOptionsSchema } from "@/lib/bazz-print";

export const Route = createFileRoute("/print")({ head: () => ({ meta: [
  { title: "Send to Print — Bazz Computer Services" }, { name: "description", content: "Send a PDF or photo to Bazz without an account." },
  { property: "og:title", content: "Send to Print — Bazz Computer Services" }, { property: "og:description", content: "Choose your file and print options. Collect at the shop." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
] }), component: PrintPage });

function PrintPage() {
  const [name, setName] = useState(""); const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"details" | "file" | "done">("details");
  const [file, setFile] = useState<File | null>(null);
  const [paperSize, setPaperSize] = useState<"A4" | "A3">("A4");
  const [colorMode, setColorMode] = useState<"bw" | "color">("bw");
  const [quantity, setQuantity] = useState(1); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(""); const [number, setNumber] = useState("");
  const input = useRef<HTMLInputElement>(null); const send = useServerFn(sendGuestPrint);
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
  function chooseFile(next: File | undefined) {
    if (!next) return;
    if (!/\.(pdf|jpe?g|png)$/i.test(next.name) || !["application/pdf", "image/jpeg", "image/png"].includes(next.type) || next.size > MAX_PRINT_BYTES) { setError("Choose a PDF, JPG or PNG under 10 MB."); setFile(null); return; }
    setFile(next); setError("");
  }
  async function submit() {
    if (!file || busy) return;
    setBusy(true); setError("");
    try {
      const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1] ?? ""); reader.onerror = reject; reader.readAsDataURL(file); });
      const result = await send({ data: { name, phone, paperSize, colorMode, quantity, fileName: file.name, contentType: file.type as "application/pdf" | "image/jpeg" | "image/png", base64 } });
      setNumber(result.orderNumber); setStep("done");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not send. Please try again."); } finally { setBusy(false); }
  }
  return <div className="min-h-svh bg-background">
    <header className="mx-auto flex max-w-2xl items-center justify-between px-5 py-5"><Button asChild variant="ghost" size="icon" className="size-12"><Link to="/" aria-label="Back home"><ArrowLeft /></Link></Button><span className="font-bold">Bazz Computer Services</span><ThemeToggle /></header>
    <main className="mx-auto max-w-xl px-5 pb-12 pt-5">
      {step !== "done" && <div className="mb-8 flex items-center gap-3 text-sm font-bold"><span className={step === "details" ? "text-primary" : "text-muted-foreground"}>1 · Your details</span><ArrowRight className="size-4 text-muted-foreground" /><span className={step === "file" ? "text-primary" : "text-muted-foreground"}>2 · Print</span></div>}
      {step === "details" && <><UserRound className="mb-4 size-9 text-primary" /><h1 className="mb-7 text-3xl font-bold">Your name & phone</h1><form onSubmit={saveDetails} className="space-y-6"><div><label htmlFor="customer-name" className="mb-2 block text-lg font-semibold">Name</label><Input id="customer-name" autoComplete="name" className="h-14 text-lg" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} /></div><div><label htmlFor="customer-phone" className="mb-2 block text-lg font-semibold">Phone number</label><Input id="customer-phone" type="tel" autoComplete="tel" className="h-14 text-lg" value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={20} /></div><Button className="h-16 w-full text-xl" type="submit">Continue <ArrowRight /></Button></form></>}
      {step === "file" && <><div className="mb-6 flex items-center justify-between gap-3"><h1 className="text-3xl font-bold">Print your file</h1><Button variant="link" onClick={() => setStep("details")}>Edit details</Button></div><p className="mb-5 text-muted-foreground">{name} · {phone}</p>
        <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png" hidden onChange={(e) => chooseFile(e.target.files?.[0])} />
        <Button variant="outline" className="mb-8 h-36 w-full flex-col whitespace-normal border-2 border-dashed text-lg" disabled={busy} onClick={() => input.current?.click()}><FileUp className="size-9" /><span className="max-w-full break-all">{file ? file.name : "Choose file"}</span><span className="text-sm font-normal text-muted-foreground">{file ? "Change file" : "PDF · JPG · PNG"}</span></Button>
        <fieldset className="mb-7"><legend className="mb-3 text-lg font-bold">Paper size</legend><div className="grid grid-cols-2 gap-3">{(["A4", "A3"] as const).map((size) => <Button disabled={busy} key={size} aria-pressed={paperSize === size} variant={paperSize === size ? "default" : "outline"} className="h-16 text-xl" onClick={() => setPaperSize(size)}>{paperSize === size && <Check />}{size}</Button>)}</div></fieldset>
        <fieldset className="mb-7"><legend className="mb-3 text-lg font-bold">Color</legend><div className="grid grid-cols-2 gap-3">{(["bw", "color"] as const).map((mode) => <Button disabled={busy} key={mode} aria-pressed={colorMode === mode} variant={colorMode === mode ? "default" : "outline"} className="h-16 whitespace-normal text-base" onClick={() => setColorMode(mode)}>{colorMode === mode && <Check />}{mode === "bw" ? "Black & white" : "Color"}</Button>)}</div></fieldset>
        <div className="mb-8"><label htmlFor="copies" className="mb-3 block text-lg font-bold">Copies</label><div className="flex gap-3"><Button disabled={busy || quantity <= 1} aria-label="Fewer copies" variant="outline" className="size-14 shrink-0" onClick={() => setQuantity((q) => q - 1)}><Minus /></Button><Input disabled={busy} id="copies" className="h-14 text-center text-xl" type="number" min={1} max={999} value={quantity} onChange={(e) => setQuantity(Math.min(999, Math.max(1, Number(e.target.value) || 1)))} /><Button disabled={busy || quantity >= 999} aria-label="More copies" variant="outline" className="size-14 shrink-0" onClick={() => setQuantity((q) => q + 1)}><Plus /></Button></div></div>
        <p className="mb-4 text-center text-sm text-muted-foreground">Price agreed at pickup.</p><Button disabled={!file || busy} variant="success" className="h-16 w-full text-xl font-bold" onClick={submit}>{busy ? <Loader2 className="animate-spin" /> : <Printer />}{busy ? "Sending…" : "Send to Print"}</Button>
      </>}
      {error && <p role="alert" className="mt-5 text-destructive">{error}</p>}
      {step === "done" && <div className="py-14 text-center"><CheckCircle2 className="mx-auto mb-6 size-20 text-success" /><h1 className="text-4xl font-bold">Sent!</h1><p className="mt-6 text-muted-foreground">Your order number</p><p className="mt-2 break-all font-mono text-2xl font-bold">{number}</p><p className="mt-6 text-lg">Collect at Bazz Computer Services.</p><Button className="mt-10 h-16 w-full text-lg" onClick={() => { setFile(null); setStep("file"); }}>Print another file <Plus /></Button></div>}
    </main>
  </div>;
}