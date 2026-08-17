import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BOOTSTRAP_ADMINS = ["mzedi2012@gmail.com"];

export type AdminUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
  location_consent: boolean;
  last_lat: number | null;
  last_lng: number | null;
  last_location_accuracy: number | null;
  last_location_at: string | null;
  last_sign_in_ip: string | null;
  orders: number;
};

type ProfileInput = {
  full_name?: string | null;
  phone?: string | null;
  location?: { lat: number; lng: number; accuracy?: number | null } | null;
  location_consent?: boolean;
};

/** Upsert the signed-in user's profile (and bootstrap the owner admin account). */
export const syncMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ProfileInput) => input ?? {})
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const email = (claims as { email?: string }).email ?? null;

    const patch: Record<string, unknown> = { id: userId, email };
    if (data.full_name !== undefined) patch['full_name'] = data.full_name;
    if (data.phone !== undefined) patch['phone'] = data.phone;
    if (data.location_consent !== undefined) patch['location_consent'] = data.location_consent;
    if (data.location) {
      patch['last_lat'] = data.location.lat;
      patch['last_lng'] = data.location.lng;
      patch['last_location_accuracy'] = data.location.accuracy ?? null;
      patch['last_location_at'] = new Date().toISOString();
      patch['location_consent'] = true;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert(patch as never, { onConflict: "id" });
    if (error) throw new Error(error.message);

    if (email && BOOTSTRAP_ADMINS.includes(email.toLowerCase())) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    }
    return { ok: true };
  });

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const listAppUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUser[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    if (error) throw new Error(error.message);

    const [{ data: profiles }, { data: roles }, { data: orders }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("orders").select("user_id"),
    ]);

    const pById = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    return authUsers.users.map((u) => {
      const p: any = pById.get(u.id) ?? {};
      return {
        id: u.id,
        email: u.email ?? null,
        full_name: p.full_name ?? (u.user_metadata as any)?.full_name ?? null,
        phone: p.phone ?? u.phone ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        roles: (roles ?? []).filter((r: any) => r.user_id === u.id).map((r: any) => r.role),
        location_consent: !!p.location_consent,
        last_lat: p.last_lat ?? null,
        last_lng: p.last_lng ?? null,
        last_location_accuracy: p.last_location_accuracy ?? null,
        last_location_at: p.last_location_at ?? null,
        last_sign_in_ip: (u as any).last_sign_in_ip ?? null,
        orders: (orders ?? []).filter((o: any) => o.user_id === u.id).length,
      };
    });
  });

export const deleteAppUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => {
    if (!input?.userId) throw new Error("userId is required");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("You cannot delete your own account.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; role: string; grant: boolean }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.role as any }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role as any);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
