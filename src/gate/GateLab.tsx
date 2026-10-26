import { useEffect, useMemo, useState } from "react";
import { CIRCUIT_PRESETS } from "../presets/circuits";
import { GATE_ARITY, probabilities, sample, simulateSteps, type Gate } from "../quantum/gate";
import { AmplitudeDials, PhaseLegend } from "./AmplitudeDials";
import { CircuitDiagram } from "./CircuitDiagram";
import { SlideGuide } from "../ui/SlideDeck";
import { GateEditor } from "./GateEditor";
import { GateGuide } from "./GateGuide";
import { MeasureBars } from "./MeasureBars";
import { ExampleLink } from "../ui/ExampleLink";
import { rememberPreset } from "../ui/route";

const SHOTS = 1000;
const PLAY_MS = 1100;

interface Circuit {
  presetId: string | null;
  example?: number;
  title: string;
  summary: string;
  n: number;
  gates: Gate[];
  notes: string[] | null;
}

const fromPreset = (id: string): Circuit => {
  const p = CIRCUIT_PRESETS.find((c) => c.id === id) ?? CIRCUIT_PRESETS[0];
  return {
    presetId: p.id,
    example: p.example,
    title: p.title,
    summary: p.summary,
    n: p.n,
    gates: p.gates,
    notes: p.notes,
  };
};

// Fallback narration for hand-built circuits, where no preset note exists.
function describeGate(g: Gate): string {
  const q = g.qubits.map((x) => `q${x}`);
  const { controls } = GATE_ARITY[g.gate];
  const deg = g.params ? `${Math.round((g.params[0] * 180) / Math.PI)}°` : "";
  switch (g.gate) {
    case "h":
      return `H を ${q[0]} に：0 と 1 を同じ大きさで重ね合わせる（すでに重ね合わせなら、干渉させて戻す）。`;
    case "x":
      return `X を ${q[0]} に：0 と 1 を入れ替える。`;
    case "z":
      return `Z を ${q[0]} に：${q[0]} が 1 の状態の位相（針の向き）を反転。確率は変わらない。`;
    case "swap":
      return `${q[0]} と ${q[1]} の中身を入れ替える。`;
    case "rx":
    case "ry":
    case "rz":
      return `${g.gate.toUpperCase()}(${deg}) を ${q[0]} に：${g.gate[1].toUpperCase()}軸のまわりに回す。`;
    default:
      return controls > 0
        ? `${q.slice(0, controls).join("・")} がすべて 1 のときだけ、${q[controls]} に ${g.gate.slice(controls).toUpperCase()} をかける。`
        : `${g.gate.toUpperCase()} を ${q[0]} に。`;
  }
}

export function GateLab({ initialPreset }: { initialPreset?: string }) {
  const [circuit, setCircuit] = useState<Circuit>(() =>
    fromPreset(initialPreset ?? CIRCUIT_PRESETS[0].id),
  );
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [counts, setCounts] = useState<Uint32Array | null>(null);

  const states = useMemo(() => simulateSteps(circuit.n, circuit.gates), [circuit]);
  const total = circuit.gates.length;
  const current = states[Math.min(step, total)];
  const probs = useMemo(() => probabilities(current), [current]);

  // `playing` stays true at the end of the circuit; `running` is what actually ticks.
  const running = playing && step < total;
  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => {
      setStep((s) => s + 1);
      setCounts(null);
    }, PLAY_MS);
    return () => clearTimeout(id);
  }, [running, step]);

  // Counts describe one specific state; any change of state makes them stale.
  const goTo = (k: number) => {
    setStep(Math.max(0, Math.min(total, k)));
    setCounts(null);
  };

  const replace = (c: Circuit, at = 0) => {
    setCircuit(c);
    setStep(at);
    setPlaying(false);
    setCounts(null);
  };

  const note =
    step === 0
      ? "すべての量子ビットが |0⟩ から始まる。円は1つだけ満たされている（必ず 0…0 が出る）。"
      : (circuit.notes?.[step - 1] ?? describeGate(circuit.gates[step - 1]));

  return (
    <div className="lab">
      <section className="presets" aria-label="題材">
        {CIRCUIT_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="chip"
            aria-pressed={circuit.presetId === p.id}
            onClick={() => {
              replace(fromPreset(p.id));
              rememberPreset("gate", p.id);
            }}
          >
            {p.title}
          </button>
        ))}
      </section>

      <section className="stage">
        <header className="stage-head">
          <h2>{circuit.title}</h2>
          <p className="lede">{circuit.summary}</p>
          {circuit.example && <ExampleLink no={circuit.example} />}
        </header>

        <SlideGuide summary="この画面の見方（スライドで説明）">
          <GateGuide />
        </SlideGuide>

        <CircuitDiagram n={circuit.n} gates={circuit.gates} step={step} onStep={goTo} />

        <div className="stepper">
          <div className="stepper-buttons">
            <button type="button" className="btn" onClick={() => goTo(0)} disabled={step === 0}>
              最初へ
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => goTo(step - 1)}
              disabled={step === 0}
            >
              1つ戻る
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => goTo(step + 1)}
              disabled={step >= total}
            >
              1つ進める
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                if (running) return setPlaying(false);
                if (step >= total) goTo(0);
                setPlaying(true);
              }}
              disabled={total === 0}
            >
              {running ? "止める" : "自動で進める"}
            </button>
          </div>
          <p className="step-count">
            <span className="ket">{step}</span> / {total} ゲート
          </p>
        </div>
        <p className="note" aria-live="polite">
          {note}
        </p>

        <div className="state-grid">
          <div>
            <h3 className="panel-title">いまの状態</h3>
            <AmplitudeDials state={current} n={circuit.n} />
            <PhaseLegend />
          </div>
          <div className="measure-panel">
            <h3 className="panel-title">ここで測ると</h3>
            <p className="panel-text">
              測ると重ね合わせは壊れ、どれか1つの結果だけが出ます。何回も測って、円の大きさどおりに出るか確かめましょう。
            </p>
            <button
              type="button"
              className="btn btn-measure"
              onClick={() => setCounts(sample(probs, SHOTS))}
            >
              {counts ? "もう一度" : ""} {SHOTS} 回測ってみる
            </button>
            {counts && <MeasureBars counts={counts} probs={probs} n={circuit.n} />}
            {counts && (
              <p className="panel-foot">
                細い縦線は理論上の確率。回数がぴったり一致しないのは、測定が確率的だからです。
              </p>
            )}
          </div>
        </div>

        <GateEditor
          n={circuit.n}
          gates={circuit.gates}
          onChange={(n, gates) =>
            replace(
              {
                presetId: null,
                title: "自分で組んだ回路",
                summary: "ゲートを追加するたびに、最後のゲートの直後の状態が表示されます。",
                n,
                gates,
                notes: null,
              },
              gates.length,
            )
          }
        />
      </section>
    </div>
  );
}
