export type OptionDef = { value: string; label: string; hint?: string; multiplier: number };

export const PAPER_SIZES: OptionDef[] = [
  { value: "A4", label: "A4", hint: "210 × 297 mm", multiplier: 1 },
  { value: "A3", label: "A3", hint: "297 × 420 mm", multiplier: 1.8 },
  { value: "A2", label: "A2", hint: "420 × 594 mm", multiplier: 3.2 },
  { value: "A1", label: "A1", hint: "594 × 841 mm", multiplier: 5.5 },
  { value: "A0", label: "A0", hint: "841 × 1189 mm", multiplier: 9 },
  { value: "custom", label: "Custom", hint: "Enter dimensions", multiplier: 1 },
];

export const PAPER_TYPES: OptionDef[] = [
  { value: "glossy", label: "Glossy", multiplier: 1.15 },
  { value: "matte", label: "Matte", multiplier: 1 },
  { value: "premium-matte", label: "Premium Matte", multiplier: 1.4 },
  { value: "recycled", label: "Recycled", hint: "Lowest carbon footprint", multiplier: 0.9 },
  { value: "vinyl", label: "Vinyl", multiplier: 2.1 },
  { value: "canvas", label: "Canvas", multiplier: 2.8 },
];

export const COLOR_MODES: OptionDef[] = [
  { value: "full-color", label: "Full Color", multiplier: 1.6 },
  { value: "grayscale", label: "Grayscale", multiplier: 1.15 },
  { value: "bw", label: "Black & White", multiplier: 1 },
];

export const SIDES: OptionDef[] = [
  { value: "single", label: "Single-sided", multiplier: 1 },
  { value: "double", label: "Double-sided", multiplier: 1.7 },
];

export const BINDINGS: OptionDef[] = [
  { value: "none", label: "None", multiplier: 0 },
  { value: "stapled", label: "Stapled", multiplier: 0.5 },
  { value: "spiral", label: "Spiral", multiplier: 2 },
  { value: "perfect", label: "Perfect Bound", multiplier: 6 },
  { value: "laminated", label: "Laminated", multiplier: 3 },
];

export const TURNAROUNDS: OptionDef[] = [
  { value: "standard", label: "Standard", hint: "3–5 days", multiplier: 1 },
  { value: "express", label: "Express", hint: "24 hours", multiplier: 1.35 },
  { value: "rush", label: "Rush", hint: "4 hours", multiplier: 1.8 },
];

export const ADDONS: OptionDef[] = [
  { value: "lamination", label: "Lamination", multiplier: 1.2 },
  { value: "mounting", label: "Mounting", multiplier: 3.5 },
  { value: "framing", label: "Framing", multiplier: 12 },
  { value: "uv-coating", label: "UV Coating", multiplier: 1.8 },
];

export const ECO_SCORE: Record<string, string> = {
  recycled: "A – lowest footprint",
  matte: "B",
  "premium-matte": "B",
  glossy: "C",
  canvas: "C",
  vinyl: "D – highest footprint",
};

const BASE_UNIT = 0.35; // per A4 B&W single-sided page

export type Specs = {
  paperSize: string;
  customWidth?: number;
  customHeight?: number;
  paperType: string;
  colorMode: string;
  sides: string;
  binding: string;
  quantity: number;
  turnaround: string;
  addons: string[];
};

export const DEFAULT_SPECS: Specs = {
  paperSize: "A4",
  paperType: "matte",
  colorMode: "full-color",
  sides: "single",
  binding: "none",
  quantity: 50,
  turnaround: "standard",
  addons: [],
};

function mult(list: OptionDef[], value: string) {
  return list.find((o) => o.value === value)?.multiplier ?? 1;
}

export function bulkDiscount(quantity: number) {
  if (quantity >= 2500) return 0.65;
  if (quantity >= 1000) return 0.72;
  if (quantity >= 500) return 0.8;
  if (quantity >= 100) return 0.88;
  if (quantity >= 25) return 0.95;
  return 1;
}

export type Quote = {
  unitPrice: number;
  subtotal: number;
  discount: number;
  total: number;
  tier: number;
};

export function quote(specs: Specs, percentOff = 0): Quote {
  let sizeMult = mult(PAPER_SIZES, specs.paperSize);
  if (specs.paperSize === "custom" && specs.customWidth && specs.customHeight) {
    const area = (specs.customWidth * specs.customHeight) / (210 * 297);
    sizeMult = Math.max(0.5, area);
  }
  const perUnit =
    BASE_UNIT *
    sizeMult *
    mult(PAPER_TYPES, specs.paperType) *
    mult(COLOR_MODES, specs.colorMode) *
    mult(SIDES, specs.sides) *
    mult(TURNAROUNDS, specs.turnaround);

  const addonsPerUnit = specs.addons.reduce((sum, a) => sum + mult(ADDONS, a), 0);
  const tier = bulkDiscount(specs.quantity);
  const unitPrice = (perUnit + addonsPerUnit) * tier;
  const bindingCost = mult(BINDINGS, specs.binding) * Math.max(1, Math.ceil(specs.quantity / 50));
  const subtotal = unitPrice * specs.quantity + bindingCost;
  const discount = (subtotal * percentOff) / 100;

  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    unitPrice: round(unitPrice),
    subtotal: round(subtotal),
    discount: round(discount),
    total: round(subtotal - discount),
    tier,
  };
}

export const money = (n: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(n);

export const STATUS_FLOW = [
  "pending",
  "processing",
  "printing",
  "ready",
  "completed",
] as const;

export const STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  processing: "Processing",
  printing: "Printing",
  qa: "Quality check",
  ready: "Ready for pickup",
  completed: "Completed",
  shipped: "Collected",
  cancelled: "Cancelled",
};

export const STORE = {
  name: "Planned Kid Computer Services",
  address: "Moi Avenue, PK Plaza, Nairobi CBD, Kenya",
  phone: "+254 700 000 000",
  hours: "Mon–Sat · 8:00 – 19:00",
};