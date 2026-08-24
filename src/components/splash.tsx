import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const APP_VERSION = "v1.2.0";

export function SplashScreen() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("pk-splash-seen")) return;
    setVisible(true);
    const t = setTimeout(() => {
      sessionStorage.setItem("pk-splash-seen", "1");
      setVisible(false);
    }, 3200);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.5 }}
          className="bg-background fixed inset-0 z-[100] grid place-items-center"
          role="status"
          aria-label="Loading Planned Kid Computer Services"
        >
          <div className="bg-primary/20 pointer-events-none absolute size-[32rem] rounded-full blur-[140px]" />
          <div className="relative flex flex-col items-center">
            <motion.img
              src="/logo.png"
              alt="Planned Kid Computer Services"
              className="w-72 max-w-[80vw]"
              initial={{ opacity: 0, y: 18, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            <motion.div
              className="bg-border mt-10 h-1 w-56 overflow-hidden rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                className="gradient-brand h-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.4, ease: "easeInOut" }}
              />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-muted-foreground mt-6 text-xs tracking-[0.3em] uppercase"
            >
              Upload · Create · Collect
            </motion.p>
          </div>
          <p className="text-muted-foreground absolute bottom-8 font-mono text-[11px]">
            {APP_VERSION}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
