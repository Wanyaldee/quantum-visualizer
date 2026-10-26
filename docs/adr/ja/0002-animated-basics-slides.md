# 0002: 基礎知識を、アプリ自身の図が動くスライドで説明する

[English](../en/0002-animated-basics-slides.md)

## Context（背景）

`#learn` の「最低限の知識」は文字だけのカードを並べたものでした。そこで説明している用語（重ね合わせ、位相、測定、干渉、もつれ、ビット順、QUBO、アニーリング）は、まさにゲート式とアニーリングの画面が描いているものです。しかしカードにはその図がなく、「円の面積」や「針の向き」が画面のどこに当たるのかは、読む人が自分で結びつけるしかありませんでした。

## Decision（決定）

- `src/learn/BasicsSlides.tsx` で、12 枚のカードのうち 9 枚をスライドに置き換える。各スライドは数コマから成り、1コマは本物の図（`AmplitudeDials`・`MeasureBars`・`ProblemGraph`・`SpectrumChart`・`DistributionBars`）と、「そのコマで何が起きているか」のキャプションの組。元のカードの説明文はその下に残す。
- コマは自動で進む（2.6 秒、最後のコマは 4.2 秒、その後くり返し）。一時停止、コマの選択、ボタン・タブ・←/→ キーでのスライド移動ができる。
- VQE、シミュレータと実機、量子が役に立つとは限らない、の3つは文字のカードのまま残す。このアプリには、動かして見せられるものがないため。

## Reason（理由）

**コマの中身は手で描かず、シミュレータで計算する。**

```tsx
const run = (n: number, gates: Gate[]): State => simulateSteps(n, gates)[gates.length];

function Dials({ n, gates }: { n: number; gates: Gate[] }) {
  return <AmplitudeDials state={run(n, gates)} n={n} />;
}
```

- ゲート式の画面と同じ円が出るので、スライドで覚えたことがそのまま画面を読むのに使える。キャプションが間違っていれば、図と食い違うのですぐ分かる。
- 続くコマは同じコンポーネントの木を描くので、React は SVG の要素を使い回し、既存の `.dial-disc` / `.dial-needle` の CSS transition が変化をアニメーションにする（「動き」はコマ間の transition で、アニメーションライブラリは使わない）。

**アニーリングのスライドでは、同じ問題をゆっくり解く場合と急いで解く場合を比べる。**

```tsx
const slow = evolve(maxcut.n, ep, 20, POINTS);
const fast = evolve(maxcut.n, ep, 1, POINTS);
```

- `T = 20` で `s = 0, 0.3, すき間が一番狭い所, 1` の4コマ、最後に `T = 1` の `s = 1`。「最適解が出るとは限らない」を、文で言うだけでなく図で見せる。

**動きを減らす設定のときは自動再生しない。**

```tsx
const [playing, setPlaying] = useState(
  () => !matchMedia("(prefers-reduced-motion: reduce)").matches,
);
```

- その設定では `index.css` がすでに transition を止めている。ここではさらにコマ送りのタイマーも止め、読んでいる途中でキャプションが変わらないようにする。

**グリッドの列は `minmax(0, 1fr)`。** これがないと、アニーリングのグラフの `min-width: 520px` がスライドを押し広げ、幅 390px でページ全体が横にスクロールした。

## Alternatives rejected（採用しなかった案）

- スライド用に CSS/SVG のキーフレームアニメーションを描く：円の描画を二重に持つことになり、シミュレータの結果とずれうる。
- スライドごとに `GateLab` / `AnnealLab` をまるごと埋め込む：最初に読むには操作が多すぎる。代わりに各スライドから対応するプリセットへリンクする。
- スライド用ライブラリ（reveal.js など）：中身は「何枚目か」とタイマーだけなので、依存を増やすほどではない。

## Consequences（結果・影響）

- `ProblemGraph` 自身の figcaption（「いま一番出やすい答え」）は、スライドの中では CSS で隠す。スライドのキャプションがその代わりになる。
- `SpectrumChart` には何もしない `onSeek` を渡している。そのため、スライド上でもホバー時のツールチップに「クリックでこの時点へ」と出るが、クリックしても何も起きない。
- 測定ともつれのスライドのサンプルはページを開くたびに1回引く（`Math.random`）ので、回数は毎回変わる。これは意図どおり。

## Verification（検証）

`vp check`:

```
pass: Formatting completed for checked files
pass: Found no warnings, lint errors, or type errors in 27 files
```

`vp test`: 3 ファイル、27 テストが通過。`vp run build`: ビルド成功。

`vp preview` に対して Playwright で `#learn` を確認:

```
no-preference 1 コマ目 -> 2 コマ目 | after ArrowRight: 振幅：大きさと向き
reduce 1 コマ目 -> 1 コマ目 | after ArrowRight: 振幅：大きさと向き
#learn [390,[]]          # 幅 390px でアニーリングのスライドを開いたときの scrollWidth。はみ出しなし
errors []                # 9 枚すべてで console / page のエラーなし
```
