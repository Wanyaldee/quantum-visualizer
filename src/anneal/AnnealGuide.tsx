import { useMemo } from "react";
import { maxcutDemo, POINTS } from "../learn/demo";
import { evolve, successByTime } from "../quantum/anneal";
import { pct } from "../ui/phase";
import { SlideDeck, type Slide } from "../ui/SlideDeck";
import { DistributionBars } from "./DistributionBars";
import { ProblemGraph } from "./ProblemGraph";
import { SpectrumChart } from "./SpectrumChart";
import { SuccessChart } from "./SuccessChart";

interface TimeAxis {
  /** The lab's T grid and range, so the guide's chart has the same axis as the lab's. */
  Ts: number[];
  tMin: number;
  tMax: number;
}

function useSlides({ Ts, tMin, tMax }: TimeAxis): Slide[] {
  return useMemo(() => {
    const { problem, raw, ground, ep, sp, gapK, slow } = maxcutDemo();
    const success = successByTime(problem.n, ep, Ts);
    const finalSuccess = (T: number) => {
      const last = evolve(problem.n, ep, T, POINTS)[POINTS - 1];
      return [...ground].reduce((p, i) => p + last.re[i] ** 2 + last.im[i] ** 2, 0);
    };

    const spectrumAt = (k: number) => (
      <SpectrumChart
        sp={sp}
        pops={slow.pops}
        sIndex={k}
        groundCount={ground.size}
        onSeek={() => {}}
      />
    );
    const barsAt = (k: number) => (
      <DistributionBars
        n={problem.n}
        probs={slow.probs(k)}
        energies={raw}
        ground={ground}
        describe={problem.describe}
      />
    );
    const successAt = (T: number) => {
      const p = finalSuccess(T);
      return {
        p,
        view: <SuccessChart Ts={Ts} success={success} T={T} current={p} tMin={tMin} tMax={tMax} />,
      };
    };
    const hurry = successAt(1);
    const normal = successAt(20);
    const careful = successAt(300);

    return [
      {
        title: "何をしている画面か",
        body: (
          <p>
            上の題材を選び、「再生」を押すと s が 0 から 1 へ進みます。s
            は「解きたい問題がどれだけ混ざっているか」で、0 では問題のことを何も知らず、1
            で問題そのものになります。名前は、金属を熱してゆっくり冷ます「焼きなまし（annealing）」から来ています。
          </p>
        ),
        school: (
          <p>
            <b>数学A「場合の数」</b>：4 つの点を 2 色で塗る方法は 2<sup>4</sup> = 16
            通りで、全部調べても一瞬です。点が 30 個なら 2<sup>30</sup> ≈ 10 億通り、60 個なら 10
            <sup>18</sup>{" "}
            通り。組み合わせが爆発的に増えるので、全部を調べずに良い答えを見つける方法が欲しくなります。
          </p>
        ),
        frames: [
          {
            view: <ProblemGraph problem={problem} probs={slow.probs(0)} />,
            caption:
              "s = 0。どの塗り分けも同じ確率なので、点は灰色のまま（答えはまだ決まっていない）。",
          },
          {
            view: <ProblemGraph problem={problem} probs={slow.probs(60)} />,
            caption: "s を進めると、一番出やすい答えで点に色が付き始めます。",
          },
          {
            view: <ProblemGraph problem={problem} probs={slow.probs(POINTS - 1)} />,
            caption:
              "s = 1。隣どうしができるだけ違う色になる塗り分けに落ち着きました。太い線が「色が分かれた線」です。",
          },
        ],
      },
      {
        title: "エネルギーの階段",
        body: (
          <p>
            横軸が
            s、縦軸がエネルギー。線は「その時点で取りうるエネルギーの段」、青い丸は状態がどの段にどれだけいるか（大きさ＝確率）です。グラフをクリックすると、その
            s へ飛べます。
          </p>
        ),
        school: (
          <p>
            <b>物理基礎「力学的エネルギー」</b>
            ：ボールが坂の一番低い所に落ち着くように、答えの「点数」をエネルギーと見なして一番低い所を探します。縦軸の値は、題材の点数を見やすい範囲に縮めたものです。
          </p>
        ),
        frames: [
          {
            view: spectrumAt(0),
            caption: "s = 0。丸は一番下の段に全部乗っています。青い点線が「いまの s」です。",
          },
          {
            view: spectrumAt(30),
            caption:
              "s が進むと、段がそれぞれ上下に動きます。緑の線は、最後に最適な答えにつながる段です。",
          },
          {
            view: spectrumAt(gapK),
            caption:
              "黒い縦の印が「すき間が一番狭い所」。ここで急ぐと、丸が上の段に飛び移ってしまいます。",
          },
          {
            view: spectrumAt(POINTS - 1),
            caption: "s = 1。丸が緑の段にいれば、最適な答えにたどり着いたということです。",
          },
        ],
      },
      {
        title: "答えごとの確率",
        body: (
          <p>
            いま測ったら、どの答え（ビット列）がどれくらいの確率で出るか。左ほど点数の低い良い答えで、緑が最適な答えです。棒にマウスを乗せると、その答えの意味が出ます。画面下の「出やすい答え」は、この棒の上位3つです。
          </p>
        ),
        frames: [
          {
            view: barsAt(0),
            caption: "s = 0。すべての棒が同じ高さ。どの答えも同じくらい出ます。",
          },
          {
            view: barsAt(50),
            caption: "途中。左側（良い答え）の棒が伸び、右側が縮み始めます。",
          },
          {
            view: barsAt(POINTS - 1),
            caption: `s = 1。左端の緑の棒に確率が集まりました（合わせて ${pct(normal.p)}）。`,
          },
        ],
      },
      {
        title: "アニーリング時間と正解率",
        body: (
          <p>
            「アニーリング時間 T」は s を 0 から 1 まで進める時間です。このグラフは、T
            を変えると最後に最適な答えが出る確率がどう変わるかを、まとめて計算したもの。丸が、いま選んでいる
            T です。
          </p>
        ),
        school: (
          <p>
            <b>数学II「対数関数」</b>：横軸は<b>対数目盛</b>で、1 → 10 → 100
            が等間隔に並びます。「急ぐ」と「じっくり」では T
            が数百倍違うので、普通の目盛では左の端に押しつぶされてしまいます。T
            のスライダーも同じ対数目盛です。
          </p>
        ),
        frames: [
          {
            view: hurry.view,
            caption: `T = 1（急ぐ）。最適な答えが出る確率は ${pct(hurry.p)}。すき間で上の段に飛び移ってしまうためです。`,
          },
          {
            view: normal.view,
            caption: `T = 20（ほどほど）。最適な答えが出る確率は ${pct(normal.p)} まで上がりました。`,
          },
          {
            view: careful.view,
            caption: `T = 300（じっくり）。確率は ${pct(careful.p)}。ゆっくり進めるほど、一番下の段に居続けられます。`,
          },
        ],
      },
    ];
  }, [Ts, tMin, tMax]);
}

export function AnnealGuide(axis: TimeAxis) {
  return <SlideDeck slides={useSlides(axis)} label="アニーリングの画面の見方" />;
}
