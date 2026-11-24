/** Returns ids present in `next` but not in `known`. */
export function findNewIds(known: Set<string>, next: string[]): string[] {
  return next.filter((id) => !known.has(id));
}

/** Plays a short two-tone chime using the browser's audio engine. */
export function playNewJobChime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      const t = ctx.currentTime + i * 0.22;
      osc.frequency.value = freq; osc.type = "sine";
      gain.gain.setValueAtTime(0.0001, t); gain.gain.exponentialRampToValueAtTime(0.4, t + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(gain).connect(ctx.destination); osc.start(t); osc.stop(t + 0.55);
    });
    setTimeout(() => void ctx.close(), 1500);
  } catch { /* audio unavailable */ }
}
