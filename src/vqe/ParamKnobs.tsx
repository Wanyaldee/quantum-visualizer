const R = 16;

/** Wraps an angle to (−180°, 180°] for display. */
const degrees = (rad: number) => {
  const d = ((((rad * 180) / Math.PI) % 360) + 360) % 360;
  return Math.round(d > 180 ? d - 360 : d);
};

/**
 * The ansatz drawn as knobs: one row per qubit, one column per RY layer, and a bar between
 * columns for the CZ chain that links neighboring qubits. Each needle is that RY's angle.
 */
export function ParamKnobs({
  n,
  layers,
  params,
}: {
  n: number;
  layers: number;
  params: readonly number[];
}) {
  const columns = Array.from({ length: layers + 1 }, (_, l) => l);
  return (
    <figure className="knobs">
      <div className="knob-rows">
        {Array.from({ length: n }, (_, q) => (
          <div key={q} className="knob-row">
            <span className="ket knob-q">q{q}</span>
            {columns.map((l) => {
              const deg = degrees(params[l * n + q]);
              return (
                <div key={l} className="knob-cell">
                  {l > 0 && <span className="knob-link" aria-hidden="true" />}
                  <span className="knob">
                    <svg
                      viewBox={`${-R - 2} ${-R - 2} ${2 * R + 4} ${2 * R + 4}`}
                      role="img"
                      aria-label={`q${q} の ${l + 1} 列目のつまみ ${deg}°`}
                    >
                      <circle className="knob-ring" r={R} />
                      <line
                        className="knob-needle"
                        x1={0}
                        y1={0}
                        x2={0}
                        y2={-R + 3}
                        style={{ transform: `rotate(${deg}deg)` }}
                      />
                    </svg>
                    <span className="knob-deg">{deg}°</span>
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <figcaption>
        回路のつまみ（RY
        ゲートで回す角度）。つまみの列のあいだの縦の帯は、となりの量子ビットどうしをつなぐ CZ
        ゲートです。普通のコンピュータが、このつまみを少しずつ回していきます。
      </figcaption>
    </figure>
  );
}
