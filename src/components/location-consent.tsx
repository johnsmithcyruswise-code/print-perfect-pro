import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { syncMyProfile } from "@/lib/admin.functions";

/** Keeps the customer profile in sync and lets them opt in to sharing location for delivery. */
export function LocationConsent() {
  const sync = useServerFn(syncMyProfile);
  const [busy, setBusy] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    sync({ data: {} }).catch(() => undefined);
  }, [sync]);

  function share() {
    if (!("geolocation" in navigator)) {
      toast.error("Your browser doesn't support location sharing.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await sync({
            data: {
              location: {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
              },
            },
          });
          setShared(true);
          toast.success("Location shared with the Bazz team.");
        } catch {
          toast.error("Couldn't save your location.");
        } finally {
          setBusy(false);
        }
      },
      () => {
        setBusy(false);
        toast.error("Location permission denied.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="glass-card mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <span className="bg-secondary text-primary flex size-9 items-center justify-center rounded-xl">
          <MapPin className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">Share your delivery location</p>
          <p className="text-muted-foreground text-xs">
            Optional — helps our riders find you. You can stop sharing any time.
          </p>
        </div>
      </div>
      <Button variant={shared ? "soft" : "hero"} size="sm" disabled={busy} onClick={share}>
        {shared ? <ShieldCheck /> : <MapPin />} {shared ? "Location shared" : "Share location"}
      </Button>
    </div>
  );
}
