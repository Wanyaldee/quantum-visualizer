import type { AnnealPreset } from "../presets/problems";
import { pct } from "../ui/phase";

const SIZE = 240;
const RING = 82;

/**
 * Variables on a circle, colored by the single most likely bitstring right now. While no
 * bitstring stands out (early in the anneal everything is equally likely), nodes stay
 * neutral instead of pretending there is an answer.
 */
export function ProblemGraph({
  problem,
  probs,
}: {
  problem: Pick<AnnealPreset, "n" | "names" | "bitMeaning" | "edges">;
  probs: Float64Array;
}) {
  const { n, names, edges, bitMeaning } = problem;
  let best = 0;
  probs.forEach((p, i) => {
    if (p > probs[best]) best = i;
  });
  const decided = probs[best] > 2 / probs.length;
  const pos = (i: number, r = RING) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return { x: SIZE / 2 + r * Math.cos(a), y: SIZE / 2 + r * Math.sin(a) };
  };

  return (
    <figure className="graph">
      <svg viewBox={`-20 -20 ${SIZE + 40} ${SIZE + 40}`} role="img" aria-label="問題のグラフ">
        {edges.map(([i, j]) => {
          const a = pos(i);
          const b = pos(j);
          const split = decided && ((best >> i) & 1) !== ((best >> j) & 1);
          return (
            <line
              key={`${i}-${j}`}
              className="edge"
              data-split={split || undefined}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
            />
          );
        })}
        {names.map((name, i) => {
          const { x, y } = pos(i);
          const bit = (best >> i) & 1;
          return (
            <g key={i} className="node" data-bit={decided ? bit : undefined}>
              <circle cx={x} cy={y} r={24} />
              <text x={x} y={y + 5} textAnchor="middle">
                {name}
              </text>
              {decided && (
                <text
                  className="node-tag"
                  x={pos(i, RING + 38).x}
                  y={pos(i, RING + 38).y + 4}
                  textAnchor="middle"
                >
                  {bitMeaning[bit ? 0 : 1]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption>
        {decided ? (
          <>いま一番出やすい答え（{pct(probs[best])}）で色分けしています。</>
        ) : (
          <>どの答えもまだ同じくらいの確率で、答えは決まっていません。</>
        )}
      </figcaption>
    </figure>
  );
}
