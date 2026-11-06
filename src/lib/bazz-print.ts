import { z } from "zod";

export const PRINT_STATUSES = ["new", "printing", "ready", "collected"] as const;
export const STATUS_NAMES = { new: "New", printing: "Printing", ready: "Ready", collected: "Collected" };
export const MAX_PRINT_BYTES = 10 * 1024 * 1024;
export const printOptionsSchema = z.object({
  name: z.string().trim().min(1).max(60),
  phone: z.string().trim().regex(/^\+?[\d\s()-]{7,20}$/, "Enter a phone number"),
  paperSize: z.enum(["A4", "A3"]),
  colorMode: z.enum(["bw", "color"]),
  quantity: z.number().int().min(1).max(999),
});
export const guestPrintSchema = printOptionsSchema.extend({
  printKind: z.enum(["document", "passport"]).default("document"),
  photoCount: z.number().int().min(1).max(16).optional(),
  message: z.string().trim().max(500).optional(),
  fileName: z.string().min(1).max(200).regex(/\.(pdf|jpe?g|png)$/i),
  contentType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
  base64: z.string().min(1).max(Math.ceil(MAX_PRINT_BYTES / 3) * 4),
}).superRefine((data, ctx) => {
  if (data.printKind === "passport" && (data.contentType !== "application/pdf" || data.paperSize !== "A4" || data.colorMode !== "color" || data.quantity !== 1 || !data.photoCount)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Passport photos must be prepared as a color A4 PDF sheet." });
  }
});

export function validPrintSignature(bytes: Uint8Array, type: string): boolean {
  if (type === "application/pdf") return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  if (type === "image/jpeg") return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (type === "image/png") return [137,80,78,71,13,10,26,10].every((v, i) => bytes[i] === v);
  return false;
}

export function customerFolder(name: string, phone: string): string {
  return `${name.normalize("NFKC").replace(/[^\p{L}\p{N} -]/gu, "").trim().slice(0, 60) || "Customer"}-${phone.replace(/\D/g, "")}`;
}