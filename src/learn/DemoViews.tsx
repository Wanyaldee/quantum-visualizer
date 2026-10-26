import type { ReactNode } from "react";
import { AmplitudeDials } from "../gate/AmplitudeDials";
import { MeasureBars } from "../gate/MeasureBars";
import { probabilities, type Gate, type State } from "../quantum/gate";
import { run } from "./demo";

export function Dials({ n, gates }: { n: number; gates: Gate[] }) {
  return <AmplitudeDials state={run(n, gates)} n={n} />;
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="slide-row">
      <span className="slide-row-label">{label}</span>
      {children}
    </div>
  );
}

export function Measured({
  state,
  n,
  counts,
}: {
  state: State;
  n: number;
  counts: Uint32Array | null;
}) {
  return (
    <div className="slide-measure">
      <AmplitudeDials state={state} n={n} />
      {counts ? (
        <MeasureBars counts={counts} probs={probabilities(state)} n={n} />
      ) : (
        <p className="panel-text">まだ測っていません。</p>
      )}
    </div>
  );
}
