// Guarded service-worker registration.
// Never registers in dev, inside an iframe, in Lovable preview hosts, or with ?sw=off.
const SW_URL = "/sw.js";

const PREVIEW_LABEL = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/;
const PREVIEW_HOSTS = [".lovable.app", ".gpt-eng.com", ".gptengineer.run"];
const DEV_HOST_LABEL = "project--65b7e622-3326-4890-ba37-1d251457460f-dev";

function isBlockedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  if (typeof window === "undefined") return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname.toLowerCase();
  const firstLabel = host.split(".")[0] ?? "";
  if (PREVIEW_HOSTS.some((suffix) => host.endsWith(suffix))) {
    if (PREVIEW_LABEL.test(firstLabel)) return true;
    if (firstLabel === DEV_HOST_LABEL) return true;
  }
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterAppWorkers() {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations
      .filter((r) => {
        const url = r.active?.scriptURL ?? r.installing?.scriptURL ?? r.waiting?.scriptURL ?? "";
        return url.endsWith(SW_URL);
      })
      .map((r) => r.unregister()),
  );
}

export async function registerAppServiceWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  if (isBlockedContext()) {
    await unregisterAppWorkers().catch(() => undefined);
    return;
  }
  try {
    await navigator.serviceWorker.register(SW_URL, { scope: "/" });
  } catch {
    // offline support is a progressive enhancement; ignore failures
  }
}
