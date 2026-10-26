// Variational quantum eigensolver, small enough to run (and replay step by step) in the
// browser. Mirrors blueqat's run_vqe inputs: a Hamiltonian as a sum of Pauli strings and a
// hardware-efficient ansatz of RY layers joined by CZ chains.
import { eigSym } from "./anneal";
import { applyGate, zeroState, type Gate, type State } from "./gate";

export type PauliOp = "X" | "Y" | "Z";

/** One term of run_vqe's `hamiltonian`: coeff × (product of Paulis on distinct qubits). */
export interface PauliTerm {
  coeff: number;
  paulis: { op: PauliOp; qubit: number }[];
}

/** P|ψ⟩ for one Pauli string (coefficient not applied). Index bit q is qubit q. */
export function applyPauli(s: State, term: PauliTerm): State {
  const size = s.re.length;
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    let j = i;
    // Phase picked up by |i⟩, as (pr + i·pi).
    let pr = 1;
    let pi = 0;
    for (const { op, qubit } of term.paulis) {
      const bit = (i >> qubit) & 1;
      if (op !== "Z") j ^= 1 << qubit;
      if (op === "Z" && bit) [pr, pi] = [-pr, -pi];
      // Y|0⟩ = i|1⟩, Y|1⟩ = −i|0⟩
      if (op === "Y") [pr, pi] = bit ? [pi, -pr] : [-pi, pr];
    }
    re[j] += pr * s.re[i] - pi * s.im[i];
    im[j] += pr * s.im[i] + pi * s.re[i];
  }
  return { re, im };
}

/** The Hamiltonian as a dense Hermitian matrix, split into real and imaginary parts. */
export interface Hamiltonian {
  n: number;
  re: Float64Array;
  im: Float64Array;
}

export function hamiltonian(n: number, terms: PauliTerm[]): Hamiltonian {
  const size = 1 << n;
  const re = new Float64Array(size * size);
  const im = new Float64Array(size * size);
  for (let c = 0; c < size; c++) {
    const basis: State = { re: new Float64Array(size), im: new Float64Array(size) };
    basis.re[c] = 1;
    for (const t of terms) {
      const col = applyPauli(basis, t);
      for (let r = 0; r < size; r++) {
        re[r * size + c] += t.coeff * col.re[r];
        im[r * size + c] += t.coeff * col.im[r];
      }
    }
  }
  return { n, re, im };
}

/** ⟨ψ|H|ψ⟩: the average energy you would get by measuring this state many times. */
export function expectation(h: Hamiltonian, s: State): number {
  const size = 1 << h.n;
  let e = 0;
  for (let r = 0; r < size; r++) {
    let hr = 0;
    let hi = 0;
    for (let c = 0; c < size; c++) {
      const k = r * size + c;
      hr += h.re[k] * s.re[c] - h.im[k] * s.im[c];
      hi += h.re[k] * s.im[c] + h.im[k] * s.re[c];
    }
    e += s.re[r] * hr + s.im[r] * hi;
  }
  return e;
}

/**
 * All energy levels, lowest first. A Hermitian H = A + iB has the same eigenvalues as the
 * real symmetric [[A, −B], [B, A]], each twice, so the anneal module's solver is enough.
 */
export function energyLevels(h: Hamiltonian): number[] {
  const size = 1 << h.n;
  const d = 2 * size;
  const m = new Float64Array(d * d);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const a = h.re[r * size + c];
      const b = h.im[r * size + c];
      m[r * d + c] = a;
      m[(r + size) * d + c + size] = a;
      m[r * d + c + size] = -b;
      m[(r + size) * d + c] = b;
    }
  }
  const vals = [...eigSym(m, d).vals].sort((x, y) => x - y);
  return vals.filter((_, k) => k % 2 === 0);
}

/** Energy of one basis state given as a q0-first bitstring, e.g. a Hartree-Fock reference. */
export function basisEnergy(h: Hamiltonian, bits: string): number {
  const size = 1 << h.n;
  const i = bits.split("").reduce((acc, b, q) => acc | (b === "1" ? 1 << q : 0), 0);
  return h.re[i * size + i];
}

