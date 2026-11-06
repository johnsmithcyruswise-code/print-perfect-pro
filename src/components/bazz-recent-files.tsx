import { useEffect, useState } from 'react';
import { Download, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { RecentPrint } from '@/lib/bazz-recent';

function LocalPreview({ entry }: { entry: RecentPrint }) {
  const [url, setUrl] = useState('');
  useEffect(() => { if (!entry.blob) return; const next = URL.createObjectURL(entry.blob); setUrl(next); return () => URL.revokeObjectURL(next); }, [entry.blob]);
  if (entry.preview || entry.blob?.type.startsWith('image/')) return <img src={entry.preview || url} alt={entry.file} className="h-full w-full object-contain" />;
  return <FileText className="size-9 text-primary" />;
}
export function BazzRecentFiles({ entries }: { entries: RecentPrint[] }) {
  const [selected, setSelected] = useState<RecentPrint | null>(null); const [url, setUrl] = useState('');
  useEffect(() => { if (!selected?.blob) { setUrl(''); return; } const next = URL.createObjectURL(selected.blob); setUrl(next); return () => URL.revokeObjectURL(next); }, [selected]);
  if (!entries.length) return null;
  return <section className="mt-9 border-t pt-6"><h2 className="mb-4 text-xl font-bold">Your recent files</h2><ul className="space-y-3">{entries.map((entry) => <li key={entry.number}><Button variant="outline" disabled={!entry.blob} className="h-auto min-h-24 w-full justify-start gap-4 whitespace-normal p-3 text-left" onClick={() => setSelected(entry)}><span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted"><LocalPreview entry={entry} /></span><span className="min-w-0"><span className="block break-all font-bold">{entry.file}</span><span className="mt-1 block font-mono text-xs text-muted-foreground">{entry.number}</span></span></Button></li>)}</ul>
    <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}><DialogContent className="max-w-xl"><DialogTitle className="break-all pr-6">{selected?.file}</DialogTitle>{selected && <div className="flex h-80 items-center justify-center overflow-hidden rounded-md bg-muted">{selected.blob?.type === 'application/pdf' && !selected.preview ? <iframe title="Document preview" src={url} className="h-full w-full" /> : <LocalPreview entry={selected} />}</div>}<div className="flex gap-3"><Button asChild className="h-12 flex-1"><a href={url} download={selected?.file}><Download />Save file</a></Button><Button variant="outline" className="h-12" onClick={() => setSelected(null)}><X />Close</Button></div></DialogContent></Dialog>
  </section>;
}