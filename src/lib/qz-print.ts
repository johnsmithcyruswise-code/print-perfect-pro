import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

let qzModule: typeof import("qz-tray") | null = null;
let qzConnected = false;

export function isQZAvailable() {
  return typeof window !== "undefined";
}

async function getQz(): Promise<typeof import("qz-tray")> {
  if (qzModule) return qzModule;
  const mod = await import("qz-tray");
  qzModule = mod;
  return mod;
}

export async function ensureQZConnected(): Promise<boolean> {
  if (!isQZAvailable()) return false;
  if (qzConnected) return true;
  const qz = await getQz();
  try {
    await qz.websocket.connect();
    qzConnected = true;
    return true;
  } catch {
    return false;
  }
}

export async function disconnectQZ() {
  const qz = await getQz().catch(() => null);
  if (!qz || !qzConnected) return;
  try {
    await qz.websocket.disconnect();
  } finally {
    qzConnected = false;
  }
}

export async function findDefaultPrinter(): Promise<string | null> {
  const qz = await getQz();
  try {
    const printers = await qz.printers.find();
    return (printers && printers[0]) || null;
  } catch {
    return null;
  }
}

function orderTicketHtml(order: Order): string {
  const lines = [
    "<h2>Planned Kid Computer Services — Order Ticket</h2>",
    `<p><strong>Order #:</strong> ${order.order_number}</p>`,
    `<p><strong>Type:</strong> ${order.order_type}</p>`,
    `<p><strong>Status:</strong> ${order.status}</p>`,
    `<p><strong>Qty:</strong> ${order.quantity}</p>`,
    `<p><strong>Paper:</strong> ${order.paper_size} — ${order.paper_type}</p>`,
    `<p><strong>Color:</strong> ${order.color_mode}</p>`,
    `<p><strong>Sides:</strong> ${order.sides}</p>`,
    `<p><strong>Binding:</strong> ${order.binding}</p>`,
    `<p><strong>Turnaround:</strong> ${order.turnaround}</p>`,
    order.staff_price ? `<p><strong>Quote:</strong> UGX ${order.staff_price}</p>` : "",
    order.staff_notes ? `<p><strong>Notes:</strong> ${order.staff_notes}</p>` : "",
    `<p style="font-size:10px;color:#666">Printed ${new Date().toLocaleString()}</p>`,
  ];
  return `<div style="font-family:sans-serif;padding:16px;max-width:400px">${lines.join("")}</div>`;
}

export async function printOrderTicket(order: Order, operatorId: string): Promise<{ ok: boolean; fallback: boolean; message: string }> {
  const printerName = await findDefaultPrinter();
  const qz = await getQz();
  if (!qzConnected) {
    const ok = await ensureQZConnected();
    if (!ok) {
      return await fallbackPrint(order);
    }
  }

  const printer = printerName || (await findDefaultPrinter());
  const config = qz.configs.create(printer || undefined);

  try {
    await qz.print(config, [
      { type: "html", format: "plain", data: orderTicketHtml(order) },
    ]);

    await logPrint(order, operatorId, printer || "default", "success");
    return { ok: true, fallback: false, message: `Sent to ${printer || "default printer"}` };
  } catch (err) {
    await logPrint(order, operatorId, printer || "default", "failed", err instanceof Error ? err.message : String(err));
    return await fallbackPrint(order);
  }
}

async function fallbackPrint(order: Order): Promise<{ ok: boolean; fallback: boolean; message: string }> {
  const html = `
    <html>
      <head><title>Order ${order.order_number}</title></head>
      <body onload="setTimeout(()=>{window.print();window.close();},300)">
        ${orderTicketHtml(order)}
      </body>
    </html>
  `;
  const w = window.open("", "_blank", "width=600,height=700");
  if (!w) {
    return { ok: false, fallback: true, message: "Popup blocked. Please allow popups for this site." };
  }
  w.document.write(html);
  w.document.close();
  return { ok: true, fallback: true, message: "Opened print dialog as fallback." };
}

async function logPrint(
  order: Order,
  operatorId: string,
  printerName: string,
  status: "success" | "failed",
  note?: string,
) {
  const { error } = await supabase.from("print_logs").insert({
    order_id: order.id,
    operator_id: operatorId,
    printer_name: printerName,
    status,
    pages_printed: 0,
    note: note || undefined,
  });
  if (error) console.error("[print log]", error);
}
