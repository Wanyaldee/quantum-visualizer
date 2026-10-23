# 0001: ゲート式・アニーリングの可視化を、ブラウザ内の厳密シミュレータで実装する

[English](../en/0001-in-browser-simulators.md)

## Context（背景）

このアプリの目的は、ワークショップの参加者（と作者自身）に、量子コンピュータが「どうやって」答えに
たどり着くのかを、ゲート式と量子アニーリングの両方について見せることです。姉妹リポジトリの
`blueqat-mcp-playground` には blueqat MCP で実行した回路や QUBO がすでにあります。ただし blueqat が返すのは
最終結果（測定回数や最後の状態ベクトル）だけで、可視化に必要な途中の状態は返ってきません。また、ブラウザから
呼ぶと API キーが露出し、ワークショップが会場のネットワークに依存してしまいます。

## Decision（決定）

- 量子計算はすべてブラウザ内で、2つの小さな厳密シミュレータで行う。
  - `src/quantum/gate.ts`: 状態ベクトルシミュレータ（5量子ビットまで）。ゲートごとにスナップショットを
    保持し、UI で回路を1ゲートずつ進めたり戻したりできるようにする。
  - `src/quantum/anneal.ts`: `H(s) = -(1-s) Σ X_q + s · H_P`（線形スケジュール `s = t/T`、6スピンまで）の
    シュレーディンガー方程式を RK4 で積分する。あわせて 101 点の格子上で `H(s)` を対角化（Jacobi 法）し、
    エネルギー準位と各準位にいる確率を描く。
- 入力形式は blueqat の JSON とビット順に合わせる（`{"gate","qubits","params"}`、`{"coeff","qubits"}`、
  `bitstring[0] = q0`）。playground の例をそのまま貼り付けられるようにするため。プリセットは playground の
  例1・2・3・13（ゲート式）と例14（アニーリング、QUBO はそのまま）を使う。
- ゲート式では各基底状態をダイヤルで表す。円の **面積** が確率、円の色と針の角度が位相。アニーリングでは、
  `s` に対するエネルギー準位と状態の居場所（点）、コスト順に並べた全ビット列の確率、問題のグラフ、
  アニーリング時間 `T` と正解率の関係を表示する。
- `.github/workflows/deploy.yml` で GitHub Pages に静的サイトとしてデプロイする。

## Reason（理由）

**確率だけでなく位相も描く。** 確率だけの棒グラフでは、グローバーのオラクルの段階（棒は全部 25% のまま）も、
`H Z H` で結果が 1 になる理由も見せられません。ダイヤルは両方を表します。

```tsx
<circle className="dial-disc" r={R * Math.sqrt(p)} style={{ fill: phaseColor(re, im) }} />
<g className="dial-needle" style={{ transform: `rotate(${-deg}deg)`, opacity: live ? 1 : 0 }}>
```

- `R * p` ではなく `R * Math.sqrt(p)`: 確率に比例させるのは半径ではなく面積。こうすると 25% の状態は、
  満杯の円の 1/16 ではなく 1/4 に見える。
- `rotate(-deg)`: SVG の y 軸は下向きなので、符号を反転して、教科書の複素平面と同じく位相を反時計回りにする。
- 色相を循環させる（`src/ui/phase.ts`、位相 0 は UI の `--amp` の青）のは、位相自体が循環する量だから。
  針が同じ角度を示すので、色だけで情報を伝えることはない。

**アニーリングの前にエネルギーをスケーリングする。**

```ts
export function rescale(e: Float64Array, n: number): Float64Array {
  ...
  const k = hi > lo ? n / (hi - lo) : 0;
  return e.map((v) => (v - lo) * k);
}
```

- 範囲を `[0, n]` に写すのは、横磁場項の広がり（`-n … n`）と同じ桁にするため。例14の係数をそのまま使うと
  （罰点 ×10、エネルギーが数百）、`s ≈ 0.01` から横磁場項が無視できるほど小さくなり、どの `T` でも同じ
  見た目になってしまう。
