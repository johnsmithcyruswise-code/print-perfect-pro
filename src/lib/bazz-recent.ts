export type RecentPrint = { number: string; file: string; at: number; blob?: Blob; preview?: string };
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('bazz-phone-files', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files', { keyPath: 'number' });
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
}
export async function readRecent(): Promise<RecentPrint[]> {
  const db = await database();
  try { return await new Promise((resolve, reject) => {
    const request = db.transaction('files').objectStore('files').getAll();
    request.onsuccess = () => resolve((request.result as RecentPrint[]).sort((a, b) => b.at - a.at).slice(0, 5)); request.onerror = () => reject(request.error);
  }); } finally { db.close(); }
}
export async function saveRecent(entry: RecentPrint): Promise<void> {
  const db = await database();
  try { await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite'); const store = tx.objectStore('files'); store.put(entry);
    const request = store.getAll(); request.onsuccess = () => {
      const entries = (request.result as RecentPrint[]).sort((a, b) => b.at - a.at);
      for (const old of entries.slice(5)) store.delete(old.number);
    };
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
  }); } finally { db.close(); }
}