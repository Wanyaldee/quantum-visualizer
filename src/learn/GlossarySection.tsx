import { VQE_REFERENCES } from "../vqe/references";
import { GLOSSARY, type GlossaryGroup } from "./glossary";

const QNI = "https://qniapp.github.io/qni/";

const GLOSSARY_GROUPS: { id: GlossaryGroup; title: string }[] = [
  { id: "common", title: "どちらの方式にも出てくる言葉" },
  { id: "gate", title: "ゲート式の言葉" },
  { id: "anneal", title: "アニーリング・最適化の言葉" },
  { id: "vqe", title: "VQE の言葉" },
];

/** Every word the labs link to; `#learn/term-<id>` scrolls here. */
export function Glossary({ focus }: { focus?: string }) {
  return (
    <>
      <p className="lede">
        量子コンピュータの説明には聞き慣れない言葉がたくさん出てきます。数式なしで、ひとことずつ説明します。状態は{" "}
        <a href={`${QNI}circle_notation.html`}>Qni</a> と同じく「
        <strong>円の大きさ＝出やすさ</strong>」「<strong>針の向き＝位相</strong>
        」で思い浮かべてください。ゲート式とアニーリングの画面に出てくる言葉は、ここにつながっています。
      </p>
      {GLOSSARY_GROUPS.map((g) => (
        <div key={g.id} className="glossary-group">
          <h3>{g.title}</h3>
          <dl className="glossary">
            {GLOSSARY.filter((e) => e.group === g.id).map((e) => (
              <div
                key={e.id}
                id={`term-${e.id}`}
                className="glossary-item"
                data-focus={focus === `term-${e.id}` || undefined}
              >
                <dt>{e.word}</dt>
                <dd>{e.short}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
      <p className="panel-text">
        <strong>重ね合わせは状態</strong>（いくつもの結果の可能性を持っていること）、
        <strong>干渉は現象</strong>
        （振幅が足し合わさって強め合ったり打ち消し合ったりすること）です。よく混同されるので注意してください。
      </p>
    </>
  );
}

export function MoreToLearn() {
  return (
    <>
      <p className="lede">
        <a href={QNI}>Qni の量子プログラミング入門</a>
        は、ブラウザ上で回路を組みながら1つずつ学べる日本語の教材です。このアプリの「円の大きさと針の向き」という見方も
        Qni の表示に合わせています。
      </p>
      <ul className="more-links">
        <li>
          <a href={`${QNI}superposition.html`}>重ね合わせ</a>
        </li>
        <li>
          <a href={`${QNI}phase.html`}>位相</a>
        </li>
        <li>
          <a href={`${QNI}circle_notation.html`}>状態ベクトルの表示（円と針）</a>
        </li>
        <li>
          <a href={`${QNI}h_gate.html`}>H ゲート</a>
        </li>
      </ul>
      <p className="panel-text">VQE をもっと知りたい人へ（VQE の画面の説明の参考文献）：</p>
      <ul className="more-links">
        {VQE_REFERENCES.map((r) => (
          <li key={r.href}>
            <a href={r.href}>{r.label}</a>
          </li>
        ))}
      </ul>
    </>
  );
}
