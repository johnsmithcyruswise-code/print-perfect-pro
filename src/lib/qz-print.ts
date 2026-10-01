import { supabase } from "@/integrations/supabase/client";

export type OrderTicket = {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  order_type: string;
  quantity: number;
  paper_size: string;
  paper_type: string;
  color_mode: string;
  sides: string;
  binding: string;
  turnaround: string;
  staff_price?: number | null;
  staff_notes?: string | null;
  customer_notes?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
};

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

async function withCustomer(order: OrderTicket): Promise<OrderTicket> {
  if (order.customer_name || order.customer_phone) return order;
  const { data } = await supabase
    .from("profiles")
    .select("full_name, phone, email")
    .eq("id", order.user_id)
    .maybeSingle();
  return { ...order, customer_name: data?.full_name, customer_phone: data?.phone, customer_email: data?.email };
}

let qzModule: any = null;
let qzConnected = false;

export function isQZAvailable() {
  return typeof window !== "undefined";
}

async function getQz(): Promise<any> {
  if (qzModule) return qzModule;
  const mod: any = await import("qz-tray");
  qzModule = mod.default ?? mod;
  return qzModule;
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

function orderTicketHtml(order: OrderTicket): string {
  const lines = [
    "<p style=\"font-size:11px;color:#666;margin:0\">Planned Kid Computer Services</p>",
    `<h1 style="font-size:26px;margin:4px 0">${esc(order.customer_name || order.customer_email || "Customer")}</h1>`,
    order.customer_phone ? `<p style="font-size:18px;margin:0 0 8px"><strong>Tel:</strong> ${esc(order.customer_phone)}</p>` : "",
    order.customer_email && order.customer_name ? `<p style="margin:0 0 8px">${esc(order.customer_email)}</p>` : "",
    "<hr/>",
    `<p><strong>Type:</strong> ${order.order_type}</p>`,
    `<p><strong>Status:</strong> ${order.status}</p>`,
    `<p><strong>Qty:</strong> ${order.quantity}</p>`,
    `<p><strong>Paper:</strong> ${order.paper_size} — ${order.paper_type}</p>`,
    `<p><strong>Color:</strong> ${order.color_mode}</p>`,
    `<p><strong>Sides:</strong> ${order.sides}</p>`,
    `<p><strong>Binding:</strong> ${order.binding}</p>`,
    `<p><strong>Turnaround:</strong> ${order.turnaround}</p>`,
    order.customer_notes ? `<p><strong>Customer says:</strong> ${esc(order.customer_notes)}</p>` : "",
    order.staff_notes ? `<p><strong>Notes:</strong> ${esc(order.staff_notes)}</p>` : "",
    `<p style="font-size:10px;color:#666">Ref ${esc(order.order_number)}</p>`,
    `<p style="font-size:10px;color:#666">Printed ${new Date().toLocaleString()}</p>`,
  ];
  return `<div style="font-family:sans-serif;padding:16px;max-width:400px">${lines.join("")}</div>`;
}

export async function printOrderTicket(
  order: OrderTicket,
  operatorId: string,
): Promise<{ ok: boolean; fallback: boolean; message: string }> {
  order = await withCustomer(order);
  if (!isQZAvailable()) return await fallbackPrint(order);

  const qz = await getQz();
  let printerName: string | null = null;

  if (!qzConnected) {
    const ok = await ensureQZConnected();
    if (!ok) return await fallbackPrint(order);
  }

  printerName = await findDefaultPrinter();
  const config = qz.configs.create(printerName || undefined);

  try {
    await qz.print(config, [{ type: "html", format: "plain", data: orderTicketHtml(order) }]);
    await logPrint(order, operatorId, printerName || "default", "success");
    return { ok: true, fallback: false, message: `Sent to ${printerName || "default printer"}` };
  } catch (err) {
    await logPrint(order, operatorId, printerName || "default", "failed");
    return await fallbackPrint(order);
  }
}

async function fallbackPrint(order: OrderTicket): Promise<{ ok: boolean; fallback: boolean; message: string }> {
  const html = `
    <html>
      <head><title>${esc(order.customer_name || order.order_number)}</title></head>
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
  order: OrderTicket,
  operatorId: string,
  printerName: string,
  status: "success" | "failed",
) {
  const { error } = await supabase.from("print_logs").insert({
    order_id: order.id,
    operator_id: operatorId,
    printer_name: printerName,
    status,
    pages_printed: 0,
  });
  if (error) console.error("[print log]", error);
}
