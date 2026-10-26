import { describe, expect, it } from "vite-plus/test";
import { VQE_PRESETS } from "../presets/hamiltonians";
import { basisLabel, probabilities, zeroState, applyGate } from "./gate";
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

/** Final energy (offset included) and final state of one replayed run. */
function runFrom(id: string, seed: number) {
  const p = preset(id);
  const h = hamiltonian(p.n, p.terms);
  const trace = descend(
    h,
    p.layers,
    startingParams(paramCount(p.n, p.layers), seed),
    p.rate,
    p.steps,
  );
  const last = trace.at(-1)!;
  return {
    h,
    trace,
    energy: last.energy + p.offset,
    state: prepare(p.n, p.layers, last.params),
    exact: energyLevels(h)[0] + p.offset,
  };
}

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
      const h = hamiltonian(p.n, p.terms);
      const params = startingParams(paramCount(p.n, p.layers), 42);
      expect(ansatzEnergy(h, p.layers, params)).toBeCloseTo(
        expectation(h, prepare(p.n, p.layers, params)),
        12,
      );
    }
  });
});

describe("example 5: transverse-field Ising, 2 qubits", () => {
  it("the exact ground energy is −√5", () => {
    const p = preset("ising");
    expect(energyLevels(hamiltonian(p.n, p.terms))[0]).toBeCloseTo(-Math.sqrt(5), 10);
  });

  it("every offered starting point reaches −√5, with playground's top states", () => {
    for (const seed of preset("ising").seeds) {
      const { energy, state } = runFrom("ising", seed);
      expect(energy, `seed ${seed}`).toBeCloseTo(-Math.sqrt(5), 6);
      const probs = probabilities(state);
      const at = (bits: string) => probs[bits.split("").reduce((a, b, q) => a | (+b << q), 0)];
      // playground: 01 / 10 ≈ 0.361804, 00 / 11 ≈ 0.138196
      expect(at("01")).toBeCloseTo(0.361804, 4);
      expect(at("10")).toBeCloseTo(0.361804, 4);
      expect(at("00")).toBeCloseTo(0.138196, 4);
      expect(at("11")).toBeCloseTo(0.138196, 4);
    }
  });
});

describe("example 12: H2 at 0.7414 Å, 4 qubits", () => {
  it("exact (FCI) and Hartree-Fock energies match playground's table", () => {
    const p = preset("h2");
    const h = hamiltonian(p.n, p.terms);
    expect(energyLevels(h)[0] + p.offset).toBeCloseTo(-1.13727, 5);
    expect(basisEnergy(h, p.reference!.bits) + p.offset).toBeCloseTo(-1.116684, 5);
  });

  it("some starting points reach FCI, others get stuck at Hartree-Fock", () => {
    const finals = preset("h2").seeds.map((seed) => runFrom("h2", seed).energy);
    const reached = finals.filter((e) => Math.abs(e + 1.13727) < 1.6e-3);
    const stuck = finals.filter((e) => Math.abs(e + 1.116684) < 1e-4);
    expect(reached.length).toBeGreaterThan(0);
    expect(stuck.length).toBeGreaterThan(0);
    expect(reached.length + stuck.length).toBe(finals.length);
  });

  it("the converged state is mostly 1100 with a little 0011, like playground's top_states", () => {
    const { state } = runFrom("h2", preset("h2").seeds[0]);
    const probs = probabilities(state);
    const top = [...probs.keys()].sort((a, b) => probs[b] - probs[a]);
    expect(basisLabel(top[0], 4)).toBe("1100");
    expect(basisLabel(top[1], 4)).toBe("0011");
  });
});

it("variational principle: no step ever goes below the exact ground energy", () => {
  for (const p of VQE_PRESETS) {
    const { trace, exact } = runFrom(p.id, p.seeds[0]);
    for (const s of trace) expect(s.energy + p.offset).toBeGreaterThanOrEqual(exact - 1e-9);
  }
});
