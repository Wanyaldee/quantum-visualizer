# このリポジトリの位置づけ

このリポジトリは [blueqat-mcp-playground](https://github.com/Wanyaldee/blueqat-mcp-playground)（ローカルでは `../blueqat-mcp-playground`）の姉妹リポジトリです。あちらの `examples/` にある使用例が量子回路やアニーリングで何をしているのかを、ブラウザ上で目に見える形にするためにあります。

- blueqat-mcp-playground に使用例が追加・変更されたら、こちらもそれに合わせる。ゲート式の例は `src/presets/circuits.ts`、アニーリング・QAOA 系の例は `src/presets/problems.ts` にプリセットを追加・更新する。
- 使用例に対応するプリセットは、タイトルの末尾に `（例N）` と元の例番号を付ける（例: `ベル状態：2つの量子ビットのもつれ（例1）`）。
- 新しいプリセットを作るときは、元の例の Markdown を読んで回路や問題設定を写し取る。回路の結果や振る舞いが元の例の説明と食い違わないことを、`src/quantum/*.test.ts` のテストで確かめる。
- 今のシミュレータでは視覚化しきれない例（量子ビット数が多すぎる、未対応のゲートを使う、など）は無理にプリセットにしない。どこが足りないかをユーザーに伝える。

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->
