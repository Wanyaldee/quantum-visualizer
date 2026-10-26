// Every example in blueqat-mcp-playground, and where (if anywhere) this app shows how it
// behaves. Kept in example order so the list reads like the playground README.

export const PLAYGROUND_URL = "https://github.com/Wanyaldee/blueqat-mcp-playground";
export const playgroundDoc = (path: string): string => `${PLAYGROUND_URL}/blob/main/${path}`;

export type ExampleGroup = "circuit" | "optimize" | "vqe" | "workshop";

/** A preset in this app: `#gate/<id>`, `#anneal/<id>` or `#vqe/<id>`. */
export interface ExampleView {
  mode: "gate" | "anneal" | "vqe";
  preset: string;
}

export interface PlaygroundExample {
  no: number;
  /** File name under examples/ in the playground. */
  file: string;
  title: string;
  tools: string[];
  group: ExampleGroup;
  summary: string;
  /** The preset that shows this example's behavior. */
  view?: ExampleView;
  /** Why there is no preset, when `view` is missing. */
  missing?: string;
  /** The closest behavior to look at instead, when there is no preset. */
  related?: ExampleView & { label: string };
}

export const viewHash = (v: ExampleView): string => `#${v.mode}/${v.preset}`;

export const PLAYGROUND_EXAMPLES: PlaygroundExample[] = [
  {
    no: 1,
    file: "01_bell_state.md",
    title: "ベル状態",
    tools: ["run_circuit"],
    group: "circuit",
    summary: "2量子ビットの最小のもつれ。00 と 11 だけが半々で出る。",
    view: { mode: "gate", preset: "bell" },
  },
  {
    no: 2,
    file: "02_ghz_state.md",
    title: "GHZ 状態",
    tools: ["run_circuit", "circuit_info", "draw_circuit"],
    group: "circuit",
    summary: "もつれを3量子ビットへ広げる。000 と 111 だけが出る。",
    view: { mode: "gate", preset: "ghz" },
  },
  {
    no: 3,
    file: "03_grover_search.md",
    title: "グローバー探索",
    tools: ["run_circuit", "draw_circuit"],
    group: "circuit",
    summary: "4通りから 11 を探す。1回の反復で正解の確率が 100% になる。",
    view: { mode: "gate", preset: "grover" },
  },
  {
    no: 4,
    file: "04_qaoa_maxcut.md",
    title: "QAOA で MaxCut",
    tools: ["run_qaoa"],
    group: "optimize",
    summary: "三角形を2色に塗り分ける。全部は満たせず、最適解が6通りに縮退する。",
    view: { mode: "anneal", preset: "frustration" },
  },
  {
    no: 5,
    file: "05_vqe_transverse_ising.md",
    title: "VQE で横磁場イジング模型",
    tools: ["run_vqe"],
    group: "vqe",
    summary: "2量子ビットの磁石の模型で、一番低いエネルギーを変分法で求める。",
    view: { mode: "vqe", preset: "ising" },
  },
  {
    no: 6,
    file: "06_quantum_random_number_generator.md",
    title: "量子乱数生成",
    tools: ["run_circuit"],
    group: "circuit",
    summary: "H を3つ並べて8通りを等確率にし、棄却サンプリングで公正な6面サイコロを作る。",
    view: { mode: "gate", preset: "qrng" },
  },
  {
    no: 7,
    file: "07_qaoa_budget_matching.md",
    title: "QAOA で予算ぴったり一致",
    tools: ["run_qaoa"],
    group: "optimize",
    summary: "合計がちょうど予算になる組み合わせを選ぶ（部分和問題）。経理の消込など。",
    view: { mode: "anneal", preset: "budget" },
  },
  {
    no: 8,
    file: "08_qaoa_portfolio_jp_us.md",
    title: "QAOA で日米株ポートフォリオ選定",
    tools: ["run_qaoa"],
    group: "optimize",
    summary: "実際の株価データから、リターンとリスクの釣り合う銘柄の組み合わせを選ぶ。",
    missing:
      "10 銘柄 = 10 量子ビットあり、このアプリのアニーリング（6 変数まで）では計算できません。",
    related: {
      mode: "anneal",
      preset: "store",
      label: "「単独で良いもの」と「組み合わせの相性」を天秤にかける形は出店候補地と同じ",
    },
  },
  {
    no: 9,
    file: "09_qaoa_feature_selection.md",
    title: "QAOA で AI 学習の特徴量選択",
    tools: ["run_qaoa"],
    group: "optimize",
    summary: "診断データの特徴量から「関連が強く、互いに冗長でない」ものを選び、古典手法と比べる。",
    missing:
      "10 特徴量 = 10 量子ビットあり、このアプリのアニーリング（6 変数まで）では計算できません。",
    related: {
      mode: "anneal",
      preset: "screening",
      label: "「役に立つが、似たもの同士は避ける」形は実験条件のスクリーニングと同じ",
    },
  },
  {
    no: 10,
    file: "10_grover_key_search.md",
    title: "グローバー探索でトイ暗号の鍵を復元",
    tools: ["run_circuit", "draw_circuit"],
    group: "circuit",
    summary: "3ビット（8通り）の鍵を2回の反復で約 95% の確率で当てる。実在の暗号への攻撃ではない。",
    view: { mode: "gate", preset: "grover-key" },
  },
  {
    no: 11,
    file: "11_bb84_quantum_key_distribution.md",
    title: "BB84 量子鍵配送",
    tools: ["run_circuit"],
    group: "circuit",
    summary:
      "盗聴者がいると受け手の誤り率が 0% から約 25% に上がる。ここでは基底が食い違った1回分を見る。",
    view: { mode: "gate", preset: "bb84" },
  },
  {
    no: 12,
    file: "12_vqe_h2_molecule.md",
    title: "VQE で水素分子の基底エネルギー",
    tools: ["run_vqe"],
    group: "vqe",
    summary:
      "実際の分子のハミルトニアンを作り、結合長ごとのエネルギーを厳密解と比べる。1.5 Å で run_vqe が捕まったくぼみも再現できる。",
    view: { mode: "vqe", preset: "h2" },
  },
  {
    no: 13,
    file: "13_superdense_coding.md",
    title: "超高密度符号化",
    tools: ["run_circuit", "draw_circuit"],
    group: "circuit",
    summary: "ベル対を共有しておけば、1量子ビットを送るだけで2ビット伝えられる。",
    view: { mode: "gate", preset: "superdense" },
  },
  {
    no: 14,
    file: "14_team_split.md",
    title: "相性を考えたチーム分け",
    tools: ["run_qaoa"],
    group: "workshop",
    summary: "6人を3人ずつに。同点の最適解が2つあり、どちらにするかは人が決める。",
    view: { mode: "anneal", preset: "team" },
  },
  {
    no: 15,
    file: "15_weekend_shift.md",
    title: "週末当番の割当",
    tools: ["run_qaoa"],
    group: "workshop",
    summary: "ルールを罰点で書く。QAOA は1回目に最適解を外し、seed を変えて当たった。",
    view: { mode: "anneal", preset: "shift" },
  },
  {
    no: 16,
    file: "16_store_location.md",
    title: "出店候補地の選定",
    tools: ["run_qaoa"],
    group: "workshop",
    summary: "「売れそうな順」に選ぶと共食いで損をする。最適解はそれを上回る。",
    view: { mode: "anneal", preset: "store" },
  },
  {
    no: 17,
    file: "17_meeting_schedule.md",
    title: "会議のスケジュール調整",
    tools: ["run_qaoa"],
    group: "workshop",
    summary: "どうしても重なるとき、困る人数が一番少ない分け方を選ぶ。",
    view: { mode: "anneal", preset: "meeting" },
  },
  {
    no: 18,
    file: "18_experiment_screening.md",
    title: "実験条件のスクリーニング",
    tools: ["run_qaoa"],
    group: "workshop",
    summary: "情報量・費用・冗長性を天秤に。「単独で黒字なら全部」より大幅に良い。",
    view: { mode: "anneal", preset: "screening" },
  },
  {
    no: 19,
    file: "19_reviewer_assignment.md",
    title: "査読担当の割当",
    tools: ["run_qaoa"],
    group: "workshop",
    summary: "利益相反も考えた割当。素朴な方法でも最適解が出る＝最適化が要らない例。",
    view: { mode: "anneal", preset: "reviewer" },
  },
];

export const exampleUrl = (no: number): string => {
  const ex = PLAYGROUND_EXAMPLES.find((e) => e.no === no);
  return ex ? playgroundDoc(`examples/${ex.file}`) : PLAYGROUND_URL;
};
