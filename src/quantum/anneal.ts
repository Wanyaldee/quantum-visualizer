// Quantum annealing simulator for small problems (exact, noiseless).
//
// H(s) = -(1 - s) * Σ_q X_q  +  s * H_P,   s = t / T  (linear schedule)
//
// H_P is diagonal: H_P|x⟩ = E(x)|x⟩ where E is the QUBO cost of bitstring x. The QUBO uses
// the same term shape as blueqat MCP's run_qaoa ({"coeff": c, "qubits": [i]} / [i, j]) and
// the same bit order (qubit q = bit q of the basis index, q0 written first).
//
// E is rescaled to the range [0, n] before annealing. Without this, a QUBO with big penalty
// weights (example 14 uses ×10) would make the driver term negligible and every schedule
// would look identical; with it, the anneal time T means roughly the same thing for every
// problem. The rescale is a positive affine map, so the optimal bitstrings do not change.

export const MAX_SPINS = 6;

export interface QuboTerm {
  coeff: number;
  qubits: number[];
}

export function quboEnergies(n: number, terms: QuboTerm[]): Float64Array {
  const e = new Float64Array(1 << n);
  for (let x = 0; x < e.length; x++) {
    let v = 0;
    for (const t of terms) if (t.qubits.every((q) => (x >> q) & 1)) v += t.coeff;
    e[x] = v;
  }
  return e;
}

export function rescale(e: Float64Array, n: number): Float64Array {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of e) {
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
  const k = hi > lo ? n / (hi - lo) : 0;
  return e.map((v) => (v - lo) * k);
}

/** Indices of the optimal bitstrings (all of them, when degenerate). */
export function groundIndices(e: Float64Array): number[] {
  const min = Math.min(...e);
  const out: number[] = [];
  e.forEach((v, i) => {
    if (v - min < 1e-9) out.push(i);
  });
  return out;
}

function hamiltonian(n: number, ep: Float64Array, s: number): Float64Array {
  const d = 1 << n;
  const h = new Float64Array(d * d);
  for (let i = 0; i < d; i++) {
    h[i * d + i] = s * ep[i];
    for (let q = 0; q < n; q++) h[i * d + (i ^ (1 << q))] = -(1 - s);
  }
  return h;
}

/**
 * Cyclic Jacobi eigen-decomposition of a real symmetric matrix (destroys `a`).
 * Returns eigenvalues ascending and eigenvectors as rows of `vecs` in the same order.
 * ponytail: O(d^3) per call; fine up to d = 64 (6 spins). Beyond that, switch to
 * Lanczos for the lowest few levels.
 */
export function eigSym(a: Float64Array, d: number): { vals: Float64Array; vecs: Float64Array } {
  const v = new Float64Array(d * d);
  for (let i = 0; i < d; i++) v[i * d + i] = 1;
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0;
    for (let p = 0; p < d; p++) for (let q = p + 1; q < d; q++) off += a[p * d + q] ** 2;
    if (off < 1e-22) break;
    for (let p = 0; p < d; p++) {
      for (let q = p + 1; q < d; q++) {
        const apq = a[p * d + q];
        if (Math.abs(apq) < 1e-300) continue;
        const theta = (a[q * d + q] - a[p * d + p]) / (2 * apq);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let k = 0; k < d; k++) {
          const akp = a[k * d + p];
          const akq = a[k * d + q];
          a[k * d + p] = c * akp - s * akq;
          a[k * d + q] = s * akp + c * akq;
        }
        for (let k = 0; k < d; k++) {
          const apk = a[p * d + k];
          const aqk = a[q * d + k];
          a[p * d + k] = c * apk - s * aqk;
          a[q * d + k] = s * apk + c * aqk;
          // Accumulate V = V·P, stored transposed so each eigenvector is a row.
          const vpk = v[p * d + k];
          const vqk = v[q * d + k];
          v[p * d + k] = c * vpk - s * vqk;
          v[q * d + k] = s * vpk + c * vqk;
        }
      }
    }
  }
  const order = [...Array(d).keys()].sort((i, j) => a[i * d + i] - a[j * d + j]);
  const vals = new Float64Array(d);
  const vecs = new Float64Array(d * d);
  order.forEach((src, dst) => {
    vals[dst] = a[src * d + src];
    vecs.set(v.subarray(src * d, src * d + d), dst * d);
  });
  return { vals, vecs };
}

