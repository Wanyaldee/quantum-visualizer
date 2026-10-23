import { useState, type MouseEvent } from "react";
import { narrowestGap, type SpectrumPoint } from "../quantum/anneal";
import { pct } from "../ui/phase";
import { Tooltip } from "../ui/Tooltip";

const W = 560;
const H = 300;
const M = { top: 14, right: 16, bottom: 34, left: 44 };
const MAX_LINES = 8;

/** Eigenvalue i at a spectrum point, expanding merged (degenerate) levels back out. */
function eigenvalues(pt: SpectrumPoint): number[] {
  return pt.levels.flatMap((lv) => Array<number>(lv.degeneracy).fill(lv.energy));
}

/**
 * Energy levels of H(s) with the evolving state drawn as dots sitting on them.
 * Lines that end in the optimal answers are drawn in --answer; the dot staying on those
 * lines is what "the anneal worked" looks like.
 */
export function SpectrumChart({
  sp,
  pops,
  sIndex,
  groundCount,
  onSeek,
}: {
  sp: SpectrumPoint[];
  pops: number[][];
  sIndex: number;
  groundCount: number;
  onSeek: (k: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const evs = sp.map(eigenvalues);
  const lines = Math.min(MAX_LINES, evs[0].length);
  const lo = Math.min(...evs.map((e) => e[0]));
  const hi = Math.max(...evs.map((e) => e[lines - 1]));
  const pad = (hi - lo) * 0.06;
  const x = (s: number) => M.left + s * (W - M.left - M.right);
  const y = (e: number) =>
    M.top + (1 - (e - lo + pad) / (hi - lo + 2 * pad)) * (H - M.top - M.bottom);

  const { k: gapK, gap } = narrowestGap(sp, groundCount);

  const shown = hover ?? sIndex;
  const pt = sp[shown];
  const yTicks = niceTicks(lo, hi, 5);

  const kFromEvent = (e: MouseEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const s = (e.clientX - box.left) / box.width;
    return Math.round(Math.max(0, Math.min(1, s)) * (sp.length - 1));
  };

  return (
    <figure className="chart">
      <figcaption className="chart-title">エネルギーの階段と、いまの状態の居場所</figcaption>
      <div className="chart-scroll">
        <div className="chart-wrap chart-wrap-wide">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="エネルギー準位の図">
            {yTicks.map((t) => (
              <g key={t}>
                <line className="grid" x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} />
                <text className="axis-label" x={M.left - 6} y={y(t) + 4} textAnchor="end">
                  {t}
                </text>
              </g>
            ))}
            {[0, 0.25, 0.5, 0.75, 1].map((s) => (
              <text
                key={s}
                className="axis-label"
                x={x(s)}
                y={H - M.bottom + 16}
                textAnchor="middle"
              >
                {s}
              </text>
            ))}
            <text className="axis-title" x={W - M.right} y={H - 4} textAnchor="end">
              s（0 = 問題を知らない → 1 = 問題そのもの）
            </text>
            <text className="axis-title" x={4} y={M.top - 2}>
              エネルギー
            </text>

            {Array.from({ length: lines }, (_, i) => (
              <polyline
                key={i}
                className={i < groundCount ? "level level-answer" : "level"}
                points={evs.map((e, k) => `${x(sp[k].s)},${y(e[i])}`).join(" ")}
              />
            ))}

            {Number.isFinite(gap) && (
              <g className="gap-mark">
                <line
                  x1={x(sp[gapK].s)}
                  x2={x(sp[gapK].s)}
                  y1={y(evs[gapK][0])}
                  y2={y(evs[gapK][groundCount])}
                />
                <text
                  x={x(sp[gapK].s) + (sp[gapK].s > 0.7 ? -6 : 6)}
                  y={y(evs[gapK][groundCount]) - 6}
                  textAnchor={sp[gapK].s > 0.7 ? "end" : "start"}
                >
                  すき間が一番狭い所
                </text>
              </g>
            )}

            <line
              className="cursor"
              x1={x(sp[sIndex].s)}
              x2={x(sp[sIndex].s)}
              y1={M.top}
              y2={H - M.bottom}
            />
            {hover !== null && hover !== sIndex && (
              <line
                className="cursor cursor-hover"
                x1={x(pt.s)}
                x2={x(pt.s)}
                y1={M.top}
                y2={H - M.bottom}
              />
            )}

            {sp[sIndex].levels.map((lv, j) =>
              pops[sIndex][j] > 0.004 && lv.energy <= hi + pad ? (
                <circle
                  key={j}
                  className="pop-dot"
                  cx={x(sp[sIndex].s)}
                  cy={y(lv.energy)}
                  r={3 + 13 * Math.sqrt(pops[sIndex][j])}
                />
              ) : null,
            )}

            <rect
              className="hit"
              x={M.left}
              y={M.top}
              width={W - M.left - M.right}
              height={H - M.top - M.bottom}
              onPointerMove={(e) => setHover(kFromEvent(e))}
              onPointerLeave={() => setHover(null)}
              onClick={(e) => onSeek(kFromEvent(e))}
            />
          </svg>
          {hover !== null && (
            <Tooltip left={(x(pt.s) / W) * 100} top={10}>
              <b>s = {pt.s.toFixed(2)}</b>
              {pt.levels.slice(0, 4).map((lv, j) => (
                <span key={j}>
                  {j === 0 ? "一番下" : `下から${j + 1}段目`}
                  {lv.degeneracy > 1 ? `（${lv.degeneracy}重）` : ""}: {pct(pops[shown][j])}
                </span>
              ))}
              <em>クリックでこの時点へ</em>
            </Tooltip>
          )}
        </div>
      </div>
      <p className="chart-foot">
        線は「その時点で取りうるエネルギー」、青い丸が状態の居場所（大きさ＝その段にいる確率）です。緑の線は最後に正解へつながる段。
      </p>
    </figure>
  );
}

function niceTicks(lo: number, hi: number, count: number): number[] {
  const raw = (hi - lo) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi + 1e-9; t += step)
    out.push(Number(t.toFixed(6)));
  return out;
}
