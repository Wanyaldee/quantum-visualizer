const W = 760;
const H = 260;
const M = { top: 16, right: 16, bottom: 40, left: 64 };

export interface CurvePoint {
  /** Bond length (Å). */
  x: number;
  fci: number;
  hf: number;
  /** playground's run_vqe result at this bond length. */
  playground?: number;
}

/**
 * Energy against bond length: the exact curve, the Hartree-Fock curve, playground's run_vqe
 * results, and where this page's run currently is. Clicking a bond length selects it.
 */
export function PotentialCurve({
  points,
  selected,
  current,
  onSelect,
}: {
  points: CurvePoint[];
  selected: number;
  current: number;
  onSelect: (i: number) => void;
}) {
  const xs = points.map((p) => p.x);
  const ys = points.flatMap((p) => [p.fci, p.hf, p.playground ?? p.fci]).concat(current);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const pad = (hi - lo) * 0.08;
  const x = (v: number) => M.left + ((v - x0) / (x1 - x0)) * (W - M.left - M.right);
  const y = (e: number) => M.top + ((hi + pad - e) / (hi - lo + 2 * pad)) * (H - M.top - M.bottom);
  const line = (f: (p: CurvePoint) => number) =>
    points.map((p) => `${x(p.x).toFixed(1)},${y(f(p)).toFixed(1)}`).join(" ");
  const ticks = [lo, (lo + hi) / 2, hi];

  return (
    <figure className="chart vqe-chart">
      <figcaption className="chart-title">
        原子どうしの距離を変えると、エネルギーが変わる
      </figcaption>
      <div className="chart-scroll">
        <div className="chart-wrap chart-wrap-wide">
          <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label="結合長とエネルギーのグラフ">
            {ticks.map((t) => (
              <g key={t}>
                <line className="grid" x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} />
                <text className="axis-label" x={M.left - 6} y={y(t) + 4} textAnchor="end">
                  {t.toFixed(2)}
                </text>
              </g>
            ))}
            <text className="axis-title" x={4} y={M.top - 4}>
              エネルギー
            </text>
            <text className="axis-title" x={W - M.right} y={H - 4} textAnchor="end">
              原子どうしの距離（Å）
            </text>
            <polyline className="exact-curve" points={line((p) => p.fci)} />
            <polyline className="reference-curve" points={line((p) => p.hf)} />
            <line
              className="cursor"
              x1={x(points[selected].x)}
              x2={x(points[selected].x)}
              y1={M.top}
              y2={H - M.bottom}
            />
            {points.map((p, i) => (
              <g key={p.x}>
                <text className="axis-label" x={x(p.x)} y={H - M.bottom + 16} textAnchor="middle">
                  {p.x}
                </text>
                {p.playground !== undefined && (
                  <rect
                    className="playground-mark"
                    x={x(p.x) - 5}
                    y={y(p.playground) - 5}
                    width={10}
                    height={10}
                  />
                )}
                <rect
                  className="hit"
                  x={x(p.x) - 18}
                  y={M.top}
                  width={36}
                  height={H - M.top - M.bottom}
                  onClick={() => onSelect(i)}
                >
                  <title>{`${p.x} Å を選ぶ`}</title>
                </rect>
              </g>
            ))}
            <circle
              className="current-dot current-ring"
              cx={x(points[selected].x)}
              cy={y(current)}
              r={6}
              pointerEvents="none"
            />
          </svg>
        </div>
      </div>
      <ul className="curve-legend">
        <li>
          <span className="legend-swatch legend-exact" />
          本当の一番低いエネルギー（厳密解）
        </li>
        <li>
          <span className="legend-swatch legend-reference" />
          HF（平均場近似）
        </li>
        <li>
          <span className="legend-swatch legend-playground" />
          playground の run_vqe の結果
        </li>
        <li>
          <span className="legend-swatch legend-current" />
          このページのいまの値
        </li>
      </ul>
      <p className="chart-foot">
        緑の曲線の一番低い所（約 0.74
        Å）が、実際の水素分子の原子どうしの距離です。離れるほど、HF（オレンジ）は緑から大きくずれていきます。電子どうしがよけ合う効果を取りこぼすからです。四角は
        playground の run_vqe の結果で、1.5 Å
        だけ大きく外れています。距離を選んで、このページのつまみ回しでも同じことが起きるか確かめてみてください。
      </p>
    </figure>
  );
}
