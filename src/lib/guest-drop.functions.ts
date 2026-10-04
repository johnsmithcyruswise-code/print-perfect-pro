import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Walk-in files are filed under the shop owner's account in a "Walk-in drops" folder.
const SHOP_OWNER_ID = "873c60cd-fca0-45d9-83bd-da2917310c90";

export const guestDrop = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        name: z.string().trim().min(1).max(60),
        phone: z.string().trim().min(7).max(20),
        fileName: z.string().min(1).max(200),
        contentType: z.string().max(100),
        base64: z.string().max(28_000_000), // ~20MB
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = String(Math.floor(Math.random() * 90) + 10);
    const safe = data.fileName.replace(/[^\w.\-]+/g, "_");
    const path = `${SHOP_OWNER_ID}/walkin/${Date.now()}-${safe}`;
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    const up = await supabaseAdmin.storage
      .from("print-files")
      .upload(path, bytes, { contentType: data.contentType || "application/octet-stream" });
    if (up.error) throw new Error("Upload failed, please try again.");

    let { data: folder } = await supabaseAdmin
      .from("folders")
      .select("id")
      .eq("user_id", SHOP_OWNER_ID)
      .eq("name", "Walk-in drops")
      .maybeSingle();
    if (!folder) {
      const r = await supabaseAdmin
        .from("folders")
        .insert({ user_id: SHOP_OWNER_ID, name: "Walk-in drops" })
        .select("id")
        .single();
      folder = r.data;
    }
    const { error } = await supabaseAdmin.from("files").insert({
      user_id: SHOP_OWNER_ID,
      folder_id: folder?.id ?? null,
      name: `#${code} ${data.name} (${data.phone}) - ${data.fileName}`,
      url: path,
      size: bytes.length,
      type: data.contentType,
    });
    if (error) throw new Error("Could not notify the shop.");
    return { code };
  });
