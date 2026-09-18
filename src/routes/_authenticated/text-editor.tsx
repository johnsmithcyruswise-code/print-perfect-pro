import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, Printer, Trash2, Type } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/_authenticated/text-editor")({
  head: () => ({
    meta: [
      { title: "Quick text printing — Planned Kid Computer Services" },
      {
        name: "description",
        content: "Type a memo, note or list and print it on A4 straight away — saved on your device.",
      },
      { property: "og:title", content: "Quick text printing — Planned Kid Computer Services" },
      { property: "og:description", content: "Type it, print it. No formatting fuss." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TextEditorPage,
});

const KEY = "pk-scratchpad";

function TextEditorPage() {
  const [title, setTitle] = useState("Quick note");
  const [text, setText] = useState("");
  const [mono, setMono] = useState(false);
  const [numbers, setNumbers] = useState(false);
  const [size, setSize] = useState(12);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      setTitle(saved.title ?? "Quick note");
      setText(saved.text ?? "");
      setMono(!!saved.mono);
      setNumbers(!!saved.numbers);
      setSize(saved.size ?? 12);
    } catch {
      /* ignore bad draft */
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(
      () => localStorage.setItem(KEY, JSON.stringify({ title, text, mono, numbers, size })),
      400,
    );
    return () => clearTimeout(id);
  }, [title, text, mono, numbers, size]);

  const words = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);
  const lines = text.split("\n");

  function bodyHtml() {
    const escape = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const rendered = numbers
      ? lines
          .map((l, i) => `<div><span style="color:#999;margin-right:12px">${i + 1}</span>${escape(l) || "&nbsp;"}</div>`)
          .join("")
      : `<pre style="white-space:pre-wrap;margin:0;font-family:inherit">${escape(text)}</pre>`;
    return `<html><head><title>${escape(title)}</title><style>
      @page{size:A4;margin:20mm}
      body{font-family:${mono ? "'JetBrains Mono',monospace" : "Nunito,Arial,sans-serif"};font-size:${size}pt;line-height:1.55;color:#1A1A2E}
      h1{font-size:${size + 6}pt;margin:0 0 14px}
    </style></head><body><h1>${escape(title)}</h1>${rendered}</body></html>`;
  }

  function print() {
    const w = window.open("", "_blank", "width=900,height=800");
    if (!w) return toast.error("Allow pop-ups to print.");
    w.document.write(bodyHtml().replace("<body>", `<body onload="setTimeout(()=>window.print(),300)">`));
    w.document.close();
  }

  function download() {
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title || "note"}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="display-heading text-3xl font-bold">Quick text printing</h1>
        <p className="text-muted-foreground">
          Type a memo, agreement or list and print it on A4. Your draft stays on this device, even offline.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-4">
          <section className="glass-card rounded-2xl p-5 lg:col-span-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="text-lg font-semibold"
            />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Start typing…"
              className={`border-input bg-background mt-3 min-h-[420px] w-full rounded-xl border p-4 outline-none ${
                mono ? "font-mono" : ""
              }`}
              style={{ fontSize: `${size}pt`, lineHeight: 1.6 }}
            />
            <p className="text-muted-foreground mt-2 text-xs">
              {words} words · {lines.length} lines · saved automatically
            </p>
          </section>

          <section className="glass-card h-fit rounded-2xl p-5">
            <h2 className="flex items-center gap-2 font-bold">
              <Type className="size-4" /> Layout
            </h2>
            <div className="mt-4 space-y-5">
              <div className="flex items-center justify-between">
                <Label htmlFor="mono">Typewriter font</Label>
                <Switch id="mono" checked={mono} onCheckedChange={setMono} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="numbers">Line numbers</Label>
                <Switch id="numbers" checked={numbers} onCheckedChange={setNumbers} />
              </div>
              <div>
                <Label className="text-xs">Text size ({size}pt)</Label>
                <Slider
                  className="mt-2"
                  value={[size]}
                  min={8}
                  max={20}
                  step={1}
                  onValueChange={(v) => setSize(v[0] ?? size)}
                />
              </div>
            </div>
            <div className="mt-6 grid gap-2">
              <Button variant="hero" onClick={print}>
                <Printer className="size-4" /> Print
              </Button>
              <Button variant="outline" onClick={download}>
                <Download className="size-4" /> Save as .txt
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setText("");
                  toast.success("Cleared.");
                }}
              >
                <Trash2 className="size-4" /> Clear
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
