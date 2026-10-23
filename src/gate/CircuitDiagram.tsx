import { GATE_ARITY, type Gate } from "../quantum/gate";

const COL = 48;
const ROW = 46;
const LEFT = 44;
const BOX = 30;

const LABEL: Partial<Record<Gate["gate"], string>> = {
  sdg: "S†",
  tdg: "T†",
  rx: "Rx",
  ry: "Ry",
  rz: "Rz",
  p: "P",
};

function boxLabel(g: Gate): string {
  const core = g.gate.slice(GATE_ARITY[g.gate].controls);
  return LABEL[g.gate] ?? core.toUpperCase();
}

/**
 * One gate per column (no parallel packing): the diagram doubles as the step timeline, so
 * column k must mean "gate k". Clicking a column jumps to the state right after that gate.
 */
export function CircuitDiagram({
  n,
  gates,
  step,
  onStep,
}: {
  n: number;
  gates: Gate[];
  step: number;
  onStep: (k: number) => void;
}) {
  const width = LEFT + Math.max(gates.length, 1) * COL + 24;
  const height = n * ROW + 8;
  const y = (q: number) => 4 + ROW / 2 + q * ROW;
  const cursorX = LEFT + step * COL;

  return (
    <div className="circuit-scroll">
      <svg
        className="circuit"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-label="量子回路"
      >
        {Array.from({ length: n }, (_, q) => (
          <g key={q}>
            <text className="wire-label ket" x={6} y={y(q) + 5}>
              q{q}
            </text>
            <line className="wire" x1={LEFT - 10} x2={width - 8} y1={y(q)} y2={y(q)} />
          </g>
        ))}
        {gates.map((g, k) => {
          const cx = LEFT + k * COL + COL / 2;
          const { controls } = GATE_ARITY[g.gate];
          const ys = g.qubits.map(y);
          const top = Math.min(...ys);
          const bottom = Math.max(...ys);
          const target = g.qubits[controls];
          const core = g.gate.slice(controls);
          const done = k < step;
          return (
            <g
              key={k}
              className="gate"
              data-done={done || undefined}
              data-current={k === step - 1 || undefined}
              onClick={() => onStep(k + 1)}
            >
              <title>{`${k + 1}番目: ${g.gate} [${g.qubits.join(", ")}] — クリックでこのゲートの直後へ`}</title>
              <rect className="gate-hit" x={cx - COL / 2} y={0} width={COL} height={height} />
              {g.qubits.length > 1 && (
                <line className="gate-link" x1={cx} x2={cx} y1={top} y2={bottom} />
              )}
              {g.qubits.slice(0, controls).map((q) => (
                <circle key={q} className="gate-dot" cx={cx} cy={y(q)} r={5} />
              ))}
              {g.gate === "swap" ? (
                g.qubits.map((q) => (
                  <path
                    key={q}
                    className="gate-x"
                    d={`M${cx - 7} ${y(q) - 7}l14 14m0 -14l-14 14`}
                  />
                ))
              ) : controls > 0 && core === "x" ? (
                <g className="gate-target">
                  <circle cx={cx} cy={y(target)} r={11} />
                  <path d={`M${cx - 11} ${y(target)}h22M${cx} ${y(target) - 11}v22`} />
                </g>
              ) : controls > 0 && core === "z" ? (
                <circle className="gate-dot" cx={cx} cy={y(target)} r={5} />
              ) : (
                <g>
                  <rect
                    className="gate-box"
                    x={cx - BOX / 2}
                    y={y(target) - BOX / 2}
                    width={BOX}
                    height={BOX}
                    rx={5}
                  />
                  <text className="gate-text" x={cx} y={y(target) + 5} textAnchor="middle">
                    {boxLabel(g)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
        <line className="cursor" x1={cursorX} x2={cursorX} y1={0} y2={height} />
      </svg>
    </div>
  );
}
