# 0003: 両方の画面にスライドの見方ガイドを付け、学校で習った数学・物理とのつながりを書く

[English](../en/0003-lab-guides-and-school-notes.md)

## Context（背景）

ADR 0002 でアニメーション付きのスライドを入れたのは基礎ページだけでした。ゲート式とアニーリングの画面では、各パネルが何を表すのかを読む人が自分で考えるしかありませんでした。ワークショップの参加者は、学生か卒業して間もない人が中心です。「これは前に習ったことで、ここで使われている」と一言添えると内容に親しみが持て、学校で学んだことの意味も伝わります。

## Decision（決定）

- スライドの表示部分を `BasicsSlides.tsx` から `src/ui/SlideDeck.tsx`（`SlideDeck`・`Slide`・`Frame`）に移す。共有するデモ用のデータは `src/learn/demo.ts`、デモ用のコンポーネントは `src/learn/DemoViews.tsx` に置く。oxlint の `only-export-components` が、コンポーネントとそれ以外の export を同じファイルに混ぜることを禁じているため分けた。
- 各画面の見出しの下に折りたたみ（`SlideGuide`）を置き、`GateGuide`（4枚: 回路図と状態・円の読み方・測定・回路を組む）と `AnnealGuide`（4枚: 何をしている画面か・エネルギーの段・答えごとの確率・時間と正解率）を開けるようにする。
- `Slide.school` は「学校で習ったことが、ここで使われている」の囲みとして表示する。同じつながりは1か所にだけ書く。概念のつながりは基礎ページに、画面固有のもの（対数目盛、面積と確率、組み合わせの数）はガイドに書く。

| スライド                 | 科目                                  |
| ------------------------ | ------------------------------------- |
| 重ね合わせ               | 数学II 指数関数（2ⁿ、2³⁰⁰ ≈ 10⁹⁰）    |
| 振幅                     | 数学C 複素数平面（Z = ×(−1)、S = ×i） |
| 測定                     | 数学B 統計的な推測（約 95% で ±1/√N） |
| 干渉                     | 物理 波の干渉                         |
| もつれ                   | 数学A 独立（P(A∩B) ≠ P(A)P(B)）       |
| ビット列                 | 情報I 2進数（q0 が 1 の位）           |
| ゲート                   | 数学C ベクトル → 大学の線形代数       |
| QUBO                     | 数学I 2次関数（0/1 では x² = x）      |
| アニーリング             | 物理 原子のエネルギー準位、断熱定理   |
| ゲート式ガイド: 円       | 中学「相似」（面積比 = 相似比²）      |
| アニーリングガイド: 画面 | 数学A 場合の数（2⁴、2³⁰、2⁶⁰）        |
| アニーリングガイド: 段   | 物理基礎 力学的エネルギー             |
| アニーリングガイド: 時間 | 数学II 対数（対数目盛）               |

## Reason（理由）

**ガイドは開いている間だけマウントする。**

```tsx
const [open, setOpen] = useState(false);
return (
  <details className="guide" onToggle={(e) => setOpen(e.currentTarget.open)}>
    <summary>{summary}</summary>
    {open && children}
  </details>
);
```

- 閉じた `<details>` の中身も描画はされる。`open &&` がないと、コマ送りのタイマーが裏で再描画を続け、アニーリングガイドの `evolve`（T = 1, 20, 300）も画面を開くたびに走ってしまう。

**アニーリングガイドは、画面と同じ時間軸を使う。**

```tsx
<AnnealGuide Ts={T_GRID} tMin={T_MIN} tMax={T_MAX} />
```

- props で渡すことで、対数軸の定義を1か所にまとめ、循環 import（`AnnealLab` → `AnnealGuide` → `AnnealLab`）も避けられる。
- ガイドは選んでいるプリセットではなく、常に 4 点の MaxCut を使う。キャプションがその数値を引用している（`pct(careful.p)`）ので、問題が決まっていないと文が正しくなくなるため。

**学校の囲みに出てくる数値は確かめた**: 2³⁰⁰ ≈ 2.0 × 10⁹⁰、2⁶⁰ ≈ 1.15 × 10¹⁸。p = 0.5 では 2σ = 2·√(0.25/N) = 1/√N なので、±1/√N は約 95% の範囲（N = 10 で ±32%、N = 1000 で ±3%）。q0 を 1 の位とすると `101` の番号は 1 + 0·2 + 1·4 = 5。

## Alternatives rejected（採用しなかった案）

- ガイドを最初から開いておく：毎回、画面の本体が下に押し出されてしまう。
- 数学・物理とのつながりを別ページにまとめる：説明している図のすぐ隣にあるほうが伝わる。
- すべてのスライドに囲みを付ける：回路図の読み方や測定ボタンのように、学校の内容と素直につながらないスライドもある。無理に付けると水増しに見える。

## Consequences（結果・影響）

- 科目名は 2022 年からの高校の学習指導要領に合わせた（複素数平面は数学C。それ以前に習った人は数学III）。
- ガイドは固定の例を使うので、選んでいるプリセットを変えても内容は変わらない。

## Verification（検証）

`vp check`: 警告・エラーなし。`vp test`: 27 件通過。`vp run build`: ビルド成功。

`vp preview` に対して Playwright で、3つのスライドすべてのスライドとコマを、幅 1200px と 390px で確認:

```
wide gate slides 4 max scrollWidth 1200
wide anneal slides 4 max scrollWidth 1200
wide learn slides 9 max scrollWidth 1200
phone gate slides 4 max scrollWidth 390
phone anneal slides 4 max scrollWidth 390
phone learn slides 9 max scrollWidth 390
errors []
```
