import type { ReactNode } from "react";
import { BasicsSlides } from "./BasicsSlides";
import {
  PLAYGROUND_EXAMPLES,
  PLAYGROUND_URL,
  playgroundDoc,
  viewHash,
  type ExampleGroup,
  type PlaygroundExample,
} from "../presets/examples";

const GROUPS: { id: ExampleGroup; title: string; lede: string }[] = [
  {
    id: "circuit",
    title: "ゲート回路",
    lede: "run_circuit に回路を投げる例。ゲート1つごとに状態がどう変わるかを見られます。",
  },
  {
    id: "optimize",
    title: "最適化（QAOA）",
    lede: "QUBO を run_qaoa で解く例。同じ QUBO をアニーリングで解く様子を見られます。",
  },
  {
    id: "vqe",
    title: "エネルギー計算（VQE）",
    lede: "run_vqe で一番低いエネルギーを探す例。いまのところ、このアプリでは再現できません。",
  },
  {
    id: "workshop",
    title: "ワークショップ向けの身近な題材",
    lede: "生活・経営・研究の割り当てや選択の問題。どれも古典的な方法で一瞬で解ける規模です。",
  },
];

function Term({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="term">
      <h3>{title}</h3>
      {children}
    </article>
  );
}

function Basics() {
  return (
    <section className="learn-section" aria-labelledby="basics">
      <h2 id="basics">最低限の知識</h2>
      <p className="lede">
        使用例を読むのに必要なことだけを、このアプリの図が動く様子と一緒にまとめました。自動で進むアニメーションの横に、いま何が起きているかの説明が出ます。もっと丁寧な説明は
        playground の <a href={playgroundDoc("docs/basics.md")}>量子コンピューティングの基礎</a>{" "}
        にあります。
      </p>
      <BasicsSlides />
      <h3 className="terms-title">アニメーションにしていない補足</h3>
      <div className="terms">
        <Term title="VQE">
          <p>
            パラメータつきの回路でエネルギーを測り、古典コンピュータがパラメータを直す、をくり返して一番低いエネルギーを探す方法。分子や物質の計算に使います。
          </p>
        </Term>
        <Term title="シミュレータと実機">
          <p>
            このアプリも playground の結果も、ノイズのない<strong>シミュレータ</strong>
            です。実機では誤りが混ざります（
            <a href={playgroundDoc("docs/simulator_vs_hardware.md")}>シミュレータと実機の違い</a>
            ）。playground の結果には run_id があり、本当に実行したかを検証できます。
          </p>
        </Term>
        <Term title="量子が役に立つとは限らない">
          <p>
            ここにある例はどれも、普通のコンピュータで一瞬で解ける規模です。目的は「どう動くか」を見ることで、速さの証明ではありません（
            <a href={playgroundDoc("docs/when_to_use_quantum.md")}>
              枯れた技術のほうが優れているかもしれない話
            </a>
            ）。
          </p>
        </Term>
      </div>
    </section>
  );
}

function ExampleCard({ ex }: { ex: PlaygroundExample }) {
  return (
    <li className="example">
      <span className="example-no" aria-hidden="true">
        {ex.no}
      </span>
      <div className="example-body">
        <h4>
          <span className="sr-only">例{ex.no}: </span>
          {ex.title}
        </h4>
        <p className="example-tools">
          {ex.tools.map((t) => (
            <code key={t}>{t}</code>
          ))}
        </p>
        <p>{ex.summary}</p>
        {ex.missing && <p className="example-missing">{ex.missing}</p>}
        <p className="example-actions">
          <a href={playgroundDoc(`examples/${ex.file}`)}>使用例を読む</a>
          {ex.view && (
            <a className="btn btn-primary" href={viewHash(ex.view)}>
              ふるまいを見る（{ex.view.mode === "gate" ? "ゲート式" : "アニーリング"}）
            </a>
          )}
          {ex.related && (
            <a className="btn" href={viewHash(ex.related)}>
              近いふるまいを見る
            </a>
          )}
        </p>
        {ex.related && <p className="example-related">{ex.related.label}</p>}
      </div>
    </li>
  );
}

export function LearnPage() {
  return (
    <div className="lab learn">
      <section className="stage">
        <Basics />
      </section>
      <section className="stage learn-section" aria-labelledby="examples">
        <h2 id="examples">blueqat-mcp-playground の使用例</h2>
        <p className="lede">
          <a href={PLAYGROUND_URL}>blueqat-mcp-playground</a> の全
          {PLAYGROUND_EXAMPLES.length} 例です。「使用例を読む」で実際に blueqat MCP
          に投げた回路・QUBO と結果を、「ふるまいを見る」でこのアプリでの動きを見られます。
        </p>
        {GROUPS.map((g) => (
          <div key={g.id} className="example-group">
            <h3>{g.title}</h3>
            <p className="panel-text">{g.lede}</p>
            <ol className="examples">
              {PLAYGROUND_EXAMPLES.filter((e) => e.group === g.id).map((ex) => (
                <ExampleCard key={ex.no} ex={ex} />
              ))}
            </ol>
          </div>
        ))}
      </section>
    </div>
  );
}
