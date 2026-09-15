import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { syncMyProfile } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin login — Planned Kid Computer Services" },
      {
        name: "description",
        content: "Staff and administrator sign in for the Planned Kid production console.",
      },
      { property: "og:title", content: "Admin login — Planned Kid Computer Services" },
      { property: "og:description", content: "Staff sign in for the production console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminLogin,
});

const OWNER_EMAIL = "mzedi2012@gmail.com";

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const creds = { email: email.trim().toLowerCase(), password };
    let { error } = await supabase.auth.signInWithPassword(creds);

    // First-run bootstrap for the owner account.
    if (error && creds.email === OWNER_EMAIL) {
      const { error: signUpError } = await supabase.auth.signUp(creds);
      if (!signUpError) {
        ({ error } = await supabase.auth.signInWithPassword(creds));
      }
    }

    if (!error) {
      // Ensure the owner profile exists and is granted the admin role.
      await syncMyProfile({ data: {} }).catch(() => null);
    }

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
          <BrandLogo className="h-12 w-auto" />
          <h1 className="mt-6 text-2xl font-bold tracking-tight">Admin login</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Staff access to the production console.
          </p>
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
          <Button type="submit" variant="hero" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <ShieldCheck />} Sign in
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button type="button" onClick={resetPassword} className="text-primary underline">
            Forgot password?
          </button>
          <Link to="/auth" className="text-muted-foreground underline">
            Customer sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
