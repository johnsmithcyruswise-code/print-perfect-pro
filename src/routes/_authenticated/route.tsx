import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const STAFF_PREFIXES = ["/admin", "/users", "/printers"];

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      const staffArea = STAFF_PREFIXES.some((p) => location.pathname.startsWith(p));
      throw redirect({ to: staffArea ? "/admin/login" : "/auth" });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
