import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, History, Loader2, Printer, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { EditorSurface, EditorToolbar, useRichEditor } from "@/components/rich-editor";

export const Route = createFileRoute("/_authenticated/editor")({
  validateSearch: (search: Record<string, unknown>) => ({ id: String(search["id"] ?? "") }),
  head: () => ({
    meta: [
      { title: "Document editor — Planned Kid Computer Services" },
      {
        name: "description",
        content:
          "Write and format documents with autosave, version history and one-click printing at our Nairobi shop.",
      },
      { property: "og:title", content: "Document editor — Planned Kid Computer Services" },
      { property: "og:description", content: "Autosaving rich-text editor with version history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditorPage,
});

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function EditorPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [words, setWords] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: doc, isLoading } = useQuery({
    queryKey: ["document", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("documents").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const editor = useRichEditor({
    content: doc?.content ?? "",
    onUpdate: (e) => {
      setWords(countWords(e.getText()));
      dirty.current = true;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void save(false), 1500);
    },
  });

  useEffect(() => {
    if (!doc || !editor) return;
    setTitle(doc.title);
    editor.commands.setContent((doc.content ?? "") as never);
    setWords(doc.word_count);
    setSavedAt(doc.last_autosave ? new Date(doc.last_autosave) : null);
  }, [doc?.id, editor]);

  const save = useCallback(
    async (snapshot: boolean) => {
      if (!editor || !doc) return;
      setSaving(true);
      const json = editor.getJSON();
      const text = editor.getText();
      const nextVersion = snapshot ? doc.version + 1 : doc.version;
      const { error } = await supabase
        .from("documents")
        .update({
          title: title || "Untitled document",
          content: json as never,
          content_plain: text,
          word_count: countWords(text),
          version: nextVersion,
          last_autosave: new Date().toISOString(),
        })
        .eq("id", doc.id);
      setSaving(false);
      if (error) {
        toast.error("Save failed.");
        return;
      }
      dirty.current = false;
      setSavedAt(new Date());
      if (snapshot) {
        await supabase.from("document_versions").insert({
          document_id: doc.id,
          content: json as never,
          version: nextVersion,
          word_count: countWords(text),
        });
        queryClient.invalidateQueries({ queryKey: ["document", id] });
        queryClient.invalidateQueries({ queryKey: ["document-versions", id] });
        toast.success(`Version ${nextVersion} saved.`);
      }
    },
    [editor, doc, title, id, queryClient],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [save]);

  if (!id) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="text-2xl font-extrabold">No document selected</h1>
          <Button variant="hero" className="mt-6" asChild>
            <Link to="/documents">Go to my documents</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="print:hidden">
        <SiteHeader />
      </div>
      <main className="mx-auto max-w-5xl px-4 py-8 print:max-w-none print:p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Button variant="ghost" size="icon" aria-label="Back" onClick={() => navigate({ to: "/documents" })}>
              <ArrowLeft className="size-4" />
            </Button>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                dirty.current = true;
              }}
              onBlur={() => void save(false)}
              className="max-w-md border-none bg-transparent text-lg font-bold shadow-none focus-visible:ring-0"
              aria-label="Document title"
            />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 text-[11px]">
              {saving ? (
                <>
                  <Loader2 className="size-3 animate-spin" /> Saving
                </>
              ) : savedAt ? (
                <>
                  <Check className="size-3" /> Saved {savedAt.toLocaleTimeString()}
                </>
              ) : (
                "Not saved yet"
              )}
            </Badge>
            <span className="text-muted-foreground font-mono text-xs">{words} words</span>
            <VersionsSheet documentId={id} />
            <Button variant="soft" size="sm" onClick={() => void save(true)}>
              <Save /> Save version
            </Button>
            <Button variant="hero" size="sm" onClick={() => window.print()}>
              <Printer /> Print / PDF
            </Button>
          </div>
        </div>

        {isLoading || !editor ? (
          <Skeleton className="mt-8 h-[60vh] w-full rounded-2xl" />
        ) : (
          <>
            <div className="mt-4">
              <EditorToolbar editor={editor} />
            </div>
            <EditorSurface editor={editor} paperSize={doc?.paper_size ?? "a4"} />
          </>
        )}
      </main>
    </div>
  );
}

function VersionsSheet({ documentId }: { documentId: string }) {
  const { data } = useQuery({
    queryKey: ["document-versions", documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_versions")
        .select("id, version, word_count, saved_at")
        .eq("document_id", documentId)
        .order("version", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <History /> Versions
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Version history</SheetTitle>
          <SheetDescription>Snapshots created each time you save a version.</SheetDescription>
        </SheetHeader>
        <div className="space-y-2 px-4 pb-8">
          {(data ?? []).map((v) => (
            <div key={v.id} className="border-border rounded-xl border p-3 text-sm">
              <p className="font-mono font-bold">v{v.version}</p>
              <p className="text-muted-foreground text-xs">
                {new Date(v.saved_at).toLocaleString()} · {v.word_count} words
              </p>
            </div>
          ))}
          {(data ?? []).length === 0 && (
            <p className="text-muted-foreground py-8 text-center text-xs">No versions saved yet.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
