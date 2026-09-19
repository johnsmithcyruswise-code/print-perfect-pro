import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Download, ImageUp, Printer, RefreshCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/_authenticated/id-photo")({
  head: () => ({
    meta: [
      { title: "ID Photo Studio — Planned Kid Computer Services" },
      {
        name: "description",
        content:
          "Take or upload a portrait, crop it to passport, visa or ID size and print a ready-to-cut photo sheet.",
      },
      { property: "og:title", content: "ID Photo Studio — Planned Kid Computer Services" },
      {
        property: "og:description",
        content: "Passport, visa and national ID photo sheets made in your browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IdPhotoStudio,
});

type Preset = { value: string; label: string; w: number; h: number };

const PRESETS: Preset[] = [
  { value: "ug", label: "Uganda passport / National ID (35 × 45 mm)", w: 35, h: 45 },
  { value: "visa", label: "US / International visa (51 × 51 mm)", w: 51, h: 51 },
  { value: "dl", label: "Driver's licence (25 × 35 mm)", w: 25, h: 35 },
  { value: "custom", label: "Custom size", w: 40, h: 50 },
];

const SHEET_W_MM = 152.4; // 6 inch
const SHEET_H_MM = 101.6; // 4 inch
const DPI = 300;
const mmToPx = (mm: number) => Math.round((mm / 25.4) * DPI);

function IdPhotoStudio() {
  const [src, setSrc] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [presetKey, setPresetKey] = useState("ug");
  const [customW, setCustomW] = useState(40);
  const [customH, setCustomH] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [copies, setCopies] = useState(8);
  const [camera, setCamera] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const sheetRef = useRef<HTMLCanvasElement | null>(null);

  const preset = PRESETS.find((p) => p.value === presetKey)!;
  const photoW = presetKey === "custom" ? customW : preset.w;
  const photoH = presetKey === "custom" ? customH : preset.h;

  useEffect(() => {
    if (!src) return setImg(null);
    const image = new Image();
    image.onload = () => setImg(image);
    image.src = src;
  }, [src]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamera(false);
  }

  useEffect(() => () => stopCamera(), []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 960 },
      });
      streamRef.current = stream;
      setCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      }, 50);
    } catch {
      toast.error("Could not open the camera. Check permission or upload a photo instead.");
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const c = document.createElement("canvas");
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    c.getContext("2d")!.drawImage(video, 0, 0);
    setSrc(c.toDataURL("image/jpeg", 0.95));
    stopCamera();
  }

  // draw single cropped photo onto a canvas of given pixel size
  function drawPhoto(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    if (!img) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    const scale = Math.max(w / img.width, h / img.height) * zoom;
    const dw = img.width * scale;
    const dh = img.height * scale;
    const dx = x + (w - dw) / 2 + (offsetX / 100) * w;
    const dy = y + (h - dh) / 2 + (offsetY / 100) * h;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  }

  // live preview
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const scale = 6; // px per mm for preview
    canvas.width = Math.round(photoW * scale);
    canvas.height = Math.round(photoH * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawPhoto(ctx, 0, 0, canvas.width, canvas.height);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, photoW, photoH, zoom, offsetX, offsetY, brightness, contrast]);

  const perRow = Math.max(1, Math.floor(SHEET_W_MM / (photoW + 2)));
  const perCol = Math.max(1, Math.floor(SHEET_H_MM / (photoH + 2)));
  const maxOnSheet = perRow * perCol;

  useEffect(() => {
    if (copies > maxOnSheet) setCopies(maxOnSheet);
  }, [maxOnSheet, copies]);

  function buildSheet(): string | null {
    if (!img) return null;
    const canvas = sheetRef.current ?? document.createElement("canvas");
    canvas.width = mmToPx(SHEET_W_MM);
    canvas.height = mmToPx(SHEET_H_MM);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pw = mmToPx(photoW);
    const ph = mmToPx(photoH);
    const gap = mmToPx(2);
    const totalW = perRow * pw + (perRow - 1) * gap;
    const totalH = perCol * ph + (perCol - 1) * gap;
    const startX = (canvas.width - totalW) / 2;
    const startY = (canvas.height - totalH) / 2;

    let placed = 0;
    for (let r = 0; r < perCol; r++) {
      for (let c = 0; c < perRow; c++) {
        if (placed >= copies) break;
        const x = startX + c * (pw + gap);
        const y = startY + r * (ph + gap);
        drawPhoto(ctx, x, y, pw, ph);
        ctx.strokeStyle = "#bbbbbb";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, pw, ph);
        placed++;
      }
    }
    return canvas.toDataURL("image/jpeg", 0.95);
  }

  function download() {
    const data = buildSheet();
    if (!data) {
      toast.error("Add a photo first.");
      return;
    }
    const a = document.createElement("a");
    a.href = data;
    a.download = `id-photo-sheet-${photoW}x${photoH}mm.jpg`;
    a.click();
    toast.success("Photo sheet downloaded.");
  }

  function printSheet() {
    const data = buildSheet();
    if (!data) {
      toast.error("Add a photo first.");
      return;
    }
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) {
      toast.error("Allow pop-ups to print the sheet.");
      return;
    }
    w.document.write(
      `<html><head><title>ID photo sheet</title><style>@page{size:6in 4in;margin:0}body{margin:0}img{width:100%;display:block}</style></head><body onload="setTimeout(()=>{window.print();},400)"><img src="${data}" /></body></html>`,
    );
    w.document.close();
  }

  const previewStyle = useMemo(
    () => ({ aspectRatio: `${photoW} / ${photoH}` }),
    [photoW, photoH],
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="display-heading text-3xl font-bold">ID Photo Studio</h1>
            <p className="text-muted-foreground">
              Passport, visa and ID photos — cropped, tiled on a 6×4 inch sheet and ready to cut.
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link to="/order">Send to an order</Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <section className="glass-card rounded-2xl p-5 lg:col-span-2">
            <h2 className="font-bold">1. Add the portrait</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => document.getElementById("id-photo-file")?.click()}>
                <ImageUp className="size-4" /> Upload photo
              </Button>
              {camera ? (
                <Button variant="outline" onClick={stopCamera}>
                  <X className="size-4" /> Close camera
                </Button>
              ) : (
                <Button variant="outline" onClick={startCamera}>
                  <Camera className="size-4" /> Use camera
                </Button>
              )}
              {src && (
                <Button variant="ghost" onClick={() => setSrc(null)}>
                  <RefreshCcw className="size-4" /> Clear
                </Button>
              )}
            </div>
            <input
              id="id-photo-file"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setSrc(String(reader.result));
                reader.readAsDataURL(file);
              }}
            />

            {camera && (
              <div className="mt-4">
                <video ref={videoRef} playsInline muted className="w-full rounded-xl bg-black" />
                <Button className="mt-2 w-full" variant="hero" onClick={capture}>
                  <Camera className="size-4" /> Capture
                </Button>
              </div>
            )}

            <h2 className="mt-6 font-bold">2. Choose the size</h2>
            <div className="mt-3 grid gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPresetKey(p.value)}
                  className={`rounded-xl border p-3 text-left text-sm ${
                    presetKey === p.value ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {presetKey === "custom" && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label>Width (mm)</Label>
                  <input
                    type="number"
                    value={customW}
                    min={10}
                    max={100}
                    onChange={(e) => setCustomW(Number(e.target.value) || 10)}
                    className="border-input mt-1 h-10 w-full rounded-md border px-3"
                  />
                </div>
                <div>
                  <Label>Height (mm)</Label>
                  <input
                    type="number"
                    value={customH}
                    min={10}
                    max={100}
                    onChange={(e) => setCustomH(Number(e.target.value) || 10)}
                    className="border-input mt-1 h-10 w-full rounded-md border px-3"
                  />
                </div>
              </div>
            )}
          </section>

          <section className="glass-card rounded-2xl p-5 lg:col-span-3">
            <h2 className="font-bold">3. Frame and adjust</h2>
            <div className="mt-4 flex justify-center">
              <div
                className="bg-muted overflow-hidden rounded-xl border"
                style={{ ...previewStyle, width: 200 }}
              >
                <canvas ref={previewRef} className="h-full w-full object-contain" />
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Adjust label="Zoom" value={zoom} min={1} max={3} step={0.05} onChange={setZoom} />
              <Adjust label="Move left / right" value={offsetX} min={-40} max={40} step={1} onChange={setOffsetX} />
              <Adjust label="Move up / down" value={offsetY} min={-40} max={40} step={1} onChange={setOffsetY} />
              <Adjust label="Brightness" value={brightness} min={50} max={150} step={1} onChange={setBrightness} />
              <Adjust label="Contrast" value={contrast} min={50} max={150} step={1} onChange={setContrast} />
              <Adjust
                label={`Photos on the sheet (max ${maxOnSheet})`}
                value={copies}
                min={1}
                max={maxOnSheet}
                step={1}
                onChange={(v) => setCopies(Math.round(v))}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="hero" onClick={printSheet} disabled={!img}>
                <Printer className="size-4" /> Print sheet
              </Button>
              <Button variant="outline" onClick={download} disabled={!img}>
                <Download className="size-4" /> Download JPEG
              </Button>
            </div>
            <p className="text-muted-foreground mt-3 text-xs">
              The sheet is 6 × 4 inch photo paper at 300 dpi with light cut lines around each photo.
            </p>
            <canvas ref={sheetRef} className="hidden" />
          </section>
        </div>
      </main>
    </div>
  );
}

function Adjust({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Slider
        className="mt-2"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0] ?? value)}
      />
    </div>
  );
}
