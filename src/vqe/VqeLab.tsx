import { useEffect, useMemo, useState } from "react";
import { AmplitudeDials, PhaseLegend } from "../gate/AmplitudeDials";
import { termsIn } from "../learn/glossary";
import { VQE_PRESETS, type VqePreset, type VqeVariant } from "../presets/hamiltonians";
import {
  basisEnergy,
  descend,
  energyLevels,
  hamiltonian,
  paramCount,
  prepare,
  startingParams,
} from "../quantum/vqe";
import { ExampleLink } from "../ui/ExampleLink";
import { rememberPreset } from "../ui/route";
import { TermHints, Word } from "../ui/Word";
import { EnergyChart } from "./EnergyChart";
import { ParamKnobs } from "./ParamKnobs";
import { PotentialCurve, type CurvePoint } from "./PotentialCurve";
import { VqeIntro } from "./VqeIntro";

const TICK_MS = 60;
// A whole run plays in about this many ticks, whatever its number of steps.
const TICKS_PER_RUN = 100;
const START_NAMES = ["A", "B", "C", "D", "E", "F"];

interface NoteInput {
  step: number;
  steps: number;
  /** Distance above the exact ground energy. */
  gap: number;
  tolerance: number;
  /** Distance from the Hartree-Fock energy, when there is one. */
  refGap: number | null;
  /** Distance from playground's run_vqe result for this Hamiltonian, when known. */
  playgroundGap: number | null;
}

function vqeNote({ step, steps, gap, tolerance, refGap, playgroundGap }: NoteInput): string {
  if (step === 0)
    return "出発点。つまみはでたらめな角度で、エネルギーはまだ高いところにいます。「再生」でつまみを回し始めます。";
  if (gap < tolerance)
    return "緑の線（本当の一番低いエネルギー）にほぼ届きました。どんな状態も緑の線より下には行けないので、ここまで下がれば答えの状態にとても近いと言えます。";
  if (step >= steps && refGap !== null && refGap < tolerance)
    return "ここで止まりました。止まった高さは HF（平均場近似）とほぼ同じで、緑の線より上です。つまみをどちらへ少し回してもエネルギーが下がらない「くぼみ」（局所解）にはまっています。別の出発点を選ぶと、緑の線まで下がることがあります。";
  if (step >= steps && playgroundGap !== null && playgroundGap < tolerance)
    return "ここで止まりました。緑の線より上の「くぼみ」（局所解）です。playground の run_vqe も、この距離ではほぼ同じ高さで止まっていました。方法が違っても、同じくぼみに捕まることがあるのです。別の出発点を選ぶと、緑の線まで下がることがあります。";
  if (step >= steps)
    return "ここで止まりました。まだ緑の線より上ですが、つまみを少し回してもほとんど下がらない場所にいます。";
  if (refGap !== null && refGap < tolerance)
    return "HF（平均場近似）の高さのあたりで、なかなか下がらなくなっています。このまま止まるか、さらに下がれるかは出発点しだいです。";
  return "つまみを少しずつ回すたびに、エネルギーが下がっていきます。坂が急なうちは速く、谷底に近づくとゆっくり下ります。";
}

function useRuns(p: VqePreset, v: VqeVariant) {
  return useMemo(() => {
    const h = hamiltonian(p.n, v.terms);
    const runs = p.seeds.map((seed) =>
      descend(h, p.layers, startingParams(paramCount(p.n, p.layers), seed), p.rate, p.steps),
    );
    return {
      runs,
      energies: runs.map((r) => r.map((s) => s.energy + v.offset)),
      exact: energyLevels(h)[0] + v.offset,
      reference: p.reference && {
        label: p.reference.label,
        energy: basisEnergy(h, p.reference.bits) + v.offset,
      },
    };
  }, [p, v]);
}

/** Exact and Hartree-Fock energy of every variant, for the bond-length curve. */
function useCurve(p: VqePreset): CurvePoint[] | null {
  return useMemo(() => {
    const ref = p.reference;
    if (p.variants.length < 2 || !ref) return null;
    return p.variants.map((v) => {
      const h = hamiltonian(p.n, v.terms);
      return {
        x: Number(v.id),
        fci: energyLevels(h)[0] + v.offset,
        hf: basisEnergy(h, ref.bits) + v.offset,
        playground: v.playgroundEnergy,
      };
    });
  }, [p]);
}

