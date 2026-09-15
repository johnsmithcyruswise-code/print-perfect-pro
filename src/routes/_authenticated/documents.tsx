import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  FolderOpen,
  FileText,
  Search,
  Trash2,
  Download,
  Printer,
  Plus,
  Clock,
  ImageIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Folder = {
  id: string;
  name: string;
  created_at: string;
};

type FileRow = {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string | null;
  uploaded_at: string;
  folder_id: string | null;
  order_id: string | null;
};

const DEFAULT_FOLDERS = ["Passport", "Business Cards", "Wedding"];

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({
    meta: [
      { title: "My files — Planned Kid Computer Services" },
      {
        name: "description",
        content:
          "Browse, search and re-print your files and folders in the PK document vault.",
      },
      { property: "og:title", content: "My files — Planned Kid Computer Services" },
      {
        property: "og:description",
        content: "Browse, search and re-print your files and folders.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VaultPage,
});

function VaultPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | "all">("all");
  const [dateSort, setDateSort] = useState<"newest" | "oldest">("newest");

  const { data: folders, isLoading: foldersLoading } = useQuery({
    queryKey: ["folders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("folders").select("id, name, created_at").order("name");
      if (error) throw error;
      return (data ?? []) as Folder[];
    },
  });

  const { data: files, isLoading: filesLoading } = useQuery({
    queryKey: ["files", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("files")
        .select("id, name, url, size, type, uploaded_at, folder_id, order_id")
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FileRow[];
    },
  });

  const seedFolders = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const existing = new Set((folders ?? []).map((f) => f.name));
      const missing = DEFAULT_FOLDERS.filter((name) => !existing.has(name));
      if (missing.length === 0) return;
      const { error } = await supabase.from("folders").insert(
        missing.map((name) => ({ user_id: user.id, name }))
      );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["folders", user?.id] }),
  });

  const createFolder = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("folders").insert({ user_id: user.id, name });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["folders", user?.id] }),
  });

  const deleteFile = useMutation({
    mutationFn: async (file: FileRow) => {
      await supabase.storage.from("print-files").remove([file.url]);
      const { error } = await supabase.from("files").delete().eq("id", file.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["files", user?.id] }),
  });

  const filtered = useMemo(() => {
    let list = (files ?? []).slice();
    if (selectedFolder !== "all") {
      list = list.filter((f) => f.folder_id === selectedFolder);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const diff = new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
      return dateSort === "newest" ? diff : -diff;
    });
    return list;
  }, [files, selectedFolder, search, dateSort]);

  const folderMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of folders ?? []) map.set(f.id, f.name);
    return map;
  }, [folders]);

  async function download(file: FileRow) {
    const { data, error } = await supabase.storage.from("print-files").createSignedUrl(file.url, 60);
    if (error || !data) {
      toast.error("Could not generate download link.");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  const isLoading = foldersLoading || filesLoading;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">My files</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Search, download and re-print anything you have ordered.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => seedFolders.mutate()} disabled={seedFolders.isPending}>
              <Plus className="size-4" /> Add default folders
            </Button>
            <Button variant="hero" asChild>
              <Link to="/order">
                <Printer className="size-4" /> Re-print
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-4">
          <aside className="space-y-4">
            <div className="glass-card rounded-2xl p-4">
              <h2 className="text-xs font-bold tracking-wide uppercase mb-3">Folders</h2>
              <button
                onClick={() => setSelectedFolder("all")}
                className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  selectedFolder === "all" ? "bg-primary/10 text-primary font-semibold" : "hover:bg-accent"
                }`}
              >
                <FolderOpen className="size-4" /> All files
              </button>
              {foldersLoading && <Skeleton className="h-8 w-full mt-2 rounded-lg" />}
              {(folders ?? []).map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    selectedFolder === folder.id
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-accent"
                  }`}
                >
                  <FolderOpen className="size-4" /> {folder.name}
                </button>
              ))}
              <NewFolder onCreate={(name) => createFolder.mutate(name)} />
            </div>
          </aside>

          <section className="lg:col-span-3 space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by file name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                value={dateSort}
                onChange={(e) => setDateSort(e.target.value as "newest" | "oldest")}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>

            {isLoading && (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </div>
            )}

            <div className="space-y-3">
              {filtered.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="bg-secondary flex size-10 items-center justify-center rounded-lg shrink-0">
                      {file.type?.startsWith("image/") ? (
                        <ImageIcon className="text-primary size-5" />
                      ) : (
                        <FileText className="text-primary size-5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{file.name}</p>
                      <p className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {new Date(file.uploaded_at).toLocaleString()}
                        </span>
                        {file.folder_id && (
                          <span className="bg-secondary rounded px-1.5 py-0.5">
                            {folderMap.get(file.folder_id) ?? "Folder"}
                          </span>
                        )}
                        <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="soft" size="sm" onClick={() => download(file)}>
                      <Download className="size-4" /> Download
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteFile.mutate(file)}>
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
              {!isLoading && filtered.length === 0 && (
                <p className="text-muted-foreground rounded-2xl border border-dashed p-10 text-center text-sm">
                  No files found. Start a new order to add files here.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function NewFolder({ onCreate }: { onCreate: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-primary hover:bg-accent transition-colors"
      >
        <Plus className="size-4" /> New folder
      </button>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onCreate(name.trim());
        setName("");
        setOpen(false);
      }}
      className="mt-2 flex items-center gap-2"
    >
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Folder name" className="h-9" />
      <Button type="submit" size="sm">
        Add
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)}>
        <X className="size-4" />
      </Button>
    </form>
  );
}
