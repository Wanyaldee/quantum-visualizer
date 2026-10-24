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
  /** Number of the blueqat-mcp-playground example this problem comes from. */
  example?: number;
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

// QUBO terms written compactly as [coeff, ...qubits]; the lists below are copied verbatim
// from the run_qaoa inputs in blueqat-mcp-playground's examples.
const qubo = (rows: number[][]): QuboTerm[] =>
  rows.map(([coeff, ...qubits]) => ({ coeff, qubits }));

/** Pair terms of a QUBO, for problems whose graph is the QUBO itself. */
const pairEdges = (terms: QuboTerm[]): [number, number][] =>
  terms
    .filter((t) => t.qubits.length === 2)
    .map((t): [number, number] => [t.qubits[0], t.qubits[1]]);

const picked = (names: string[], bits: number[]) => names.filter((_, i) => bits[i]);

const BUDGET_COSTS = [2, 3, 5, 7];
const BUDGET_TERMS = qubo([
  [-36, 0],
  [-51, 1],
  [-75, 2],
  [-91, 3],
  [12, 0, 1],
  [20, 0, 2],
  [28, 0, 3],
  [30, 1, 2],
  [42, 1, 3],
  [70, 2, 3],
]);

// q0..q5 = A土, A日, B土, B日, C土, C日
const SHIFT_SLOTS = ["A土", "A日", "B土", "B日", "C土", "C日"];
const SHIFT_TERMS = qubo([
  [-11, 0],
  [-19, 1],
  [-18, 2],
  [-17, 3],
  [-19, 4],
  [-18, 5],
  [20, 0, 1],
  [40, 0, 2],
  [40, 0, 4],
  [40, 1, 3],
  [40, 1, 5],
  [20, 2, 3],
  [40, 2, 4],
  [40, 3, 5],
  [20, 4, 5],
]);

const STORES = ["駅前", "大学前", "住宅街", "国道沿い", "商店街"];
const STORE_TERMS = qubo([
  [-100, 0],
  [-97, 1],
  [-96, 2],
  [-98, 3],
  [-95, 4],
  [64, 0, 1],
  [60, 0, 2],
  [63, 0, 3],
  [65, 0, 4],
  [60, 1, 2],
  [60, 1, 3],
  [62, 1, 4],
  [61, 2, 3],
  [60, 2, 4],
  [60, 3, 4],
]);
const STORE_SALES = [10, 7, 6, 8, 5];
// Pairs that eat into each other's sales (the rest of the pair terms are the headcount penalty).
const STORE_OVERLAP: [number, number, number][] = [
  [0, 1, 4],
  [0, 4, 5],
  [0, 3, 3],
  [1, 4, 2],
  [2, 3, 1],
];

const MEETINGS = ["定例", "面接", "予算", "顧客", "1on1"];
const MEETING_NAMES = ["定例", "採用面接", "予算会議", "顧客打合せ", "1on1"];
// [meeting, meeting, people who attend both]
const MEETING_CLASH: [number, number, number][] = [
  [0, 1, 2],
  [1, 2, 1],
  [0, 2, 3],
  [2, 3, 2],
  [3, 4, 1],
  [0, 4, 1],
];
const MEETING_TERMS = qubo([
  [-6, 0],
  [-3, 1],
  [-6, 2],
  [-3, 3],
  [-2, 4],
  [4, 0, 1],
  [6, 0, 2],
  [2, 0, 4],
  [2, 1, 2],
  [4, 2, 3],
  [2, 3, 4],
]);

const EXPERIMENTS = ["高温", "低温", "触媒A", "触媒B", "高圧", "長時間"];
const EXPERIMENT_TERMS = qubo([
  [-3, 0],
  [-2, 1],
  [-3, 2],
  [-2, 3],
  [-2, 4],
  [-2, 5],
  [3, 0, 4],
  [2, 0, 5],
  [1, 1, 5],
  [5, 2, 3],
]);

