import { useEffect, useMemo, useState, type ReactNode } from "react";
import { DistributionBars } from "../anneal/DistributionBars";
import { ProblemGraph } from "../anneal/ProblemGraph";
import { SpectrumChart } from "../anneal/SpectrumChart";
import { AmplitudeDials, PhaseLegend } from "../gate/AmplitudeDials";
import { MeasureBars } from "../gate/MeasureBars";
import { ANNEAL_PRESETS } from "../presets/problems";
import {
  evolve,
  groundIndices,
  levelPopulations,
  narrowestGap,
  quboEnergies,
  rescale,
  spectrum,
} from "../quantum/anneal";
import {
  basisLabel,
  probabilities,
  sample,
  simulateSteps,
  type Gate,
  type State,
} from "../quantum/gate";
import { playgroundDoc } from "../presets/examples";

const FRAME_MS = 2600;
// The last frame carries the punchline, so it stays up longer before the loop restarts.
const LAST_FRAME_MS = 4200;
const POINTS = 101;

interface Frame {
  view: ReactNode;
  /** What this frame of the animation is showing, in plain words. */
  caption: ReactNode;
}

interface Slide {
  title: string;
  body: ReactNode;
  frames: Frame[];
  /** The lab view where the same behavior can be played with. */
  link?: { href: string; label: string };
}

const h = (q: number): Gate => ({ gate: "h", qubits: [q] });
const x = (q: number): Gate => ({ gate: "x", qubits: [q] });
const z = (q: number): Gate => ({ gate: "z", qubits: [q] });
const s = (q: number): Gate => ({ gate: "s", qubits: [q] });
const cx = (c: number, t: number): Gate => ({ gate: "cx", qubits: [c, t] });
const cz = (a: number, b: number): Gate => ({ gate: "cz", qubits: [a, b] });

/** State after running `gates` from |0…0⟩. */
const run = (n: number, gates: Gate[]): State => simulateSteps(n, gates)[gates.length];

function Dials({ n, gates }: { n: number; gates: Gate[] }) {
  return <AmplitudeDials state={run(n, gates)} n={n} />;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="slide-row">
      <span className="slide-row-label">{label}</span>
      {children}
    </div>
  );
}

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

function Measured({ state, n, counts }: { state: State; n: number; counts: Uint32Array | null }) {
  return (
    <div className="slide-measure">
      <AmplitudeDials state={state} n={n} />
      {counts ? (
        <MeasureBars counts={counts} probs={probabilities(state)} n={n} />
      ) : (
        <p className="panel-text">まだ測っていません。</p>
      )}
    </div>
  );
}

function useSlides(): Slide[] {
  return useMemo(() => {
    const plus = run(1, [h(0)]);
    const bell = run(2, [h(0), cx(0, 1)]);
    const shots = (state: State, k: number) => sample(probabilities(state), k);

    const maxcut = ANNEAL_PRESETS.find((p) => p.id === "maxcut") ?? ANNEAL_PRESETS[0];
    const raw = quboEnergies(maxcut.n, maxcut.terms);
    const ground = new Set(groundIndices(raw));
    const ep = rescale(raw, maxcut.n);
    const sp = spectrum(maxcut.n, ep, POINTS);
    const slow = evolve(maxcut.n, ep, 20, POINTS);
    const fast = evolve(maxcut.n, ep, 1, POINTS);
    const gapK = narrowestGap(sp, ground.size).k;
    const bits = (i: number) => Array.from({ length: maxcut.n }, (_, q) => (i >> q) & 1);
    const oneHot = (i: number) => Float64Array.from(raw, (_, k) => (k === i ? 1 : 0));

    const annealView = (snaps: typeof slow, k: number) => {
      const probs = Float64Array.from(snaps[k].re, (r, i) => r * r + snaps[k].im[i] ** 2);
      return (
        <div className="slide-charts">
          <SpectrumChart
            sp={sp}
            pops={sp.map((pt, j) => levelPopulations(pt, snaps[j]))}
            sIndex={k}
            groundCount={ground.size}
            onSeek={() => {}}
          />
          <DistributionBars
            n={maxcut.n}
            probs={probs}
            energies={raw}
            ground={ground}
            describe={maxcut.describe}
          />
        </div>
      );
    };

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
  const slides = useSlides();
  const [index, setIndex] = useState(0);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(
    () => !matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const slide = slides[index];
  const last = slide.frames.length - 1;

  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(
      () => setFrame((f) => (f >= last ? 0 : f + 1)),
      frame === last ? LAST_FRAME_MS : FRAME_MS,
    );
    return () => clearTimeout(id);
  }, [playing, frame, last]);

  const goSlide = (k: number) => {
    setIndex(Math.max(0, Math.min(slides.length - 1, k)));
    setFrame(0);
  };

  const pickFrame = (k: number) => {
    setPlaying(false);
    setFrame(k);
  };

  return (
    <div
      className="deck"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") goSlide(index + 1);
        if (e.key === "ArrowLeft") goSlide(index - 1);
      }}
    >
      <nav className="deck-tabs" aria-label="スライド">
        {slides.map((sl, k) => (
          <button
            key={sl.title}
            type="button"
            className="chip chip-small"
            aria-pressed={k === index}
            onClick={() => goSlide(k)}
          >
            {k + 1}. {sl.title}
          </button>
        ))}
      </nav>

      <article className="slide" aria-roledescription="スライド">
        <header className="slide-head">
          <span className="slide-no">
            {index + 1} / {slides.length}
          </span>
          <h3>{slide.title}</h3>
        </header>
        <div className="slide-grid">
          <div className="slide-visual">{slide.frames[Math.min(frame, last)].view}</div>
          <div className="slide-text">
            <div className="frame-controls">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  if (!playing && frame >= last) setFrame(0);
                  setPlaying(!playing);
                }}
              >
                {playing ? "止める" : "再生"}
              </button>
              <ol className="frame-dots" aria-label="アニメーションのコマ">
                {slide.frames.map((_, k) => (
                  <li key={k}>
                    <button
                      type="button"
                      aria-label={`${k + 1} コマ目`}
                      aria-current={k === frame ? "step" : undefined}
                      onClick={() => pickFrame(k)}
                    />
                  </li>
                ))}
              </ol>
            </div>
            <p className="slide-caption-title">このアニメーションの意味</p>
            <p className="note slide-caption" aria-live="polite">
              {slide.frames[Math.min(frame, last)].caption}
            </p>
            <div className="slide-body">{slide.body}</div>
            {slide.link && (
              <p className="slide-link">
                <a className="btn" href={slide.link.href}>
                  {slide.link.label}
                </a>
              </p>
            )}
          </div>
        </div>
        <footer className="slide-nav">
          <button
            type="button"
            className="btn"
            onClick={() => goSlide(index - 1)}
            disabled={index === 0}
          >
            ← 前へ
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => goSlide(index + 1)}
            disabled={index === slides.length - 1}
          >
            次へ →
          </button>
        </footer>
      </article>
    </div>
  );
}
