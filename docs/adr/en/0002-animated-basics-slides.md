# 0002: Teach the basics as slides driven by the app's own visualizations

[日本語](../ja/0002-animated-basics-slides.md)

## Context

The "最低限の知識" section of `#learn` was a grid of text cards. The terms it defines
(superposition, phase, measurement, interference, entanglement, bit order, QUBO,
annealing) are exactly what the gate and anneal views draw, but the cards never showed
those drawings, so a reader had to map "円の面積" or "針の向き" onto the labs alone.

## Decision

- `src/learn/BasicsSlides.tsx` replaces nine of the twelve cards with a slide deck. Each
  slide has a few frames; each frame is a real view (`AmplitudeDials`, `MeasureBars`,
  `ProblemGraph`, `SpectrumChart`, `DistributionBars`) plus a caption saying what that
  frame of the animation means. The concept text from the old card stays under it.
- Frames advance automatically (2.6 s, last frame 4.2 s, then loop). Users can pause,
  jump to a frame, change slide with buttons, tabs, or ←/→.
- VQE, simulator vs hardware, and "quantum is not always useful" stay as text cards:
  there is nothing in this app to animate for them.

## Reason

**Frames are computed by the simulators, not drawn by hand.**

```tsx
const run = (n: number, gates: Gate[]): State => simulateSteps(n, gates)[gates.length];

function Dials({ n, gates }: { n: number; gates: Gate[] }) {
  return <AmplitudeDials state={run(n, gates)} n={n} />;
}
```

- The slides show the same dials the gate lab shows, so what is learned transfers
  directly; a wrong caption would also disagree visibly with the picture.
- Consecutive frames render the same component tree, so React keeps the SVG nodes and the
  existing `.dial-disc` / `.dial-needle` CSS transitions animate the change (the "motion"
  is the transition between frames; no animation library).

**The anneal slide contrasts slow and fast runs on the same problem.**

```tsx
const slow = evolve(maxcut.n, ep, 20, POINTS);
const fast = evolve(maxcut.n, ep, 1, POINTS);
```

- Four frames at `s = 0, 0.3, narrowest gap, 1` with `T = 20`, then `s = 1` with `T = 1`, so
  "not always optimal" is shown, not only stated.

**Autoplay respects reduced motion.**

```tsx
const [playing, setPlaying] = useState(
  () => !matchMedia("(prefers-reduced-motion: reduce)").matches,
);
```

- `index.css` already disables transitions under that setting; this also stops the frame
  timer, so the caption does not change under the reader.

**Grid columns are `minmax(0, 1fr)`.** Without it the anneal charts' `min-width: 520px`
widened the slide and the whole page scrolled sideways at 390 px.

## Alternatives rejected

- CSS/SVG keyframe animations drawn for the slides: duplicates the dial drawing and can
  drift from what the simulator produces.
- Embedding the full `GateLab` / `AnnealLab` per slide: too many controls for a first read;
  each slide links to the matching lab preset instead.
- A slide library (reveal.js etc.): a dependency for what is a state index and a timer.

## Consequences

- `ProblemGraph`'s own figcaption ("most likely answer right now") is hidden inside slides by
  CSS, because the slide caption replaces it.
- `SpectrumChart` gets a no-op `onSeek`, so its hover tooltip still says "クリックでこの時点へ"
  although clicking does nothing on the slide.
- The measurement and entanglement samples are drawn once per page load
  (`Math.random`), so counts differ between visits; this is intended.

## Verification

`vp check`:

```
pass: Formatting completed for checked files
pass: Found no warnings, lint errors, or type errors in 27 files
```

`vp test`: 3 files, 27 tests passed. `vp run build`: built.

Playwright against `vp preview`, `#learn`:

```
no-preference 1 コマ目 -> 2 コマ目 | after ArrowRight: 振幅：大きさと向き
reduce 1 コマ目 -> 1 コマ目 | after ArrowRight: 振幅：大きさと向き
#learn [390,[]]          # scrollWidth at 390 px with the anneal slide open, no overflow
errors []                # no console/page errors across all 9 slides
```
