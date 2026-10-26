import type { PointerEvent } from "react";

const W = 760;
const H = 280;
const M = { top: 16, right: 16, bottom: 36, left: 64 };

/**
 * Energy after each step of the knob-turning loop. Every starting point is drawn faintly so
 * the ones that stall above the green line (a local minimum) stand out from the chosen run.
 */
export function EnergyChart({
  traces,
  chosen,
  step,
  exact,
  reference,
  digits,
  onSeek,
}: {
  /** Energies per starting point, offset already added. */
  traces: number[][];
  chosen: number;
  step: number;
  exact: number;
  reference?: { label: string; energy: number };
  digits: number;
  onSeek: (step: number) => void;
}) {
  const steps = traces[chosen].length - 1;
  const top = Math.max(...traces.map((t) => t[0]));
  // With a reference line, zoom in on the gap between it and the exact energy: that gap is
  // the whole story (stuck at Hartree-Fock or not), and it is tiny next to where runs start.
  const hi = reference ? Math.min(top, exact + 4 * (reference.energy - exact)) : top;
  const span = hi - exact || 1;
  const lo = exact - span * 0.12;
  const clipped = hi < top;
  // Steps on a log axis: runs drop fast at first and then creep, and both should be visible.
  const plotW = W - M.left - M.right;
  const x = (k: number) => M.left + (Math.log1p(k) / Math.log1p(steps)) * plotW;
  const y = (e: number) => M.top + ((hi - Math.min(e, hi)) / (hi - lo)) * (H - M.top - M.bottom);
  const xTicks = [0, 1, 10, 100, 1000].filter((k) => k < steps).concat(steps);
  const line = (t: number[], upto = t.length - 1) =>
    t
      .slice(0, upto + 1)
      .map((e, k) => `${x(k).toFixed(1)},${y(e).toFixed(1)}`)
      .join(" ");
  const ticks = [lo, (lo + hi) / 2, hi];
  const current = traces[chosen][step];

  const seek = (e: PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * W;
    const k = Math.round(Math.expm1(((px - M.left) / plotW) * Math.log1p(steps)));
    onSeek(Math.max(0, Math.min(steps, k)));
  };

  return (
    <figure className="chart vqe-chart">
      <figcaption className="chart-title">つまみを回すたびに、エネルギーが下がっていく</figcaption>
      <div className="chart-scroll">
        <div className="chart-wrap chart-wrap-wide">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={`くり返し ${step} 回目のエネルギー ${current.toFixed(digits)}`}
            onPointerDown={seek}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line className="grid" x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} />
                <text className="axis-label" x={M.left - 6} y={y(t) + 4} textAnchor="end">
                  {t.toFixed(digits > 4 ? 3 : 2)}
                </text>
              </g>
            ))}
            {xTicks.map((k) => (
              <text
                key={k}
                className="axis-label"
                x={x(k)}
                y={H - M.bottom + 16}
                textAnchor="middle"
              >
                {k}
              </text>
            ))}
            <text className="axis-title" x={W - M.right} y={H - 4} textAnchor="end">
              つまみを回した回数（対数目盛、0 = 出発点）
            </text>
            <text className="axis-title" x={4} y={M.top - 4}>
              エネルギー
            </text>
            <line className="exact-line" x1={M.left} x2={W - M.right} y1={y(exact)} y2={y(exact)} />
            <text className="exact-label" x={W - M.right} y={y(exact) + 14} textAnchor="end">
              本当の一番低いエネルギー
            </text>
            {reference && (
              <>
                <line
                  className="reference-line"
                  x1={M.left}
                  x2={W - M.right}
                  y1={y(reference.energy)}
                  y2={y(reference.energy)}
                />
                <text
                  className="reference-label"
                  x={W - M.right}
                  y={y(reference.energy) - 5}
                  textAnchor="end"
                >
                  {reference.label}
                </text>
              </>
            )}
            {traces.map((t, i) =>
              i === chosen ? null : <polyline key={i} className="series-ghost" points={line(t)} />,
            )}
            <polyline className="series-ghost series-ahead" points={line(traces[chosen])} />
            <polyline className="series" points={line(traces[chosen], step)} />
            <line className="cursor" x1={x(step)} x2={x(step)} y1={M.top} y2={H - M.bottom} />
            <circle className="current-dot" cx={x(step)} cy={y(current)} r={6} />
          </svg>
        </div>
      </div>
      <p className="chart-foot">
        太い線がいま選んでいる出発点、薄い線はほかの出発点です。グラフをクリックすると、その回数の時点へ飛べます。
        {clipped &&
          " 緑の線とのわずかな差が見えるように縦軸を拡大しているので、出発点のあたりの高いエネルギーは上にはみ出しています。"}
      </p>
    </figure>
  );
}