export function VqeLab({ initialPreset }: { initialPreset?: string }) {
  const [preset, setPreset] = useState<VqePreset>(
    () => VQE_PRESETS.find((p) => p.id === initialPreset) ?? VQE_PRESETS[0],
  );
  const [variantIndex, setVariantIndex] = useState(preset.defaultVariant);
  const [chosen, setChosen] = useState(0);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const variant = preset.variants[variantIndex];
  const { runs, energies, exact, reference } = useRuns(preset, variant);
  const curve = useCurve(preset);

  const steps = preset.steps;
  const running = playing && step < steps;
  useEffect(() => {
    if (!running) return;
    const id = setTimeout(
      () => setStep((k) => Math.min(steps, k + Math.ceil(steps / TICKS_PER_RUN))),
      TICK_MS,
    );
    return () => clearTimeout(id);
  }, [running, step, steps]);

  const params = runs[chosen][step].params;
  const state = useMemo(() => prepare(preset.n, preset.layers, params), [preset, params]);
  const energy = energies[chosen][step];
  const digits = preset.unit ? 6 : 4;
  // "Reached" is 0.1% of the energy scale; for H2 that is about chemical accuracy.
  const tolerance = Math.abs(exact) * 1e-3;
  const note = vqeNote({
    step,
    steps,
    gap: energy - exact,
    tolerance,
    refGap: reference ? Math.abs(energy - reference.energy) : null,
    playgroundGap:
      variant.playgroundEnergy === undefined ? null : Math.abs(energy - variant.playgroundEnergy),
  });
  const unit = preset.unit ? ` ${preset.unit}` : "";

  const restart = () => {
    setStep(0);
    setPlaying(false);
  };

  const choose = (p: VqePreset) => {
    setPreset(p);
    setVariantIndex(p.defaultVariant);
    setChosen(0);
    setStep(0);
    setPlaying(false);
    rememberPreset("vqe", p.id);
  };

  return (
    <div className="lab">
      <section className="presets" aria-label="題材">
        {VQE_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="chip"
            aria-pressed={preset.id === p.id}
            onClick={() => choose(p)}
          >
            {p.title}
          </button>
        ))}
      </section>

      <section className="stage">
        <header className="stage-head">
          <h2>{preset.title}</h2>
          <p className="lede">{preset.summary}</p>
          {preset.example && <ExampleLink no={preset.example} />}
          <TermHints text={preset.summary} />
        </header>

        <VqeIntro />

        {curve && (
          <div className="vqe-variants">
            <div className="control">
              <span className="control-label">{preset.variantLabel}</span>
              <div className="speed-row">
                {preset.variants.map((v, i) => (
                  <button
                    key={v.id}
                    type="button"
                    className="chip chip-small"
                    aria-pressed={variantIndex === i}
                    onClick={() => {
                      setVariantIndex(i);
                      restart();
                    }}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            <PotentialCurve
              points={curve}
              selected={variantIndex}
              current={energy}
              onSelect={(i) => {
                setVariantIndex(i);
                restart();
              }}
            />
          </div>
        )}

        <div className="vqe-controls">
          <div className="control">
            <span className="control-label">出発点（最初のつまみの角度）</span>
            <div className="speed-row">
              {preset.seeds.map((seed, i) => (
                <button
                  key={seed}
                  type="button"
                  className="chip chip-small"
                  aria-pressed={chosen === i}
                  onClick={() => {
                    setChosen(i);
                    setStep(0);
                    setPlaying(false);
                  }}
                >
                  出発点 {START_NAMES[i]}
                </button>
              ))}
            </div>
            <p className="control-hint">
              最初のつまみの角度はでたらめに決めます。出発点を変えると、たどる道すじと、行き着く先が変わることがあります。
            </p>
          </div>
          <div className="control">
            <label htmlFor="vqe-step">
              つまみを回した回数{" "}
              <span className="ket">
                {step} / {steps}
              </span>
            </label>
            <input
              id="vqe-step"
              type="range"
              min={0}
              max={steps}
              value={step}
              onChange={(e) => {
                setPlaying(false);
                setStep(Number(e.target.value));
              }}
            />
            <div className="speed-row">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (running) return setPlaying(false);
                  if (step >= steps) setStep(0);
                  setPlaying(true);
                }}
              >
                {running ? "止める" : step >= steps ? "最初から再生" : "再生"}
              </button>
            </div>
          </div>
        </div>

        <p className="note" aria-live="polite">
          {note}
        </p>
        <TermHints text={note} skip={termsIn(preset.summary).map((t) => t.id)} />

        <div className="vqe-readout">
          <span>
            いまのエネルギー{" "}
            <strong className="ket">
              {energy.toFixed(digits)}
              {unit}
            </strong>
          </span>
          <span>
            本当の一番低い値{" "}
            <strong className="ket">
              {exact.toFixed(digits)}
              {unit}
            </strong>
          </span>
          <span>
            差{" "}
            <strong className="ket">
              {(energy - exact).toFixed(digits)}
              {unit}
            </strong>
          </span>
        </div>
        <p className="panel-text">{preset.energyMeaning}</p>

        <EnergyChart
          traces={energies}
          chosen={chosen}
          step={step}
          exact={exact}
          reference={reference}
          digits={digits}
          onSeek={(k) => {
            setPlaying(false);
            setStep(k);
          }}
        />

        <div className="state-grid">
          <div>
            <h3 className="panel-title">いまのつまみ</h3>
            <ParamKnobs n={preset.n} layers={preset.layers} params={params} />
          </div>
          <div>
            <h3 className="panel-title">いまのつまみで作られる状態</h3>
            <p className="panel-text">
              円の大きさが、<Word id="measurement">測った</Word>
              ときに出やすい結果です。つまみが回ると、円の大きさも変わっていきます。
            </p>
            <AmplitudeDials state={state} n={preset.n} />
            <PhaseLegend />
          </div>
        </div>
      </section>
    </div>
  );
}
