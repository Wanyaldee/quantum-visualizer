import { describe, expect, it } from "vite-plus/test";
import { groundIndices, MAX_SPINS, quboEnergies } from "../quantum/anneal";
import { basisLabel, MAX_QUBITS, probabilities, simulateSteps } from "../quantum/gate";
import { CIRCUIT_PRESETS } from "./circuits";
import { PLAYGROUND_EXAMPLES } from "./examples";
import { ANNEAL_PRESETS } from "./problems";

const presetsFor = (mode: "gate" | "anneal") =>
  mode === "gate" ? CIRCUIT_PRESETS : ANNEAL_PRESETS;

const finalProbs = (id: string) => {
  const p = CIRCUIT_PRESETS.find((c) => c.id === id)!;
  return probabilities(simulateSteps(p.n, p.gates).at(-1)!);
};

/** Optimal bitstrings of a QUBO preset, written q0 first like the playground does. */
const optima = (id: string) => {
  const p = ANNEAL_PRESETS.find((x) => x.id === id)!;
  return groundIndices(quboEnergies(p.n, p.terms))
    .map((i) => basisLabel(i, p.n))
    .sort();
};

describe("playground example catalog", () => {
  it("lists every example 1..19 exactly once, in order", () => {
    expect(PLAYGROUND_EXAMPLES.map((e) => e.no)).toEqual(
      Array.from({ length: 19 }, (_, i) => i + 1),
    );
    for (const e of PLAYGROUND_EXAMPLES)
      expect(e.file.startsWith(String(e.no).padStart(2, "0"))).toBe(true);
  });

  it("links each example to a preset that exists, or says why it cannot", () => {
    for (const e of PLAYGROUND_EXAMPLES) {
      if (e.view) {
        const preset = presetsFor(e.view.mode).find((p) => p.id === e.view!.preset);
        expect(preset, `例${e.no}`).toBeDefined();
        expect(preset!.example).toBe(e.no);
        expect(preset!.title.endsWith(`（例${e.no}）`)).toBe(true);
      } else {
        expect(e.missing, `例${e.no}`).toBeTruthy();
      }
      if (e.related)
        expect(presetsFor(e.related.mode).some((p) => p.id === e.related!.preset)).toBe(true);
    }
  });

  it("every preset fits the simulators", () => {
    for (const p of CIRCUIT_PRESETS) expect(p.n).toBeLessThanOrEqual(MAX_QUBITS);
    for (const p of ANNEAL_PRESETS) expect(p.n).toBeLessThanOrEqual(MAX_SPINS);
  });
});

describe("circuit presets behave like their playground examples", () => {
  it("example 6: three H gates give 8 equally likely outcomes", () => {
    for (const p of finalProbs("qrng")) expect(p).toBeCloseTo(1 / 8);
  });

  it("example 10: 35 gates, two Grover rounds find key 101 about 95% of the time", () => {
    expect(CIRCUIT_PRESETS.find((c) => c.id === "grover-key")!.gates.length).toBe(35);
    // q0 first: 101 → q0 = 1, q2 = 1 → index 0b101
    expect(finalProbs("grover-key")[0b101]).toBeCloseTo(0.9453, 3);
  });

  it("example 11: a basis mismatch makes Bob read the wrong bit half the time", () => {
    const probs = finalProbs("bb84");
    // q0 is Bob's bit (index bit 0); Alice sent 1, so q0 = 0 is an error.
    expect(probs[0b00] + probs[0b10]).toBeCloseTo(0.5);
  });
});

describe("QUBO presets have the optima the playground reports", () => {
  it.each([
    ["frustration", ["001", "010", "011", "100", "101", "110"]], // example 4
    ["budget", ["0101", "1110"]], // example 7
    ["shift", ["010010"]], // example 15
    ["store", ["10100"]], // example 16
    ["meeting", ["01101", "10010"]], // example 17
    ["screening", ["011011", "111000"]], // example 18
    ["reviewer", ["100001"]], // example 19
  ])("%s", (id, expected) => {
    expect(optima(id)).toEqual(expected);
  });

  it("descriptions read back the playground's answers", () => {
    const say = (id: string, bits: string) =>
      ANNEAL_PRESETS.find((p) => p.id === id)!.describe(bits.split("").map(Number));
    expect(say("store", "10100")).toContain("見込み月商 16");
    expect(say("store", "10010")).toContain("見込み月商 15");
    expect(say("meeting", "10010")).toContain("困る人 1人");
    expect(say("screening", "111000")).toContain("= 8");
    expect(say("reviewer", "100001")).toContain("一致度 9");
    expect(say("shift", "010010")).toBe("土曜: C / 日曜: A");
  });
});
