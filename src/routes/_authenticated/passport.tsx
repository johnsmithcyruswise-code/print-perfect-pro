import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, Check, Loader2, ArrowLeft, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { STORE } from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/passport")({
  head: () => ({
    meta: [
      { title: "Passport photos — Planned Kid Computer Services" },
      {
        name: "description",
        content: "Upload a portrait photo for passport-size printing. Reviewed and approved by PK staff.",
      },
      { property: "og:title", content: "Passport photos — Planned Kid Computer Services" },
      { property: "og:description", content: "Upload a portrait photo for passport-size printing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PassportPage,
});

function PassportPage() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  function addFile(list: FileList | null) {
    if (!list || list.length === 0) return;
    const f = list[0];
    if (!f.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    if (!user || !file) return;
    setSubmitting(true);
    setProgress(10);
    try {
      let location: GeolocationPosition | null = null;
      try {
        location = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 })
        );
      } catch {
        // location optional
      }

      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          order_type: "passport",
          paper_size: "passport",
          paper_type: "glossy",
          color_mode: "full-color",
          sides: "single",
          binding: "none",
          quantity: 1,
          turnaround: "1-day",
          addons: [],
          delivery_method: "pickup",
          location_lat: location?.coords.latitude ?? null,
          location_lng: location?.coords.longitude ?? null,
        })
        .select()
        .single();
      if (error || !order) throw error ?? new Error("Order failed");

      const path = `${user.id}/${order.id}/${crypto.randomUUID()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("print-files").upload(path, file);
      if (upErr) throw upErr;

      await supabase.from("order_files").insert({
        order_id: order.id,
        user_id: user.id,
        file_path: path,
        file_name: file.name,
        size_bytes: file.size,
        content_type: file.type || null,
      });

      // Put in Passport folder if it exists
      const { data: passportFolder } = await supabase
        .from("folders")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", "Passport")
        .single();
      if (passportFolder) {
        await supabase.from("files").insert({
          user_id: user.id,
          folder_id: passportFolder.id,
          order_id: order.id,
          name: file.name,
          url: path,
          size: file.size,
          type: file.type || null,
        });
      }

      await supabase.from("order_events").insert({
        order_id: order.id,
        status: "pending",
        note: "Passport photo submitted — awaiting staff approval",
      });

      setProgress(100);
      setOrderNumber(order.order_number);
      setDone(true);
    } catch (err) {
      console.error(err);
      toast.error("Could not submit passport photo. Please try again.");
      setProgress(0);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/order">
            <ArrowLeft className="size-4" /> Back to order
          </Link>
        </Button>
        <h1 className="text-3xl font-extrabold tracking-tight">Passport photos</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Upload one clear portrait. Our staff will review it before printing.
        </p>

        {!done ? (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card mt-8 rounded-3xl p-6 space-y-6"
          >
            {!preview ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  addFile(e.dataTransfer.files);
                }}
                onClick={() => inputRef.current?.click()}
                className="border-primary/30 bg-primary/5 hover:bg-primary/10 flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-12 text-center transition-colors"
              >
                <UploadCloud className="text-primary size-10" />
                <p className="font-semibold">Drop your portrait photo here</p>
                <p className="text-muted-foreground text-xs">JPG or PNG, clear face, plain background preferred</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => addFile(e.target.files)}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative mx-auto w-64 h-80 overflow-hidden rounded-xl border border-border bg-black/5">
                  <img src={preview} alt="Passport preview" className="h-full w-full object-contain" />
                </div>
                <div className="flex justify-center gap-3">
                  <Button variant="ghost" onClick={() => { setFile(null); setPreview(null); }}>
                    Choose another
                  </Button>
                  <Button variant="hero" disabled={submitting} onClick={submit}>
                    {submitting && <Loader2 className="animate-spin" />} Submit passport order
                  </Button>
                </div>
                {submitting && <Progress value={progress} />}
              </div>
            )}
          </motion.section>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card mt-8 rounded-3xl p-8 text-center space-y-6"
          >
            <span className="bg-success/15 text-success mx-auto flex size-16 items-center justify-center rounded-full">
              <Check className="size-8" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold">Passport photo submitted</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Staff will review and approve it before printing.
              </p>
            </div>
            <div className="bg-secondary mx-auto w-fit rounded-2xl px-8 py-5">
              <p className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
                Order number
              </p>
              <p className="font-mono text-2xl font-extrabold">{orderNumber}</p>
            </div>
            <div className="text-muted-foreground mx-auto grid max-w-md gap-2 text-left text-sm">
              <p className="flex items-start gap-2">
                <MapPin className="text-primary mt-0.5 size-4 shrink-0" /> {STORE.address}
              </p>
              <p className="flex items-start gap-2">
                <Clock className="text-primary mt-0.5 size-4 shrink-0" /> {STORE.hours}
              </p>
            </div>
            <Button variant="hero" size="lg" asChild>
              <Link to="/dashboard">View my orders</Link>
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
