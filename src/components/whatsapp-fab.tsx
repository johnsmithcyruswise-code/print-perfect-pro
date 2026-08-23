import { MessageCircle } from "lucide-react";
import { STORE, waHref } from "@/lib/pricing";

export function WhatsAppFab() {
  return (
    <a
      href={waHref(STORE.whatsapp)}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Chat with us on WhatsApp"
      className="bg-accent text-accent-foreground fixed right-4 bottom-4 z-50 flex size-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
    >
      <MessageCircle className="size-7" />
    </a>
  );
}
