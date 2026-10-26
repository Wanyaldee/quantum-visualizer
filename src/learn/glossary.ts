// Definitions follow blueqat-mcp-playground's docs/basics.md ("まず、言葉の意味"), and like
// Qni they explain a state as "disc size = how likely, needle direction = phase", no formulas.

export type GlossaryGroup = "common" | "gate" | "anneal";

export interface GlossaryEntry {
  id: string;
  word: string;
  /** One plain sentence or two, for someone who knows nothing about quantum computing. */
  short: string;
  group: GlossaryGroup;
  /** Substrings that mean this word appears in a sentence. Empty: glossary only. */
  aliases: string[];
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    id: "qubit",
    word: "量子ビット",
    short:
      "量子コンピュータの「ビット」。普通のビットは 0 か 1 のどちらかですが、量子ビットは「0 になる可能性」と「1 になる可能性」を両方持てます。",
    group: "common",
    aliases: ["量子ビット"],
  },
  {
    id: "ket",
    word: "|0⟩ や |01⟩ という書き方",
    short:
      "状態の名前です。|01⟩ は「q0 が 0、q1 が 1」の組み合わせ。縦棒とカギ括弧は「これは状態の名前です」という印にすぎません。",
    group: "common",
    aliases: ["⟩"],
  },
  {
    id: "superposition",
    word: "重ね合わせ",
    short:
      "いくつかの結果の可能性を、どれも持っている「状態」。まだどれとも決まっていません（円がいくつも満たされている状態）。",
    group: "common",
    aliases: ["重ね合わせ", "重なる", "重なっ"],
  },
  {
    id: "measurement",
    word: "測定",
    short:
      "量子ビットの値を読むこと。読んだ瞬間に、どれか1つの結果に決まり、重ね合わせは消えます。",
    group: "common",
    aliases: ["測定", "測る", "測っ", "測れ"],
  },
  {
    id: "shots",
    word: "ショット（shots）",
    short:
      "同じ回路を何回くり返して測るか。1回測るだけでは結果が1つしか分からないので、何百回も測って出た割合を見ます。",
    group: "common",
    aliases: ["ショット", "shots", "回測"],
  },
  {
    id: "amplitude",
    word: "振幅",
    short:
      "確率の「もと」になる量。この画面では円の大きさで描いています（円が大きいほど出やすい）。普通の確率と違って「向き」も持っています。",
    group: "common",
    aliases: ["振幅"],
  },
  {
    id: "phase",
    word: "位相",
    short:
      "振幅の「向き」。この画面では針の向きと色で描いています。向きだけを変えても、その場で測ったときの確率は変わりません。でも、次のゲートの結果を変えます。",
    group: "common",
    aliases: ["位相", "針"],
  },
  {
    id: "interference",
    word: "干渉",
    short:
      "振幅どうしが足し合わさるときに起きる「現象」。同じ向きなら強め合い、逆向きなら打ち消し合います。水面の波で、山と山が重なると高くなり、山と谷が重なると消えるのと同じです。",
    group: "common",
    aliases: ["干渉", "打ち消し", "強め合"],
  },
  {
    id: "entanglement",
    word: "もつれ（エンタングルメント）",
    short:
      "2つ以上の量子ビットの結果が連動している関係。片方が 0 ならもう片方も必ず 0、のように振る舞います。",
    group: "common",
    aliases: ["もつれ", "エンタングルメント"],
  },
  {
    id: "simulator",
    word: "シミュレータと実機",
    short:
      "シミュレータは、普通のコンピュータで量子コンピュータの計算をまねたもの。実機は本物の量子コンピュータで、ノイズ（誤り）が混ざります。",
    group: "common",
    aliases: ["シミュレータ", "実機"],
  },
  {
    id: "gate",
    word: "ゲート",
    short:
      "量子ビットに対する1つの操作。普通のコンピュータの「NOT」のような基本の命令にあたります。",
    group: "gate",
    aliases: [],
  },
  {
    id: "circuit",
    word: "量子回路",
    short: "ゲートを順番に並べた手順書。左から右へ実行します。",
    group: "gate",
    aliases: [],
  },
  {
    id: "statevector",
    word: "状態ベクトル",
    short:
      "すべての組み合わせ（2量子ビットなら 00, 01, 10, 11）の振幅を並べた一覧。この画面の「いまの状態」に並ぶ円がそれです。",
    group: "gate",
    aliases: ["状態ベクトル"],
  },
  {
    id: "basis",
    word: "基底（Z 基底・X 基底）",
    short:
      "どの「ものさし」で読むか。Z 基底はふつうの 0 / 1 の読み方。X 基底は、H をかけてから 0 / 1 で読む読み方です。ものさしが合っていないと、結果は半々のでたらめになります。",
    group: "gate",
    aliases: ["Z 基底", "X 基底"],
  },
  {
    id: "cnot",
    word: "CNOT（cx）",
    short:
      "制御側の量子ビットが 1 のときだけ、相手の 0 と 1 を入れ替えるゲート。重ね合わせと組み合わせると、もつれを作れます。",
    group: "gate",
    aliases: ["CNOT"],
  },
  {
    id: "cz",
    word: "CZ・CCZ",
    short:
      "関わる量子ビットが全部 1 の組み合わせだけ、針を逆向きにするゲート。確率は変わらず、「印」をつけるのに使います。",
    group: "gate",
    aliases: ["CZ"],
  },
  {
    id: "oracle",
    word: "オラクル",
    short:
      "探している答えにだけ「印」をつける部分。印とは針を逆向きにすることなので、この時点では確率は変わりません。",
    group: "gate",
    aliases: ["オラクル"],
  },
  {
    id: "diffusion",
    word: "拡散",
    short:
      "全部の振幅の平均を軸にして、振幅を折り返す操作。オラクルで逆向きにされた答えの振幅だけが大きくなり、ほかは小さくなります（干渉を使っています）。",
    group: "gate",
    aliases: ["拡散", "平均のまわりで"],
  },
  {
    id: "global-phase",
    word: "全体にかかる位相",
    short:
      "すべての針が同じだけ回っている状態。針どうしの向きの差は変わらないので、測定結果にはまったく影響しません。",
    group: "gate",
    aliases: ["全体にかかる位相"],
  },
  {
    id: "qubo",
    word: "QUBO",
    short:
      "0/1 で答える「はい・いいえ」の選択を組み合わせて、点数（コスト）が一番低い組み合わせを探す問題の書き方。「この2つを同時に選ぶと減点」のようなルールを点数として書きます。",
    group: "anneal",
    aliases: ["QUBO"],
  },
  {
    id: "penalty",
    word: "罰点（ペナルティ）",
    short:
      "守ってほしいルールを破ったときに足す点数。「ちょうど2人選ぶ」なら、2人でないときに点数を上げます。",
    group: "anneal",
    aliases: ["罰点", "ペナルティ"],
  },
  {
    id: "energy",
    word: "エネルギー",
    short:
      "ここでは「答えの点数」のこと。QUBO の点数を物理の言葉で言い換えたもので、低いほど良い答えです。",
    group: "anneal",
    aliases: ["エネルギー"],
  },
  {
    id: "hamiltonian",
    word: "ハミルトニアン",
    short:
      "状態ごとのエネルギーを決める式。QUBO の点数表を物理の言葉で書き直したものと考えて構いません。",
    group: "anneal",
    aliases: ["ハミルトニアン"],
  },
  {
    id: "ground",
    word: "基底エネルギー・基底状態",
    short:
      "一番低いエネルギーと、そのときの状態。最適化問題では「一番良い答え」にあたります。階段の図では一番下の線です。",
    group: "anneal",
    aliases: ["基底エネルギー", "基底状態", "一番低い状態", "一番下の段"],
  },
  {
    id: "level",
    word: "エネルギー準位",
    short:
      "その時点で取りうるエネルギーの値。階段の段のように並ぶので、下から1段目、2段目…と数えます。段のすき間が狭い所では、急ぐと上の段へ飛び移ってしまいます。",
    group: "anneal",
    aliases: ["準位", "すき間"],
  },
  {
    id: "annealing",
    word: "量子アニーリング",
    short:
      "答えが分かっている簡単な状態から、解きたい問題へゆっくり切り替えていき、一番低いエネルギーの状態に落ち着かせる方法。速すぎると最適でない答えに落ちます。",
    group: "anneal",
    aliases: ["アニーリング"],
  },
  {
    id: "qaoa",
    word: "QAOA",
    short:
      "量子アニーリングの「ゆっくり切り替える」を、ゲートを数段重ねた回路でまねる方法。段数が少ないと最適解を外すことがあります。",
    group: "anneal",
    aliases: ["QAOA"],
  },
  {
    id: "heuristic",
    word: "ヒューリスティック",
    short:
      "必ず最適解が出るとは限らないが、多くの場合に良い答えを出す方法。QAOA や量子アニーリングはこれにあたります。",
    group: "anneal",
    aliases: ["ヒューリスティック"],
  },
  {
    id: "frustration",
    word: "フラストレーション",
    short:
      "すべてのルールを同時には満たせない状態。三角形の3点を「隣どうしは違う色」で2色に塗ろうとすると、どこか1辺は必ず同じ色になります。",
    group: "anneal",
    aliases: ["フラストレーション"],
  },
  {
    id: "maxcut",
    word: "MaxCut",
    short:
      "点を2つのグループに分けて、グループをまたぐ線をできるだけ多くする問題。「つながった点どうしを違う色に塗る」と言い換えられます。",
    group: "anneal",
    aliases: ["MaxCut"],
  },
  {
    id: "vqe",
    word: "VQE",
    short:
      "回路でエネルギーを測り、普通のコンピュータが回路のつまみ（パラメータ）を直す、をくり返して一番低いエネルギーを探す方法。分子の計算に使われます。",
    group: "anneal",
    aliases: ["VQE"],
  },
];

export const termHash = (id: string): string => `#learn/term-${id}`;

/** Glossary entries whose aliases occur in `text`, in order of first appearance. */
export function termsIn(text: string, skip: readonly string[] = []): GlossaryEntry[] {
  const found: { entry: GlossaryEntry; at: number }[] = [];
  for (const entry of GLOSSARY) {
    if (skip.includes(entry.id)) continue;
    const hits = entry.aliases.map((a) => text.indexOf(a)).filter((i) => i >= 0);
    if (hits.length > 0) found.push({ entry, at: Math.min(...hits) });
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.entry);
}

export function glossaryEntry(id: string): GlossaryEntry {
  const entry = GLOSSARY.find((e) => e.id === id);
  if (!entry) throw new Error(`unknown glossary term: ${id}`);
  return entry;
}
