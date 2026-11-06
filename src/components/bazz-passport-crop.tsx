import { useState } from 'react';
import Cropper from 'react-easy-crop';
import { ZoomIn } from 'lucide-react';
import type { PhotoCrop } from '@/lib/bazz-photo';

export function BazzPassportCrop({ source, onCrop }: { source: string; onCrop: (crop: PhotoCrop) => void }) {
  const [position, setPosition] = useState({ x: 0, y: 0 }); const [zoom, setZoom] = useState(1);
  return <div className="mb-6"><div className="relative h-80 overflow-hidden rounded-lg bg-photo-paper"><Cropper image={source} crop={position} zoom={zoom} aspect={35 / 45} onCropChange={setPosition} onZoomChange={setZoom} onCropComplete={(_area, pixels) => onCrop(pixels)} /></div><label className="mt-4 flex items-center gap-4"><ZoomIn className="size-5 shrink-0 text-primary" /><input aria-label="Photo zoom" type="range" min={1} max={3} step={0.05} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="h-10 w-full accent-primary" /></label><p className="text-center text-sm text-muted-foreground">35 × 45 mm</p></div>;
}