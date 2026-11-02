import { describe, expect, it } from "vitest";
import { customerFolder, guestPrintSchema, PRINT_STATUSES, printOptionsSchema, validPrintSignature } from "./bazz-print";
const options = { name: "Print Check", phone: "0770000000", paperSize: "A4", colorMode: "bw", quantity: 1 };
describe("Bazz print rules", () => {
  it("accepts name and phone without an account", () => { expect(printOptionsSchema.parse(options)).toEqual(options); });
  it("allows only A4 and A3", () => { expect(printOptionsSchema.safeParse({ ...options, paperSize: "A3" }).success).toBe(true); expect(printOptionsSchema.safeParse({ ...options, paperSize: "A5" }).success).toBe(false); });
  it("allows color or black and white", () => { expect(printOptionsSchema.safeParse({ ...options, colorMode: "color" }).success).toBe(true); expect(printOptionsSchema.safeParse({ ...options, colorMode: "other" }).success).toBe(false); });
  it("requires a positive whole number of copies", () => { expect(printOptionsSchema.safeParse({ ...options, quantity: 0 }).success).toBe(false); expect(printOptionsSchema.safeParse({ ...options, quantity: 1.5 }).success).toBe(false); });
  it("accepts PDF, JPG and PNG only", () => { for (const [fileName, contentType] of [["a.pdf", "application/pdf"], ["a.jpg", "image/jpeg"], ["a.png", "image/png"]]) expect(guestPrintSchema.safeParse({ ...options, fileName, contentType, base64: "AA==" }).success).toBe(true); expect(guestPrintSchema.safeParse({ ...options, fileName: "a.exe", contentType: "application/octet-stream", base64: "AA==" }).success).toBe(false); });
  it("rejects a disguised non-PDF", () => { expect(validPrintSignature(new TextEncoder().encode("not a PDF"), "application/pdf")).toBe(false); expect(validPrintSignature(new TextEncoder().encode("%PDF-1.4"), "application/pdf")).toBe(true); });
  it("has the four requested staff statuses", () => { expect(PRINT_STATUSES).toEqual(["new", "printing", "ready", "collected"]); });
  it("uses customer names while separating identical names by phone", () => { expect(customerFolder("John Smith", "0770000000")).toBe("John Smith-0770000000"); expect(customerFolder("John Smith", "0770000001")).not.toBe(customerFolder("John Smith", "0770000000")); });
});