/**
 * Energy levels at one s, with degenerate eigenvalues merged into one level.
 * Populations are only meaningful per level (a degenerate eigenbasis is arbitrary), so
 * levels carry the eigenvectors that span them.
 */
export interface Level {
  energy: number;
  degeneracy: number;
  /** Row offsets into the owning SpectrumPoint.vecs. */
  rows: number[];
}

export interface SpectrumPoint {
  s: number;
  levels: Level[];
  vecs: Float64Array;
}

const DEGENERACY_TOL = 1e-6;

export function spectrum(n: number, ep: Float64Array, points: number): SpectrumPoint[] {
  const d = 1 << n;
  const out: SpectrumPoint[] = [];
  for (let k = 0; k < points; k++) {
    const s = k / (points - 1);
    const { vals, vecs } = eigSym(hamiltonian(n, ep, s), d);
    const levels: Level[] = [];
    for (let i = 0; i < d; i++) {
      const last = levels[levels.length - 1];
      if (last && vals[i] - last.energy < DEGENERACY_TOL) {
        last.degeneracy++;
        last.rows.push(i * d);
      } else {
        levels.push({ energy: vals[i], degeneracy: 1, rows: [i * d] });
      }
    }
    out.push({ s, levels, vecs });
  }
  return out;
}

/** Probability of finding the state in each level of `pt`. */
export function levelPopulations(
  pt: SpectrumPoint,
  psi: { re: Float64Array; im: Float64Array },
): number[] {
  const d = psi.re.length;
  return pt.levels.map((lv) => {
    let p = 0;
    for (const row of lv.rows) {
      let r = 0;
      let i = 0;
      for (let k = 0; k < d; k++) {
        r += pt.vecs[row + k] * psi.re[k];
        i += pt.vecs[row + k] * psi.im[k];
      }
      p += r * r + i * i;
    }
    return p;
  });
}

/**
 * Integrates i dψ/dt = H(t/T) ψ from the uniform superposition (ground state of the
 * driver) with RK4, recording ψ at `points` evenly spaced values of s.
 */
export function evolve(
  n: number,
  ep: Float64Array,
  T: number,
  points: number,
): { re: Float64Array; im: Float64Array }[] {
  const d = 1 << n;
  // dt·‖H‖ ≲ 0.25 keeps RK4 accurate here: ‖H‖ ≤ n (driver) + n (rescaled problem).
  const perSegment = Math.max(4, Math.ceil(T / (points - 1) / 0.02));
  const steps = perSegment * (points - 1);
  const dt = T / steps;

  const re = new Float64Array(d).fill(1 / Math.sqrt(d));
  const im = new Float64Array(d);
  const snaps = [{ re: re.slice(), im: im.slice() }];

  // f(ψ) = -i H ψ. H is real, so with ψ = re + i·im:  re' = H·im,  im' = -H·re.
  const hApply = (
    s: number,
    xr: Float64Array,
    xi: Float64Array,
    or: Float64Array,
    oi: Float64Array,
  ) => {
    const a = 1 - s;
    for (let i = 0; i < d; i++) {
      let hr = s * ep[i] * xr[i];
      let hi = s * ep[i] * xi[i];
      for (let q = 0; q < n; q++) {
        const j = i ^ (1 << q);
        hr -= a * xr[j];
        hi -= a * xi[j];
      }
      or[i] = hi;
      oi[i] = -hr;
    }
  };

  const k = Array.from({ length: 8 }, () => new Float64Array(d));
  const tr = new Float64Array(d);
  const ti = new Float64Array(d);
  for (let step = 0; step < steps; step++) {
    const s0 = (step * dt) / T;
    const sm = ((step + 0.5) * dt) / T;
    const s1 = ((step + 1) * dt) / T;
    hApply(s0, re, im, k[0], k[1]);
    for (let i = 0; i < d; i++) {
      tr[i] = re[i] + 0.5 * dt * k[0][i];
      ti[i] = im[i] + 0.5 * dt * k[1][i];
    }
    hApply(sm, tr, ti, k[2], k[3]);
    for (let i = 0; i < d; i++) {
      tr[i] = re[i] + 0.5 * dt * k[2][i];
      ti[i] = im[i] + 0.5 * dt * k[3][i];
    }
    hApply(sm, tr, ti, k[4], k[5]);
    for (let i = 0; i < d; i++) {
      tr[i] = re[i] + dt * k[4][i];
      ti[i] = im[i] + dt * k[5][i];
    }
    hApply(s1, tr, ti, k[6], k[7]);
    for (let i = 0; i < d; i++) {
      re[i] += (dt / 6) * (k[0][i] + 2 * k[2][i] + 2 * k[4][i] + k[6][i]);
      im[i] += (dt / 6) * (k[1][i] + 2 * k[3][i] + 2 * k[5][i] + k[7][i]);
    }
    if ((step + 1) % perSegment === 0) snaps.push({ re: re.slice(), im: im.slice() });
  }
  return snaps;
}

