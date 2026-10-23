import type { Gate } from "../quantum/gate";

export interface CircuitPreset {
  id: string;
  title: string;
  summary: string;
  n: number;
  gates: Gate[];
  /** One sentence per gate, shown while stepping (same length as `gates`). */
  notes: string[];
}

const h = (q: number): Gate => ({ gate: "h", qubits: [q] });
const x = (q: number): Gate => ({ gate: "x", qubits: [q] });
const z = (q: number): Gate => ({ gate: "z", qubits: [q] });
const cx = (c: number, t: number): Gate => ({ gate: "cx", qubits: [c, t] });
const cz = (c: number, t: number): Gate => ({ gate: "cz", qubits: [c, t] });

export const CIRCUIT_PRESETS: CircuitPreset[] = [
  {
    id: "interference",
    title: "干渉：H を2回かけると元に戻る",
    summary:
      "重ね合わせは「半々の確率」ではありません。間に Z を挟むと、波の山と谷が打ち消し合って結果が 1 に変わります。",
    n: 1,
    gates: [h(0), z(0), h(0)],
    notes: [
      "H で |0⟩ と |1⟩ が同じ大きさで重なる。測ればどちらも 50%。",
      "Z は |1⟩ の向き（位相）だけを反転させる。確率は 50% のまま変わらない。",
      "もう一度 H。|0⟩ への寄与が打ち消し合い、|1⟩ への寄与が強め合って、結果は必ず 1。",
    ],
  },
  {
    id: "bell",
    title: "ベル状態：2つの量子ビットのもつれ（例1）",
    summary: "片方を測ると、もう片方の結果も決まる。00 と 11 だけが出て、01 や 10 は出ません。",
    n: 2,
    gates: [h(0), cx(0, 1)],
    notes: [
      "q0 を重ね合わせにする。この時点では q0 と q1 は無関係。",
      "CNOT：q0 が 1 のときだけ q1 を反転。00 と 11 だけが残り、2つが「もつれた」状態になる。",
    ],
  },
  {
    id: "ghz",
    title: "GHZ 状態：3つ以上のもつれ（例2）",
    summary: "ベル状態を3量子ビットに広げたもの。000 と 111 だけが出ます。",
    n: 3,
    gates: [h(0), cx(0, 1), cx(1, 2)],
    notes: [
      "q0 を重ね合わせにする。",
      "q0 → q1 に CNOT。000 と 110 の重ね合わせ。",
      "q1 → q2 に CNOT。000 と 111 の重ね合わせ。全員がそろって 0 か、そろって 1。",
    ],
  },
  {
    id: "grover",
    title: "グローバー探索：答えの確率だけを増やす（例3）",
    summary:
      "4通りの中から 11 を探す。「印をつける（位相を反転）」→「平均のまわりで折り返す」の1回で、11 の確率が 100% になります。",
    n: 2,
    gates: [h(0), h(1), cz(0, 1), h(0), h(1), x(0), x(1), cz(0, 1), x(0), x(1), h(0), h(1)],
    notes: [
      "q0 を重ね合わせに。",
      "q1 も重ね合わせに。4通りすべてが 25% ずつ。",
      "オラクル：答え 11 の位相だけを反転（矢印が逆向きに）。確率はまだ全部 25%。",
      "ここから「拡散」：平均のまわりで振幅を折り返す操作。まず H。",
      "H。",
      "X で 00 を目印の位置に動かす。",
      "X。",
      "CZ で位相を反転。",
      "X で元に戻す。",
      "X。",
      "H。",
      "H。答え 11 の振幅だけが強め合い、確率 100% に（針が逆向きなのは全体にかかる位相で、測定結果には影響しない）。",
    ],
  },
  {
    id: "superdense",
    title: "超高密度符号化：1量子ビットで2ビット送る（例13）",
    summary:
      "あらかじめベル状態を共有しておくと、送り手は自分の1量子ビットに操作して渡すだけで「11」の2ビットを伝えられます。",
    n: 2,
    gates: [h(0), cx(0, 1), x(0), z(0), cx(0, 1), h(0)],
    notes: [
      "準備：q0 を重ね合わせに。",
      "準備：ベル状態を作り、q0 を送り手、q1 を受け手が持つ。",
      "送り手：「11」を送るため X をかける。",
      "送り手：続けて Z。触ったのは q0 だけ。",
      "受け手：q0 を受け取り、CNOT でもつれをほどく。",
      "受け手：H をかけて測ると、必ず 11 が出る。",
    ],
  },
];
