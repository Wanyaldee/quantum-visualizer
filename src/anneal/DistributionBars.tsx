import { useState } from "react";
import { basisLabel } from "../quantum/gate";
import { pct } from "../ui/phase";
import { Tooltip } from "../ui/Tooltip";

const W = 560;
const H = 200;
const M = { top: 12, right: 8, bottom: 52, left: 40 };

/**
 * Probability of every bitstring at the current s, ordered by problem cost (best on the
 * left), so "probability piling up on the left" is the visual signature of success.
 */
export function DistributionBars({
  n,
  probs,
  energies,
  ground,
  describe,
}: {
  n: number;
  probs: Float64Array;
  energies: Float64Array;
  ground: Set<number>;
  describe: (bits: number[]) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const order = [...probs.keys()].sort((a, b) => energies[a] - energies[b] || a - b);
  const slot = (W - M.left - M.right) / order.length;
  const barW = Math.max(2, slot - 2);
  const y = (p: number) => M.top + (1 - p) * (H - M.top - M.bottom);
  const showLabels = order.length <= 32;

  return (
    <figure className="chart">
      <figcaption className="chart-title">いま測ったら、どの答えがどれくらい出るか</figcaption>
      <div className="chart-scroll">
        <div className="chart-wrap chart-wrap-wide">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="答えごとの確率">
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <g key={t}>
                <line className="grid" x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} />
                <text className="axis-label" x={M.left - 6} y={y(t) + 4} textAnchor="end">
                  {t * 100}%
                </text>
              </g>
            ))}
            {order.map((idx, k) => {
              const x0 = M.left + k * slot + 1;
              const h = Math.max(0, y(0) - y(probs[idx]));
              return (
                <g
                  key={idx}
                  onPointerEnter={() => setHover(k)}
                  onPointerLeave={() => setHover(null)}
                  data-hover={hover === k || undefined}
                >
                  <rect
                    className="hit"
                    x={x0 - 1}
                    y={M.top}
                    width={slot}
                    height={H - M.top - M.bottom}
                  />
                  {h > 0.5 && (
                    <path
                      className={ground.has(idx) ? "bar bar-answer" : "bar"}
                      d={roundedTop(x0, y(0), barW, h, Math.min(4, barW / 2))}
                    />
                  )}
                  {showLabels && (
                    <text
                      className="bar-label ket"
                      data-answer={ground.has(idx) || undefined}
                      transform={`translate(${x0 + barW / 2 + 3},${y(0) + 6}) rotate(-90)`}
                      textAnchor="end"
                    >
                      {basisLabel(idx, n)}
                    </text>
                  )}
                </g>
              );
            })}
            <line className="baseline" x1={M.left} x2={W - M.right} y1={y(0)} y2={y(0)} />
            <text className="axis-title" x={M.left} y={H - 2}>
              ← 良い答え
            </text>
            <text className="axis-title" x={W - M.right} y={H - 2} textAnchor="end">
              悪い答え →
            </text>
          </svg>
          {hover !== null && (
            <Tooltip left={((M.left + (hover + 0.5) * slot) / W) * 100} top={8}>
              <b className="ket">{basisLabel(order[hover], n)}</b>
              <span>{describe(Array.from({ length: n }, (_, q) => (order[hover] >> q) & 1))}</span>
              <span>出る確率 {pct(probs[order[hover]])}</span>
              {ground.has(order[hover]) && <span className="tip-answer">最適な答え</span>}
            </Tooltip>
          )}
        </div>
      </div>
    </figure>
  );
}

function roundedTop(x: number, base: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, h);
  return `M${x} ${base}V${base - h + rr}Q${x} ${base - h} ${x + rr} ${base - h}H${x + w - rr}Q${x + w} ${base - h} ${x + w} ${base - h + rr}V${base}Z`;
}
