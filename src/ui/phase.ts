// Phase is cyclic, so it gets a cyclic hue — the one place a hue wheel is the right encoding.
// Phase 0 (a positive real amplitude) lands on the --amp blue so "nothing interesting has
// happened" looks like the rest of the UI; phase π lands on the opposite hue. The dial needle
// encodes the same angle, so phase is never conveyed by color alone.
const HUE_AT_ZERO = 264;

export function phaseColor(re: number, im: number): string {
  const deg = (Math.atan2(im, re) * 180) / Math.PI;
  return `oklch(var(--phase-l) 0.16 ${(HUE_AT_ZERO + deg + 360) % 360})`;
}

export function formatPhase(re: number, im: number): string {
  const t = Math.atan2(im, re) / Math.PI;
  const r = Math.round(t * 4) / 4;
  if (Math.abs(t - r) > 0.01) return `${(t * 180).toFixed(0)}°`;
  const table: Record<string, string> = {
    "0": "0",
    "0.25": "π/4",
    "0.5": "π/2",
    "0.75": "3π/4",
    "1": "π",
    "-1": "π",
    "-0.25": "−π/4",
    "-0.5": "−π/2",
    "-0.75": "−3π/4",
  };
  return table[String(r)] ?? `${(t * 180).toFixed(0)}°`;
}

export const pct = (p: number) =>
  p >= 0.9995 ? "100%" : p < 0.0005 ? "0%" : `${(p * 100).toFixed(1)}%`;
