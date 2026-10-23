import type { QuboTerm } from "../quantum/anneal";

export interface AnnealPreset {
  id: string;
  title: string;
  summary: string;
  n: number;
  /** Display name for each variable; bit = 1 / 0 meaning is in `bitMeaning`. */
  names: string[];
  bitMeaning: [one: string, zero: string];
  terms: QuboTerm[];
  /** Graph edges drawn between variables (a QUBO's pair terms, or the problem's own graph). */
  edges: [number, number][];
  /** Turns a bitstring (q0 first) into a human sentence. */
  describe: (bits: number[]) => string;
}

// Maximize the number of edges whose endpoints differ:
// cost = Σ_edges -(x_i + x_j - 2 x_i x_j)
function maxcutTerms(edges: [number, number][]): QuboTerm[] {
  const terms: QuboTerm[] = [];
  for (const [i, j] of edges) {
    terms.push(
      { coeff: -1, qubits: [i] },
      { coeff: -1, qubits: [j] },
      { coeff: 2, qubits: [i, j] },
    );
  }
  return terms;
}

const SQUARE: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [0, 2],
];

const TRIANGLE: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 0],
];

const TEAM_PEOPLE = ["鈴木", "高橋", "田中", "伊藤", "渡辺"];

export const ANNEAL_PRESETS: AnnealPreset[] = [
  {
    id: "maxcut",
    title: "グラフを2色に塗り分ける（MaxCut）",
    summary:
      "線でつながった点どうしをできるだけ違う色にする問題。playground の例4（QAOA MaxCut）と同じ種類の問題です。",
    n: 4,
    names: ["A", "B", "C", "D"],
    bitMeaning: ["青", "橙"],
    terms: maxcutTerms(SQUARE),
    edges: SQUARE,
    describe: (bits) => {
      const cut = SQUARE.filter(([i, j]) => bits[i] !== bits[j]).length;
      return `${cut} / ${SQUARE.length} 本の線で色が分かれている`;
    },
  },
  {
    id: "team",
    title: "相性を考えたチーム分け（例14）",
    summary:
      "6人を3人ずつに分ける。佐藤さんはチームA に固定し、残り5人の所属を探します。QUBO は playground 例14 で blueqat に投げたものそのままです。",
    n: 5,
    names: TEAM_PEOPLE,
    bitMeaning: ["A", "B"],
    // Copied verbatim from blueqat-mcp-playground examples/14_team_split.md.
    terms: [
      { coeff: -33, qubits: [0] },
      { coeff: -31, qubits: [1] },
      { coeff: -31, qubits: [2] },
      { coeff: -27, qubits: [3] },
      { coeff: -30, qubits: [4] },
      { coeff: 20, qubits: [0, 1] },
      { coeff: 20, qubits: [0, 2] },
      { coeff: 20, qubits: [0, 3] },
      { coeff: 22, qubits: [0, 4] },
      { coeff: 26, qubits: [1, 2] },
      { coeff: 20, qubits: [1, 3] },
      { coeff: 20, qubits: [1, 4] },
      { coeff: 16, qubits: [2, 3] },
      { coeff: 20, qubits: [2, 4] },
      { coeff: 18, qubits: [3, 4] },
    ],
    // The affinity pairs that do not involve 佐藤 (the full graph is all-to-all through the
    // headcount penalty, which would just draw a hairball).
    edges: [
      [1, 2],
      [3, 4],
      [0, 4],
      [2, 3],
    ],
    describe: (bits) => {
      const a = ["佐藤", ...TEAM_PEOPLE.filter((_, i) => bits[i])];
      const b = TEAM_PEOPLE.filter((_, i) => !bits[i]);
      return `A: ${a.join("・")} / B: ${b.join("・")}`;
    },
  },
  {
    id: "frustration",
    title: "全員の希望は叶わない三角形（フラストレーション）",
    summary:
      "3つの点がお互いに「相手とは違う色がいい」と思っている。3辺すべてを満たす塗り方は存在せず、最良の答えが6通りあります。",
    n: 3,
    names: ["A", "B", "C"],
    bitMeaning: ["青", "橙"],
    terms: maxcutTerms(TRIANGLE),
    edges: TRIANGLE,
    describe: (bits) => {
      const cut = TRIANGLE.filter(([i, j]) => bits[i] !== bits[j]).length;
      return `${cut} / 3 本の線で色が分かれている`;
    },
  },
];
