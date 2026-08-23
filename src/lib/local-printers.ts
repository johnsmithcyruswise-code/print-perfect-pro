export type DetectedPrinter = {
  id: string;
  name: string;
  model: string;
  type: "USB" | "Bluetooth";
  status: string;
};

export const PRINTER_USB_CLASS = 7; // USB printer device class

export function localScanSupported() {
  if (typeof navigator === "undefined") return { usb: false, bluetooth: false };
  return {
    usb: "usb" in navigator,
    bluetooth: "bluetooth" in navigator,
  };
}

type UsbLike = {
  requestDevice: (o: unknown) => Promise<{
    productName?: string;
    manufacturerName?: string;
    serialNumber?: string;
    opened?: boolean;
  }>;
  getDevices?: () => Promise<
    { productName?: string; manufacturerName?: string; serialNumber?: string; opened?: boolean }[]
  >;
};

export async function listPairedUsbPrinters(): Promise<DetectedPrinter[]> {
  const usb = (navigator as unknown as { usb?: UsbLike }).usb;
  if (!usb?.getDevices) return [];
  const devices = await usb.getDevices();
  return devices.map((d, i) => ({
    id: d.serialNumber ?? `usb-${i}`,
    name: d.productName ?? "USB printer",
    model: [d.manufacturerName, d.productName].filter(Boolean).join(" ") || "USB device",
    type: "USB" as const,
    status: d.opened ? "Busy" : "Online",
  }));
}

export async function requestUsbPrinter(): Promise<DetectedPrinter> {
  const usb = (navigator as unknown as { usb?: UsbLike }).usb;
  if (!usb) throw new Error("WebUSB unavailable");
  const device = await usb.requestDevice({ filters: [{ classCode: PRINTER_USB_CLASS }, {}] });
  return {
    id: device.serialNumber ?? `usb-${device.productName ?? "device"}`,
    name: device.productName ?? "USB printer",
    model:
      [device.manufacturerName, device.productName].filter(Boolean).join(" ") || "USB device",
    type: "USB",
    status: "Online",
  };
}

export async function requestBluetoothPrinter(): Promise<DetectedPrinter> {
  const bluetooth = (
    navigator as unknown as {
      bluetooth?: {
        requestDevice: (o: unknown) => Promise<{ id?: string; name?: string }>;
      };
    }
  ).bluetooth;
  if (!bluetooth) throw new Error("Web Bluetooth unavailable");
  const device = await bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: ["000018f0-0000-1000-8000-00805f9b34fb"],
  });
  return {
    id: device.id ?? `bt-${device.name ?? "device"}`,
    name: device.name ?? "Bluetooth printer",
    model: device.name ?? "Bluetooth device",
    type: "Bluetooth",
    status: "Online",
  };
}
