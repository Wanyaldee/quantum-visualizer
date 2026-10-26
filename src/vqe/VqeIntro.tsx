import { Word } from "../ui/Word";
import { VQE_REFERENCES } from "./references";

/** How VQE works, without formulas: the loop, the one rule that makes it work, the pitfalls. */
export function VqeIntro() {
  return (
    <details className="vqe-intro" open>
      <summary>VQE は何をしているのか（はじめての人へ）</summary>
      <p>
        分子や磁石は、
        <Word id="energy" />
        が一番低い状態に落ち着こうとします。その一番低いエネルギーが分かると、分子がどれくらいしっかりくっつくか、などが分かります。
        <Word id="vqe" />
        は、それを量子コンピュータと普通のコンピュータが協力して探す方法です。
      </p>
      <p>
        たとえるなら、<strong>目かくしをして山の谷底を探す</strong>
        ようなものです。足もとが下り坂になっている方へ一歩ずつ進めば、だんだん低い所へ下りていけます。
      </p>
      <ol className="vqe-loop">
        <li>
          <b>量子コンピュータ</b>：<Word id="parameter">つまみ</Word>
          の角度どおりに回路を動かして、状態を1つ作る。
        </li>
        <li>
          <b>量子コンピュータ</b>
          ：その状態のエネルギーを測る。1回測るだけでは結果が1つしか出ないので、何回も測って平均します（
          <Word id="expectation">期待値</Word>）。
        </li>
        <li>
          <b>普通のコンピュータ</b>：つまみを少し回したらエネルギーが上がるか下がるか（
          <Word id="gradient">坂の向き</Word>
          ）を調べて、下がる向きにつまみを回す。そして 1 に戻る。
        </li>
      </ol>
      <div className="vqe-boxes">
        <div className="vqe-box">
          <h4>大事な決まり：本当の答えより下には行けない</h4>
          <p>
            どんな状態を作っても、測ったエネルギーは本当の一番低いエネルギーより
            <strong>下にはなりません</strong>（<Word id="variational">変分原理</Word>
            ）。だから、エネルギーが下がれば下がるほど本当の答えに近づいている、と言えます。グラフの緑の線は、答え合わせのために普通のコンピュータで計算した本当の値です。大きな分子では、この答え合わせ自体ができなくなります。
          </p>
        </div>
        <div className="vqe-box">
          <h4>うまくいかないこともある</h4>
          <p>
            回路の形（<Word id="ansatz">アンザッツ</Word>
            ）が答えの状態を作れないと、どれだけつまみを回しても届きません。谷底に着いたと思ったら、途中の
            <Word id="local-min">くぼみ</Word>
            だった、ということもあります（水素分子で出発点を変えると見られます）。量子ビットが増えると、坂がほとんど平らで進む向きが分からない場所が広がる、という難しさも知られています。
          </p>
        </div>
      </div>
      <p className="panel-foot">
        このアプリは、つまみを1つずつ「4分の1回転だけ両方向に回して測り、差から坂の向きを知る」方法（パラメータシフト則）で、坂を素直に下っています。playground
        の run_vqe の中の方法は公開されていないので、何回で着くかは比べられません。参考にした教材：
        {VQE_REFERENCES.map((r, i) => (
          <span key={r.href}>
            {i > 0 && "、"}
            <a href={r.href}>{r.label}</a>
          </span>
        ))}
        。
      </p>
    </details>
  );
}
