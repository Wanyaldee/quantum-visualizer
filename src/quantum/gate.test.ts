import { describe, expect, it } from "vite-plus/test";
import { CIRCUIT_PRESETS } from "../presets/circuits";
import {
  applyGate,
  basisLabel,
  parseCircuit,
  probabilities,
  simulateSteps,
  zeroState,
} from "./gate";

const final = (id: string) => {
  const p = CIRCUIT_PRESETS.find((c) => c.id === id)!;
  return probabilities(simulateSteps(p.n, p.gates).at(-1)!);
};

describe("gate simulator", () => {
  it("presets reach their textbook outcome", () => {
    expect(final("interference")[1]).toBeCloseTo(1);
    const bell = final("bell");
    expect(bell[0]).toBeCloseTo(0.5);
    expect(bell[3]).toBeCloseTo(0.5);
    expect(final("ghz")[7]).toBeCloseTo(0.5);
    expect(final("grover")[3]).toBeCloseTo(1);
    expect(final("superdense")[3]).toBeCloseTo(1);
  });

  it("interference preset: H makes a superposition, H→H returns to 0, H→Z→H gives 1", () => {
    const p = CIRCUIT_PRESETS.find((c) => c.id === "interference")!;
    const [, h1, hh, h3, hz, hzh] = simulateSteps(p.n, p.gates).map((s) =>
      Array.from(probabilities(s)),
    );
    for (const half of [h1, h3, hz]) {
      expect(half[0]).toBeCloseTo(0.5);
      expect(half[1]).toBeCloseTo(0.5);
    }
    expect(hh[0]).toBeCloseTo(1);
    expect(hzh[1]).toBeCloseTo(1);
    // The title must not read as if H itself were interference.
    expect(p.title.startsWith("重ね合わせと干渉")).toBe(true);
  });

  it("every preset has one note per gate", () => {
    for (const p of CIRCUIT_PRESETS) expect(p.notes.length).toBe(p.gates.length);
  });

  it("cx uses qubits[0] as control (blueqat order)", () => {
    // |q0=1, q1=0⟩ → cx(0,1) → |11⟩ ; index has bit q set for qubit q
    const s = applyGate(applyGate(zeroState(2), { gate: "x", qubits: [0] }), {
      gate: "cx",
      qubits: [0, 1],
    });
    expect(probabilities(s)[3]).toBeCloseTo(1);
    const t = applyGate(applyGate(zeroState(2), { gate: "x", qubits: [1] }), {
      gate: "cx",
      qubits: [0, 1],
    });
    expect(probabilities(t)[2]).toBeCloseTo(1);
  });

  it("rotations preserve norm and ry(π) flips", () => {
    const s = applyGate(zeroState(1), { gate: "ry", qubits: [0], params: [Math.PI] });
    expect(probabilities(s)[1]).toBeCloseTo(1);
    const r = applyGate(applyGate(zeroState(2), { gate: "h", qubits: [0] }), {
      gate: "rx",
      qubits: [1],
      params: [0.7],
    });
    expect(probabilities(r).reduce((a, b) => a + b)).toBeCloseTo(1);
  });

  it("ccx flips only when both controls are 1", () => {
    let s = zeroState(3);
    s = applyGate(s, { gate: "x", qubits: [0] });
    s = applyGate(s, { gate: "ccx", qubits: [0, 1, 2] });
    expect(probabilities(s)[1]).toBeCloseTo(1);
    s = applyGate(s, { gate: "x", qubits: [1] });
    s = applyGate(s, { gate: "ccx", qubits: [0, 1, 2] });
    expect(probabilities(s)[7]).toBeCloseTo(1);
  });

  it("labels put q0 first", () => {
    expect(basisLabel(1, 3)).toBe("100");
  });

  it("parses run_circuit JSON and rejects bad input", () => {
    const { n, gates } = parseCircuit({
      gates: [
        { gate: "h", qubits: [0] },
        { gate: "cnot", qubits: [0, 2] },
      ],
    });
    expect(n).toBe(3);
    expect(gates[1].gate).toBe("cx");
    expect(() => parseCircuit([{ gate: "u", qubits: [0] }])).toThrow(/未対応/);
    expect(() => parseCircuit([{ gate: "cx", qubits: [0, 0] }])).toThrow(/qubits/);
    expect(() => parseCircuit([{ gate: "rx", qubits: [0] }])).toThrow(/params/);
  });
});