// q0..q5 = 論文X×{Y, N, K}先生, 論文Y×{Y, N, K}先生
const REVIEWERS = ["Y先生", "N先生", "K先生"];
const REVIEW_MATCH = [5, 2, 4, 3, 5, 4];
const REVIEW_TERMS = qubo([
  [-25, 0],
  [-22, 1],
  [-24, 2],
  [-23, 3],
  [-5, 4],
  [-24, 5],
  [40, 0, 1],
  [40, 0, 2],
  [20, 0, 3],
  [40, 1, 2],
  [20, 1, 4],
  [20, 2, 5],
  [40, 3, 4],
  [40, 3, 5],
  [40, 4, 5],
]);

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
    example: 14,
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
    title: "全員の希望は叶わない三角形（例4）",
    summary:
      "3つの点がお互いに「相手とは違う色がいい」と思っている（フラストレーション）。3辺すべてを満たす塗り方は存在せず、最良の答えが6通りあります。QUBO は playground 例4 の MaxCut と同じです。",
    example: 4,
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
  {
    id: "budget",
    title: "予算ぴったりの組み合わせ（例7）",
    summary:
      "2・3・5・7 万円の4案件から、合計がちょうど 10 万円になる組み合わせを選ぶ。答えは 2+3+5 と 3+7 の2通りあります。",
    example: 7,
    n: 4,
    names: BUDGET_COSTS.map((c) => `${c}万`),
    bitMeaning: ["選ぶ", "外す"],
    terms: BUDGET_TERMS,
    edges: pairEdges(BUDGET_TERMS),
    describe: (bits) => {
      const chosen = BUDGET_COSTS.filter((_, i) => bits[i]);
      const sum = chosen.reduce((a, c) => a + c, 0);
      return chosen.length ? `${chosen.join(" + ")} = ${sum} 万円（予算 10 万円）` : "何も選ばない";
    },
  },
  {
    id: "shift",
    title: "週末当番の割当（例15）",
    summary:
      "A・B・C の3人で土日の当番を1人ずつ決める。A さんは土曜 NG、1人1日まで。ルールは罰点として QUBO に入っています。playground の QAOA は1回目に最適解を外しました。",
    example: 15,
    n: 6,
    names: SHIFT_SLOTS,
    bitMeaning: ["当番", "休み"],
    terms: SHIFT_TERMS,
    edges: pairEdges(SHIFT_TERMS),
    describe: (bits) => {
      const day = (offset: number) =>
        ["A", "B", "C"].filter((_, p) => bits[2 * p + offset]).join("・") || "なし";
      return `土曜: ${day(0)} / 日曜: ${day(1)}`;
    },
  },
  {
    id: "store",
    title: "出店候補地の選定（例16）",
    summary:
      "5つの候補地から2店を選ぶ。月商の大きい順（駅前＋国道沿い）は共食いで損をし、駅前＋住宅街が最適です。",
    example: 16,
    n: 5,
    names: STORES.map((name) => name.slice(0, 2)),
    bitMeaning: ["出店", "見送り"],
    terms: STORE_TERMS,
    edges: STORE_OVERLAP.map(([i, j]): [number, number] => [i, j]),
    describe: (bits) => {
      const sales =
        STORE_SALES.reduce((a, v, i) => a + v * bits[i], 0) -
        STORE_OVERLAP.reduce((a, [i, j, loss]) => a + loss * bits[i] * bits[j], 0);
      const chosen = picked(STORES, bits);
      return `${chosen.join("・") || "出店なし"}（${chosen.length}店・見込み月商 ${sales} 百万円）`;
    },
  },
  {
    id: "meeting",
    title: "会議のスケジュール調整（例17）",
    summary:
      "5つの会議を午前と午後に分ける。どう分けても誰かは困るので、困る人数が一番少ない分け方を探します（重み付き MaxCut）。",
    example: 17,
    n: 5,
    names: MEETINGS,
    bitMeaning: ["午後", "午前"],
    terms: MEETING_TERMS,
    edges: MEETING_CLASH.map(([i, j]): [number, number] => [i, j]),
    describe: (bits) => {
      const clash = MEETING_CLASH.reduce((a, [i, j, w]) => a + (bits[i] === bits[j] ? w : 0), 0);
      const am = MEETING_NAMES.filter((_, i) => !bits[i]).join("・") || "なし";
      return `午前: ${am} / 困る人 ${clash}人`;
    },
  },
  {
    id: "screening",
    title: "実験条件のスクリーニング（例18）",
    summary:
      "情報量・費用・似た実験の重なりを天秤にかけて、試す条件を選ぶ。最適解は2通りで、どちらも触媒Bを外します。",
    example: 18,
    n: 6,
    names: ["高温", "低温", "触A", "触B", "高圧", "長時"],
    bitMeaning: ["試す", "外す"],
    terms: EXPERIMENT_TERMS,
    edges: pairEdges(EXPERIMENT_TERMS),
    describe: (bits) => {
      // The QUBO is −(information − cost), so the score is just the negated energy.
      const score = -EXPERIMENT_TERMS.reduce(
        (a, t) => a + t.coeff * t.qubits.reduce((p, q) => p * bits[q], 1),
        0,
      );
      return `${picked(EXPERIMENTS, bits).join("・") || "なし"}（情報量 − 費用 = ${score}）`;
    },
  },
  {
    id: "reviewer",
    title: "査読担当の割当（例19）",
    summary:
      "2本の論文に3人の先生から1人ずつ。N 先生は論文Y と利益相反です。この例は素朴な方法（論文ごとに一番適任の人）でも最適解が出る、最適化が要らない例です。",
    example: 19,
    n: 6,
    names: ["X:Y", "X:N", "X:K", "Y:Y", "Y:N", "Y:K"],
    bitMeaning: ["担当", "—"],
    terms: REVIEW_TERMS,
    edges: pairEdges(REVIEW_TERMS),
    describe: (bits) => {
      const who = (paper: number) =>
        REVIEWERS.filter((_, r) => bits[3 * paper + r]).join("・") || "なし";
      const match = REVIEW_MATCH.reduce((a, m, i) => a + m * bits[i], 0);
      return `論文X: ${who(0)} / 論文Y: ${who(1)}（一致度 ${match}）`;
    },
  },
];
