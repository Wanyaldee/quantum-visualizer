import { useEffect, useState } from "react";
import { AnnealLab } from "./anneal/AnnealLab";
import { GateLab } from "./gate/GateLab";

type Mode = "gate" | "anneal";

// The mode lives in the URL hash so a workshop host can hand out a link that opens
// straight into annealing (…/#anneal).
const modeFromHash = (): Mode => (location.hash === "#anneal" ? "anneal" : "gate");

export default function App() {
  const [mode, setMode] = useState<Mode>(modeFromHash);

  useEffect(() => {
    const onHash = () => setMode(modeFromHash());
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, []);

  return (
    <div className="page">
      <header className="masthead">
        <h1>量子コンピュータは、どうやって答えを出すのか</h1>
        <nav className="modes" aria-label="方式">
          <a href="#gate" aria-current={mode === "gate" ? "page" : undefined}>
            <span className="mode-name">ゲート式</span>
            <span className="mode-hint">回路で波を重ねて、答えの確率を育てる</span>
          </a>
          <a href="#anneal" aria-current={mode === "anneal" ? "page" : undefined}>
            <span className="mode-name">アニーリング</span>
            <span className="mode-hint">ゆっくり問題に切り替えて、一番低い所に落ち着かせる</span>
          </a>
        </nav>
      </header>
      <main>{mode === "gate" ? <GateLab /> : <AnnealLab />}</main>
      <footer className="colophon">
        計算はすべてこのブラウザの中で行う、ノイズのない理想的なシミュレーションです。実機との違いは{" "}
        <a href="https://github.com/Wanyaldee/blueqat-mcp-playground/blob/main/docs/simulator_vs_hardware.md">
          シミュレータと実機の違い
        </a>
        、題材の回路や QUBO は{" "}
        <a href="https://github.com/Wanyaldee/blueqat-mcp-playground">blueqat-mcp-playground</a>{" "}
        を参照してください。{" "}
        <a href="https://github.com/Wanyaldee/quantum-visualizer">ソースコード</a>
      </footer>
    </div>
  );
}
