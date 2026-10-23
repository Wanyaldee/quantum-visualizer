// Gate-model statevector simulator.
//
// Circuits use the same JSON shape as blueqat MCP's run_circuit
// ({"gate": "cx", "qubits": [control, target], "params": [theta]}) so circuits from
// blueqat-mcp-playground can be pasted in unchanged. Bit order also follows blueqat:
// qubit i is bit i of the basis index, and labels are written q0 first (bitstring[0] = q0).

export const MAX_QUBITS = 5;

export type GateName =
  | "h"
  | "x"
  | "y"
  | "z"
  | "s"
  | "sdg"
  | "t"
  | "tdg"
  | "rx"
  | "ry"
  | "rz"
  | "p"
  | "cx"
  | "cy"
  | "cz"
  | "swap"
  | "ccx"
  | "ccz";

export interface Gate {
  gate: GateName;
  qubits: number[];
  params?: number[];
}

/** State as separate real/imag arrays of length 2^n. */
export interface State {
  re: Float64Array;
  im: Float64Array;
}

// 2x2 complex matrix, row-major: [a, b; c, d] each as [re, im].
type C = readonly [number, number];
type M2 = readonly [C, C, C, C];

const R = Math.SQRT1_2;
const phase = (t: number): C => [Math.cos(t), Math.sin(t)];

function singleMatrix(name: GateName, theta: number): M2 | null {
  const c = Math.cos(theta / 2);
  const s = Math.sin(theta / 2);
  switch (name) {
    case "h":
      return [
        [R, 0],
        [R, 0],
        [R, 0],
        [-R, 0],
      ];
    case "x":
      return [
        [0, 0],
        [1, 0],
        [1, 0],
        [0, 0],
      ];
    case "y":
      return [
        [0, 0],
        [0, -1],
        [0, 1],
        [0, 0],
      ];
    case "z":
      return [
        [1, 0],
        [0, 0],
        [0, 0],
        [-1, 0],
      ];
    case "s":
      return [[1, 0], [0, 0], [0, 0], phase(Math.PI / 2)];
    case "sdg":
      return [[1, 0], [0, 0], [0, 0], phase(-Math.PI / 2)];
    case "t":
      return [[1, 0], [0, 0], [0, 0], phase(Math.PI / 4)];
    case "tdg":
      return [[1, 0], [0, 0], [0, 0], phase(-Math.PI / 4)];
    case "p":
      return [[1, 0], [0, 0], [0, 0], phase(theta)];
    case "rx":
      return [
        [c, 0],
        [0, -s],
        [0, -s],
        [c, 0],
      ];
    case "ry":
      return [
        [c, 0],
        [-s, 0],
        [s, 0],
        [c, 0],
      ];
    case "rz":
      return [phase(-theta / 2), [0, 0], [0, 0], phase(theta / 2)];
    default:
      return null;
  }
}

/** How many qubits each gate takes, and which of them are controls (the leading ones). */
export const GATE_ARITY: Record<GateName, { qubits: number; controls: number; param: boolean }> = {
  h: { qubits: 1, controls: 0, param: false },
  x: { qubits: 1, controls: 0, param: false },
  y: { qubits: 1, controls: 0, param: false },
  z: { qubits: 1, controls: 0, param: false },
  s: { qubits: 1, controls: 0, param: false },
  sdg: { qubits: 1, controls: 0, param: false },
  t: { qubits: 1, controls: 0, param: false },
  tdg: { qubits: 1, controls: 0, param: false },
  rx: { qubits: 1, controls: 0, param: true },
  ry: { qubits: 1, controls: 0, param: true },
  rz: { qubits: 1, controls: 0, param: true },
  p: { qubits: 1, controls: 0, param: true },
  cx: { qubits: 2, controls: 1, param: false },
  cy: { qubits: 2, controls: 1, param: false },
  cz: { qubits: 2, controls: 1, param: false },
  swap: { qubits: 2, controls: 0, param: false },
  ccx: { qubits: 3, controls: 2, param: false },
  ccz: { qubits: 3, controls: 2, param: false },
};

export function zeroState(n: number): State {
  const re = new Float64Array(1 << n);
  re[0] = 1;
  return { re, im: new Float64Array(1 << n) };
}

