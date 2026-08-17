import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MapPin, ShieldAlert, Trash2, Search, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { useRoles } from "@/hooks/use-role";
import { listAppUsers, deleteAppUser } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({
    meta: [
      { title: "Customer accounts — Bazz Computer Services" },
      {
        name: "description",
        content: "Admin console for Bazz staff: review customer accounts, shared locations and remove users.",
      },
      { property: "og:title", content: "Customer accounts — Bazz Computer Services" },
      { property: "og:description", content: "Admin console for customer accounts at Bazz." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const { isAdmin, loading } = useRoles();
  const fetchUsers = useServerFn(listAppUsers);
  const removeUser = useServerFn(deleteAppUser);
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["app-users"],
    enabled: isAdmin,
    queryFn: () => fetchUsers({ data: undefined as never }),
  });

  const del = useMutation({
    mutationFn: (userId: string) => removeUser({ data: { userId } }),
    onSuccess: () => {
      toast.success("Account deleted.");
      queryClient.invalidateQueries({ queryKey: ["app-users"] });
    },
    onError: (e: Error) => toast.error(e.message || "Delete failed."),
  });

  if (!loading && !isAdmin) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-md px-4 py-24 text-center">
          <ShieldAlert className="text-destructive mx-auto size-10" />
          <h1 className="mt-4 text-2xl font-extrabold">Admins only</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Account management is limited to Bazz administrators.
          </p>
          <Button variant="hero" className="mt-6" asChild>
            <Link to="/dashboard">Back to my orders</Link>
          </Button>
        </main>
      </div>
    );
  }

  const users = (data ?? []).filter((u) =>
    `${u.email ?? ""} ${u.full_name ?? ""}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight">
              <UsersIcon className="text-primary size-7" /> Customer accounts
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Review sign-ups, last known location (shared with consent) and remove accounts.
            </p>
          </div>
          <Button variant="soft" asChild>
            <Link to="/admin">Production console</Link>
          </Button>
        </div>

        <div className="relative mt-8 max-w-sm">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            className="pl-9"
            placeholder="Search by name or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="mt-6 space-y-3">
          {isLoading && <Skeleton className="h-24 w-full rounded-2xl" />}
          {users.map((u) => (
            <article key={u.id} className="glass-card rounded-2xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{u.full_name ?? "Unnamed customer"}</p>
                  <p className="text-muted-foreground text-xs">{u.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(u.roles.length ? u.roles : ["customer"]).map((r) => (
                      <Badge key={r} variant="secondary" className="text-[10px] capitalize">
                        {r}
                      </Badge>
                    ))}
                    <Badge variant="outline" className="text-[10px]">
                      {u.orders} order{u.orders === 1 ? "" : "s"}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-[11px]">
                    Joined {new Date(u.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    Last sign-in{" "}
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "—"}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
                {u.last_lat != null && u.last_lng != null ? (
                  <a
                    className="text-primary inline-flex items-center gap-1.5 text-xs font-semibold"
                    href={`https://www.google.com/maps?q=${u.last_lat},${u.last_lng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MapPin className="size-3.5" />
                    {u.last_lat.toFixed(5)}, {u.last_lng.toFixed(5)}
                    <span className="text-muted-foreground font-normal">
                      ({u.last_location_at ? new Date(u.last_location_at).toLocaleString() : "—"})
                    </span>
                  </a>
                ) : (
                  <span className="text-muted-foreground text-xs">
                    No location shared by this customer
                  </span>
                )}

                <Button
                  size="sm"
                  variant="destructive"
                  disabled={del.isPending}
                  onClick={() => {
                    if (confirm(`Permanently delete ${u.email}? This cannot be undone.`)) {
                      del.mutate(u.id);
                    }
                  }}
                >
                  <Trash2 /> Delete user
                </Button>
              </div>
            </article>
          ))}
          {!isLoading && users.length === 0 && (
            <p className="text-muted-foreground py-12 text-center text-sm">No accounts found.</p>
          )}
        </div>
      </main>
    </div>
  );
}
