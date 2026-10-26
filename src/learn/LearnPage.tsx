import { useEffect, useState, type ReactNode } from "react";
import { BasicsSlides } from "./BasicsSlides";
import { Chapter } from "./Chapter";
import { Glossary, MoreToLearn } from "./GlossarySection";
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
    <>
      <p className="lede">
        使用例を読むのに必要なことだけを、このアプリの図が動く様子と一緒にまとめました。自動で進むアニメーションの横に、いま何が起きているかの説明が出ます。もっと丁寧な説明は
        playground の <a href={playgroundDoc("docs/basics.md")}>量子コンピューティングの基礎</a>{" "}
        にあります。
      </p>
      <p className="lede">
        学校で習う数学や物理の話も入れています。習っている人はこういうところで使われてるんだ〜と思って、習っていない人は習ったときに、あそこで役立ってるって言ってたな〜と思ってもらえたら嬉しいです。
      </p>
      <p className="panel-text">
        高校の科目名はいまの学習指導要領のもの、「高専では」の科目名と学年は
        <a href="https://syllabus.kosen-k.go.jp/Pages/PublicSubjects?school_id=39&department_id=32&year=2025&lang=ja">
          香川高専 電気情報工学科の令和7年度シラバス
        </a>
        から、あくまで参考情報として拾ってきたものです。学校や学科、年度によって科目名や学ぶ時期は違いますが、「この勉強はこの先あそこにつながるんだ」と見通しを持って勉強するきっかけになれば嬉しいです。
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
    </>
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

const CHAPTERS = ["glossary", "basics", "examples", "more"] as const;
type ChapterId = (typeof CHAPTERS)[number];

/** The chapter that holds a `#learn/<focus>` target: a chapter id, or a glossary word. */
function chapterOf(focus: string | undefined): ChapterId | null {
  if (!focus) return null;
  if (focus.startsWith("term-")) return "glossary";
  return CHAPTERS.find((c) => c === focus) ?? null;
}

/**
 * `focus` is the element id after `#learn/`: a chapter (`examples`) or a glossary word
 * (`term-phase`). Chapters start closed so the page reads as a table of contents; the one
 * holding the focus starts open.
 */
export function LearnPage({ focus }: { focus?: string }) {
  const [open, setOpen] = useState<ReadonlySet<ChapterId>>(() => {
    const c = chapterOf(focus);
    return new Set(c ? [c] : []);
  });
  const toggle = (id: ChapterId) => (isOpen: boolean) =>
    setOpen((prev) => {
      if (prev.has(id) === isOpen) return prev;
      const next = new Set(prev);
      if (isOpen) next.add(id);
      else next.delete(id);
      return next;
    });

  useEffect(() => {
    if (!focus) return;
    const block = focus.startsWith("term-") ? "center" : "start";
    document.getElementById(focus)?.scrollIntoView({ block });
  }, [focus]);

  const chapter = (id: ChapterId) => ({ id, open: open.has(id), onToggle: toggle(id) });

  return (
    <div className="lab learn">
      <div className="chapter-tools">
        <p className="panel-text">見たい章を開いてください。</p>
        <button type="button" className="btn" onClick={() => setOpen(new Set(CHAPTERS))}>
          すべて開く
        </button>
        <button type="button" className="btn" onClick={() => setOpen(new Set())}>
          すべてたたむ
        </button>
      </div>
      <Chapter
        {...chapter("glossary")}
        title="まず、言葉の意味"
        hint="画面に出てくる言葉を、数式なしでひとことずつ説明します"
      >
        <Glossary focus={focus} />
      </Chapter>
      <Chapter
        {...chapter("basics")}
        title="最低限の知識"
        hint="重ね合わせ・干渉・もつれ・QUBO などを、図が動くスライドで順に見ます"
      >
        <Basics />
      </Chapter>
      <Chapter
        {...chapter("examples")}
        title="blueqat-mcp-playground の使用例"
        hint={`全 ${PLAYGROUND_EXAMPLES.length} 例と、それぞれのふるまいを見るリンク`}
      >
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
      </Chapter>
      <Chapter {...chapter("more")} title="もっと知りたい人へ" hint="Qni など、次に読む教材">
        <MoreToLearn />
      </Chapter>
    </div>
  );
}
