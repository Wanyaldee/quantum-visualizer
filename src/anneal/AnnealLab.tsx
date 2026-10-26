import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ANNEAL_PRESETS, type AnnealPreset } from "../presets/problems";
import {
  evolve,
  groundIndices,
  levelPopulations,
  MAX_SPINS,
  narrowestGap,
  parseQubo,
  quboEnergies,
  rescale,
  spectrum,
  successByTime,
} from "../quantum/anneal";
import { basisLabel } from "../quantum/gate";
import { pct } from "../ui/phase";
import { SlideGuide } from "../ui/SlideDeck";
import { AnnealGuide } from "./AnnealGuide";
import { DistributionBars } from "./DistributionBars";
import { ProblemGraph } from "./ProblemGraph";
import { SpectrumChart } from "./SpectrumChart";
import { SuccessChart } from "./SuccessChart";
import { ExampleLink } from "../ui/ExampleLink";
import { termsIn } from "../learn/glossary";
import { TermHints, Word } from "../ui/Word";
import { rememberPreset } from "../ui/route";

const POINTS = 101;
const T_MIN = 0.3;
const T_MAX = 500;
const T_GRID = Array.from({ length: 13 }, (_, i) => T_MIN * (T_MAX / T_MIN) ** (i / 12));
const PLAY_MS = 4000;

// Slider position 0..100 ↔ T on a log scale, so "fast" and "slow" both get room.
const tFromSlider = (v: number) => T_MIN * (T_MAX / T_MIN) ** (v / 100);
const sliderFromT = (t: number) => (100 * Math.log(t / T_MIN)) / Math.log(T_MAX / T_MIN);

const SPEEDS = [
  { label: "急ぐ", T: 1 },
  { label: "ほどほど", T: 20 },
  { label: "じっくり", T: 300 },
];

function customProblem(n: number, terms: AnnealPreset["terms"]): AnnealPreset {
  return {
    id: "custom",
    title: "貼り付けた QUBO",
    summary: "blueqat の run_qaoa に渡す形式の QUBO を、量子アニーリングで解いたらどう見えるか。",
    n,
    names: Array.from({ length: n }, (_, i) => `q${i}`),
    bitMeaning: ["1", "0"],
    terms,
    edges: terms
      .filter((t) => t.qubits.length === 2 && t.qubits[0] !== t.qubits[1])
      .map((t) => [t.qubits[0], t.qubits[1]]),
    describe: (bits) => `ビット列 ${bits.join("")}`,
  };
}

function phaseNote(s: number, gapS: number): string {
  if (s === 0)
    return "スタート地点。すべての答えが同じ確率で重なっている（問題のことはまだ何も知らない）一番低い状態から始めます。";
  if (s >= 1) return "s = 1 で、残っているのは問題そのものだけ。ここで測ると答えが1つ出ます。";
  if (Math.abs(s - gapS) < 0.08)
    return "準位のすき間が一番狭いあたり。ゆっくり進めていれば一番下の段に残れますが、急いでいるとここで上の段に飛び移ってしまいます。";
  if (s < 0.3) return "問題の影響が少しずつ入り始めました。まだ答えはほとんど決まっていません。";
  return "問題の影響が強まり、良い答え（左側）に確率が集まり始めます。";
}

