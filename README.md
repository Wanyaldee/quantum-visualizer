# quantum-visualizer

量子コンピュータが「どう振る舞って答えを出すのか」を、ゲート1つごとの状態ベクトル（振幅・位相）の変化として
目で見るための Web アプリです。ワークショップ教材兼、自分の理解のためのツール。

量子回路の題材・実行結果は [blueqat-mcp-playground](https://github.com/Wanyaldee/blueqat-mcp-playground) を参照。

## 方針

- 計算はブラウザ内の小さな状態ベクトルシミュレータで行う（外部 API・キー不要、オフラインでも動く）
- 静的サイトとして GitHub Pages で配信

## 開発

[Vite+](https://viteplus.dev) (`vp`) を使います。

```sh
vp install      # 依存関係のインストール
vp dev          # 開発サーバー
vp check        # format / lint / 型チェック
vp run build    # 本番ビルド（dist/）
```

## デプロイ

`main` に push すると `.github/workflows/deploy.yml` が GitHub Pages にデプロイします。
初回のみ、GitHub のリポジトリ設定 Settings → Pages → Source を「GitHub Actions」にしてください。

## ライセンス

MIT
