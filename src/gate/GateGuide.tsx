import { useMemo } from "react";
import { cx, h, run, z } from "../learn/demo";
import { Dials, Measured } from "../learn/DemoViews";
import { probabilities, sample, type Gate } from "../quantum/gate";
import { SlideDeck, type Slide } from "../ui/SlideDeck";
import { PhaseLegend } from "./AmplitudeDials";
import { CircuitDiagram } from "./CircuitDiagram";
import { Word } from "../ui/Word";

const BELL: Gate[] = [h(0), cx(0, 1)];
// RY(π/3) leaves |0⟩ with cos²(π/6) = 75 % and |1⟩ with 25 %.
const RY_75_25: Gate = { gate: "ry", qubits: [0], params: [Math.PI / 3] };

function CircuitAt({ gates, step }: { gates: Gate[]; step: number }) {
  return (
    <>
      <CircuitDiagram n={2} gates={gates} step={step} onStep={() => {}} />
      <Dials n={2} gates={gates.slice(0, step)} />
    </>
  );
}

function useSlides(): Slide[] {
  return useMemo(() => {
    const bell = run(2, BELL);
    const shots = () => sample(probabilities(bell), 1000);

    return [
      {
        title: "回路図と「いまの状態」",
        body: (
          <p>
            画面の上が回路図、下の「いまの状態」がその時点の量子ビットの中身です。「1つ進める」「自動で進める」で縦線が動き、その下の説明文がいま通ったゲートの意味を教えてくれます。
          </p>
        ),
        frames: [
          {
            view: <CircuitAt gates={BELL} step={0} />,
            caption:
              "横線1本が量子ビット1つ（上から q0, q1）で、左から右へ時間が進みます。縦線が「いまここ」。まだゲートを通っていないので、|00⟩ の円だけが満タンです。",
          },
          {
            view: <CircuitAt gates={BELL} step={1} />,
            caption:
              "1つ進めると縦線が H の箱を越え、円が変わります。円はいつも「縦線の位置での状態」です。",
          },
          {
            view: <CircuitAt gates={BELL} step={2} />,
            caption:
              "●から線が伸びて ⊕ につながる形が CNOT（●が 1 のときだけ ⊕ 側の 0 と 1 を入れ替える）。回路図の列をクリックすると、その時点へ飛べます。",
          },
        ],
      },
      {
        title: "円の読み方",
        body: (
          <p>
            1つの円が1つの結果（ビット列）です。灰色の輪が 100% の大きさで、塗られた円の
            <strong>面積</strong>
            が、測ったときにその結果が出る確率。針の向きと色が<Word id="phase">位相</Word>
            （振幅の「向き」）です。
          </p>
        ),
        school: (
          <p>
            <b>中学数学「相似」</b>
            ：面積の比は相似比（半径の比）の2乗。だから確率が 25% の円は、半径が 100% の円のちょうど
            1/2 です。半径で確率を描くと 25% が 1/16 の面積に見えてしまうので、面積で描いています。
          </p>
        ),
        frames: [
          {
            view: (
              <>
                <Dials n={1} gates={[]} />
                <PhaseLegend />
              </>
            ),
            caption: "|0⟩ の円が輪いっぱい＝100%。|1⟩ は空っぽ＝0% です。",
          },
          {
            view: (
              <>
                <Dials n={1} gates={[RY_75_25]} />
                <PhaseLegend />
              </>
            ),
            caption: "75% と 25%。25% の円は、半径が輪の半分です（面積が 1/4）。",
          },
          {
            view: (
              <>
                <Dials n={1} gates={[h(0)]} />
                <PhaseLegend />
              </>
            ),
            caption: "50% ずつ。円の下の数字が確率です。",
          },
          {
            view: (
              <>
                <Dials n={1} gates={[h(0), z(0)]} />
                <PhaseLegend />
              </>
            ),
            caption:
              "確率は同じ 50% ずつでも、|1⟩ の針と色が逆向きに。下の色の輪で、色と向き（位相）の対応を確かめられます。",
          },
        ],
      },
      {
        title: "ここで測ると",
        kosen: (
          <p>
            <b>1年「電気情報基礎Ⅰ（情報）」モンテカルロ法</b>
            ：「1000 回測ってみる」は、乱数で結果を引いて数えるモンテカルロ・シミュレーションです。
          </p>
        ),
        body: (
          <p>
            右側の「1000 回測ってみる」は、いまの状態を 1000
            回測ったときの結果をサンプリングします。棒が出た回数、細い縦線が円の大きさから計算した理論上の確率です。
          </p>
        ),
        frames: [
          {
            view: <Measured state={bell} n={2} counts={null} />,
            caption: "ベル状態。|00⟩ と |11⟩ が 50% ずつです。",
          },
          {
            view: <Measured state={bell} n={2} counts={shots()} />,
            caption: "1000 回測った結果。00 と 11 がだいたい半々で、01 と 10 は一度も出ません。",
          },
          {
            view: <Measured state={bell} n={2} counts={shots()} />,
            caption:
              "もう一度 1000 回。回数は毎回少しずつ変わります。測定は確率的なので、ぴったり 500 回ずつにはなりません。",
          },
        ],
      },
      {
        title: "回路を自分で組む",
        body: (
          <p>
            画面下の「回路を自分で組む」で、ゲートと量子ビットを選んで追加できます。blueqat の
            run_circuit 形式の JSON を貼り付けることもできます。量子ビットは 5 個まで。
          </p>
        ),
        frames: (
          [
            [[], "空の回路。2つの量子ビットが |00⟩ にいます。"],
            [[h(0)], "q0 に H を追加。追加するたびに、最後のゲートの直後の状態が表示されます。"],
            [[h(0), cx(0, 1)], "CNOT を追加して、ベル状態ができました。"],
            [
              [h(0), cx(0, 1), z(0)],
              "Z を足すと |11⟩ の針だけが逆向きに。確率は変わらないので、測っただけでは区別できない別の状態です。",
            ],
          ] satisfies [Gate[], string][]
        ).map(([gates, caption]) => ({
          view: <CircuitAt gates={gates} step={gates.length} />,
          caption,
        })),
      },
    ];
  }, []);
}

export function GateGuide() {
  return <SlideDeck slides={useSlides()} label="ゲート式の画面の見方" />;
}
