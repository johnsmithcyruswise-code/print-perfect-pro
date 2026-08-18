import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FileText, Plus, Trash2, Clock, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({
    meta: [
      { title: "My documents — Planned Kid Computer Services" },
      {
        name: "description",
        content:
          "Create, edit and print documents from ready-made templates: letters, CVs, flyers, posters and business cards.",
      },
      { property: "og:title", content: "My documents — Planned Kid Computer Services" },
      {
        property: "og:description",
        content: "A document workspace with templates, autosave and one-click printing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocumentsPage,
});

type Template = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  paper_size: string;
  content: unknown;
};

function DocumentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: docs, isLoading } = useQuery({
    queryKey: ["documents", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, word_count, version, updated_at, paper_size, template_used")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: templates } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("templates").select("*").order("name");
      if (error) throw error;
      return data as unknown as Template[];
    },
  });

  const create = useMutation({
    mutationFn: async (template: Template | null) => {
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          title: template ? `${template.name} draft` : "Untitled document",
          content: (template?.content ?? { type: "doc", content: [{ type: "paragraph" }] }) as never,
          paper_size: template?.paper_size ?? "a4",
          template_used: template?.name ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => navigate({ to: "/editor", search: { id } }),
    onError: () => toast.error("Could not create the document."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted.");
    },
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Document workspace</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Write it here, print it downstairs. Autosaves as you type.
            </p>
          </div>
          <Button variant="hero" onClick={() => create.mutate(null)} disabled={create.isPending}>
            <Plus /> New document
          </Button>
        </div>

        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-sm font-bold tracking-wide uppercase">
            <LayoutTemplate className="text-primary size-4" /> Start from a template
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(templates ?? []).map((t, i) => (
              <motion.button
                key={t.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => create.mutate(t)}
                disabled={create.isPending}
                className="glass-card hover-lift rounded-2xl p-5 text-left"
              >
                <div className="flex items-center justify-between">
                  <FileText className="text-primary size-5" />
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {t.paper_size}
                  </Badge>
                </div>
                <h3 className="mt-3 font-bold">{t.name}</h3>
                <p className="text-muted-foreground mt-1 text-xs">{t.description}</p>
              </motion.button>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-sm font-bold tracking-wide uppercase">Your documents</h2>
          <div className="mt-4 space-y-3">
            {isLoading && <Skeleton className="h-20 w-full rounded-2xl" />}
            {(docs ?? []).map((d) => (
              <div
                key={d.id}
                className="glass-card flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5"
              >
                <div className="min-w-0">
                  <Link
                    to="/editor"
                    search={{ id: d.id }}
                    className="hover:text-primary font-bold break-words"
                  >
                    {d.title}
                  </Link>
                  <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {new Date(d.updated_at).toLocaleString()}
                    </span>
                    <span>{d.word_count} words</span>
                    <span>v{d.version}</span>
                    <span className="uppercase">{d.paper_size}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="soft" size="sm" asChild>
                    <Link to="/editor" search={{ id: d.id }}>
                      Open
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${d.title}`}
                    onClick={() => remove.mutate(d.id)}
                  >
                    <Trash2 className="text-destructive size-4" />
                  </Button>
                </div>
              </div>
            ))}
            {!isLoading && (docs ?? []).length === 0 && (
              <p className="text-muted-foreground rounded-2xl border border-dashed p-10 text-center text-sm">
                No documents yet — pick a template above to get started.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
