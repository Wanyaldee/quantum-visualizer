import type { Gate } from "../quantum/gate";

export interface CircuitPreset {
  id: string;
  title: string;
  summary: string;
  n: number;
  gates: Gate[];
  /** One sentence per gate, shown while stepping (same length as `gates`). */
  notes: string[];
  /** Number of the blueqat-mcp-playground example this circuit comes from. */
  example?: number;
}

const h = (q: number): Gate => ({ gate: "h", qubits: [q] });
const x = (q: number): Gate => ({ gate: "x", qubits: [q] });
const z = (q: number): Gate => ({ gate: "z", qubits: [q] });
const cx = (c: number, t: number): Gate => ({ gate: "cx", qubits: [c, t] });
const cz = (c: number, t: number): Gate => ({ gate: "cz", qubits: [c, t] });
const ccz = (a: number, b: number, c: number): Gate => ({ gate: "ccz", qubits: [a, b, c] });

// Example 10: one Grover iteration over 3 qubits that marks the key 101 (q0 first).
// The gates are exactly the ones playground sent to run_circuit.
function groverKeyIteration(round: string): { gates: Gate[]; notes: string[] } {
  return {
    gates: [x(1), ccz(0, 1, 2), x(1), h(0), h(1), h(2), x(0), x(1), x(2), ccz(0, 1, 2)].concat([
      x(0),
      x(1),
      x(2),
      h(0),
      h(1),
      h(2),
    ]),
    notes: [
      `${round}オラクル：q1 だけ X で反転し、101 を 111 の位置に動かす。`,
      "CCZ：3つとも 1 のときだけ位相を反転。これで鍵 101 にだけ印がつく（確率はまだ変わらない）。",
      "X で q1 を元に戻す。印のついた矢印は 101 に戻る。",
      "ここから拡散（平均のまわりで折り返す）。H。",
      "H。",
      "H。",
      "X で 000 を 111 の位置へ。",
      "X。",
      "X。",
      "CCZ で 000 の位相を反転。",
      "X で戻す。",
      "X。",
      "X。",
      "H。",
      "H。",
      round === "1回目の"
        ? "H。1回目の終わり。101 の確率が約 78% まで育った。"
        : "H。2回目の終わり。101 の確率は約 95%（N = 8 では反復回数が整数にならないので、ぴったり 100% にはならない）。",
    ],
  };
}

const KEY_ROUND_1 = groverKeyIteration("1回目の");
const KEY_ROUND_2 = groverKeyIteration("2回目の");

export const CIRCUIT_PRESETS: CircuitPreset[] = [
  {
    id: "interference",
    title: "重ね合わせと干渉：H を2回かけると元に戻る",
    summary:
      "H は重ね合わせを作るゲートです。重ね合わせにもう一度 H をかけると、振幅どうしが足し合わされて干渉が起き、0 に戻ります。間に Z を挟むと、打ち消し合う相手が入れ替わって必ず 1 になります。",
    n: 1,
    gates: [h(0), h(0), h(0), z(0), h(0)],
    notes: [
      "1回目の H：重ね合わせを作る。0 と 1 の円が同じ大きさになり、測ればどちらも 50%。",
      "2回目の H：ここで干渉が起きる。「1 になる分」は針が逆向きどうしで打ち消し合い、「0 になる分」は同じ向きどうしで強め合う。50% ずつだったのに、必ず 0 に戻った。",
      "もう一度 H で重ね合わせを作る。ここまでは1回目と同じ。",
      "Z：1 の針（位相）だけを逆向きにする。円の大きさは変わらないので、測ればまだ 50% ずつ。",
      "最後の H：今度は「0 になる分」が打ち消し合い、「1 になる分」が強め合う。Z で針の向きを変えただけなのに、結果は必ず 1。",
    ],
  },
  {
    id: "bell",
    example: 1,
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
    example: 2,
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
    example: 3,
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
    example: 13,
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
  {
    id: "qrng",
    title: "量子乱数：公正なサイコロ（例6）",
    summary:
      "3つの量子ビットに H をかけるだけで、000〜111 の8通りがまったく同じ確率になります。測った結果は原理的に予測できません。",
    n: 3,
    example: 6,
    gates: [h(0), h(1), h(2)],
    notes: [
      "q0 を重ね合わせに。2通りが 50% ずつ。",
      "q1 も。4通りが 25% ずつ。",
      "q2 も。8通りが 12.5% ずつ。000〜101 を 1〜6 の目に、110 と 111 が出たら振り直せば公正な6面サイコロになる。",
    ],
  },
  {
    id: "grover-key",
    title: "グローバー探索で3ビットの鍵を探す（例10）",
    summary:
      "候補8通りから鍵 101 を探す。「印をつけて折り返す」を2回くり返すと、101 の確率が約 95% まで育ちます（古典の総当たりなら平均4回）。",
    n: 3,
    example: 10,
    gates: [h(0), h(1), h(2), ...KEY_ROUND_1.gates, ...KEY_ROUND_2.gates],
    notes: [
      "q0 を重ね合わせに。",
      "q1 も。",
      "q2 も。8通りの鍵候補が 12.5% ずつ。",
      ...KEY_ROUND_1.notes,
      ...KEY_ROUND_2.notes,
    ],
  },
  {
    id: "bb84",
    title: "BB84：盗聴すると誤りが出る（例11）",
    summary:
      "送り手が X 基底で 1 を送り、盗聴者が Z 基底でのぞき見ると、受け手の結果は 50% の確率で間違います。q0 が信号、q1 は盗聴者の記録です。",
    n: 2,
    example: 11,
    gates: [x(0), h(0), cx(0, 1), h(0)],
    notes: [
      "送り手：送りたいビット 1 を用意する。",
      "送り手：X 基底（H）に変えて送る。q0 は 0 と 1 の重ね合わせで、測っても Z 基底では読めない。",
      "盗聴者：Z 基底で q0 を写し取る（CNOT で q1 に記録し、q1 は二度と見ない＝測ったのと同じ）。もつれによって q0 の重ね合わせが壊れる。",
      "受け手：送り手と同じ X 基底（H）で読む。盗聴がなければ必ず 1 なのに、q0 は 0 も 50% で出る。この誤り率の上昇で盗聴に気づける。",
    ],
  },
];
