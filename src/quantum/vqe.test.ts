import { describe, expect, it } from "vite-plus/test";
import { H2_BOND_LENGTHS } from "../presets/h2BondLengths";
import { VQE_PRESETS } from "../presets/hamiltonians";
import { applyGate, basisLabel, probabilities, zeroState } from "./gate";
import {
  ansatzEnergy,
  applyPauli,
  basisEnergy,
  descend,
  energyLevels,
  expectation,
  hamiltonian,
  paramCount,
  prepare,
  startingParams,
} from "./vqe";

const preset = (id: string) => VQE_PRESETS.find((p) => p.id === id)!;
const bond = (x: number) => preset("h2").variants.findIndex((v) => v.id === String(x));

/** Final energy (offset included) and final state of one replayed run. */
function runFrom(id: string, seed: number, variant = preset(id).defaultVariant) {
  const p = preset(id);
  const v = p.variants[variant];
  const h = hamiltonian(p.n, v.terms);
  const start = startingParams(paramCount(p.n, p.layers), seed);
  const trace = descend(h, p.layers, start, p.rate, p.steps);
  const last = trace.at(-1)!;
  return {
    trace,
    energy: last.energy + v.offset,
    state: prepare(p.n, p.layers, last.params),
    exact: energyLevels(h)[0] + v.offset,
    hf: p.reference ? basisEnergy(h, p.reference.bits) + v.offset : NaN,
    offset: v.offset,
  };
}

/** Probability of a q0-first bitstring. */
const probOf = (probs: Float64Array, bits: string) =>
  probs[bits.split("").reduce((a, b, q) => a | (Number(b) << q), 0)];

describe("Pauli expectation values", () => {
  it("matches textbook values on single qubits", () => {
    const zero = zeroState(1);
    const plus = applyGate(zero, { gate: "h", qubits: [0] });
    const plusI = applyGate(plus, { gate: "s", qubits: [0] });
    const one = (op: "X" | "Y" | "Z") => hamiltonian(1, [{ coeff: 1, paulis: [{ op, qubit: 0 }] }]);
    expect(expectation(one("Z"), zero)).toBeCloseTo(1);
    expect(expectation(one("X"), plus)).toBeCloseTo(1);
    expect(expectation(one("Y"), plusI)).toBeCloseTo(1);
    expect(expectation(one("Z"), plus)).toBeCloseTo(0);
  });

  it("Y flips the bit with a phase of ±i", () => {
    const y = applyPauli(zeroState(1), { coeff: 1, paulis: [{ op: "Y", qubit: 0 }] });
    expect(y.re[1]).toBeCloseTo(0);
    expect(y.im[1]).toBeCloseTo(1);
  });

  it("the fast ansatz path agrees with the general simulator", () => {
    for (const p of VQE_PRESETS) {
      for (const v of p.variants) {
        const h = hamiltonian(p.n, v.terms);
        const params = startingParams(paramCount(p.n, p.layers), 42);
        expect(ansatzEnergy(h, p.layers, params)).toBeCloseTo(
          expectation(h, prepare(p.n, p.layers, params)),
          12,
        );
      }
    }
  });
});

describe("example 5: transverse-field Ising, 2 qubits", () => {
  it("the exact ground energy is −√5", () => {
    const p = preset("ising");
    expect(energyLevels(hamiltonian(p.n, p.variants[0].terms))[0]).toBeCloseTo(-Math.sqrt(5), 10);
  });

  it("every offered starting point reaches −√5, with playground's top states", () => {
    for (const seed of preset("ising").seeds) {
      const { energy, state } = runFrom("ising", seed);
      expect(energy, `seed ${seed}`).toBeCloseTo(-Math.sqrt(5), 6);
      const probs = probabilities(state);
      // playground: 01 / 10 ≈ 0.361804, 00 / 11 ≈ 0.138196
      expect(probOf(probs, "01")).toBeCloseTo(0.361804, 4);
      expect(probOf(probs, "10")).toBeCloseTo(0.361804, 4);
      expect(probOf(probs, "00")).toBeCloseTo(0.138196, 4);
      expect(probOf(probs, "11")).toBeCloseTo(0.138196, 4);
    }
  });
});

