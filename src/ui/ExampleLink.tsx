import { exampleUrl } from "../presets/examples";

/** "Read the original" line under a preset that comes from a playground example. */
export function ExampleLink({ no, solvedBy }: { no: number; solvedBy?: "qaoa" }) {
  return (
    <p className="example-link">
      <a href={exampleUrl(no)}>playground の例{no} を読む</a>
      {solvedBy === "qaoa" && (
        <span>
          （playground では同じ QUBO を QAOA で解いています。ここではアニーリングで解きます）
        </span>
      )}
      <a href="#learn/examples">使用例の一覧と基礎知識</a>
    </p>
  );
}