/** Applies a gate and returns a new state (snapshots for step-through need immutability). */
export function applyGate(state: State, g: Gate): State {
  const re = state.re.slice();
  const im = state.im.slice();
  const size = re.length;

  if (g.gate === "swap") {
    const [a, b] = g.qubits;
    for (let i = 0; i < size; i++) {
      const ba = (i >> a) & 1;
      const bb = (i >> b) & 1;
      if (ba === 1 && bb === 0) {
        const j = i ^ (1 << a) ^ (1 << b);
        [re[i], re[j]] = [re[j], re[i]];
        [im[i], im[j]] = [im[j], im[i]];
      }
    }
    return { re, im };
  }

  const { controls } = GATE_ARITY[g.gate];
  // Controlled gates reduce to their single-qubit core applied where all controls are 1.
  const core = (controls === 0 ? g.gate : g.gate.slice(controls)) as GateName;
  const m = singleMatrix(core, g.params?.[0] ?? 0);
  if (!m) throw new Error(`unsupported gate: ${g.gate}`);

  const target = g.qubits[controls];
  let ctrlMask = 0;
  for (let k = 0; k < controls; k++) ctrlMask |= 1 << g.qubits[k];
  const tBit = 1 << target;

  for (let i = 0; i < size; i++) {
    if (i & tBit || (i & ctrlMask) !== ctrlMask) continue;
    const j = i | tBit;
    const ar = state.re[i];
    const ai = state.im[i];
    const br = state.re[j];
    const bi = state.im[j];
    const [m00, m01, m10, m11] = m;
    re[i] = m00[0] * ar - m00[1] * ai + m01[0] * br - m01[1] * bi;
    im[i] = m00[0] * ai + m00[1] * ar + m01[0] * bi + m01[1] * br;
    re[j] = m10[0] * ar - m10[1] * ai + m11[0] * br - m11[1] * bi;
    im[j] = m10[0] * ai + m10[1] * ar + m11[0] * bi + m11[1] * br;
  }
  return { re, im };
}

/** All intermediate states: result[k] is the state after the first k gates. */
export function simulateSteps(n: number, gates: Gate[]): State[] {
  const states = [zeroState(n)];
  for (const g of gates) states.push(applyGate(states[states.length - 1], g));
  return states;
}

export function probabilities(s: State): Float64Array {
  const p = new Float64Array(s.re.length);
  for (let i = 0; i < p.length; i++) p[i] = s.re[i] ** 2 + s.im[i] ** 2;
  return p;
}

/** Basis label with q0 first, matching blueqat's bitstring order. */
export function basisLabel(index: number, n: number): string {
  let out = "";
  for (let q = 0; q < n; q++) out += (index >> q) & 1;
  return out;
}

/** Draws `shots` measurement outcomes. `rand` is injectable so tests can be deterministic. */
export function sample(probs: Float64Array, shots: number, rand = Math.random): Uint32Array {
  const counts = new Uint32Array(probs.length);
  for (let s = 0; s < shots; s++) {
    let r = rand();
    let i = 0;
    for (; i < probs.length - 1; i++) {
      r -= probs[i];
      if (r < 0) break;
    }
    counts[i]++;
  }
  return counts;
}

/**
 * Validates untrusted circuit JSON (pasted by the user) into Gates.
 * Throws an Error with a Japanese message naming the first problem found.
 */
export function parseCircuit(json: unknown): { n: number; gates: Gate[] } {
  // run_circuit's full argument object ({"gates": [...], "shots": ...}) is accepted too.
  const list = Array.isArray(json) ? json : (json as { gates?: unknown } | null)?.gates;
  if (!Array.isArray(list)) throw new Error("ゲートの配列（[...]）を貼り付けてください");
  const n = MAX_QUBITS;
  const gates = list.map((raw, idx): Gate => {
    const where = `${idx + 1}番目のゲート`;
    if (typeof raw !== "object" || raw === null)
      throw new Error(`${where}がオブジェクトではありません`);
    const { gate, qubits, params } = raw as Record<string, unknown>;
    const name = (gate === "cnot" ? "cx" : gate === "toffoli" ? "ccx" : gate) as GateName;
    const arity = GATE_ARITY[name];
    if (typeof gate !== "string" || !arity)
      throw new Error(`${where}: 未対応のゲート "${String(gate)}"`);
    if (
      !Array.isArray(qubits) ||
      qubits.length !== arity.qubits ||
      !qubits.every((q) => Number.isInteger(q) && q >= 0 && q < n) ||
      new Set(qubits).size !== qubits.length
    ) {
      throw new Error(
        `${where}: qubits は 0〜${n - 1} の異なる番号を ${arity.qubits} 個指定してください`,
      );
    }
    if (arity.param && !(Array.isArray(params) && typeof params[0] === "number")) {
      throw new Error(`${where}: ${name} には params: [角度] が必要です`);
    }
    return arity.param
      ? { gate: name, qubits: qubits as number[], params: [(params as number[])[0]] }
      : { gate: name, qubits: qubits as number[] };
  });
  const used = Math.max(0, ...gates.flatMap((g) => g.qubits)) + 1;
  return { n: used, gates };
}
