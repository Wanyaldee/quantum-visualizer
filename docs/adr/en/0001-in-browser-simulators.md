# 0001: Gate-model and annealing visualizers backed by in-browser exact simulators

[日本語](../ja/0001-in-browser-simulators.md)

## Context

The app exists to show workshop attendees (and the author) _how_ a quantum computer arrives
at an answer, for both the gate model and quantum annealing. The companion repo
`blueqat-mcp-playground` already holds circuits and QUBOs that were run on blueqat MCP, but
blueqat only returns final results (counts, statevector at the end), not the intermediate
states the visualization needs, and calling it from a browser would expose an API key and
make the workshop depend on network access.

## Decision

- All quantum computation runs in the browser, in two small exact simulators:
  - `src/quantum/gate.ts`: statevector simulator (≤ 5 qubits) that keeps a snapshot after
    every gate, so the UI can step forward/back through a circuit.
  - `src/quantum/anneal.ts`: integrates the Schrödinger equation for
    `H(s) = -(1-s) Σ X_q + s · H_P` (linear schedule `s = t/T`, ≤ 6 spins) with RK4, and
    diagonalizes `H(s)` on a 101-point grid (Jacobi) to draw the energy levels and the
    state's population on each level.
- Inputs use blueqat's JSON shapes and bit order (`{"gate","qubits","params"}`,
  `{"coeff","qubits"}`, `bitstring[0] = q0`) so playground examples can be pasted in.
  Presets reuse playground examples 1, 2, 3, 13 (gate) and 14 (annealing, QUBO verbatim).
- Gate mode shows each basis state as a dial: disc **area** = probability, disc color and
  needle angle = phase. Annealing mode shows energy levels vs `s` with population dots,
  the probability of every bitstring ordered by cost, the problem graph, and success
  probability vs anneal time `T`.
- Deployed as a static site to GitHub Pages by `.github/workflows/deploy.yml`.

## Reason

**Phase is drawn, not just probability.** A probability-only bar chart cannot show the
oracle step of Grover (all bars stay at 25 %) or why `H Z H` gives 1. The dial encodes both:

```tsx
<circle className="dial-disc" r={R * Math.sqrt(p)} style={{ fill: phaseColor(re, im) }} />
<g className="dial-needle" style={{ transform: `rotate(${-deg}deg)`, opacity: live ? 1 : 0 }}>
```

- `R * Math.sqrt(p)`, not `R * p`: area, not radius, is proportional to probability, so a
  25 % state looks like a quarter of a full disc rather than a sixteenth.
- `rotate(-deg)`: SVG's y axis points down; negating keeps phase counter-clockwise like the
  complex plane in textbooks.