- 正の係数の一次変換なので、最適なビット列は変わらない（例14の `11000` / `10100` でテスト済み）。
- 意図的に残した副作用: チーム分けのプリセットでは罰点が依然として範囲の大部分を占め、良い答えどうしの
  差は 0.1 しかない。そのため正解率 90% 超には `T ≈ 300` が必要になる。これは罰点の重い QUBO の本当の性質で、
  教材として使えるので、`T_MAX = 500` にしている。

**RK4 の刻み幅。**

```ts
const perSegment = Math.max(4, Math.ceil(T / (points - 1) / 0.02));
```

- `dt ≤ 0.02` と `‖H‖ ≤ 2n ≤ 12` から `dt·‖H‖ ≤ 0.24` となり、RK4 の安定領域に十分収まる。テストでノルムが
  小数第6位まで 1 のままであることを確認している。
- 総ステップ数をスナップショット格子の整数倍にしているので、スナップショット `k` はちょうど `s = k/100` に
  あり、スペクトルの点 `k` と同じ `s` になる（各準位にいる確率は、この2つの重なりとして計算する）。

**Jacobi 法で固有値を求め、縮退した準位はまとめる。**

```ts
if (last && vals[i] - last.energy < DEGENERACY_TOL) {
  last.degeneracy++;
  last.rows.push(i * d);
}
```

- Householder+QL ではなく Jacobi 法: 約60行で依存ライブラリもなく、101 × (64×64) なら十分速い
  （コード中に `ponytail:` コメントで、Lanczos 法への移行方法とあわせて明記）。
- 確率は固有ベクトルごとではなく _準位ごと_ に合計する。縮退した準位の中では固有基底の選び方が任意なので、
  固有ベクトルごとの値は格子点ごとにちらついてしまう。

**「すき間が一番狭い所」の目印**（`narrowestGap`）は、`ev[1] - ev[0]` ではなく `ev[groundCount] - ev[0]` を
測る。MaxCut とチーム分けには最適解が2つあるので、2番目の準位に移っても最適解が出る。失敗とは、最適解に
つながる準位群の _上_ にある最初の準位に移ることだから。最初の実装は `ev[g] - ev[g-1]` を使っていて、
s = 0（縮退した2つの励起準位）を指していた。スクリーンショットで発見した。

**貼り付けられた信頼できない入力は検証する**（`parseCircuit`、`parseQubo`）。シミュレータに渡す前に、
量子ビット番号を `MAX_QUBITS` / `MAX_SPINS` 以下に制限し（`2^n` の配列を小さく保つ）、同じ量子ビットの
重複を拒否し、どの項目が間違っているかを日本語のメッセージで示す。

## Alternatives rejected（採用しなかった案）

- ページから blueqat MCP を呼ぶ: ブラウザに API キーが必要で、会場のネットワークに依存し、途中の状態も返らない。
- 量子計算用の JS ライブラリ（シミュレータパッケージなど）: ゲートの適用はここでは約40行。依存を増やすと
  サイズが増え、参加者が読みたいかもしれないコードが隠れてしまう。
- 量子ビットごとのブロッホ球: もつれを表せない（ベル状態の各量子ビットは「空」に見える）。ゲート式の
  プリセットで見せたいことの半分がもつれである。
- 量子アニーリングではなく古典の焼きなまし法（熱的アニーリング）: 断熱ギャップを見せられない。
  アニーリングのモードはそのギャップの仕組みを説明するためにある。
- グラフ描画ライブラリ: ホバー付きの専用 SVG グラフ4つを書くほうが、ライブラリを合わせ込むよりコードが
  少なく、依存も増えない。

## Consequences（結果・影響）

