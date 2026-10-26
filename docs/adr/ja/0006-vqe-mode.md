# 0006: VQE モード、H2 の結合長、run_vqe が外れた先の三重項

[English](../en/0006-vqe-mode.md)

## Context（背景）

playground の例5（2量子ビットの横磁場イジング模型を `run_vqe` で解く）と例12（H2、STO-3G、4量子ビット、7つの結合長を `run_vqe` で解く）には、このアプリで動きを見る画面がありませんでした。使用例の一覧には「回路のパラメータを古典コンピュータが少しずつ直すループがない」と、その理由が書かれていました。

ユーザーから、まず VQE をアニメーションにできるか確かめるよう頼まれ、次に作るよう頼まれました。説明は数式を使わず、中学生にも分かるレベルにするという条件です。参考文献として次の2つを指定されました。

- [Quantum Native Dojo 5-1（Qulacs）](https://dojo.qulacs.org/ja/latest/notebooks/5.1_variational_quantum_eigensolver.html)
- [IBM Quantum Learning「Variational quantum eigensolver」](https://quantum.cloud.ibm.com/learning/en/courses/quantum-diagonalization-algorithms/vqe)

例12に載っていたハミルトニアンは 0.7414Å の1組だけでした。表では、1.5Å で `run_vqe` が FCI から +0.107564 Hartree 外れていて、例12はこれを局所解のためだと推測していました。

作業は playground 側のエージェントと（Orca 経由で）やり取りしながら進めました。

1. playground 側が、7つの結合長すべてのハミルトニアンを `assets/12_h2_hamiltonians.json`（コミット `724607b`）として公開した。
2. このリポジトリで、`run_vqe` が外れた値が、重なり合った励起状態の準位と一致することを見つけた。
3. playground 側が OpenFermion で、その準位が三重項（⟨S²⟩ = 2）であることを確かめ、1点を訂正した。この準位が2番目に低いのは 1.0Å 以上だけ、という点。

## Decision（決定）

- **4つ目のモード `#vqe`**（`src/vqe/`）を作り、`src/presets/hamiltonians.ts` にプリセットを2つ置いた。`ising`（例5）と `h2`（例12）。プリセットはそれぞれ `variants`（ハミルトニアン1つにつき1つ）を持つ。H2 は7つの結合長で、`src/presets/h2BondLengths.ts` に、例12の表にある `run_vqe` のエネルギーと一緒に写した。
- **計算**（`src/quantum/vqe.ts`）:
  - run_vqe と同じ形式のパウリ演算子の和のハミルトニアン（エルミート行列として持つ）。
  - 厳密なエネルギー準位。
  - 例5で逆算されている回路の形（アンザッツ）。RY 層と CZ チェーンを交互に `layers` = 2 回並べ、最後にもう一度 RY 層を置く。
  - パラメータシフト則による勾配降下。全ステップを残し、あとから再生できるようにした。
- **画面**:
  - 出発点 A〜E（ランダムな初期角度の seed）。
  - ステップの再生。
  - エネルギーのグラフ。横軸のステップ数は対数目盛で、大事な差のところを拡大する。厳密解・HF・三重項を線で引く。
  - パラメータはつまみとして、状態は円と針で描く。
  - H2 には結合長の切り替えと、FCI・HF・三重項・`run_vqe` の結果・いまの値を描いた曲線。
- **数式なしの説明**（`VqeIntro.tsx`）:
  - たとえは「目かくしをして山の谷底を探す」。
  - 3ステップのくり返し。量子コンピュータが状態を作り、何回も測った平均でエネルギーを出す。普通のコンピュータが坂の向きを調べて、つまみを回す。
  - 変分原理: どの状態も本当の一番低いエネルギーより下には行けない。
  - うまくいかない場合: 回路の形が答えを作れない、途中のくぼみで止まる、坂がほとんど平らで進む向きが分からない。
  - このページの最適化の方法は `run_vqe` とは違うこと。
  - 2つの参考文献は、ここと「もっと知りたい人へ」からリンクした。用語集に VQE のグループ（パラメータ、アンザッツ、期待値、変分原理、勾配、局所解、HF、厳密解、スピン、励起状態、三重項）を足し、言い回しは playground の `docs/basics.md` にそろえた。
- **ステップの説明で、実行がどうなったかを伝える**: 厳密解に届いた、HF で止まった、三重項で止まった、のどれか。止まった値がその結合長での `run_vqe` の値と一致するときは「playground の run_vqe も、この距離ではこの状態で止まっていました」と付け加える。
- `examples.ts` の例5と例12から、`#vqe/ising` と `#vqe/h2` へリンクした。

## Reason（理由）

**最適化は素直なパラメータシフト則＋勾配降下で、全ステップを残す。**

```ts
const trace: VqeStep[] = [{ params: [...start], energy: energy(start) }];
for (let s = 0; s < steps; s++) {
  const { params } = trace[trace.length - 1];
  const grad = params.map(
    (_, i) =>
      (energy(shifted(params, i, Math.PI / 2)) - energy(shifted(params, i, -Math.PI / 2))) / 2,
  );
  const next = params.map((v, i) => v - rate * grad[i]);
  trace.push({ params: next, energy: energy(next) });
}
```

- **差分ではなくパラメータシフト（±π/2）にした**: RY なら正確な坂の向きが出て、しかも言葉で説明できる。「つまみを1つずつ4分の1回転だけ両方向に回して測り、その差で下り坂の向きが分かる」。
- **Powell や COBYLA ではなく素直な勾配降下にした**（Qulacs Dojo は Powell を使っている）: 毎ステップ、すべてのつまみを下り坂の向きに少しずつ回すので、つまみとエネルギーのグラフがコマごとになめらかに変わる。微分を使わない方法は直線探索をするので、跳んで見えてしまう。
- **全ステップを残す**: スライダーやグラフのクリックで、どのステップにも飛べる。
- **`rate` と `steps` をプリセットごとに変えた**（イジングは 0.2・60、H2 は 0.5・1000）: イジングを 0.5 で動かすと、40通りの出発点のうち1000ステップで −√5 に届いたのは29通りだけだった。0.2 なら40通りすべてが60ステップ以内に届く。playground 側も自分の numpy 実装で同じ傾向（0.5 で40通り中31）を確かめ、例5に両方の条件を書いた。

**実数だけで計算する速い道を作り、一般のシミュレータとの一致をテストで押さえる。**

```ts
export function ansatzEnergy(h: Hamiltonian, layers: number, params: readonly number[]): number {
  // RY and CZ keep every amplitude real: one array, updated in place
  // ... RY rotates pairs (i, i|bit) by params[l*n+q]/2; CZ negates entries with both bits set
  let e = 0;
  for (let r = 0; r < size; r++) {
    let row = 0;
    for (let c = 0; c < size; c++) row += h.re[r * size + c] * v[c];
    e += v[r] * row;
  }
  return e;
}
```

```ts
expect(ansatzEnergy(h, p.layers, params)).toBeCloseTo(
  expectation(h, prepare(p.n, p.layers, params)),
  12,
);
```

- 最初の版は、どのゲートも複素数で扱う `applyGate` を通していた。H2 の再生（つまみ12個 × 2方向 × 1000ステップ）に出発点1つあたり約1.4秒かかり、出発点4つでは画面が約6秒固まった。
- RY と CZ は虚数部を作らない。状態が実数なら、エルミートな H の虚数部は反対称なので ⟨ψ|H|ψ⟩ から消え、`h.re` だけで済む。
- 直したあとは、結合長の切り替え（出発点5つ × 1000ステップ）が約0.6秒になった（ブラウザで計測）。
- テストでは、すべての variant でこの速い道と一般の計算を12桁まで比べている。速い道だけがいつのまにかずれることはない。

**厳密な準位は実数行列に埋め込んで、アニーリングの固有値ソルバーを使い回す。**

```ts
m[r * d + c] = a;
m[(r + size) * d + c + size] = a;
m[r * d + c + size] = -b;
m[(r + size) * d + c] = b;
const vals = [...eigSym(m, d).vals].sort((x, y) => x - y);
return vals.filter((_, k) => k % 2 === 0);
```

- H2 のハミルトニアンには Y の項があるので、行列は複素数になる。`eigSym`（ADR 0001 のアニーリングのコード）は実対称行列しか扱えない。
- A + iB の固有値は、[[A, −B], [B, A]] の固有値と同じで、それぞれが2回ずつ出てくる。並べて1つおきに取れば、複素数用の固有値ソルバーを足さずに準位が出る。

**エネルギーのグラフは大事な差を拡大し、どの出発点の終点も範囲に入れる。**

```ts
const ends = Math.max(...traces.map((t) => t[t.length - 1]));
const zoomTop = reference
  ? Math.max(exact + 4 * (reference.energy - exact), ends + 0.1 * (ends - exact))
  : top;
const hi = Math.min(top, zoomTop);
const x = (k: number) => M.left + (Math.log1p(k) / Math.log1p(steps)) * plotW;
```

- 0.7414Å では、出発点は −0.4 あたりから始まり、HF と FCI の差は 0.02 しかない。全体を描くと、この差は見えない。けれども「HF で止まったかどうか」こそが見せたいこと。FCI から差の4倍の高さまでを描けば、はっきり見える。
- `ends` の項は、1.0Å で三重項に止まった出発点（−0.746）が、グラフの上端に平らに張り付いてしまったので足した。
- 横軸を対数（`log1p`）にしたのは、どの出発点も最初の10ステップほどで急に下がり、そのあと何百ステップもかけてゆっくり進むから。普通の目盛りだと、最初の急な下がりが左端の縦線になってしまう。

**出発点はそれぞれの結末が見えるように選び、テストで固定する。**

```ts
// 3 reaches FCI near equilibrium, 1 stops at Hartree-Fock there, 10 stops in the
// spin-aligned state at 1.5 Å and beyond (where run_vqe did), and 6 already does so at 1 Å.
seeds: [3, 1, 10, 2, 6],
```

```ts
const spin = basisEnergy(h, p.spinAligned!.bits) + v.offset; // |1010⟩
expect(basisEnergy(h, "0101") + v.offset).toBeCloseTo(spin, 9);
expect(energyLevels(h)[1] + v.offset).toBeCloseTo(spin, 6); // x ≥ 1.0 Å
if (x > 1) expect(Math.abs(v.playgroundEnergy! - spin)).toBeLessThan(1e-5);
```

- seed は、すべての結合長で seed 1〜12、1.0Å では 1〜40 を調べて選んだ。でたらめに4つ選ぶと、3つの結末のうち1つしか見えないことが十分ありえる。
- **三重項について分かったこと**:
  - `run_vqe` は 1.5Å で −0.890585 を返した。三重項の準位は −0.890585 で、差は 2e-7。2.0Å では差 1e-6、2.5Å では 5e-6。
  - このページの出発点も、同じ値で止まる。
  - つまり `run_vqe` は「ただの局所解」に捕まったのではなく、三重項に収束していた。三重項は厳密な固有状態なので、坂の向き（勾配）がちょうど0になる。
  - 原子どうしが離れるほど、三重項は一重項の基底状態に近づく。差は 1.0Å で 0.355 Hartree、1.5Å で 0.108、2.0Å で 0.024、2.5Å で 0.0044（playground、OpenFermion）。
- **画面では「2番目に低い準位」ではなく「三重項」と呼ぶ**: playground 側の指摘によると、1Å より短い所では、基底状態と三重項の間に電子1個の準位が入る（qubit のハミルトニアンは、電子の数が違う状態もすべて含むため）。テストでも、0.7414Å で2番目の準位が −0.538710、三重項が −0.532479 であることを記録している。
- **HF で止まるのは別の種類**: HF の値はどの準位とも一致しないので、固有状態ではなく、回路の形の上の平らな停留点。説明文でも2つを分けている。

**H2 のデータは写しで、出どころをファイルに書いてある。**

- `tsconfig` に `resolveJsonModule` がないので、JSON を一度 TS のモジュールに変換した。ファイルの先頭に、`assets/12_h2_hamiltonians.json` のコミット `724607b` と書いてある。どの結合長でも、HF と FCI を例12の表と照らし合わせるテストがあるので、写し間違えれば落ちる。

## Alternatives rejected（採らなかった案）

- 最適化を Web Worker で動かす: 速い道でメインスレッドでも約0.6秒になったので、Worker のためのコードやメッセージのやり取りを足しても、得るものは少ない。
- ビルド時に計算を済ませておく: seed と結合長ごとのデータを同期させ続ける必要がある。その場で計算しても十分速い。
- 最適化の地形（2次元の断面）を描く: パラメータが6個や12個あると、どの断面を選ぶかは恣意的になり、くぼみの場所について誤解させかねない。
- グラフの参照線を1つのリストにまとめる（HF と三重項を同じ扱いにする）: HF は拡大の範囲と「HF で止まった」の説明を決めている。三重項は、拡大した範囲に入るときだけ描く。別々に持つほうが変更が小さく済んだ。
- 画面で三重項を「2番目の励起準位」と呼ぶ: 1Å より短い所では正しくない（上を参照）。

## Consequences（影響）

- このページの「何ステップで届くか」や「何通り届くか」は、`run_vqe` とは比べられない。VQE の画面の説明と playground の例5の両方にそう書いてある。比べているのは止まったエネルギーだけ。
- playground の JSON が変わったら、`h2BondLengths.ts` を作り直す必要がある。リポジトリをまたいで確かめる仕組みは、表との照合テストのほかにはない。
- 速い道は、回路の形が実数だけ（RY + CZ）であることを前提にしている。RX・RZ や複素数のゲートを回路に足すなら `ansatzEnergy` を直す必要があり、直すまでは一致のテストが落ちる。
- 0.30Å の `run_vqe` の値（−0.594490）はどの準位とも一致せず、どちらのリポジトリでも再現できていない。理由はまだ分からない。

## Verification（確認）

コミット `e5cd2dc`、`14ebcbc`、`985c019`。ログは ADR 0005 と同じ実行で、`985c019` の時点で取ったもの。

`vp check`:

```
pass: All 67 files are correctly formatted (465ms, 24 threads)
pass: Found no warnings, lint errors, or type errors in 48 files (716ms, 24 threads)
```

`vp test`（47件に `src/quantum/vqe.test.ts` を含む）:

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

テストで固定していること（`vqe.test.ts`）:

- 例5: 厳密解は −√5。用意したどの seed も届き、そのときの状態の割合が playground の top_states（01 = 10 ≈ 0.361804、00 = 11 ≈ 0.138196）と4桁まで一致する。
- 例12:
  - 7つの結合長の HF と FCI が、例12の表と5桁まで一致する。
  - 0.7414Å では、FCI に届く seed と HF で止まる seed があり、収束した状態は 1100 が中心で 0011 が少し混ざる。
  - 1.5・2.0・2.5Å では、ある seed が `run_vqe` の値から 1e-3 以内で止まる。
  - 三重項は、1.0Å 以上で2番目の準位と一致し、1.5Å 以上で `run_vqe` の値と一致する。
  - 1Å より短い所では、三重項は2番目の準位ではない。
- 変分原理: どのステップも厳密解より下には行かない。

playground 側の独立した実装（numpy と OpenFermion）との突き合わせ（向こうのエージェントの報告を、こちらと比べた）:

- JSON の `hf_energy` と `fci_energy` は、7点すべてでこのリポジトリの計算と 1e-8 以内で一致した。
  Verified-by: Claude Opus 5.5 (AI agent), 2026-10-26
- `run_vqe` が行き着いた 1.0〜2.5Å の準位は ⟨S²⟩ = 2、基底状態は ⟨S²⟩ = 0。これは playground 側のエージェントが計算したもので、このリポジトリでは S² を計算していない。

ブラウザでの確認:

- `vp preview` に対して Playwright（Chromium）で、1200px・820px・390px で確かめた。結果は次のとおり。
  - `#vqe/ising` で再生すると −2.2361 まで下がり、「届いた」説明が出る。
  - `#vqe/h2` で出発点 B は −1.116684 で止まり、HF の説明が出る。
  - 1.5Å で出発点 C は三重項の説明（「playground の run_vqe も…」を含む）で終わり、曲線では中抜きの輪が `run_vqe` の四角に重なる。
  - 1.0Å で出発点 E は三重項の線の上で止まる。
  - どの幅でも scrollWidth はビューポートと同じで、ページエラーはない。
    Verified-by: Claude Opus 5.5 (AI agent), 2026-10-26

操作の記録:

- **操作:** `main` をプッシュして GitHub Pages にデプロイ（3回）
  **意図:** 公開ページに、`#vqe`（`e5cd2dc`）、結合長の切り替え（`14ebcbc`）、三重項の線と説明（`985c019`）が順に出ること
  **対象:** github.com/Wanyaldee/quantum-visualizer、GitHub Pages
  **実行者:** Claude Opus 5.5 (AI agent), 2026-10-26

  ```
     c72cbed..e5cd2dc  main -> main
     e5cd2dc..14ebcbc  main -> main
     14ebcbc..985c019  main -> main
  ```

  デプロイのワークフロー run 40331872308、40336965879、40339904237: すべて `success`。
  Verified-by: Claude Opus 5.5 (AI agent), 2026-10-26。それぞれのデプロイのあと、公開中の JS にその回で足した文言（「つまみを回して、一番低いエネルギーを探す」「原子どうしの距離を変えると」「三重項（スピンがそろった状態）」）が含まれることを確かめた。

確認していないこと:

- VQE の説明が中学生に分かるかを人が読んで確かめてはいない。実機で画面を使ってもいない。
- `run_vqe` の中の最適化の方法は分からない。「三重項に収束した」は、エネルギーの一致（2e-7〜5e-6）と playground の top_states からの推測で、`run_vqe` の中を見て確かめたものではない。
- 新しく足した色 `--spin` のダークモードでの見え方は、目で確かめていない。
