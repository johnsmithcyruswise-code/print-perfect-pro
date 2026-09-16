import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, LayoutDashboard, ShieldCheck, Users, FileText, Settings } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-role";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "@/components/notification-bell";


export function SiteHeader() {
  const { user, loading } = useAuth();
  const { isStaff, isAdmin } = useRoles();
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
          <BrandLogo />
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
          {!loading && user ? (
            <>
              {isStaff && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin">
                    <ShieldCheck /> Staff
                  </Link>
                </Button>
              )}
              {isAdmin && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/users">
                    <Users /> Users
                  </Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link to="/documents">
                  <FileText /> Documents
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard">
                  <LayoutDashboard /> Dashboard
                </Link>
              </Button>
              <Button asChild variant="hero" size="sm">
                <Link to="/order">Start an order</Link>
              </Button>
              <NotificationBell />
              <Button asChild variant="ghost" size="icon" aria-label="Settings">
                <Link to="/settings">
                  <Settings />
                </Link>
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