/** Probability of ending in an optimal bitstring, for each anneal time in `Ts`. */
export function successByTime(n: number, ep: Float64Array, Ts: number[]): number[] {
  const ground = groundIndices(ep);
  return Ts.map((T) => {
    const snaps = evolve(n, ep, T, 2);
    const last = snaps[snaps.length - 1];
    return ground.reduce((p, i) => p + last.re[i] ** 2 + last.im[i] ** 2, 0);
  });
}

/**
 * Validates untrusted QUBO JSON (pasted by the user; run_qaoa's `qubo` array or the whole
 * argument object). Returns the variable count inferred from the highest qubit index.
 */
export function parseQubo(json: unknown): { n: number; terms: QuboTerm[] } {
  const list = Array.isArray(json) ? json : (json as { qubo?: unknown } | null)?.qubo;
  if (!Array.isArray(list) || list.length === 0)
    throw new Error("QUBO の項の配列（[...]）を貼り付けてください");
  const terms = list.map((raw, idx): QuboTerm => {
    const where = `${idx + 1}番目の項`;
    const { coeff, qubits } = (raw ?? {}) as Record<string, unknown>;
    if (typeof coeff !== "number" || !Number.isFinite(coeff))
      throw new Error(`${where}: coeff が数値ではありません`);
    if (
      !Array.isArray(qubits) ||
      qubits.length < 1 ||
      qubits.length > 2 ||
      !qubits.every((q) => Number.isInteger(q) && q >= 0 && q < MAX_SPINS)
    ) {
      throw new Error(`${where}: qubits は 0〜${MAX_SPINS - 1} の番号を1つか2つ指定してください`);
    }
    return { coeff, qubits: qubits as number[] };
  });
  return { n: Math.max(...terms.flatMap((t) => t.qubits)) + 1, terms };
}

/**
 * Where the lowest level is closest to the first level that does NOT end in an optimal
 * bitstring (eigenvalue index `groundCount`). Leaking into levels below that index still
 * ends in an optimal answer, so they do not count as failure; this is the gap that sets
 * how slowly the anneal must go.
 */
export function narrowestGap(sp: SpectrumPoint[], groundCount: number): { k: number; gap: number } {
  let k = 0;
  let gap = Infinity;
  sp.forEach((pt, i) => {
    const ev = pt.levels.flatMap((lv) => Array<number>(lv.degeneracy).fill(lv.energy));
    if (groundCount < ev.length && ev[groundCount] - ev[0] < gap) {
      gap = ev[groundCount] - ev[0];
      k = i;
    }
  });
  return { k, gap };
}
