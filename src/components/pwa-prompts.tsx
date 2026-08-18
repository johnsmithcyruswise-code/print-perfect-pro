import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, X, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setupOfflineDetection, isOnline, setupInstallPrompt } from "@/lib/pwa";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsubscribe = setupOfflineDetection(
      () => {
        setIsOffline(false);
        setDismissed(false); // Show banner again when coming online
      },
      () => setIsOffline(true)
    );

    return unsubscribe;
  }, []);

  if (!isOffline || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200 px-4 py-3"
      >
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <WifiOff className="size-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">You are offline</p>
              <p className="text-sm text-amber-700">
                Some features may be unavailable. Your changes will sync when you reconnect.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDismissed(true)}
            className="text-amber-600 hover:text-amber-700"
          >
            <X className="size-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Detect iOS
    const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isApple);

    // Setup install prompt for Android/Chrome
    if (!isApple) {
      setupInstallPrompt((prompt) => {
        setDeferredPrompt(prompt);
        setShowPrompt(true);
      });
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  if (!showPrompt && !isIOS) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="fixed bottom-6 right-6 z-50 max-w-sm"
      >
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5">
          {isIOS ? (
            <>
              <div className="flex items-start gap-3">
                <Share2 className="size-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">Install App</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Tap{" "}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
                      Share
                    </code>{" "}
                    then{" "}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
                      Add to Home Screen
                    </code>
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPrompt(false)}
                className="w-full mt-4 text-gray-600"
              >
                Got it
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <Download className="size-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">
                    Install Planned Kid
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Get faster access to your orders and offline support.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPrompt(false)}
                  className="flex-1 text-gray-600"
                >
                  Not now
                </Button>
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="flex-1"
                >
                  Install
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
