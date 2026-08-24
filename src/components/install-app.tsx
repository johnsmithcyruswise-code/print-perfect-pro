import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BipEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let cachedPrompt: BipEvent | null = null;

function useInstallPrompt() {
  const [prompt, setPrompt] = useState<BipEvent | null>(cachedPrompt);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(
      window.matchMedia("(display-mode: standalone)").matches ||
        // iOS Safari
        (navigator as unknown as { standalone?: boolean }).standalone === true,
    );
    const onPrompt = (e: Event) => {
      e.preventDefault();
      cachedPrompt = e as BipEvent;
      setPrompt(cachedPrompt);
    };
    const onInstalled = () => {
      cachedPrompt = null;
      setPrompt(null);
      setInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!prompt) return false;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      cachedPrompt = null;
      setPrompt(null);
    }
    return outcome === "accepted";
  }

  return { canInstall: !!prompt && !installed, installed, install };
}

export function InstallAppButton({ className }: { className?: string }) {
  const { canInstall, installed, install } = useInstallPrompt();
  const [hint, setHint] = useState(false);

  if (installed) return null;

  return (
    <div className={className}>
      <Button
        size="lg"
        variant="brand"
        onClick={() => (canInstall ? install() : setHint(true))}
      >
        <Download /> 📲 Install App
      </Button>
      {hint && !canInstall && (
        <p className="text-muted-foreground mt-2 text-xs">
          On iPhone tap Share → Add to Home Screen. On desktop use your browser's install icon.
        </p>
      )}
    </div>
  );
}

export function InstallBanner() {
  const { canInstall, installed, install } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(sessionStorage.getItem("pk-install-dismissed") === "1");
  }, []);

  if (installed || dismissed || !canInstall) return null;

  return (
    <div className="border-primary/20 bg-card fixed inset-x-3 bottom-3 z-50 flex items-center gap-3 rounded-2xl border p-3 shadow-lg sm:hidden">
      <img src="/logo.png" alt="" className="h-9 w-auto" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Install Planned Kid</p>
        <p className="text-muted-foreground truncate text-xs">
          Faster access to orders and documents.
        </p>
      </div>
      <Button size="sm" variant="brand" onClick={() => install()}>
        Install
      </Button>
      <button
        aria-label="Dismiss install banner"
        onClick={() => {
          sessionStorage.setItem("pk-install-dismissed", "1");
          setDismissed(true);
        }}
        className="text-muted-foreground p-1"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
