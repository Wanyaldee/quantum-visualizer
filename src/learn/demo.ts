import { ANNEAL_PRESETS } from "../presets/problems";
import {
  evolve,
  groundIndices,
  levelPopulations,
  narrowestGap,
  quboEnergies,
  rescale,
  spectrum,
} from "../quantum/anneal";
import { simulateSteps, type Gate, type State } from "../quantum/gate";

// Small fixed examples shared by the slide decks (basics page and the two labs' guides).

export const h = (q: number): Gate => ({ gate: "h", qubits: [q] });
export const x = (q: number): Gate => ({ gate: "x", qubits: [q] });
export const z = (q: number): Gate => ({ gate: "z", qubits: [q] });
export const s = (q: number): Gate => ({ gate: "s", qubits: [q] });
export const cx = (c: number, t: number): Gate => ({ gate: "cx", qubits: [c, t] });
export const cz = (a: number, b: number): Gate => ({ gate: "cz", qubits: [a, b] });

/** State after running `gates` from |0…0⟩. */
export const run = (n: number, gates: Gate[]): State => simulateSteps(n, gates)[gates.length];

export const POINTS = 101;

/** The 4-node MaxCut preset, annealed slowly (T = 20) and in a hurry (T = 1). */
export function maxcutDemo() {
  const problem = ANNEAL_PRESETS.find((p) => p.id === "maxcut") ?? ANNEAL_PRESETS[0];
  const raw = quboEnergies(problem.n, problem.terms);
  const ground = new Set(groundIndices(raw));
  const ep = rescale(raw, problem.n);
  const sp = spectrum(problem.n, ep, POINTS);
  const withPops = (snaps: ReturnType<typeof evolve>) => ({
    snaps,
    pops: sp.map((pt, j) => levelPopulations(pt, snaps[j])),
    probs: (k: number) => Float64Array.from(snaps[k].re, (r, i) => r * r + snaps[k].im[i] ** 2),
  });
  return {
    problem,
    raw,
    ground,
    ep,
    sp,
    gapK: narrowestGap(sp, ground.size).k,
    slow: withPops(evolve(problem.n, ep, 20, POINTS)),
    fast: withPops(evolve(problem.n, ep, 1, POINTS)),
  };
}
