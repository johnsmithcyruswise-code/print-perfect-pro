import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { customerFolder, guestPrintSchema, MAX_PRINT_BYTES, validPrintSignature } from "./bazz-print";

export const sendGuestPrint = createServerFn({ method: "POST" })
  .inputValidator((input) => guestPrintSchema.parse(input))
  .handler(async ({ data }) => {
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    if (bytes.length > MAX_PRINT_BYTES || !validPrintSignature(bytes, data.contentType)) throw new Error("Choose a PDF, JPG or PNG under 10 MB.");
    // This is an intentionally public submission endpoint. No read/admin access is exposed.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const phone = data.phone.replace(/[^\d+]/g, "");
    const { count, error: limitError } = await supabaseAdmin.from("guest_print_orders").select("id", { count: "exact", head: true }).eq("customer_phone", phone).gte("created_at", new Date(Date.now() - 60_000).toISOString());
    if (limitError) throw new Error("The shop is unavailable. Please try again.");
    if ((count ?? 0) >= 5) throw new Error("Please wait a minute before sending another file.");
    const path = `customers/${customerFolder(data.name, phone)}/${crypto.randomUUID()}/${data.fileName.replace(/[^\w.\-]/g, "_")}`;
    const upload = await supabaseAdmin.storage.from("print-files").upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (upload.error) throw new Error("File could not be sent. Please try again.");
    const { data: order, error } = await supabaseAdmin.from("guest_print_orders").insert({ customer_name: data.name, customer_phone: phone, file_name: data.fileName, file_path: path, content_type: data.contentType, paper_size: data.paperSize, color_mode: data.colorMode, quantity: data.quantity, message: data.message || null }).select("order_number").single();
    if (error || !order) {
      await supabaseAdmin.storage.from("print-files").remove([path]);
      throw new Error("Order could not be saved. Please try again.");
    }
    return { orderNumber: order.order_number };
  });

export const listGuestPrints = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: staff, error: roleError } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (roleError || !staff) throw new Error("Staff access only.");
    const { data, error } = await context.supabase.from("guest_print_orders").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) throw new Error("Orders could not be loaded.");
    return data;
  });