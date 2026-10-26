import { useMemo } from "react";
import { DistributionBars } from "../anneal/DistributionBars";
import { ProblemGraph } from "../anneal/ProblemGraph";
import { SpectrumChart } from "../anneal/SpectrumChart";
import { PhaseLegend } from "../gate/AmplitudeDials";
import { playgroundDoc } from "../presets/examples";
import { basisLabel, probabilities, sample, type Gate, type State } from "../quantum/gate";
import { SlideDeck, type Frame, type Slide } from "../ui/SlideDeck";
import { cx, cz, h, maxcutDemo, POINTS, run, s, x, z } from "./demo";
import { Dials, Measured, Row } from "./DemoViews";

function BeforeAfter({ n, before, gate }: { n: number; before: Gate[]; gate: Gate }) {
  return (
    <div className="before-after">
      <Row label="かける前">
        <Dials n={n} gates={before} />
      </Row>
      <Row label={`${gate.gate} をかけた後`}>
        <Dials n={n} gates={[...before, gate]} />
      </Row>
    </div>
  );
}

function useSlides(): Slide[] {
  return useMemo(() => {
    const plus = run(1, [h(0)]);
    const bell = run(2, [h(0), cx(0, 1)]);
    const shots = (state: State, k: number) => sample(probabilities(state), k);

    const demo = maxcutDemo();
    const { problem: maxcut, raw, ground, sp, gapK, slow, fast } = demo;
    const bits = (i: number) => Array.from({ length: maxcut.n }, (_, q) => (i >> q) & 1);
    const oneHot = (i: number) => Float64Array.from(raw, (_, k) => (k === i ? 1 : 0));

    const annealView = (run: typeof slow, k: number) => (
      <div className="slide-charts">
        <SpectrumChart
          sp={sp}
          pops={run.pops}
          sIndex={k}
          groundCount={ground.size}
          onSeek={() => {}}
        />
        <DistributionBars
          n={maxcut.n}
          probs={run.probs(k)}
          energies={raw}
          ground={ground}
          describe={maxcut.describe}
        />
      </div>
    );

    const quboFrame = (i: number, extra: string): Frame => ({
      view: <ProblemGraph problem={maxcut} probs={oneHot(i)} />,
      caption: (
        <>
          <span className="ket">{basisLabel(i, maxcut.n)}</span>（{maxcut.describe(bits(i))}
          ）の点数は <strong>{raw[i]}</strong>。{extra}
        </>
      ),
    });

    return [
      {
        title: "量子ビットと重ね合わせ",
        kosen: (
          <p>
            <b>1年「数学ⅠB」指数関数</b>、<b>1年「電気情報基礎Ⅰ（情報）」2進数と情報量</b>
            ：円は 2<sup>n</sup> 個あっても、測って取り出せる情報は n
            ビットだけ。5年「情報・符号理論」の情報量で考えると、量子コンピュータが「なんでも一度に計算して読み出せる」わけではない理由が分かります。
          </p>
        ),
        school: (
          <p>
            <b>数学II「指数関数」</b>：円の数は 2<sup>n</sup> 。量子ビットが 10 個で約 1000、300
            個なら 2<sup>300</sup> ≈ 10<sup>90</sup> で、宇宙にある原子の数（約 10<sup>80</sup>
            ）より多くなります。このアプリが量子ビットを 5
            個までにしているのも、普通のコンピュータでは円の数が倍々で増えるからです。
          </p>
        ),
        body: (
          <p>
            普通のビットは 0 か 1 のどちらか。量子ビットは 0 と 1 を<strong>同時に</strong>
            持てます。n 個あれば 2<sup>n</sup>{" "}
            通りの状態が、それぞれ「振幅」という重みつきで重なります。
          </p>
        ),
        frames: [
          {
            view: <Dials n={1} gates={[]} />,
            caption: (
              <>
                円は「その結果が出る確率」を表します。いまは <span className="ket">|0⟩</span>{" "}
                の円だけが満タン。測れば必ず 0 が出る、普通のビットと同じ状態です。
              </>
            ),
          },
          {
            view: <Dials n={1} gates={[h(0)]} />,
            caption: (
              <>
                H ゲートをかけると、<span className="ket">|0⟩</span> と{" "}
                <span className="ket">|1⟩</span> の円が半分ずつに。0 と 1 が 50% ずつの重みで
                <strong>同時に</strong>存在しています。
              </>
            ),
          },
          {
            view: <Dials n={2} gates={[h(0), h(1)]} />,
            caption: (
              <>
                量子ビットが2つなら円は 2<sup>2</sup> = 4 つ。両方に H をかけると、4 通りが 25%
                ずつ重なります。量子ビットが1つ増えるたびに、円の数は2倍になります。
              </>
            ),
          },
        ],
      },
      {
        title: "振幅：大きさと向き",
        kosen: (
          <p>
            <b>3年「電気基礎」複素数の極座標表示・オイラーの式・フェーザ</b>
            ：この円と針は、交流回路のフェーザ図と同じ描き方です。振幅は re<sup>iθ</sup>{" "}
            の形の複素数で、r が大きさ、θ
            が針の向き。2年「数学ⅡD」のオイラーの公式がそのまま使われています。
          </p>
        ),
        school: (
          <p>
            <b>数学C「複素数平面」</b>：振幅は複素数で、針の向きは<b>偏角</b>
            、円の面積は絶対値の2乗です。Z ゲートは |1⟩ の振幅を −1 倍（180° 回転）、S ゲートは i
            倍（90° 回転）しているだけ。複素数をかけると回転する、がそのまま使われています。
          </p>
        ),
        body: (
          <p>
            振幅には<strong>大きさ</strong>と<strong>向き（位相）</strong>
            があります。このアプリでは大きさを円の面積（＝測ったときに出る確率）、向きを針と色で描いています。
          </p>
        ),
        frames: [
          {
            view: (
              <>
                <Dials n={1} gates={[h(0)]} />
                <PhaseLegend />
              </>
            ),
            caption: "50% ずつの重ね合わせ。針はどちらも右向き（位相 0）で、色も同じ青です。",
          },
          {
            view: (
              <>
                <Dials n={1} gates={[h(0), z(0)]} />
                <PhaseLegend />
              </>
            ),
            caption: (
              <>
                Z ゲートをかけると、<span className="ket">|1⟩</span>{" "}
                の針だけが半回転して左向きに（色も変わる）。円の大きさ＝確率は 50%
                のまま。測るだけでは、この違いは見えません。
              </>
            ),
          },
          {
            view: (
              <>
                <Dials n={1} gates={[h(0), s(0)]} />
                <PhaseLegend />
              </>
            ),
            caption:
              "S ゲートなら 1/4 回転して上向きに。向きは右と左の2つだけでなく、ぐるっと一周どこでも取れます。",
          },
        ],
      },
      {
        title: "測定",
        kosen: (
          <p>
            <b>3年「応用数学Ⅰ」二項分布・正規分布・標本平均の分布</b>：1000 回測って 0
            が出る回数は二項分布 B(1000, 1/2) に従い、平均 500、標準偏差 √(1000 × 1/2 × 1/2) ≈
            16。回数が多いと正規分布で近似できる、がそのまま見えます。
          </p>
        ),
        school: (
          <p>
            <b>数学B「統計的な推測」</b>
            ：回数を増やすほど、出た割合が確率に近づく（大数の法則）。50% の場合、ずれはほとんど（約
            95%）が ±1/√（回数）の中に収まり、10 回なら ±30% ほど、1000 回なら ±3%
            ほどです。実機の結果を読むときも同じ考え方を使います。
          </p>
        ),
        body: (
          <p>
            測ると重ね合わせは壊れ、確率に従ってどれか<strong>1つ</strong>
            だけが出ます。だから同じ回路を何百回も実行（shots）して、出た回数（counts）で確率を見ます。
          </p>
        ),
        frames: [
          {
            view: <Measured state={plus} n={1} counts={null} />,
            caption: "測る前。0 と 1 が 50% ずつ重なっています。",
          },
          {
            view: <Measured state={plus} n={1} counts={shots(plus, 1)} />,
            caption:
              "1回測ると、どちらか1つだけが出ます（棒の長さが出た回数）。1回では「50%」かどうかは分かりません。",
          },
          {
            view: <Measured state={plus} n={1} counts={shots(plus, 10)} />,
            caption: "10回。まだばらつきが大きく、半々からずれることもよくあります。",
          },
          {
            view: <Measured state={plus} n={1} counts={shots(plus, 1000)} />,
            caption:
              "1000回。細い縦線（理論上の確率）にほぼ重なりました。回数を増やすと、円の大きさが回数から読み取れます。",
          },
        ],
      },
      {
        title: "干渉",
        kosen: (
          <p>
            <b>3年「物理学Ⅱ」重ね合わせの原理・波の干渉・ヤングの実験</b>、
            <b>3年「電気基礎」正弦波の合成</b>
            ：同じ周波数の正弦波を足すときにフェーザ（複素数）を足すのと同じで、振幅を複素数のまま足してから2乗するので、打ち消し合いが起きます。
          </p>
        ),
        school: (
          <p>
            <b>物理「波の干渉」</b>
            ：山と山が重なれば強め合い、山と谷が重なれば打ち消し合う。水面の波や、ヤングの実験の明暗の縞と同じ仕組みが、確率の「波」で起きています。
          </p>
        ),
        body: (
          <p>
            向きのそろった振幅は強め合い、逆向きは打ち消し合います。量子アルゴリズムの仕事は、
            <strong>正解の振幅を強め、不正解を打ち消す</strong>
            ように向きをそろえることです（グローバー探索がその典型）。
          </p>
        ),
        link: { href: "#gate/interference", label: "ゲート式で1ステップずつ見る" },
        frames: (
          [
            [[], [], "上の段（H → H）と下の段（H → Z → H）を並べて比べます。どちらも |0⟩ から。"],
            [[h(0)], [h(0)], "H で半々に。この時点では上と下はまったく同じ状態です。"],
            [
              [h(0)],
              [h(0), z(0)],
              "下の段だけ Z。確率は 50% のまま同じですが、|1⟩ の針だけが逆向きになりました。",
            ],
            [
              [h(0), h(0)],
              [h(0), z(0), h(0)],
              "もう一度 H。上は |1⟩ の成分が打ち消し合って |0⟩ が 100%、下は逆に |1⟩ が 100%。確率は同じでも、向きの違いが答えを決めました。",
            ],
          ] satisfies [Gate[], Gate[], string][]
        ).map(([top, bottom, caption]) => ({
          view: (
            <>
              <Row label="H → H">
                <Dials n={1} gates={top} />
              </Row>
              <Row label="H → Z → H">
                <Dials n={1} gates={bottom} />
              </Row>
            </>
          ),
          caption,
        })),
      },
      {
        title: "もつれ（エンタングルメント）",
        kosen: (
          <p>
            <b>3年「応用数学Ⅰ」独立な試行・条件付き確率</b>：ベル状態では P(q1 = 0 | q0 = 0) = 1。q0
            の結果を知ると q1 の確率が変わる＝独立ではない、を条件付き確率で書くとこうなります。
          </p>
        ),
        school: (
          <p>
            <b>数学A「確率」の独立</b>：2つが独立なら P(A かつ B) = P(A)·P(B) 。q0 も q1 も 0 が 50%
            なので、独立なら 00 は 25% のはず。実際は 50% で、01 は
            0%。積の式が成り立たない＝独立でない、がもつれの数学的な意味です。
          </p>
        ),
        body: (
          <p>
            複数の量子ビットの結果が連動する状態。ベル状態では片方が 0 ならもう片方も必ず
            0。通信の例（超高密度符号化・BB84）はこの性質を使っています。
          </p>
        ),
        link: { href: "#gate/bell", label: "ベル状態をゲート式で見る" },
        frames: [
          {
            view: <Dials n={2} gates={[]} />,
            caption: "2つの量子ビットがどちらも 0（|00⟩）から始まります。",
          },
          {
            view: <Dials n={2} gates={[h(0)]} />,
            caption: (
              <>
                q0 に H。<span className="ket">|00⟩</span> と <span className="ket">|10⟩</span>{" "}
                が半々になりました（左端の文字が q0）。q1 はまだ 0 のままです。
              </>
            ),
          },
          {
            view: <Dials n={2} gates={[h(0), cx(0, 1)]} />,
            caption: (
              <>
                CNOT（q0 が 1 のときだけ q1 を反転）。<span className="ket">|10⟩</span> が{" "}
                <span className="ket">|11⟩</span> に移り、<span className="ket">|00⟩</span> と{" "}
                <span className="ket">|11⟩</span> だけが残ります。
              </>
            ),
          },
          {
            view: <Measured state={bell} n={2} counts={shots(bell, 1000)} />,
            caption:
              "1000回測っても、出るのは 00 と 11 だけ。01 や 10 は一度も出ません。片方が分かれば、もう片方も分かる。これがもつれです。",
          },
        ],
      },
      {
        title: "ビット列の読み方",
        kosen: (
          <p>
            <b>4年「論理回路」記数法と2進数</b>：論理回路で LSB（最下位ビット）・MSB
            と呼ぶものに当てはめると、blueqat は LSB（q0）を<b>左</b>
            に書いています。普段の2進数とは逆向きです。
          </p>
        ),
        school: (
          <p>
            <b>情報I「2進数」</b>：円の番号は 2 進数です。ただし blueqat は q0 を 1 の位にして
            <b>左に</b>書くので、<code>101</code> の番号は 1 + 0×2 + 1×4 = 5。普段の 2
            進数とは読む向きが逆です。
          </p>
        ),
        body: (
          <p>
            blueqat もこのアプリも<strong>左端が q0</strong>
            です（<code>bitstring[0]</code> = q0）。<code>101</code> は q0 = 1, q1 = 0, q2 =
            1。教科書によっては逆向きに書くので、よくつまずきます。
          </p>
        ),
        frames: [
          {
            view: <Dials n={3} gates={[]} />,
            caption: "3つの量子ビットがすべて 0。円は 2³ = 8 つで、満タンなのは |000⟩ です。",
          },
          {
            view: <Dials n={3} gates={[x(0)]} />,
            caption: (
              <>
                q0 に X（0 と 1 を入れ替え）。満タンになるのは <span className="ket">|100⟩</span>
                。q0 は<strong>左端</strong>の文字です。
              </>
            ),
          },
          {
            view: <Dials n={3} gates={[x(0), x(2)]} />,
            caption: (
              <>
                さらに q2 に X で <span className="ket">|101⟩</span>。左から q0 = 1, q1 = 0, q2 = 1
                と読みます。
              </>
            ),
          },
        ],
      },
      {
        title: "よく出るゲート",
        kosen: (
          <p>
            <b>2年「数学ⅡD」行列の演算</b>、<b>3年「数学ⅢA」線形変換</b>、
            <b>4年「応用数学Ⅱ」表現行列・正規直交基底</b>：ゲートは線形変換、|00⟩ や |01⟩
            は正規直交基底です。<b>4年「論理回路」</b>とも対応していて、x は NOT、cx は「相手 ← 相手
            XOR 制御」、ccx（トフォリ）は「相手 ← 相手 XOR (a AND
            b)」。量子回路は古典の論理回路も含んでいます。
          </p>
        ),
        school: (
          <p>
            <b>数学C「ベクトル」→ 大学の線形代数</b>：状態は 2<sup>n</sup>{" "}
            個の成分を持つベクトル、ゲートは行列です。x は (a, b) を (b, a) に入れ替える行列、z は
            (a, b) を (a, −b) にする行列。回路を1ステップ進めるのは「行列 × ベクトル」の計算です。
          </p>
        ),
        body: (
          <>
            <ul className="gate-list">
              <li>
                <code>h</code> 0 と 1 を半々に重ねる（重なっていれば干渉させて戻す）
              </li>
              <li>
                <code>x</code> 0 と 1 を入れ替える
              </li>
              <li>
                <code>z</code> 1 の向きを反転（確率は変わらない）
              </li>
              <li>
                <code>cx</code> 制御が 1 のときだけ相手を反転（CNOT）
              </li>
              <li>
                <code>cz</code> / <code>ccz</code> 全部 1 のときだけ向きを反転
              </li>
            </ul>
            <p className="term-foot">
              全一覧は <a href={playgroundDoc("docs/gates.md")}>対応ゲート一覧</a>。
            </p>
          </>
        ),
        frames: [
          {
            view: <BeforeAfter n={1} before={[]} gate={x(0)} />,
            caption: "x：|0⟩ の円が |1⟩ に移ります。普通のコンピュータの NOT と同じです。",
          },
          {
            view: <BeforeAfter n={1} before={[]} gate={h(0)} />,
            caption: "h：1つの円が、同じ大きさ・同じ向きの2つの円に分かれます。",
          },
          {
            view: <BeforeAfter n={1} before={[h(0)]} gate={z(0)} />,
            caption: "z：円の大きさはそのまま、|1⟩ の針だけが逆向きになります。",
          },
          {
            view: <BeforeAfter n={2} before={[x(0)]} gate={cx(0, 1)} />,
            caption: "cx：制御の q0 が 1 なので、相手の q1 が反転。|10⟩ が |11⟩ に移ります。",
          },
          {
            view: <BeforeAfter n={2} before={[h(0), h(1)]} gate={cz(0, 1)} />,
            caption:
              "cz：両方 1 の |11⟩ だけ針が逆向きに。確率は 25% ずつのまま変わりません。グローバー探索の「目印つけ」はこの形です。",
          },
        ],
      },
      {
        title: "QUBO",
        kosen: (
          <p>
            <b>4年「情報数学」最適化</b>、<b>3年「数学ⅢB」条件付き極値</b>
            ：連続な変数なら、微分して 0
            になる所を探したり、ラグランジュの未定乗数法で制約を扱ったりできます。QUBO は 0/1
            なので微分が使えず、制約は罰点として足します。なめらかな凸関数でもないので、局所最適解（少し変えても良くならないが、一番ではない答え）にはまりやすい問題です。
          </p>
        ),
        school: (
          <p>
            <b>数学I「2次関数」</b>：QUBO は2次式の最小値探し。ただし x は 0 か 1 だけなので x
            <sup>2</sup> = x になり、グラフを描いて頂点を探す方法は使えません。組み合わせが 2
            <sup>n</sup> 通りあるのが難しさの正体です。
          </p>
        ),
        body: (
          <p>
            0/1 の変数の2次式で書いた「点数表」。点数が一番<strong>低い</strong>
            組み合わせが答えです。「ちょうど2つ選ぶ」などのルールは、破ると点数が上がる
            <strong>罰点</strong>として足します。最大化したいときは符号を反転します。
          </p>
        ),
        link: { href: "#anneal/maxcut", label: "この問題をアニーリングで解く" },
        frames: [
          quboFrame(0, "全部同じ色で、色が分かれた線は1本もありません。"),
          quboFrame(1, "A だけ色を変えると、分かれた線が増えて点数が下がりました。"),
          quboFrame([...ground][0], "これ以上は下がらない、一番低い点数。この塗り方が答えです。"),
        ],
      },
      {
        title: "QAOA と量子アニーリング",
        kosen: (
          <p>
            <b>3年「数学ⅢA」固有値と固有ベクトル・線形微分方程式</b>、
            <b>4年「半導体物理」シュレーディンガー方程式・井戸型ポテンシャル</b>
            ：図の段は、各 s での行列 H(s) の<b>固有値</b>
            です（このアプリは実際に行列を対角化して描いています）。状態の動きは i dψ/dt = H(t/T) ψ
            という連立線形微分方程式で、H
            が時間とともに変わるので、ルンゲ＝クッタ法で数値的に解いています。
          </p>
        ),
        school: (
          <p>
            <b>物理「原子」のエネルギー準位</b>
            ：原子の電子がとびとびのエネルギーの段に乗り、光を受けると上の段へ飛び移る。図の線と丸はこれと同じです。「ゆっくり変えれば一番下の段に居続ける」ことは、大学の量子力学で
            <b>断熱定理</b>として習います。
          </p>
        ),
        body: (
          <p>
            どちらも QUBO を解く方法です。QAOA はゲート回路を数段重ねて近づける方法（playground の
            run_qaoa）、アニーリングは「簡単な問題」から「解きたい問題」へゆっくり切り替える方法（このアプリの
            <a href="#anneal">アニーリング</a>）。どちらも
            <strong>必ず最適解が出るとは限りません</strong>。
          </p>
        ),
        link: { href: "#anneal/maxcut", label: "アニーリングで速さを変えてみる" },
        frames: [
          {
            view: annealView(slow, 0),
            caption:
              "上の図の線はエネルギーの段、青い丸が状態の居場所です。s = 0 では丸は一番下の段にいて、下の棒はすべて同じ高さ（答えはまだ何も決まっていない）。",
          },
          {
            view: annealView(slow, 30),
            caption:
              "s を進めて、解きたい問題を少しずつ混ぜていきます。丸は一番下の段に乗ったまま、良い答え（左）の棒が伸び始めます。",
          },
          {
            view: annealView(slow, gapK),
            caption:
              "段と段のすき間が一番狭い所。ゆっくり進めていれば、丸はここでも一番下の段に残れます。",
          },
          {
            view: annealView(slow, POINTS - 1),
            caption:
              "s = 1 で問題そのものに。一番下の段は最適な答えにつながっていて（緑）、そこに確率が集まりました。",
          },
          {
            view: annealView(fast, POINTS - 1),
            caption:
              "同じことを急いで（T = 1）やると、丸が上の段に飛び移ってしまい、悪い答えも多く出ます。速さしだいで、最適解が出ないこともあります。",
          },
        ],
      },
    ];
  }, []);
}

export function BasicsSlides() {
  return <SlideDeck slides={useSlides()} label="基礎知識のスライド" />;
}
