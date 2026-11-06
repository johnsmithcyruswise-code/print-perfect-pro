export const PASSPORT_PHOTO = { widthMm: 35, heightMm: 45, widthPx: 413, heightPx: 531 } as const;
export type PhotoCrop = { x: number; y: number; width: number; height: number };

export async function loadPhoto(source: string): Promise<HTMLImageElement> {
  const image = new Image(); image.src = source; await image.decode(); return image;
}

export async function preparePortrait(file: File, progress: (message: string) => void): Promise<string> {
  const source = URL.createObjectURL(file);
  try {
    const image = await loadPhoto(source);
    const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas'); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Photo could not be opened.');
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Photo could not be opened.')), 'image/png'));
    progress('Making background white…');
    const { removeBackground } = await import('@imgly/background-removal');
    const cutout = await removeBackground(blob, { model: 'isnet_quint8', device: 'cpu', proxyToWorker: false, progress: (_key, current, total) => { if (current < total) progress('Loading photo tool…'); } });
    return URL.createObjectURL(cutout);
  } finally { URL.revokeObjectURL(source); }
}

export async function passportSheet(source: string, crop: PhotoCrop, count: number): Promise<{ file: File; preview: string }> {
  const image = await loadPhoto(source);
  const canvas = document.createElement('canvas'); canvas.width = PASSPORT_PHOTO.widthPx; canvas.height = PASSPORT_PHOTO.heightPx;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Photo could not be prepared.');
  // White is a physical photo background, independent of the interface theme.
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
  const preview = canvas.toDataURL('image/jpeg', 0.95);
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  for (let i = 0; i < count; i++) pdf.addImage(preview, 'JPEG', 12 + (i % 4) * 40, 12 + Math.floor(i / 4) * 50, PASSPORT_PHOTO.widthMm, PASSPORT_PHOTO.heightMm);
  return { file: new File([pdf.output('blob')], 'Passport-photos-35x45mm.pdf', { type: 'application/pdf' }), preview };
}