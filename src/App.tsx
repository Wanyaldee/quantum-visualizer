import { useEffect, useState } from "react";
import { AnnealLab } from "./anneal/AnnealLab";
import { GateLab } from "./gate/GateLab";
import { LearnPage } from "./learn/LearnPage";

type Mode = "gate" | "anneal" | "learn";

interface Route {
  mode: Mode;
  preset?: string;
  /** Counts hash changes. Preset chips rewrite the hash with replaceState (no event), so
   * the preset id alone may not change when a link leads back to it. */
  visit: number;
}

// The view lives in the URL hash so a workshop host can hand out a link that opens
// straight into one preset (…/#anneal/team), and the example list can link to each one.
function routeFromHash(visit = 0): Route {
  const [mode, preset] = location.hash.slice(1).split("/");
  if (mode === "anneal" || mode === "learn") return { mode, preset, visit };
  return { mode: "gate", preset, visit };
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => routeFromHash());
  const { mode, preset, visit } = route;

  useEffect(() => {
    const onHash = () => {
      setRoute((r) => routeFromHash(r.visit + 1));
      // Links from the long example list would otherwise land mid-page.
      scrollTo({ top: 0 });
    };
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
          <a href="#learn" aria-current={mode === "learn" ? "page" : undefined}>
            <span className="mode-name">使用例と基礎</span>
            <span className="mode-hint">playground の全使用例と、読むための最低限の知識</span>
          </a>
        </nav>
      </header>
      <main>
        {/* Keyed by visit so following a link to a preset starts that lab fresh. */}
        {mode === "gate" && <GateLab key={visit} initialPreset={preset} />}
        {mode === "anneal" && <AnnealLab key={visit} initialPreset={preset} />}
        {mode === "learn" && <LearnPage key={visit} focus={preset} />}
      </main>
      <footer className="colophon">
        計算はすべてこのブラウザの中で行う、ノイズのない理想的なシミュレーションです。実機との違いは{" "}
        <a href="https://github.com/Wanyaldee/blueqat-mcp-playground/blob/main/docs/simulator_vs_hardware.md">
          シミュレータと実機の違い
        </a>
        、題材の回路や QUBO は{" "}
        <a href="https://github.com/Wanyaldee/blueqat-mcp-playground">blueqat-mcp-playground</a>{" "}
        を参照してください。{" "}
        <a href="https://github.com/Wanyaldee/quantum-visualizer">ソースコード</a>
        <p className="colophon-meta">
          <strong>プライバシー:</strong> このサイトは Cookie
          やアクセス解析を使わず、操作内容や読み込んだ JSON
          をどこにも送信しません。ただし、フォントの取得元の Google Fonts と配信元の GitHub Pages
          には、通常のアクセスと同じく IP アドレスなどが届きます（
          <a href="https://policies.google.com/privacy?hl=ja">Google</a>・
          <a href="https://docs.github.com/ja/site-policy/privacy-policies/github-general-privacy-statement">
            GitHub
          </a>{" "}
          のプライバシーポリシー）。
        </p>
        <p className="colophon-meta">
          © 2026 Wanyaldee ·{" "}
          <a href="https://github.com/Wanyaldee/quantum-visualizer/blob/main/LICENSE">
            MIT License
          </a>
        </p>
      </footer>
    </div>
  );
}