- Hue is cyclic (`src/ui/phase.ts`, phase 0 → the UI's `--amp` blue) because phase is
  cyclic; the needle repeats the angle so color is never the only carrier.

**Energies are rescaled before annealing.**

```ts
export function rescale(e: Float64Array, n: number): Float64Array {
  ...
  const k = hi > lo ? n / (hi - lo) : 0;
  return e.map((v) => (v - lo) * k);
}
```

- Range mapped to `[0, n]`, the same order as the driver term's spread (`-n … n`): with raw
  example-14 coefficients (penalty ×10, energies in the hundreds) the driver would be
  negligible from `s ≈ 0.01` and every `T` would look the same.
- Positive affine map: optimal bitstrings are unchanged (tested against example 14's
  `11000` / `10100`).
- Side effect kept on purpose: in the team-split preset the penalty still dominates the
  range, so good answers are only 0.1 apart and the anneal needs `T ≈ 300` to reach > 90 %.
  That is a true, teachable property of penalty-heavy QUBOs, so `T_MAX = 500`.

**RK4 step size.**

```ts
const perSegment = Math.max(4, Math.ceil(T / (points - 1) / 0.02));
```

- `dt ≤ 0.02` with `‖H‖ ≤ 2n ≤ 12` gives `dt·‖H‖ ≤ 0.24`, well inside RK4's stability
  region; the test checks the norm stays 1 to 6 decimals.
- Steps are a whole multiple of the snapshot grid, so snapshot `k` is exactly at `s = k/100`,
  the same `s` as spectrum point `k` (populations are overlaps between the two).

**Jacobi eigensolver, degenerate levels merged.**

```ts
if (last && vals[i] - last.energy < DEGENERACY_TOL) {
  last.degeneracy++;
  last.rows.push(i * d);
}
```

- Jacobi, not Householder+QL: ~60 lines, no dependency, and 101 × (64×64) is fast enough
  (marked `ponytail:` in code with the Lanczos upgrade path).
- Populations are summed per _level_, not per eigenvector: inside a degenerate level the
  eigenbasis is arbitrary, so per-vector populations would flicker between grid points.

**"Narrowest gap" marker** (`narrowestGap`) measures `ev[groundCount] - ev[0]`, not
`ev[1] - ev[0]`: MaxCut and team split have two optimal answers, so leaking into the second
level still yields an optimal answer; failure is reaching the first level _above_ the answer
manifold. The first version used `ev[g] - ev[g-1]`, which pointed at s = 0 (two degenerate
excited levels) — caught in a screenshot.

**Untrusted paste input is validated** (`parseCircuit`, `parseQubo`) before it reaches the
simulators: qubit indices bounded by `MAX_QUBITS` / `MAX_SPINS` (keeps `2^n` arrays small),
duplicate qubits rejected, and messages say which item is wrong in Japanese.

## Alternatives rejected

- Calling blueqat MCP from the page: needs an API key in the browser, network at the venue,
  and returns no intermediate states.
- A quantum JS library (e.g. a full simulator package): gate application is ~40 lines here;
  a dependency would add weight and hide the code attendees may want to read.
- Bloch spheres per qubit: cannot show entanglement (Bell state qubits each look "empty"),
  which is half of what the gate presets demonstrate.
- Simulated (thermal) annealing instead of quantum annealing: it would not show the
  adiabatic gap, which is the mechanism the annealing mode exists to explain.
- A chart library: four bespoke SVG charts with hover were less code than adapting one, and
  avoid a dependency.

## Consequences

- Hard ceilings: 5 qubits (32 dials) and 6 spins (64×64 diagonalization on the main
  thread). Larger sizes need a Web Worker and Lanczos.
- Everything is noiseless; the footer links to the playground's simulator-vs-hardware doc.
- Mid-circuit measurement, `reset`, and gates outside `GATE_ARITY` are rejected on paste.
- Only a linear schedule `s = t/T` is modeled.

## Verification

`vp check`:

```
pass: All 32 files are correctly formatted (1064ms, 12 threads)
pass: Found no warnings, lint errors, or type errors in 21 files (2.1s, 12 threads)
exit 0
```

`vp test` (13 tests: preset outcomes, blueqat bit order/control order, ccx, norm
preservation, example-14 optimum, spectrum endpoints, slow-vs-fast anneal, parser rejection):

```
 RUN  v5.0.5 /home/ko200/quantum-visualizer


 Test Files  2 passed (2)
      Tests  13 passed (13)
   Start at  11:34:19
   Duration  738ms (tests 56%, import 23%, transform 14%, worker 7%)

exit 0
```

`vp run build`:

```
$ tsc -b ⊘ cache disabled

$ vp build ⊘ cache disabled
transforming...
✓ 33 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.04 kB │ gzip:  0.63 kB
dist/assets/index-fW4fvPus.css   10.76 kB │ gzip:  3.28 kB
dist/assets/index-WtEYukOl.js   261.16 kB │ gzip: 83.27 kB

✓ built in 576ms

---
vp run: 2/2 successful. (Run `vp run --last-details` for full details)
exit 0
```

Browser checks (headless Chromium via Playwright against `vp preview`):

- Screenshots at 1280px light, 1280px dark, 390px phone: Grover step 3 and end, MaxCut at
  T=20 and T=1, team split at T=300 / s=0.55. No console errors. Fixed from these: title
  orphan line, gap marker at s=0, graph labels over edges, unreadable charts on phones
  (the two wide charts now keep a 520px minimum width and scroll horizontally).
- Gate editor adds H → 50 %/50 %; pasted `run_circuit` object loads 3 qubits / 8 dials;
  unsupported gate `u` shows `1番目のゲート: 未対応のゲート "u"`; pasted QUBO loads and
  marks both optima; page `scrollWidth` = 390 on a 390px viewport in both modes.
  Verified-by: Claude Opus 5.5 (AI agent), 2026-10-23

Deploy:

- **Operation:** GitHub Pages deploy of commit `1b4675f` by `.github/workflows/deploy.yml`
  **Intent:** https://wanyaldee.github.io/quantum-visualizer/ serves this build
  **Target:** GitHub Pages, `Wanyaldee/quantum-visualizer`
  **Run by:** GitHub Actions run 39890402877 (pushed by Claude Opus 5.5, AI agent), 2026-10-23

  ```
  $ gh run view 39890402877 --json conclusion,headSha,updatedAt
  success 1b4675f 2026-10-23T02:36:04Z
  ```

  Verified-by: Claude Opus 5.5 (AI agent), 2026-10-23 — opened
  `https://wanyaldee.github.io/quantum-visualizer/#anneal` in headless Chromium: title
  `量子のふるまい`, heading `グラフを2色に塗り分ける（MaxCut）`, 0 page errors

Not verified:

- Viewing on a real phone/projector, and keyboard-only operation end to end.
- Human review of the physics narration texts (`src/presets/*.ts`).
