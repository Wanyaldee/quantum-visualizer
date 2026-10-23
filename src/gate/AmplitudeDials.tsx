import { basisLabel, type State } from "../quantum/gate";
import { formatPhase, pct, phaseColor } from "../ui/phase";

const R = 30;

/**
 * One dial per basis state. Filled disc area ∝ probability (|amplitude|²), disc color and
 * needle angle = phase. Probability alone would hide interference, which is the point of
 * the gate model, so the phase is always visible.
 */
export function AmplitudeDials({ state, n }: { state: State; n: number }) {
  const size = state.re.length;
  return (
    <ol className={`dials dials-n${n}`} aria-label="各状態の振幅">
      {Array.from({ length: size }, (_, i) => {
        const re = state.re[i];
        const im = state.im[i];
        const p = re * re + im * im;
        const live = p > 1e-6;
        const deg = (Math.atan2(im, re) * 180) / Math.PI;
        const label = basisLabel(i, n);
        return (
          <li key={i} className="dial" data-live={live || undefined}>
            <svg
              viewBox={`${-R - 3} ${-R - 3} ${2 * R + 6} ${2 * R + 6}`}
              role="img"
              aria-label={`|${label}⟩ 確率 ${pct(p)}${live ? ` 位相 ${formatPhase(re, im)}` : ""}`}
            >
              <circle className="dial-ring" r={R} />
              <circle
                className="dial-disc"
                r={R * Math.sqrt(p)}
                style={{ fill: phaseColor(re, im) }}
              />
              <g
                className="dial-needle"
                style={{ transform: `rotate(${-deg}deg)`, opacity: live ? 1 : 0 }}
              >
                <line x1={0} y1={0} x2={R} y2={0} />
                <circle cx={R} cy={0} r={2.5} />
              </g>
            </svg>
            <span className="ket">|{label}⟩</span>
            <span className="dial-p">{pct(p)}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function PhaseLegend() {
  const marks = [
    { deg: 0, label: "0" },
    { deg: 90, label: "π/2" },
    { deg: 180, label: "π" },
    { deg: 270, label: "−π/2" },
  ];
  return (
    <figure className="phase-legend">
      <svg viewBox="-44 -40 88 80" aria-hidden="true">
        {Array.from({ length: 36 }, (_, k) => {
          const a0 = (k * 10 * Math.PI) / 180;
          const a1 = ((k + 1) * 10 * Math.PI) / 180;
          return (
            <path
              key={k}
              d={`M${18 * Math.cos(a0)} ${-18 * Math.sin(a0)} A18 18 0 0 0 ${18 * Math.cos(a1)} ${-18 * Math.sin(a1)}`}
              style={{ stroke: phaseColor(Math.cos(a0 + 0.08), Math.sin(a0 + 0.08)) }}
              className="legend-arc"
            />
          );
        })}
        {marks.map((m) => {
          const a = (m.deg * Math.PI) / 180;
          return (
            <text key={m.deg} x={31 * Math.cos(a)} y={-31 * Math.sin(a) + 4} textAnchor="middle">
              {m.label}
            </text>
          );
        })}
      </svg>
      <figcaption>
        円の<b>面積</b>が測ったときに出る確率、<b>針の向きと色</b>が位相（波のずれ）です。
      </figcaption>
    </figure>
  );
}