export const paramCount = (n: number, layers: number): number => n * (layers + 1);

/** RY on every qubit, then a CZ chain, `layers` times, ending with one more RY layer. */
export function ansatz(n: number, layers: number, params: readonly number[]): Gate[] {
  const gates: Gate[] = [];
  for (let l = 0; l <= layers; l++) {
    for (let q = 0; q < n; q++)
      gates.push({ gate: "ry", qubits: [q], params: [params[l * n + q]] });
    if (l < layers) for (let q = 0; q + 1 < n; q++) gates.push({ gate: "cz", qubits: [q, q + 1] });
  }
  return gates;
}

export const prepare = (n: number, layers: number, params: readonly number[]): State =>
  ansatz(n, layers, params).reduce(applyGate, zeroState(n));

/** Random starting angles in [−π, π), reproducible from `seed`. */
export function startingParams(count: number, seed: number): number[] {
  let r = seed;
  const next = () => {
    r = (r * 1103515245 + 12345) % 2 ** 31;
    return r / 2 ** 31;
  };
  return Array.from({ length: count }, () => (next() - 0.5) * 2 * Math.PI);
}

export interface VqeStep {
  params: number[];
  energy: number;
}

/**
 * The ansatz's energy without going through `prepare`. RY and CZ keep every amplitude real,
 * so the state fits in one array updated in place, and ⟨ψ|H|ψ⟩ needs only H's real part
 * (the imaginary part is antisymmetric and cancels). Replaying H2 needs ~25 000 of these,
 * which is what makes the general path too slow to run while the page waits.
 */
export function ansatzEnergy(h: Hamiltonian, layers: number, params: readonly number[]): number {
  const { n } = h;
  const size = 1 << n;
  const v = new Float64Array(size);
  v[0] = 1;
  for (let l = 0; l <= layers; l++) {
    for (let q = 0; q < n; q++) {
      const c = Math.cos(params[l * n + q] / 2);
      const s = Math.sin(params[l * n + q] / 2);
      const bit = 1 << q;
      for (let i = 0; i < size; i++) {
        if (i & bit) continue;
        const a = v[i];
        const b = v[i | bit];
        v[i] = c * a - s * b;
        v[i | bit] = s * a + c * b;
      }
    }
    if (l === layers) break;
    for (let q = 0; q + 1 < n; q++) {
      const both = (1 << q) | (1 << (q + 1));
      for (let i = 0; i < size; i++) if ((i & both) === both) v[i] = -v[i];
    }
  }
  let e = 0;
  for (let r = 0; r < size; r++) {
    let row = 0;
    for (let c = 0; c < size; c++) row += h.re[r * size + c] * v[c];
    e += v[r] * row;
  }
  return e;
}

/**
 * Gradient descent with the parameter-shift rule: for each knob, measure the energy with
 * the knob turned a quarter turn each way, and the difference says which way is downhill.
 * Returns every step (index 0 = the starting point) so the run can be replayed.
 */
export function descend(
  h: Hamiltonian,
  layers: number,
  start: readonly number[],
  rate: number,
  steps: number,
): VqeStep[] {
  const energy = (p: readonly number[]) => ansatzEnergy(h, layers, p);
  const shifted = (p: readonly number[], i: number, d: number) =>
    p.map((v, k) => (k === i ? v + d : v));
  const trace: VqeStep[] = [{ params: [...start], energy: energy(start) }];
  for (let s = 0; s < steps; s++) {
    const { params } = trace[trace.length - 1];
    const grad = params.map(
      (_, i) =>
        (energy(shifted(params, i, Math.PI / 2)) - energy(shifted(params, i, -Math.PI / 2))) / 2,
    );
    const next = params.map((v, i) => v - rate * grad[i]);
    trace.push({ params: next, energy: energy(next) });
  }
  return trace;
}
