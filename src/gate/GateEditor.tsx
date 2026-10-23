import { useState } from "react";
import { GATE_ARITY, MAX_QUBITS, parseCircuit, type Gate, type GateName } from "../quantum/gate";

const GATE_CHOICES: { name: GateName; label: string }[] = [
  { name: "h", label: "H（重ね合わせ）" },
  { name: "x", label: "X（反転）" },
  { name: "y", label: "Y" },
  { name: "z", label: "Z（位相を反転）" },
  { name: "s", label: "S（位相 π/2）" },
  { name: "t", label: "T（位相 π/4）" },
  { name: "rx", label: "Rx（X軸回転）" },
  { name: "ry", label: "Ry（Y軸回転）" },
  { name: "rz", label: "Rz（Z軸回転）" },
  { name: "cx", label: "CNOT（制御反転）" },
  { name: "cz", label: "CZ（制御位相反転）" },
  { name: "swap", label: "SWAP（入れ替え）" },
  { name: "ccx", label: "トフォリ（2つで制御する反転）" },
];

function roleLabel(name: GateName, k: number): string {
  const { qubits, controls } = GATE_ARITY[name];
  if (qubits === 1) return "対象";
  if (name === "swap") return `入れ替え${k + 1}`;
  return k < controls ? `制御${controls > 1 ? k + 1 : ""}` : "対象";
}

export function GateEditor({
  n,
  gates,
  onChange,
}: {
  n: number;
  gates: Gate[];
  onChange: (n: number, gates: Gate[]) => void;
}) {
  const [name, setName] = useState<GateName>("h");
  const [qubits, setQubits] = useState<number[]>([0, 1, 2]);
  const [degrees, setDegrees] = useState(90);
  const [json, setJson] = useState("");
  const [error, setError] = useState<string | null>(null);

  const arity = GATE_ARITY[name];
  const picked = qubits.slice(0, arity.qubits);
  const distinct = new Set(picked).size === picked.length;
  const fits = arity.qubits <= n && picked.every((q) => q < n);

  const add = () => {
    const g: Gate = { gate: name, qubits: picked };
    if (arity.param) g.params = [(degrees * Math.PI) / 180];
    onChange(n, [...gates, g]);
  };

  const resize = (m: number) =>
    onChange(
      m,
      gates.filter((g) => g.qubits.every((q) => q < m)),
    );

  const load = () => {
    try {
      const parsed = parseCircuit(JSON.parse(json));
      onChange(parsed.n, parsed.gates);
      setError(null);
    } catch (e) {
      setError(
        e instanceof SyntaxError
          ? "JSON として読めません。括弧やカンマを確認してください"
          : (e as Error).message,
      );
    }
  };

  return (
    <details className="editor">
      <summary>回路を自分で組む</summary>
      <div className="editor-body">
        <div className="field-row">
          <label>
            量子ビット数
            <select value={n} onChange={(e) => resize(Number(e.target.value))}>
              {Array.from({ length: MAX_QUBITS }, (_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>
          <label>
            ゲート
            <select value={name} onChange={(e) => setName(e.target.value as GateName)}>
              {GATE_CHOICES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          {Array.from({ length: arity.qubits }, (_, k) => (
            <label key={k}>
              {roleLabel(name, k)}
              <select
                value={qubits[k]}
                onChange={(e) =>
                  setQubits(qubits.map((q, j) => (j === k ? Number(e.target.value) : q)))
                }
              >
                {Array.from({ length: n }, (_, q) => (
                  <option key={q} value={q}>
                    q{q}
                  </option>
                ))}
              </select>
            </label>
          ))}
          {arity.param && (
            <label>
              角度（度）
              <input
                type="number"
                step={15}
                value={degrees}
                onChange={(e) => setDegrees(Number(e.target.value))}
              />
            </label>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={add}
            disabled={!distinct || !fits}
          >
            末尾に追加
          </button>
        </div>
        {!distinct && <p className="hint-error">同じ量子ビットを2回選んでいます。</p>}
        {!fits && distinct && (
          <p className="hint-error">このゲートには量子ビットが {arity.qubits} 個以上必要です。</p>
        )}
        <div className="field-row">
          <button
            type="button"
            className="btn"
            onClick={() => onChange(n, gates.slice(0, -1))}
            disabled={!gates.length}
          >
            最後のゲートを消す
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => onChange(n, [])}
            disabled={!gates.length}
          >
            すべて消す
          </button>
        </div>
        <label className="json-field">
          blueqat の run_circuit 形式の JSON を貼り付けて読み込む
          <textarea
            rows={4}
            spellCheck={false}
            placeholder='[{"gate": "h", "qubits": [0]}, {"gate": "cx", "qubits": [0, 1]}]'
            value={json}
            onChange={(e) => setJson(e.target.value)}
          />
        </label>
        <div className="field-row">
          <button type="button" className="btn" onClick={load} disabled={!json.trim()}>
            JSON を読み込む
          </button>
          {error && (
            <p className="hint-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </details>
  );
}
