import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type AppRole = "admin" | "manager" | "operator" | "csr" | "customer";
const STAFF: AppRole[] = ["admin", "manager", "operator", "csr"];

export function useRoles() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data.map((r) => r.role as AppRole);
    },
  });
  const roles = data ?? [];
  return {
    roles,
    loading: isLoading,
    isStaff: roles.some((r) => STAFF.includes(r)),
    isAdmin: roles.includes("admin"),
  };
}