- 上限: 5量子ビット（ダイヤル32個）と6スピン（メインスレッドで 64×64 の対角化）。これより大きくするには
  Web Worker と Lanczos 法が必要。
- すべてノイズのない計算。フッターから playground の「シミュレータと実機の違い」にリンクしている。
- 回路途中の測定、`reset`、`GATE_ARITY` にないゲートは、貼り付け時に拒否される。
- スケジュールは線形 `s = t/T` のみ。

## Verification（検証）

`vp check`:

```
pass: All 32 files are correctly formatted (1064ms, 12 threads)
pass: Found no warnings, lint errors, or type errors in 21 files (2.1s, 12 threads)
exit 0
```

`vp test`（13件: プリセットの結果、blueqat のビット順・制御ビットの順、ccx、ノルムの保存、例14の最適解、
スペクトルの両端、遅いアニーリングと速いアニーリングの比較、パーサーのエラー検出）:

```
 RUN  v5.0.5 /home/ko200/quantum-visualizer


 Test Files  2 passed (2)
      Tests  13 passed (13)
   Start at  11:34:19
   Duration  738ms (tests 56%, import 23%, transform 14%, worker 7%)

exit 0
```

`vp run build`:

```
$ tsc -b ⊘ cache disabled

$ vp build ⊘ cache disabled
transforming...
✓ 33 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.04 kB │ gzip:  0.63 kB
dist/assets/index-fW4fvPus.css   10.76 kB │ gzip:  3.28 kB
dist/assets/index-WtEYukOl.js   261.16 kB │ gzip: 83.27 kB

✓ built in 576ms

---
vp run: 2/2 successful. (Run `vp run --last-details` for full details)
exit 0
```

ブラウザでの確認（`vp preview` に対して、Playwright のヘッドレス Chromium で実施）:

- 1280px ライト、1280px ダーク、390px スマホ幅でスクリーンショットを撮影: グローバーの3ゲート目と最後、
  MaxCut の T=20 と T=1、チーム分けの T=300 / s=0.55。コンソールエラーなし。これをもとに修正したもの:
  タイトルの最後の1文字だけが改行される問題、s=0 を指していたギャップの目印、辺に重なっていたグラフの
  ラベル、スマホで読めなかったグラフ（横長の2つのグラフに最小幅 520px を設定し、横スクロールにした）。
- ゲート編集で H を追加すると 50%/50% になる。`run_circuit` の引数オブジェクトを貼り付けると 3量子ビット・
  ダイヤル8個で読み込まれる。未対応ゲート `u` では `1番目のゲート: 未対応のゲート "u"` と表示される。
  QUBO を貼り付けると読み込まれ、最適解2つに印がつく。390px の画面で両モードともページの
  `scrollWidth` = 390。
  Verified-by: Claude Opus 5.5 (AI agent), 2026-10-23

デプロイ:

- **Operation:** `.github/workflows/deploy.yml` によるコミット `1b4675f` の GitHub Pages デプロイ
  **Intent:** https://wanyaldee.github.io/quantum-visualizer/ でこのビルドが配信される
  **Target:** GitHub Pages、`Wanyaldee/quantum-visualizer`
  **Run by:** GitHub Actions run 39890402877（push したのは Claude Opus 5.5、AI agent）、2026-10-23

  ```
  $ gh run view 39890402877 --json conclusion,headSha,updatedAt
  success 1b4675f 2026-10-23T02:36:04Z
  ```

  Verified-by: Claude Opus 5.5 (AI agent), 2026-10-23 — ヘッドレス Chromium で
  `https://wanyaldee.github.io/quantum-visualizer/#anneal` を開き、タイトル `量子のふるまい`、
  見出し `グラフを2色に塗り分ける（MaxCut）`、ページエラー 0件を確認

未検証:

- 実機のスマホやプロジェクタでの表示、キーボードだけでの一通りの操作。
- 物理の説明文（`src/presets/*.ts`）の人によるレビュー。
