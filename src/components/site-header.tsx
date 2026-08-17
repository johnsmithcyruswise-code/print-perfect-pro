import { Link, useNavigate } from "@tanstack/react-router";
import { Printer, LogOut, LayoutDashboard, ShieldCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-role";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const { user, loading } = useAuth();
  const { isStaff } = useRoles();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="gradient-brand flex size-9 items-center justify-center rounded-xl text-primary-foreground">
            <Printer className="size-5" />
          </span>
          <span className="text-sm leading-tight font-extrabold tracking-tight">
            BAZZ
            <span className="text-muted-foreground block text-[10px] font-medium tracking-[0.18em]">
              COMPUTER SERVICES
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          {!loading && user ? (
            <>
              {isStaff && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin">
                    <ShieldCheck /> Staff
                  </Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard">
                  <LayoutDashboard /> Dashboard
                </Link>
              </Button>
              <Button asChild variant="hero" size="sm">
                <Link to="/order">Start an order</Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
                <LogOut />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild variant="hero" size="sm">
                <Link to="/order">Upload &amp; print</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}