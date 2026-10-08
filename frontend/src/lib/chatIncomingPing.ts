let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!sharedCtx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      sharedCtx = new AC();
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

/** Call after a user gesture so incoming pings are not blocked by autoplay policy. */
export function primeChatIncomingAudio(): void {
  const ctx = getCtx();
  if (!ctx || ctx.state !== "suspended") return;
  void ctx.resume().catch(() => {});
}

function beep(ctx: AudioContext, start: number, freq: number, duration: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.07, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Short two-tone ping when someone sends you a direct message. */
export function playChatIncomingPing(): void {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  const t = ctx.currentTime;
  try {
    beep(ctx, t, 880, 0.1);
    beep(ctx, t + 0.12, 660, 0.14);
  } catch {
    /* ignore */
  }
}
