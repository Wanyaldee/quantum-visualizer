import type { ReactNode } from "react";
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
        使用例を読むのに必要なことだけをまとめました。もっと丁寧な説明は playground の{" "}
        <a href={playgroundDoc("docs/basics.md")}>量子コンピューティングの基礎</a> にあります。
      </p>
      <div className="terms">
        <Term title="量子ビットと重ね合わせ">
          <p>
            普通のビットは 0 か 1 のどちらか。量子ビットは 0 と 1 を<strong>同時に</strong>
            持てます。n 個あれば 2<sup>n</sup>{" "}
            通りの状態が、それぞれ「振幅」という重みつきで重なります。
          </p>
        </Term>
        <Term title="振幅：大きさと向き">
          <p>
            振幅には<strong>大きさ</strong>と<strong>向き（位相）</strong>
            があります。このアプリでは大きさを円の面積（＝測ったときに出る確率）、向きを針と色で描いています。
          </p>
        </Term>
        <Term title="測定">
          <p>
            測ると重ね合わせは壊れ、確率に従ってどれか<strong>1つ</strong>
            だけが出ます。だから同じ回路を何百回も実行（shots）して、出た回数（counts）で確率を見ます。
          </p>
        </Term>
        <Term title="干渉">
          <p>
            向きのそろった振幅は強め合い、逆向きは打ち消し合います。量子アルゴリズムの仕事は、
            <strong>正解の振幅を強め、不正解を打ち消す</strong>
            ように向きをそろえることです（グローバー探索がその典型）。
          </p>
        </Term>
        <Term title="もつれ（エンタングルメント）">
          <p>
            複数の量子ビットの結果が連動する状態。ベル状態では片方が 0 ならもう片方も必ず
            0。通信の例（超高密度符号化・BB84）はこの性質を使っています。
          </p>
        </Term>
        <Term title="よく出るゲート">
          <ul className="gate-list">
            <li>
              <code>h</code> 0 と 1 を半々に重ねる（重なっていれば干渉させて戻す）
            </li>
            <li>
              <code>x</code> 0 と 1 を入れ替える
            </li>
            <li>
              <code>z</code> 1 の向きを反転（確率は変わらない）
            </li>
            <li>
              <code>cx</code> 制御が 1 のときだけ相手を反転（CNOT）
            </li>
            <li>
              <code>cz</code> / <code>ccz</code> 全部 1 のときだけ向きを反転
            </li>
          </ul>
          <p className="term-foot">
            全一覧は <a href={playgroundDoc("docs/gates.md")}>対応ゲート一覧</a>。
          </p>
        </Term>
        <Term title="ビット列の読み方">
          <p>
            blueqat もこのアプリも<strong>左端が q0</strong>
            です（<code>bitstring[0]</code> = q0）。<code>101</code> は q0 = 1, q1 = 0, q2 =
            1。教科書によっては逆向きに書くので、よくつまずきます。
          </p>
        </Term>
        <Term title="QUBO">
          <p>
            0/1 の変数の2次式で書いた「点数表」。点数が一番<strong>低い</strong>
            組み合わせが答えです。「ちょうど2つ選ぶ」などのルールは、破ると点数が上がる
            <strong>罰点</strong>として足します。最大化したいときは符号を反転します。
          </p>
        </Term>
        <Term title="QAOA と量子アニーリング">
          <p>
            どちらも QUBO を解く方法です。QAOA はゲート回路を数段重ねて近づける方法（playground の
            run_qaoa）、アニーリングは「簡単な問題」から「解きたい問題」へゆっくり切り替える方法（このアプリの
            <a href="#anneal">アニーリング</a>）。どちらも
            <strong>必ず最適解が出るとは限りません</strong>。
          </p>
        </Term>
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
