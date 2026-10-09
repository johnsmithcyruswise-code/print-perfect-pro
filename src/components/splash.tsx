import { useEffect, useState } from "react";

export const APP_VERSION = "v1.2.0";

export function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("pk-splash-seen")) return;
    setMounted(true);
    const fade = setTimeout(() => setFading(true), 2600);
    const hide = setTimeout(() => {
      sessionStorage.setItem("pk-splash-seen", "1");
      setMounted(false);
    }, 3200);
    return () => {
      clearTimeout(fade);
      clearTimeout(hide);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={`bg-background pointer-events-none fixed inset-0 z-[100] grid place-items-center transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
      role="status"
      aria-label="Loading Planned Kid Computer Services"
    >
      <div className="relative flex flex-col items-center">
        <img
          src="/logo.png"
          alt="Planned Kid Computer Services"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          className="w-72 max-w-[80vw]"
        />
        <div className="bg-border mt-10 h-1 w-56 overflow-hidden rounded-full">
          <div className="bg-primary h-full animate-[splash-bar_2.4s_ease-in-out_forwards]" />
        </div>
        <p className="text-muted-foreground mt-6 text-xs tracking-[0.3em] uppercase">
          Upload · Create · Collect
        </p>
      </div>
      <p className="text-muted-foreground absolute bottom-8 font-mono text-[11px]">{APP_VERSION}</p>
    </div>
  );
}
