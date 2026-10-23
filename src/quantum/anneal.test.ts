import { describe, expect, it } from "vite-plus/test";
import { ANNEAL_PRESETS } from "../presets/problems";
import {
  eigSym,
  evolve,
  groundIndices,
  levelPopulations,
  parseQubo,
  quboEnergies,
  rescale,
  spectrum,
  successByTime,
} from "./anneal";

const preset = (id: string) => {
  const p = ANNEAL_PRESETS.find((x) => x.id === id)!;
  return { p, ep: rescale(quboEnergies(p.n, p.terms), p.n) };
};

describe("annealing simulator", () => {
  it("eigSym matches a known 2x2", () => {
    const { vals } = eigSym(Float64Array.from([2, 1, 1, 2]), 2);
    expect(vals[0]).toBeCloseTo(1);
    expect(vals[1]).toBeCloseTo(3);
  });

  it("team split optimum matches example 14 (11000 and 10100)", () => {
    const { p } = preset("team");
    const g = groundIndices(quboEnergies(p.n, p.terms));
    // index bit q = qubit q; 11000 → q0=q1=1 → 0b00011
    expect(g.sort((a, b) => a - b)).toEqual([0b00011, 0b00101]);
  });

  it("spectrum starts at the driver's levels and ends at the problem energies", () => {
    const { p, ep } = preset("frustration");
    const sp = spectrum(p.n, ep, 3);
    expect(sp[0].levels[0].energy).toBeCloseTo(-p.n);
    expect(sp[0].levels[0].degeneracy).toBe(1);
    expect(sp[2].levels[0].energy).toBeCloseTo(0);
    expect(sp[2].levels[0].degeneracy).toBe(6);
  });

  it("evolution keeps the norm and starts fully in the ground level", () => {
    const { p, ep } = preset("maxcut");
    const sp = spectrum(p.n, ep, 11);
    const snaps = evolve(p.n, ep, 10, 11);
    expect(snaps.length).toBe(11);
    for (const s of snaps) {
      const norm = s.re.reduce((a, v, i) => a + v * v + s.im[i] ** 2, 0);
      expect(norm).toBeCloseTo(1, 6);
    }
    expect(levelPopulations(sp[0], snaps[0])[0]).toBeCloseTo(1);
  });

  it("slow annealing succeeds where fast annealing does not (adiabatic theorem)", () => {
    for (const id of ["maxcut", "team", "frustration"]) {
      const { p, ep } = preset(id);
      const [fast, slow] = successByTime(p.n, ep, [0.1, 500]);
      expect(slow).toBeGreaterThan(0.9);
      expect(fast).toBeLessThan(slow);
    }
  });
});

describe("parseQubo", () => {
  it("accepts run_qaoa input and rejects out-of-range qubits", () => {
    expect(
      parseQubo({
        qubo: [
          { coeff: -1, qubits: [0] },
          { coeff: 2, qubits: [0, 3] },
        ],
      }).n,
    ).toBe(4);
    expect(() => parseQubo([{ coeff: 1, qubits: [6] }])).toThrow(/qubits/);
    expect(() => parseQubo([{ coeff: "1", qubits: [0] }])).toThrow(/coeff/);
  });
});
