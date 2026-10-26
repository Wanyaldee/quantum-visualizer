# 0005: 初学者向けの用語集、「H は重ね合わせを作る」、章をたためる学習ページ

[English](../en/0005-beginner-glossary-and-h-wording.md)

## Context（背景）

blueqat-mcp-playground がレビューで次の指摘を受けました。「ゲート式やアニーリング式の解説について動きを見せるのは良い試みですね。ただ、普段聞きなれない用語を説明なしに使っていることと、言葉の意味にも疑問もあります（アダマールゲートは干渉ではなく重ね合わせではないでしょうか？）」。playground 側は指摘を受け入れて自分のドキュメント（`docs/basics.md`、`docs/gates.md`）を直し、このリポジトリにも同じ修正を頼みました。

- H の説明が「重なっていれば干渉させて戻す」になっていた。場所は `GateLab.tsx` の `describeGate`、学習ページのゲート一覧、それに作業中の pull で入ってきた `BasicsSlides.tsx`。
- プリセット「干渉：H を2回かけると元に戻る」は、H が干渉そのものだと読めた。しかも回路は H→Z→H で結果は 1 なので、「元に戻る」というタイトルとも合っていなかった。
- ゲート式とアニーリングの画面に、専門用語（振幅、位相、状態ベクトル、オラクル、拡散、QUBO、罰点、ハミルトニアンなど）が説明なしに出ていた。対象は量子のことを何も知らない初学者。参考は [Qni](https://qniapp.github.io/qni/) の「円の大きさ＝出やすさ、針の向き＝位相」という見方。
- 用語集とスライドを足したあと、ユーザーから「学習ページが長くなったので、章をたためるか、すぐ飛べるようにしたい」と頼まれた。

## Decision（決定）

- **H の説明**: 説明しているすべての場所（ステップの説明、スライド、ゲート一覧）で「重ね合わせを作る。もう一度かけると元に戻る」にそろえた。干渉は現象として説明する（振幅どうしが足し合わさり、同じ向きなら強め合い、逆向きなら打ち消し合う）。用語集には「重ね合わせは状態、干渉は現象」と書いた。
- **プリセット `interference`**（id は変えていないので、今あるリンクはそのまま使える）: タイトルを「重ね合わせと干渉：H を2回かけると元に戻る」にし、回路を H, H, H, Z, H にした。1つの回路で H→H（0 に戻る）と H→Z→H（必ず 1）の両方を見せる。ステップの説明は「1回目の H は重ね合わせを作る」と「2回目の H で振幅が足し合わさり、干渉が起きる」を書き分けた。
- **スライド「アダマールゲート（H）は何をするのか」を新設**（0 に H、1 に H、重ね合わせに H）。干渉のスライドのタイトルは「干渉（ゲートではなく現象）」にした。
- **用語集**（`src/learn/glossary.ts`）: 最初は3つのグループで30語。ADR 0006 で VQE のグループが加わる。定義は playground の `docs/basics.md` にそろえた。読み手には3つの経路で届く。
  - `TermHints`: プリセットの概要と各ステップの説明の下に、たためる「この文に出てくる言葉」の一覧を出す。文から自動で作る。
  - `Word`: 画面の決まった文の中で、点線の下線付きリンクにする。マウスを乗せるか、キーボードで選ぶと説明が出る。
  - 学習ページの用語集の章: `#learn/term-<id>` でその章が開き、その用語の位置まで移動する。
- **「もっと知りたい人へ」**: Qni の「重ね合わせ」「位相」「円の表示」「H ゲート」の各ページにリンクした。
- **章をたためるようにした**: 学習ページを4つの `Chapter` に分け、最初はすべてたたんだ状態にした。「すべて開く／すべてたたむ」のボタンを置いた。`#learn/<章>` と `#learn/term-<id>` は、行き先の章を開く。`ExampleLink` のリンク先は `#learn/examples` にした。

## Reason（理由）

**1つの回路で2つの結果を見せ、各ステップをテストで固定する。**

```ts
gates: [h(0), h(0), h(0), z(0), h(0)],
```

```ts
const [, h1, hh, h3, hz, hzh] = simulateSteps(p.n, p.gates).map((s) =>
  Array.from(probabilities(s)),
);
for (const half of [h1, h3, hz]) {
  expect(half[0]).toBeCloseTo(0.5);
  expect(half[1]).toBeCloseTo(0.5);
}
expect(hh[0]).toBeCloseTo(1);
expect(hzh[1]).toBeCloseTo(1);
expect(p.title.startsWith("重ね合わせと干渉")).toBe(true);
```

- H→H だけでは「0 に戻る」は見せられても、針の向きがなぜ大事なのかは見せられない。H→Z→H だけ（前の回路）ではタイトルと矛盾する。2つを続けて並べると、「50%ずつ → 0」から「また 50%ずつ → Z は針しか変えない → 1」へと順にたどれる。
- タイトルのテストは、あとの修正で「干渉：H …」がいつのまにか戻ってくるのを防ぐためのもの。

**用語のヒントは、手で印を付けずに文字列から探す。**

```ts
export function termsIn(text: string, skip: readonly string[] = []): GlossaryEntry[] {
  const found: { entry: GlossaryEntry; at: number }[] = [];
  for (const entry of GLOSSARY) {
    if (skip.includes(entry.id)) continue;
    const hits = entry.aliases.map((a) => text.indexOf(a)).filter((i) => i >= 0);
    if (hits.length > 0) found.push({ entry, at: Math.min(...hits) });
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.entry);
}
```

- プリセット全体で説明文は60ほどある。用語ごとに手で印を付けると、説明文を直すたびにずれていく。用語ごとに表記の一覧（alias）を持てば、新しい説明文も自動で拾える。主な用語がプリセットの文で漏れなく拾えることはテストで確かめている。
- alias はぶつからないように選んだ。測定の基底は `"基底"` ではなく `"Z 基底"`・`"X 基底"` にしている。`"基底"` だと `"基底エネルギー"` にも当たってしまうため。まさにこの場合をテストで確かめている。
- `skip` には概要の下ですでに出した用語を渡し、ステップの説明で同じ用語をくり返さない。
- `TermHints` は `<details>` にした。説明文が長くならないよう最初は閉じている。一度開くと、React が同じ要素を使い回すので、ステップを進めても開いたまま残る。

**説明の吹き出しは、表示するまで 1px の切り抜かれた箱にしておく。**

```css
.word-tip {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.word:focus-visible .word-tip {
  width: max-content;
  max-width: min(20em, 80vw);
  height: auto;
  clip-path: none;
}
@media (hover: hover) {
  .word:hover .word-tip {
    /* same as focus */
  }
}
```

- 最初の版は `clip-path` と `opacity` だけで隠していた。隠れていても幅いっぱいの箱がレイアウトに数えられ、390px でページが横にはみ出した。scrollWidth は `#gate/grover` で 584、`#anneal/team` で 556（変更前はどちらも 390）。1px の箱なら、スクリーンリーダーはリンクの一部として読み上げられ、しかもレイアウトの幅は取らない。
- マウスを乗せたときの表示は `(hover: hover)` の環境だけにした。タッチ画面では、吹き出しを一瞬出す代わりに、タップで用語集へ移動する。

**たたんだ章は中身を描かない。**

```tsx
<details id={id} open={open} onToggle={(e) => onToggle(e.currentTarget.open)}>
  <summary>
    <h2>{title}</h2>
    <span className="chapter-hint">{hint}</span>
  </summary>
  {open && <div className="chapter-body learn-section">{children}</div>}
</details>
```

- 基礎の章にはスライドがあり、表示されている間はコマ送りのタイマーが動き続ける。開いているときだけ描けば、たたんだ章の裏でタイマーが止まる。代わりに、章を開き直すとスライドは最初からになる。
- 開閉の状態は、それぞれの `<details>` ではなく `LearnPage` が（章 id の `Set` として）持つ。こうすると「すべて開く」や `#learn/term-…` のリンクから章を開けて、`scrollIntoView` を呼ぶ時点で目的の要素がもう存在している。

## Alternatives rejected（採らなかった案）

- H→Z→H のままプリセット名だけ変える: 「元に戻る」というタイトルと結果（1）が合わないまま残る。
- 用語の説明に `src/ui/Tooltip.tsx` を使う: グラフの枠の中で位置を % で指定する部品で、文中の言葉の横に出すものではない。
- 開いた章の上に別の目次を置く: 一行の説明付きでたたんだ章が、そのまま目次として読める。
- 用語集の部品を `Glossary.tsx` と名付ける: 大文字小文字を区別しないファイルシステムでは、import の解決で `glossary.ts` とぶつかる。そのため `GlossarySection.tsx` にした。

## Consequences（影響）

- 新しいプリセットの説明文は、使った言葉が alias に入っていれば自動で用語ヒントが付く。新しい専門用語を使うときは用語集に足さないと、説明なしで出てしまう。
- 用語集の言い回しは、playground の `docs/basics.md` と手でそろえている。2つのリポジトリをまたいで確かめる仕組みはない。
- 章は最初たたんであるので、はじめて開いた人には見出しが4つ見えるだけで、中身は見えない。

## Verification（確認）

コミット `db218fa`。以下のログは、この変更を含む `985c019` の時点で取ったもの。

`vp check`:

```
pass: All 67 files are correctly formatted (465ms, 24 threads)
pass: Found no warnings, lint errors, or type errors in 48 files (716ms, 24 threads)
```

`vp test`:

```

 RUN  v5.0.5 /home/subgo/quantum-visualizer


 Test Files  5 passed (5)
      Tests  47 passed (47)
   Start at  23:30:19
   Duration  1.13s (tests 89%, import 5%, transform 4%, worker 2%)

```

`vp run build`:

```
$ tsc -b ⊘ cache disabled

$ vp build ⊘ cache disabled
transforming...
✓ 57 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.04 kB │ gzip:   0.63 kB
dist/assets/index-IuX5HyzQ.css   20.39 kB │ gzip:   5.27 kB
dist/assets/index-DNmkB0n7.js   366.13 kB │ gzip: 116.47 kB

✓ built in 220ms

---
vp run: 2/2 successful. (Run `vp run --last-details` for full details)
```

ブラウザでの確認:

- `vp preview` に対して Playwright（Chromium）で、1200px と 390px で確かめた。結果は次のとおり。
  - 1px の吹き出しに直したあと、`#gate/grover`・`#anneal/team`・`#learn` のどれも scrollWidth がビューポートと同じで、ページエラーはない。
  - スクリーンショットで、干渉のプリセットのステップ2に用語の一覧と吹き出しが出ることを見た。
  - 学習ページは最初すべての章がたたまれている。見出しを押すと開き、「すべて開く／すべてたたむ」で4つすべてが開閉する。
  - `#gate/bell` の「使用例の一覧と基礎知識」のリンクでは、使用例の章だけが開く。`#gate/grover` の `Word` リンクでは用語集が開き、`term-statevector` が強調される。
    Verified-by: Claude Opus 5.5 (AI agent), 2026-10-26

操作の記録:

- **操作:** `main`（`db218fa`。`e5cd2dc` と一緒）をプッシュし、GitHub Pages にデプロイ
  **意図:** 公開ページに、用語集・H の説明・章をたためる学習ページが出ること
  **対象:** github.com/Wanyaldee/quantum-visualizer、GitHub Pages
  **実行者:** Claude Opus 5.5 (AI agent), 2026-10-26

  ```
  To https://github.com/Wanyaldee/quantum-visualizer.git
     c72cbed..e5cd2dc  main -> main
  ```

  デプロイのワークフロー run 40331872308: `completed success`。
  Verified-by: Claude Opus 5.5 (AI agent), 2026-10-26。公開中の JS に「つまみを回して、一番低いエネルギーを探す」が含まれていて、2つのコミットを含むビルドが公開されたことを確かめた。

確認していないこと:

- 用語集とヒントを、人が実機で通して使ってはいない。新しい説明文を初学者に読んでもらってもいない。
- `Word` の吹き出し（リンクの文字＋説明）が実際のスクリーンリーダーでどう読まれるかは試していない。
