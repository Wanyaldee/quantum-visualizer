# 0005: Beginner glossary, "H makes a superposition", collapsible learn page

[日本語](../ja/0005-beginner-glossary-and-h-wording.md)

## Context

A reviewer of blueqat-mcp-playground wrote: "Showing how gate and annealing methods behave is a
good idea, but terms are used without explanation, and some meanings look wrong (isn't the
Hadamard gate superposition rather than interference?)". The playground side agreed and fixed
its docs (`docs/basics.md`, `docs/gates.md`). It then asked this repo to do the same:

- The H narration said "重なっていれば干渉させて戻す" (if already superposed, interfere it
  back), in `GateLab.tsx` `describeGate`, the learn page's gate list, and later also in
  `BasicsSlides.tsx`, which arrived with an upstream pull during the work.
- The preset "干渉：H を2回かけると元に戻る" read as if H were interference itself. Its circuit
  was H→Z→H, which ends in 1, so the title "returns to the start" did not even match.
- Jargon (振幅, 位相, 状態ベクトル, オラクル, 拡散, QUBO, 罰点, ハミルトニアン, …) appeared on the
  gate and annealing screens with no explanation. The target reader is someone who knows
  nothing about quantum computing. The reference is [Qni](https://qniapp.github.io/qni/):
  disc size = how likely, needle = phase.
- After the glossary and slides were added, the user found the learn page too long and asked
  for chapters that collapse or can be jumped to.

## Decision

- **H wording.** H "makes a superposition; applying it again undoes it" everywhere it is
  described: step narration, slide, gate lists. Interference is described as a phenomenon
  (amplitudes add: the same direction reinforces, opposite directions cancel), and the
  glossary says "重ね合わせは状態、干渉は現象" (superposition is a state, interference is a
  phenomenon).
- **Preset `interference`** (id unchanged, so links keep working). The title is now
  "重ね合わせと干渉：H を2回かけると元に戻る" and the circuit is H, H, H, Z, H, so one circuit
  shows both H→H (back to 0) and H→Z→H (always 1). The notes separate "1回目の H makes the
  superposition" from "2回目の H: amplitudes add, interference happens".
- **A new slide "アダマールゲート（H）は何をするのか"** (H on 0, H on 1, H on a superposition).
  The interference slide is now titled "干渉（ゲートではなく現象）".
- **Glossary** (`src/learn/glossary.ts`). It started with 30 terms in three groups, and
  ADR 0006 adds a VQE group. The definitions match playground's `docs/basics.md`. Terms reach
  the reader in three ways:
  - `TermHints`, a collapsible "この文に出てくる言葉" list under every preset summary and step
    note, built automatically from the text.
  - `Word`, a dotted-underline link with a hover or focus tip inside fixed UI text.
  - A glossary chapter on the learn page. `#learn/term-<id>` opens it and scrolls to the term.
- **"もっと知りたい人へ"** links Qni's superposition, phase, circle notation and H gate pages.
- **Collapsible chapters.** The learn page is four `Chapter`s, closed by default, with "すべて
  開く／すべてたたむ" buttons. `#learn/<chapter>` and `#learn/term-<id>` open the right chapter.
  `ExampleLink` now points at `#learn/examples`.

## Reason

**The preset shows both outcomes in one circuit, and the tests pin each step.**

```ts
gates: [h(0), h(0), h(0), z(0), h(0)],
```

```ts
const [, h1, hh, h3, hz, hzh] = simulateSteps(p.n, p.gates).map((s) =>
  Array.from(probabilities(s)),
);
for (const half of [h1, h3, hz]) {
  expect(half[0]).toBeCloseTo(0.5);
  expect(half[1]).toBeCloseTo(0.5);
}
expect(hh[0]).toBeCloseTo(1);
expect(hzh[1]).toBeCloseTo(1);
expect(p.title.startsWith("重ね合わせと干渉")).toBe(true);
```

- H→H alone would show "returns to 0" but not why the needle matters. H→Z→H alone (the old
  circuit) contradicts the title. Putting both in a row lets the reader step from "50/50 → 0"
  to "50/50 again → Z changes only a needle → 1".
- The title assertion is there so a later edit cannot quietly reintroduce "干渉：H …".

**Glossary hints are found by substring, not hand-tagged.**

```ts
export function termsIn(text: string, skip: readonly string[] = []): GlossaryEntry[] {
  const found: { entry: GlossaryEntry; at: number }[] = [];
  for (const entry of GLOSSARY) {
    if (skip.includes(entry.id)) continue;
    const hits = entry.aliases.map((a) => text.indexOf(a)).filter((i) => i >= 0);
    if (hits.length > 0) found.push({ entry, at: Math.min(...hits) });
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.entry);
}
```

- There are about 60 notes across the presets. Tagging each word by hand would drift as notes
  change. An alias list per term catches new notes automatically, and a test asserts that the
  presets' text covers the key terms.
- Aliases are chosen so they do not collide: the measurement basis uses `"Z 基底"` and
  `"X 基底"`, not `"基底"`, because `"基底エネルギー"` would match. A test checks exactly that
  case.
- `skip` takes the terms already listed under the summary, so a step note does not repeat
  them.
- `TermHints` is a `<details>`. It is closed by default so notes stay short, and the browser
  keeps it open across steps once opened, because React reuses the element.

**The hover tip is a 1 px clipped box until shown.**

```css
.word-tip {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.word:focus-visible .word-tip {
  width: max-content;
  max-width: min(20em, 80vw);
  height: auto;
  clip-path: none;
}
@media (hover: hover) {
  .word:hover .word-tip {
    /* same as focus */
  }
}
```

- The first version hid the tip with `clip-path` and `opacity` only. The full-width hidden
  boxes still counted for layout and widened the page at 390 px: scrollWidth was 584 on
  `#gate/grover` and 556 on `#anneal/team`, against 390 before the change. The 1 px box keeps
  the text readable for screen readers as part of the link without taking layout width.
- Hover only applies under `(hover: hover)`. On touch screens a tap follows the link to the
  glossary instead of flashing a tip.

**A closed chapter does not render its body.**

```tsx
<details id={id} open={open} onToggle={(e) => onToggle(e.currentTarget.open)}>
  <summary>
    <h2>{title}</h2>
    <span className="chapter-hint">{hint}</span>
  </summary>
  {open && <div className="chapter-body learn-section">{children}</div>}
</details>
```

- The basics chapter holds the slide deck, whose frame timer runs while it is mounted.
  Rendering only when open stops that timer behind a closed fold. The cost is that a deck
  restarts from slide 1 when its chapter is reopened.
- Open state lives in `LearnPage` (a `Set` of chapter ids), not in each `<details>`. That way
  "すべて開く" and a `#learn/term-…` link can open chapters, and the target element exists
  before `scrollIntoView` runs.

## Alternatives rejected

- Keeping H→Z→H and only renaming the preset: the title "元に戻る" would still not match the
  outcome (1).
- Using `src/ui/Tooltip.tsx` for terms: it is placed by percentage inside a chart wrapper, not
  next to a word in running text.
- A separate table of contents above expanded chapters: closed chapters with a one-line hint
  already read as a table of contents.
- Naming the glossary component `Glossary.tsx`: on case-insensitive filesystems it collides
  with `glossary.ts` on import resolution, so it is `GlossarySection.tsx`.

## Consequences

- A new preset note gets term hints automatically if its words are aliases. A new jargon word
  needs a glossary entry, or it goes unexplained.
- Glossary wording is kept in step with playground's `docs/basics.md` by hand. Nothing checks
  across the two repos.
- Chapters start closed, so a first-time visitor sees four headings, not content.

## Verification

Commit `db218fa`. The logs below were taken at `985c019`, which includes this work.

`vp check`:

```
pass: All 67 files are correctly formatted (465ms, 24 threads)
pass: Found no warnings, lint errors, or type errors in 48 files (716ms, 24 threads)
```

`vp test`:

```

 RUN  v5.0.5 /home/subgo/quantum-visualizer


 Test Files  5 passed (5)
      Tests  47 passed (47)
   Start at  23:30:19
   Duration  1.13s (tests 89%, import 5%, transform 4%, worker 2%)

```

`vp run build`:

```
$ tsc -b ⊘ cache disabled

$ vp build ⊘ cache disabled
transforming...
✓ 57 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.04 kB │ gzip:   0.63 kB
dist/assets/index-IuX5HyzQ.css   20.39 kB │ gzip:   5.27 kB
dist/assets/index-DNmkB0n7.js   366.13 kB │ gzip: 116.47 kB

✓ built in 220ms

---
vp run: 2/2 successful. (Run `vp run --last-details` for full details)
```

Checks run in a browser:

- Playwright (Chromium) against `vp preview`, at 1200 px and 390 px. `#gate/grover`,
  `#anneal/team` and `#learn` all have scrollWidth equal to the viewport after the 1 px tip
  fix, and there were no page errors. The interference preset's step 2 shows the hint list
  and hover tip in screenshots. On the learn page all chapters are closed by default;
  clicking a heading opens it, "すべて開く／すべてたたむ" opens and closes all four, the
  `#gate/bell` "使用例の一覧と基礎知識" link opens only the examples chapter, and a `Word` link
  from `#gate/grover` opens the glossary with `term-statevector` highlighted.
  Verified-by: Claude Opus 5.5 (AI agent), 2026-10-26

Operations:

- **Operation:** push `main` (`db218fa`, together with `e5cd2dc`) and deploy to GitHub Pages
  **Intent:** the public page serves the glossary, the H wording and the collapsible learn page
  **Target:** github.com/Wanyaldee/quantum-visualizer, GitHub Pages
  **Run by:** Claude Opus 5.5 (AI agent), 2026-10-26

  ```
  To https://github.com/Wanyaldee/quantum-visualizer.git
     c72cbed..e5cd2dc  main -> main
  ```

  Deploy workflow run 40331872308: `completed success`.
  Verified-by: Claude Opus 5.5 (AI agent), 2026-10-26. The served JS bundle contains
  "つまみを回して、一番低いエネルギーを探す", which shows that the build including both commits
  went live.

Not verified:

- No human has walked through the glossary and hints on a real device, and no beginner has
  read the new wording.
- The screen-reader reading of `Word` tips (link text plus tip) was not tested with an actual
  screen reader.
