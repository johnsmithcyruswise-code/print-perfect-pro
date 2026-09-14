import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Planned Kid Computer Services" },
      { name: "description", content: "Sign in or create a PK print shop account to order and track prints." },
      { property: "og:title", content: "Sign in — Planned Kid Computer Services" },
      { property: "og:description", content: "Sign in or create a PK print shop account." },
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
  const [phone, setPhone] = useState("");

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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName },
      },
    });
    if (!error && data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        phone,
      });
    }
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created — you can start printing.");
    navigate({ to: "/dashboard" });
  }

  async function forgotPassword() {
    if (!email.trim()) {
      toast.error("Enter your email first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent — check your email");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <BrandLogo className="h-12 w-auto" />
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
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={forgotPassword}
                  className="text-primary hover:underline text-sm"
                >
                  Forgot password?
                </button>
              </div>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4">
                <Field id="su-name" label="Full name" value={fullName} onChange={setFullName} />
                <Field id="su-phone" label="Phone number" type="tel" value={phone} onChange={setPhone} />
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
