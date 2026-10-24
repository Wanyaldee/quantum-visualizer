# quantum-visualizer

量子コンピュータが「どう振る舞って答えを出すのか」を、ゲート1つごとの状態ベクトル（振幅・位相）の変化として
目で見るための Web アプリです。ワークショップ教材兼、自分の理解のためのツール。

量子回路の題材・実行結果は [blueqat-mcp-playground](https://github.com/Wanyaldee/blueqat-mcp-playground) を参照。

公開ページ: https://wanyaldee.github.io/quantum-visualizer/

## できること

- **ゲート式**（`#gate`）: 回路を1ゲートずつ進め、各状態の確率（円の面積）と位相（針・色）がどう変わるかを見る。
  ベル状態・GHZ・グローバー・量子乱数・鍵探索・BB84・超高密度符号化などのプリセット、ゲートの追加、blueqat `run_circuit` 形式の JSON 読み込み、測定のサンプリング。
- **アニーリング**（`#anneal`）: 横磁場から問題へ少しずつ切り替える量子アニーリングを厳密に計算し、
  エネルギー準位と状態の居場所、答えごとの確率、アニーリング時間と正解率の関係を見る。
  MaxCut・予算一致・チーム分け・当番割当・出店・会議・実験・査読（playground 例4, 7, 14〜19）のプリセット、blueqat `run_qaoa` 形式の QUBO 読み込み。
- **使用例と基礎**（`#learn`）: playground の全19例を一覧にし、各例の Markdown と、このアプリで動きを見られるプリセット
  （`#gate/<id>` / `#anneal/<id>` で直接開ける）へリンク。使用例を読むための最低限の知識もここにまとめています。

設計判断は ADR を参照（[日本語](docs/adr/ja/0001-in-browser-simulators.md) / [English](docs/adr/en/0001-in-browser-simulators.md)）。

## 方針

- 計算はブラウザ内の小さな状態ベクトルシミュレータで行う（外部 API・キー不要、オフラインでも動く）
- 静的サイトとして GitHub Pages で配信

## 開発

[Vite+](https://viteplus.dev) (`vp`) を使います。

```sh
vp install      # 依存関係のインストール
vp dev          # 開発サーバー
vp check        # format / lint / 型チェック
vp test         # シミュレータのテスト
vp run build    # 本番ビルド（dist/）
```

## デプロイ

`main` に push すると `.github/workflows/deploy.yml` が GitHub Pages にデプロイします。
初回のみ、GitHub のリポジトリ設定 Settings → Pages → Source を「GitHub Actions」にしてください。

## ライセンス

MIT
