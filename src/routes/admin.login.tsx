import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Staff login — Bazz Computer Services" },
      {
        name: "description",
        content: "Staff sign in to manage Bazz print orders.",
      },
      { property: "og:title", content: "Staff login — Bazz Computer Services" },
      { property: "og:description", content: "Staff sign in to manage print orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminLogin,
});


function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const creds = { email: email.trim().toLowerCase(), password };
    const { error } = await supabase.auth.signInWithPassword(creds);

    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
    navigate({ to: "/admin", replace: true });
  }

  async function resetPassword() {
    if (!email.trim()) {
      toast.error("Enter your email first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/admin/login`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent");
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-16">
      <div className="glass-card w-full max-w-md rounded-3xl p-8">
        <div className="flex flex-col items-center text-center">
          <ThemeToggle />
          <h1 className="mt-6 text-2xl font-bold">Bazz · Staff login</h1>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="hero" className="h-14 w-full text-lg" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <ShieldCheck />} Sign in
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Button type="button" variant="link" onClick={resetPassword}>
            Forgot password?
          </Button>
          <Link to="/" className="text-muted-foreground underline">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
