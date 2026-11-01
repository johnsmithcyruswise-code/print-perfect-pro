import { supabase } from "@/integrations/supabase/client";

export async function connectPrintStation() {
  const { default: qz } = await import("qz-tray");
  if (!qz.websocket.isActive()) await qz.websocket.connect();
  return await qz.printers.find();
}

export async function printCustomerFile(order: { file_path: string; content_type: string; quantity: number; paper_size: string; color_mode: string }, printer: string) {
  const { default: qz } = await import("qz-tray");
  if (!qz.websocket.isActive()) await qz.websocket.connect();
  const { data, error } = await supabase.storage.from("print-files").download(order.file_path);
  if (error || !data) throw new Error("Cannot load this file.");
  const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1] ?? ""); reader.onerror = reject; reader.readAsDataURL(data); });
  const config = qz.configs.create(printer, { copies: order.quantity, size: order.paper_size === "A3" ? { width: 297, height: 420 } : { width: 210, height: 297 }, units: "mm", colorType: order.color_mode === "bw" ? "grayscale" : "color" });
  await qz.print(config, [{ type: "pixel", format: order.content_type === "application/pdf" ? "pdf" : "image", flavor: "base64", data: base64 }]);
}