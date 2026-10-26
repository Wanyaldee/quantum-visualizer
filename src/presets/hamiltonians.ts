import type { PauliTerm } from "../quantum/vqe";
import { H2_BOND_LENGTHS } from "./h2BondLengths";
import { pauliTerm as P } from "./pauli";

/** One Hamiltonian of a preset; H2 has one per bond length. */
export interface VqeVariant {
  id: string;
  label: string;
  terms: PauliTerm[];
  /** Added to every energy for display (H2: nuclear repulsion, left out of the terms). */
  offset: number;
  /** The energy playground's run_vqe returned for this Hamiltonian, when it is known. */
  playgroundEnergy?: number;
}

export interface VqePreset {
  id: string;
  title: string;
  summary: string;
  /** What "energy" means for this problem, in plain words. */
  energyMeaning: string;
  n: number;
  /** run_vqe's `layers`: how many CZ chains the ansatz has. */
  layers: number;
  variants: VqeVariant[];
  /** Index into `variants` shown first. */
  defaultVariant: number;
  /** What the variants differ in, e.g. "原子どうしの距離". Absent with a single variant. */
  variantLabel?: string;
  unit: string;
  /** A well-known classical estimate drawn as a second reference line. */
  reference?: { label: string; bits: string };
  /**
   * The state with both electrons' spins aligned: H2's triplet (playground checked ⟨S²⟩ = 2
   * with OpenFermion). From 1 Å on it is the second-lowest level, and both this page's runs
   * and playground's run_vqe can stop there. Below 1 Å a one-electron level (the qubit
   * Hamiltonian holds every electron count) lies between it and the ground state, so it is
   * named as the triplet, not as "the second-lowest level".
   */
  spinAligned?: { label: string; bits: string };
  /** Gradient-descent step size and number of steps to replay. */
  rate: number;
  steps: number;
  /** Starting points offered as buttons; chosen so that the story of the example shows. */
  seeds: number[];
  /** Number of the blueqat-mcp-playground example this comes from. */
  example?: number;
}

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
    variants: [
      {
        id: "ising",
        label: "横磁場イジング模型",
        terms: [P("ZZ", 1), P("XI", -1), P("IX", -1)],
        offset: 0,
        playgroundEnergy: -2.236067977499361,
      },
    ],
    defaultVariant: 0,
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
      "水素原子2つがくっついた水素分子で、電子がどう広がると一番エネルギーが低くなるかを探します。4つの量子ビットが、電子が入れる4つの「席」を表します。原子どうしの距離を変えたり、出発点を変えたりすると、本当の答えの手前のくぼみで止まることがあります。",
    energyMeaning:
      "分子全体のエネルギー（単位は Hartree）。低いほど安定で、この値から分子のいろいろな性質が分かります。",
    n: 4,
    layers: 2,
    variants: H2_BOND_LENGTHS.map((b) => ({
      id: String(b.bondLength),
      label: `${b.bondLength} Å`,
      terms: b.terms,
      offset: b.offset,
      playgroundEnergy: b.playgroundVqe,
    })),
    defaultVariant: H2_BOND_LENGTHS.findIndex((b) => b.bondLength === 0.7414),
    variantLabel: "原子どうしの距離",
    unit: "Hartree",
    reference: { label: "HF（平均場近似）", bits: "1100" },
    spinAligned: { label: "三重項（スピンがそろった状態）", bits: "1010" },
    rate: 0.5,
    steps: 1000,
    // Chosen across the bond lengths (see tests): 3 reaches FCI near equilibrium, 1 stops at
    // Hartree-Fock there, 10 stops in the spin-aligned state at 1.5 Å and beyond (where
    // run_vqe did), and 6 already does so at 1 Å.
    seeds: [3, 1, 10, 2, 6],
  },
];
