import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fixDocumentText } from "@/lib/ai.functions";

type Mode = "fix" | "formal" | "shorten";

const MODES: { value: Mode; label: string; hint: string }[] = [
  { value: "fix", label: "Fix spelling & grammar", hint: "Keeps your wording and tone" },
  { value: "formal", label: "Make it professional", hint: "Rewrites in business English" },
  { value: "shorten", label: "Make it shorter", hint: "Same facts, fewer words" },
];

export function AiFixButton({
  getText,
  onFixed,
  size = "sm",
}: {
  getText: () => string;
  onFixed: (text: string) => void;
  size?: "sm" | "default";
}) {
  const [busy, setBusy] = useState(false);
  const fix = useServerFn(fixDocumentText);

  async function run(mode: Mode) {
    const text = getText().trim();
    if (!text) {
      toast.error("Write something first.");
      return;
    }
    setBusy(true);
    const t = toast.loading("Checking your document…");
    try {
      const result = await fix({ data: { text, mode } });
      onFixed(result.text);
      toast.success("Document cleaned up.", { id: t });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Auto-fix failed.", { id: t });
    } finally {
      setBusy(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="soft" size={size} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          AI fix
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Auto-fix this document</DropdownMenuLabel>
        {MODES.map((m) => (
          <DropdownMenuItem key={m.value} onSelect={() => void run(m.value)} className="flex-col items-start gap-0.5">
            <span className="font-medium">{m.label}</span>
            <span className="text-muted-foreground text-xs">{m.hint}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
