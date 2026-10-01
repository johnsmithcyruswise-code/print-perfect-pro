import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Customer = { id: string; full_name: string | null; phone: string | null; email: string | null };

/** Staff-only: map of user id → customer profile (RLS lets staff read all profiles). */
export function useCustomers() {
  const { data } = useQuery({
    queryKey: ["customer-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, phone, email");
      if (error) throw error;
      return new Map((data ?? []).map((p) => [p.id, p as Customer]));
    },
    staleTime: 60_000,
  });
  return data ?? new Map<string, Customer>();
}

export function customerLabel(c?: Customer) {
  return c?.full_name || c?.email || "Unknown customer";
}
