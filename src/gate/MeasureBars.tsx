import { basisLabel } from "../quantum/gate";

/** Measured counts vs the exact probability (thin tick), so sampling noise is visible. */
export function MeasureBars({
  counts,
  probs,
  n,
}: {
  counts: Uint32Array;
  probs: Float64Array;
  n: number;
}) {
  const shots = counts.reduce((a, b) => a + b, 0);
  const max = Math.max(...probs, ...Array.from(counts, (c) => c / shots));
  return (
    <table className="measure">
      <caption className="sr-only">測定結果（回数と理論上の確率）</caption>
      <thead className="sr-only">
        <tr>
          <th>結果</th>
          <th>回数</th>
          <th>理論上の確率</th>
        </tr>
      </thead>
      <tbody>
        {Array.from(counts, (c, i) => ({ c, i }))
          // With 16+ outcomes, rows that can never appear are noise.
          .filter(({ c, i }) => counts.length <= 8 || c > 0 || probs[i] > 1e-9)
          .map(({ c, i }) => (
            <tr key={i}>
              <th scope="row" className="ket">
                {basisLabel(i, n)}
              </th>
              <td className="measure-track">
                <span className="measure-bar" style={{ width: `${((c / shots) * 100) / max}%` }} />
                <span
                  className="measure-tick"
                  style={{ left: `${(probs[i] * 100) / max}%` }}
                  title="理論上の確率"
                />
              </td>
              <td className="measure-n">{c}</td>
              <td className="sr-only">{(probs[i] * 100).toFixed(1)}%</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
