import type { PauliTerm } from "../quantum/vqe";

export interface VqePreset {
  id: string;
  title: string;
  summary: string;
  /** What "energy" means for this problem, in plain words. */
  energyMeaning: string;
  n: number;
  /** run_vqe's `layers`: how many CZ chains the ansatz has. */
  layers: number;
  terms: PauliTerm[];
  /** Added to every energy for display (H2: nuclear repulsion, left out of the terms). */
  offset: number;
  unit: string;
  /** A well-known classical estimate drawn as a second reference line. */
  reference?: { label: string; bits: string };
  /** Gradient-descent step size and number of steps to replay. */
  rate: number;
  steps: number;
  /** Starting points offered as buttons; chosen so that the story of the example shows. */
  seeds: number[];
  /** Number of the blueqat-mcp-playground example this comes from. */
  example?: number;
}

const P = (ops: string, coeff: number): PauliTerm => ({
  coeff,
  paulis: ops
    .split("")
    .flatMap((op, qubit) =>
      op === "I" ? [] : [{ op: op as PauliTerm["paulis"][number]["op"], qubit }],
    ),
});

export const VQE_PRESETS: VqePreset[] = [
  {
    id: "ising",
    example: 5,
    title: "2つの小さな磁石の一番安定な並び（例5）",
    summary:
      "2つの小さな磁石が「おたがい逆向きにそろいたい」のに、横から磁場がかかっていて「横を向きたい」とも思っている。そのせめぎ合いで一番落ち着く（エネルギーが一番低い）状態を、つまみを回して探します。",
    energyMeaning: "磁石たちの「落ち着かなさ」。低いほど安定です。",
    n: 2,
    layers: 2,
    terms: [P("ZZ", 1), P("XI", -1), P("IX", -1)],
    offset: 0,
    unit: "",
    rate: 0.2,
    steps: 60,
    seeds: [1, 2, 3, 4],
  },
  {
    id: "h2",
    example: 12,
    title: "水素分子のエネルギー（例12）",
    summary:
      "水素原子2つがくっついた水素分子で、電子がどう広がると一番エネルギーが低くなるかを探します。4つの量子ビットが、電子が入れる4つの「席」を表します。出発点によっては、本当の答えの手前のくぼみで止まってしまいます。",
    energyMeaning:
      "分子全体のエネルギー（単位は Hartree）。低いほど安定で、この値から分子のいろいろな性質が分かります。",
    n: 4,
    layers: 2,
    // Example 12's Hamiltonian at the equilibrium bond length 0.7414 Å (Jordan-Wigner, 14 terms).
    terms: [
      P("ZIII", 0.17119775),
      P("IZII", 0.17119775),
      P("IIZI", -0.22278593),
      P("IIIZ", -0.22278593),
      P("ZZII", 0.16862219),
      P("YXXY", 0.0453222),
      P("YYXX", -0.0453222),
      P("XXYY", -0.0453222),
      P("XYYX", 0.0453222),
      P("ZIZI", 0.12054482),
      P("ZIIZ", 0.16586702),
      P("IZZI", 0.16586702),
      P("IZIZ", 0.12054482),
      P("IIZZ", 0.17434844),
    ],
    offset: -0.098864,
    unit: "Hartree",
    reference: { label: "HF（平均場近似）", bits: "1100" },
    rate: 0.5,
    steps: 700,
    // 3 and 7 reach the exact energy; 1 and 8 stop at the Hartree-Fock state (see tests).
    seeds: [3, 1, 7, 8],
  },
];