export function AnnealLab({ initialPreset }: { initialPreset?: string }) {
  const [problem, setProblem] = useState<AnnealPreset>(
    () => ANNEAL_PRESETS.find((p) => p.id === initialPreset) ?? ANNEAL_PRESETS[0],
  );
  const [T, setT] = useState(20);
  const [sIndex, setSIndex] = useState(POINTS - 1);
  const [playing, setPlaying] = useState(false);
  const [json, setJson] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Expensive work is memoized per problem (spectrum, success curve) and per (problem, T)
  // (time evolution); the slider is deferred so dragging it stays responsive.
  const deferredT = useDeferredValue(T);
  const raw = useMemo(() => quboEnergies(problem.n, problem.terms), [problem]);
  const ep = useMemo(() => rescale(raw, problem.n), [raw, problem.n]);
  const ground = useMemo(() => new Set(groundIndices(raw)), [raw]);
  const sp = useMemo(() => spectrum(problem.n, ep, POINTS), [problem.n, ep]);
  const success = useMemo(() => successByTime(problem.n, ep, T_GRID), [problem.n, ep]);
  const snaps = useMemo(() => evolve(problem.n, ep, deferredT, POINTS), [problem.n, ep, deferredT]);
  const pops = useMemo(() => sp.map((pt, k) => levelPopulations(pt, snaps[k])), [sp, snaps]);

  const psi = snaps[sIndex];
  const probs = useMemo(() => psi.re.map((r, i) => r * r + psi.im[i] ** 2), [psi]);
  const final = snaps[POINTS - 1];
  const finalSuccess = [...ground].reduce((p, i) => p + final.re[i] ** 2 + final.im[i] ** 2, 0);

  const gapS = useMemo(() => sp[narrowestGap(sp, ground.size).k].s, [sp, ground]);

  // `playing` stays true at s = 1; `running` is what actually ticks.
  const running = playing && sIndex < POINTS - 1;
  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => setSIndex((k) => k + 1), PLAY_MS / POINTS);
    return () => clearTimeout(id);
  }, [running, sIndex]);

  const choose = (p: AnnealPreset) => {
    setProblem(p);
    setSIndex(POINTS - 1);
    setPlaying(false);
  };

  const load = () => {
    try {
      const { n, terms } = parseQubo(JSON.parse(json));
      choose(customProblem(n, terms));
      setError(null);
    } catch (e) {
      setError(
        e instanceof SyntaxError
          ? "JSON として読めません。括弧やカンマを確認してください"
          : (e as Error).message,
      );
    }
  };

  const s = sp[sIndex].s;
  const note = phaseNote(s, gapS);
  const top = [...probs.keys()].sort((a, b) => probs[b] - probs[a]).slice(0, 3);

  return (
    <div className="lab">
      <section className="presets" aria-label="題材">
        {ANNEAL_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="chip"
            aria-pressed={problem.id === p.id}
            onClick={() => {
              choose(p);
              rememberPreset("anneal", p.id);
            }}
          >
            {p.title}
          </button>
        ))}
      </section>

      <section className="stage">
        <header className="stage-head">
          <h2>{problem.title}</h2>
          <p className="lede">{problem.summary}</p>
          {problem.example && <ExampleLink no={problem.example} solvedBy="qaoa" />}
          <TermHints text={problem.summary} />
          <p className="panel-text">
            どの題材も、答えの良し悪しを点数表（
            <Word id="qubo" />
            ）で書いてあります。点数が一番低い答えが最適解です。ここではそれを
            <Word id="annealing" />
            で解き、途中の様子を見ます。
          </p>
        </header>

        <SlideGuide summary="この画面の見方（スライドで説明）">
          <AnnealGuide Ts={T_GRID} tMin={T_MIN} tMax={T_MAX} />
        </SlideGuide>

        <div className="anneal-controls">
          <div className="control">
            <label htmlFor="anneal-t">
              アニーリング時間{" "}
              <span className="ket">T = {T < 10 ? T.toFixed(1) : Math.round(T)}</span>
            </label>
            <input
              id="anneal-t"
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={sliderFromT(T)}
              onChange={(e) => setT(tFromSlider(Number(e.target.value)))}
            />
            <p className="control-hint">
              簡単な問題から解きたい問題へ切り替えるのにかける時間。大きいほどゆっくり切り替えます。
            </p>
            <div className="speed-row">
              {SPEEDS.map((sp) => (
                <button
                  key={sp.label}
                  type="button"
                  className="chip chip-small"
                  aria-pressed={Math.abs(T - sp.T) < 1e-9}
                  onClick={() => setT(sp.T)}
                >
                  {sp.label}（T = {sp.T}）
                </button>
              ))}
            </div>
          </div>
          <div className="control">
            <label htmlFor="anneal-s">
              進み具合 <span className="ket">s = {s.toFixed(2)}</span>
            </label>
            <input
              id="anneal-s"
              type="range"
              min={0}
              max={POINTS - 1}
              value={sIndex}
              onChange={(e) => {
                setPlaying(false);
                setSIndex(Number(e.target.value));
              }}
            />
            <p className="control-hint">
              s = 0 は答えの分かっている簡単な問題だけ、s = 1
              は解きたい問題だけ。途中はその2つを混ぜたものです。
            </p>
            <div className="speed-row">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (running) return setPlaying(false);
                  if (sIndex >= POINTS - 1) setSIndex(0);
                  setPlaying(true);
                }}
              >
                {running ? "止める" : sIndex >= POINTS - 1 ? "最初から再生" : "再生"}
              </button>
            </div>
          </div>
        </div>
        <p className="note" aria-live="polite">
          {note}
        </p>
        <TermHints text={note} skip={termsIn(problem.summary).map((t) => t.id)} />

        <div className="anneal-grid">
          <SpectrumChart
            sp={sp}
            pops={pops}
            sIndex={sIndex}
            groundCount={ground.size}
            onSeek={setSIndex}
          />
          <ProblemGraph problem={problem} probs={probs} />
          <DistributionBars
            n={problem.n}
            probs={probs}
            energies={raw}
            ground={ground}
            describe={problem.describe}
          />
          <SuccessChart
            Ts={T_GRID}
            success={success}
            T={deferredT}
            current={finalSuccess}
            tMin={T_MIN}
            tMax={T_MAX}
          />
        </div>

        <div className="answers">
          <h3 className="panel-title">
            {s >= 1 ? "最後に測ると出やすい答え" : `s = ${s.toFixed(2)} で測ると出やすい答え`}
          </h3>
          <ol>
            {top.map((i) => (
              <li key={i} data-answer={ground.has(i) || undefined}>
                <span className="ket">{basisLabel(i, problem.n)}</span>
                <span className="answer-p">{pct(probs[i])}</span>
                <span>
                  {problem.describe(Array.from({ length: problem.n }, (_, q) => (i >> q) & 1))}
                </span>
                {ground.has(i) && <span className="tip-answer">最適</span>}
              </li>
            ))}
          </ol>
          <p className="panel-foot">
            実機のアニーリングマシンは、<Word id="measurement">測る</Word>
            たびにこの確率どおりにどれか1つの答えを返します。最適解が必ず出るとは限らない（
            <Word id="heuristic" />
            な）方法なので、何回も実行して一番良いものを選びます。
          </p>
        </div>

        <details className="editor">
          <summary>自分の QUBO を試す</summary>
          <div className="editor-body">
            <label className="json-field">
              blueqat の run_qaoa 形式（{"{"}"coeff", "qubits"{"}"} の配列）で、変数は {MAX_SPINS}{" "}
              個まで
              <textarea
                rows={4}
                spellCheck={false}
                placeholder='[{"coeff": -1, "qubits": [0]}, {"coeff": 2, "qubits": [0, 1]}]'
                value={json}
                onChange={(e) => setJson(e.target.value)}
              />
            </label>
            <div className="field-row">
              <button type="button" className="btn" onClick={load} disabled={!json.trim()}>
                QUBO を読み込む
              </button>
              {error && (
                <p className="hint-error" role="alert">
                  {error}
                </p>
              )}
            </div>
          </div>
        </details>
      </section>
    </div>
  );
}
