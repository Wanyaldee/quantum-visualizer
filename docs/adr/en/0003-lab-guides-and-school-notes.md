# 0003: Slide guides in both labs, and notes linking each idea to school math and physics

[日本語](../ja/0003-lab-guides-and-school-notes.md)

## Context

ADR 0002 added animated slides to the basics page only. The gate and anneal screens still
expected the reader to work out on their own what each panel means. Workshop attendees are
mostly students or recent graduates. A sentence like "you learned this already, and here
is where it shows up" makes the content feel familiar, and it shows why that schooling was
worth it.

## Decision

- The deck UI moves from `BasicsSlides.tsx` to `src/ui/SlideDeck.tsx` (`SlideDeck`,
  `Slide`, `Frame`). Shared demo data lives in `src/learn/demo.ts`; demo components live in
  `src/learn/DemoViews.tsx`. They are split because oxlint's `only-export-components`
  forbids mixing components and plain exports.
- `GateGuide` (4 slides: circuit and state, reading a dial, measuring, building a circuit)
  and `AnnealGuide` (4 slides: what the screen does, energy levels, distribution, time vs
  success) open from a `SlideGuide` fold under each lab's header.
- `Slide.school` renders a "学校で習ったことが、ここで使われている" box. Each connection
  is written once: concepts on the basics page, screen-specific ones (log axis, area ∝
  probability, counting combinations) in the guides.

| Slide                | Subject                                        |
| -------------------- | ---------------------------------------------- |
| superposition        | 数学II exponential functions (2ⁿ, 2³⁰⁰ ≈ 10⁹⁰) |
| amplitude            | 数学C complex plane (Z = ×(−1), S = ×i)        |
| measurement          | 数学B statistical inference (±1/√N at ~95 %)   |
| interference         | 物理 interference of waves                     |
| entanglement         | 数学A independence (P(A∩B) ≠ P(A)P(B))         |
| bit order            | 情報I binary (q0 is the ones place)            |
| gates                | 数学C vectors → university linear algebra      |
| QUBO                 | 数学I quadratic functions (x² = x for 0/1)     |
| annealing            | 物理 atomic energy levels; adiabatic theorem   |
| gate guide: dials    | 中学「相似」 (area ratio = ratio²)             |
| anneal guide: screen | 数学A counting (2⁴, 2³⁰, 2⁶⁰)                  |
| anneal guide: levels | 物理基礎 mechanical energy                     |
| anneal guide: time   | 数学II logarithms (log axis)                   |

## Reason

**The guide mounts only while open.**

```tsx
const [open, setOpen] = useState(false);
return (
  <details className="guide" onToggle={(e) => setOpen(e.currentTarget.open)}>
    <summary>{summary}</summary>
    {open && children}
  </details>
);
```

- A closed `<details>` still renders its children. Without the `open &&`, the frame timer
  would keep re-rendering, and the anneal guide's `evolve` calls (T = 1, 20, 300) would run
  on every lab visit.

**The anneal guide uses the lab's time axis.**

```tsx
<AnnealGuide Ts={T_GRID} tMin={T_MIN} tMax={T_MAX} />
```

- Passing these as props keeps one source for the log axis and avoids an import cycle
  (`AnnealLab` → `AnnealGuide` → `AnnealLab`).
- The guide always uses the fixed 4-node MaxCut, not the selected preset. Captions quote
  its numbers (`pct(careful.p)`), which only stay true for a known problem.

**Numbers in school notes were checked**: 2³⁰⁰ ≈ 2.0 × 10⁹⁰, 2⁶⁰ ≈ 1.15 × 10¹⁸, and
2σ = 2·√(0.25/N) = 1/√N for p = 0.5, so ±1/√N is the ~95 % range (±32 % at N = 10, ±3 % at
N = 1000). Index of `101` with q0 as the ones place: 1 + 0·2 + 1·4 = 5.

## Alternatives rejected

- Opening the guide by default: it would push the lab below the fold on every visit.
- Notes in a separate "math and physics" page: they work best next to the picture they
  explain.
- A note on every slide: some slides (circuit reading, measuring button) have no honest
  school connection, and a forced one reads as padding.

## Consequences

- Curriculum names follow the 2022 Japanese high-school curriculum (複素数平面 is 数学C;
  older readers learned it in 数学III).
- Guides use fixed examples, so they do not change with the selected preset.

## Verification

`vp check`: no warnings or errors. `vp test`: 27 passed. `vp run build`: built.

Playwright against `vp preview`, every frame of every slide in all three decks, at 1200 px
and 390 px:

```
wide gate slides 4 max scrollWidth 1200
wide anneal slides 4 max scrollWidth 1200
wide learn slides 9 max scrollWidth 1200
phone gate slides 4 max scrollWidth 390
phone anneal slides 4 max scrollWidth 390
phone learn slides 9 max scrollWidth 390
errors []
```
