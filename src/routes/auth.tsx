import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Bazz Computer Services" },
      { name: "description", content: "Sign in or create a Bazz print shop account to order and track prints." },
      { property: "og:title", content: "Sign in — Bazz Computer Services" },
      { property: "og:description", content: "Sign in or create a Bazz print shop account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created — you can start printing.");
    navigate({ to: "/dashboard" });
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="gradient-brand flex size-10 items-center justify-center rounded-xl text-primary-foreground">
            <Printer className="size-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">Bazz Computer Services</span>
        </Link>

        <div className="glass-card rounded-3xl p-6">
          <Tabs defaultValue="signin">
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-4">
                <Field id="si-email" label="Email" type="email" value={email} onChange={setEmail} />
                <Field
                  id="si-pass"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                />
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="animate-spin" />} Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4">
                <Field id="su-name" label="Full name" value={fullName} onChange={setFullName} />
                <Field id="su-email" label="Email" type="email" value={email} onChange={setEmail} />
                <Field
                  id="su-pass"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                />
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="animate-spin" />} Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="text-muted-foreground my-5 flex items-center gap-3 text-xs">
            <span className="bg-border h-px flex-1" /> or <span className="bg-border h-px flex-1" />
          </div>

          <Button variant="outline" size="lg" className="w-full" onClick={google}>
            Continue with Google
          </Button>
        </div>
      </div>
    </main>
  );
}

function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        required
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}