describe("example 12: H2", () => {
  // HF and FCI columns of the table in examples/12_vqe_h2_molecule.md.
  const TABLE = [
    [0.3, -0.593828, -0.601804],
    [0.5, -1.042996, -1.05516],
    [0.7414, -1.116684, -1.13727],
    [1.0, -1.066109, -1.10115],
    [1.5, -0.910874, -0.998149],
    [2.0, -0.783793, -0.948641],
    [2.5, -0.702944, -0.936055],
  ];

  it("the 7 Hamiltonians give the table's HF and FCI energies", () => {
    expect(H2_BOND_LENGTHS.map((b) => b.bondLength)).toEqual(TABLE.map((r) => r[0]));
    for (const [i, [x, hf, fci]] of TABLE.entries()) {
      const b = H2_BOND_LENGTHS[i];
      expect(b.terms, `${x} Å`).toHaveLength(14);
      const h = hamiltonian(4, b.terms);
      expect(basisEnergy(h, "1100") + b.offset, `${x} Å HF`).toBeCloseTo(hf, 5);
      expect(energyLevels(h)[0] + b.offset, `${x} Å FCI`).toBeCloseTo(fci, 5);
    }
  });

  it("0.7414 Å is the Hamiltonian printed in example 12", () => {
    const v = preset("h2").variants[bond(0.7414)];
    expect(preset("h2").defaultVariant).toBe(bond(0.7414));
    expect(v.terms[0].coeff).toBeCloseTo(0.17119775, 8);
    expect(v.offset).toBeCloseTo(-0.098864, 6);
  });

  it("at 0.7414 Å some starting points reach FCI and others stop at Hartree-Fock", () => {
    const runs = preset("h2").seeds.map((seed) => runFrom("h2", seed));
    expect(runs.some((r) => r.energy - r.exact < 1.6e-3)).toBe(true);
    expect(runs.some((r) => Math.abs(r.energy - r.hf) < 1e-4)).toBe(true);
  });

  it("the converged state is mostly 1100 with a little 0011, like playground's top_states", () => {
    const { state } = runFrom("h2", preset("h2").seeds[0]);
    const probs = probabilities(state);
    const top = [...probs.keys()].sort((a, b) => probs[b] - probs[a]);
    expect(basisLabel(top[0], 4)).toBe("1100");
    expect(basisLabel(top[1], 4)).toBe("0011");
  });

  it("at 1.5, 2.0 and 2.5 Å a starting point stalls where playground's run_vqe did", () => {
    for (const x of [1.5, 2.0, 2.5]) {
      const v = preset("h2").variants[bond(x)];
      const finals = preset("h2").seeds.map((seed) => runFrom("h2", seed, bond(x)).energy);
      const nearest = Math.min(...finals.map((e) => Math.abs(e - v.playgroundEnergy!)));
      expect(nearest, `${x} Å`).toBeLessThan(1e-3);
    }
  });

  it("run_vqe's misses at 1.5, 2.0 and 2.5 Å are the spin-aligned state's energy", () => {
    const p = preset("h2");
    for (const x of [1.0, 1.5, 2.0, 2.5]) {
      const v = p.variants[bond(x)];
      const h = hamiltonian(4, v.terms);
      const spin = basisEnergy(h, p.spinAligned!.bits) + v.offset;
      // Both electrons' spins aligned either way is the same level (the triplet); from 1 Å on
      // it is the second lowest.
      expect(basisEnergy(h, "0101") + v.offset, `${x} Å`).toBeCloseTo(spin, 9);
      expect(energyLevels(h)[1] + v.offset, `${x} Å`).toBeCloseTo(spin, 6);
      if (x > 1) expect(Math.abs(v.playgroundEnergy! - spin), `${x} Å`).toBeLessThan(1e-5);
    }
  });

  it("below 1 Å the triplet is not the second-lowest level (a one-electron level is)", () => {
    const p = preset("h2");
    const v = p.variants[bond(0.7414)];
    const h = hamiltonian(4, v.terms);
    // playground (OpenFermion): second level −0.538710 has N = 1; triplet is −0.532479.
    expect(energyLevels(h)[1] + v.offset).toBeCloseTo(-0.53871, 5);
    expect(basisEnergy(h, p.spinAligned!.bits) + v.offset).toBeCloseTo(-0.532479, 5);
  });

  it("starting point E stops in the spin-aligned state already at 1.0 Å", () => {
    const p = preset("h2");
    const v = p.variants[bond(1.0)];
    const spin = basisEnergy(hamiltonian(4, v.terms), p.spinAligned!.bits) + v.offset;
    expect(runFrom("h2", p.seeds[4], bond(1.0)).energy).toBeCloseTo(spin, 5);
  });
});

it("variational principle: no step ever goes below the exact ground energy", () => {
  for (const p of VQE_PRESETS) {
    const { trace, exact, offset } = runFrom(p.id, p.seeds[0]);
    for (const s of trace) expect(s.energy + offset).toBeGreaterThanOrEqual(exact - 1e-9);
  }
});
