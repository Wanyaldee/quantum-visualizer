import { useState } from "react";
import { pct } from "../ui/phase";
import { Tooltip } from "../ui/Tooltip";

const W = 360;
const H = 200;
const M = { top: 14, right: 12, bottom: 36, left: 40 };

/** Success probability vs anneal time on a log axis, with the currently chosen T marked. */
export function SuccessChart({
  Ts,
  success,
  T,
  current,
  tMin,
  tMax,
}: {
  Ts: number[];
  success: number[];
  T: number;
  current: number;
  tMin: number;
  tMax: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const x = (t: number) =>
    M.left + (Math.log(t / tMin) / Math.log(tMax / tMin)) * (W - M.left - M.right);
  const y = (p: number) => M.top + (1 - p) * (H - M.top - M.bottom);
  const ticks = [1, 10, 100].filter((t) => t >= tMin && t <= tMax);

  return (
    <figure className="chart">
      <figcaption className="chart-title">ゆっくり進めるほど、正解が出やすくなる</figcaption>
      <div className="chart-scroll">
        <div className="chart-wrap">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="アニーリング時間と正解率">
            {[0, 0.5, 1].map((t) => (
              <g key={t}>
                <line className="grid" x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} />
                <text className="axis-label" x={M.left - 6} y={y(t) + 4} textAnchor="end">
                  {t * 100}%
                </text>
              </g>
            ))}
            {ticks.map((t) => (
              <text
                key={t}
                className="axis-label"
                x={x(t)}
                y={H - M.bottom + 16}
                textAnchor="middle"
              >
                {t}
              </text>
            ))}
            <text className="axis-title" x={W - M.right} y={H - 4} textAnchor="end">
              アニーリング時間 T（対数目盛）
            </text>
            <polyline
              className="series"
              points={Ts.map((t, i) => `${x(t)},${y(success[i])}`).join(" ")}
            />
            {Ts.map((t, i) => (
              <circle
                key={t}
                className="series-dot"
                cx={x(t)}
                cy={y(success[i])}
                r={hover === i ? 5 : 3.5}
              />
            ))}
            <line className="cursor" x1={x(T)} x2={x(T)} y1={M.top} y2={H - M.bottom} />
            <circle className="current-dot" cx={x(T)} cy={y(current)} r={6} />
            {Ts.map((t, i) => (
              <rect
                key={t}
                className="hit"
                x={x(t) - 12}
                y={M.top}
                width={24}
                height={H - M.top - M.bottom}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
              />
            ))}
          </svg>
          {hover !== null && (
            <Tooltip left={(x(Ts[hover]) / W) * 100} top={8}>
              <b>T = {Ts[hover] < 10 ? Ts[hover].toFixed(1) : Math.round(Ts[hover])}</b>
              <span>正解が出る確率 {pct(success[hover])}</span>
            </Tooltip>
          )}
        </div>
      </div>
      <p className="chart-foot">大きい丸がいま選んでいる T（正解率 {pct(current)}）。</p>
    </figure>
  );
}
