# 0006: VQE mode, H2 bond lengths, and the triplet behind run_vqe's misses

[日本語](../ja/0006-vqe-mode.md)

## Context

Playground examples 5 (`run_vqe` on a 2-qubit transverse-field Ising model) and 12 (`run_vqe`
on H2, STO-3G, 4 qubits, 7 bond lengths) had no view in this app. The examples list said why:
there is no loop where "a classical computer adjusts the circuit's parameters".

The user asked whether VQE could be animated, then to build it. The explanation had to work
without formulas, at a level a middle-school student can follow. Two references were named:
[Quantum Native Dojo 5-1 (Qulacs)](https://dojo.qulacs.org/ja/latest/notebooks/5.1_variational_quantum_eigensolver.html)
and [IBM Quantum Learning, "Variational quantum eigensolver"](https://quantum.cloud.ibm.com/learning/en/courses/quantum-diagonalization-algorithms/vqe).

Example 12 printed only the 0.7414 Å Hamiltonian. Its table showed `run_vqe` missing FCI by
+0.107564 Hartree at 1.5 Å, which the example attributed to a local minimum.

The work went back and forth with the playground repo's agent (via Orca):

1. The playground agent published all 7 Hamiltonians as `assets/12_h2_hamiltonians.json`
   (commit `724607b`).
2. This repo found that `run_vqe`'s misses equal a degenerate excited level.
3. The playground agent confirmed with OpenFermion that this level is the triplet (⟨S²⟩ = 2),
   and corrected one claim: it is the second-lowest level only from 1.0 Å on.

## Decision

- **A fourth mode, `#vqe`** (`src/vqe/`), with two presets in `src/presets/hamiltonians.ts`:
  `ising` (example 5) and `h2` (example 12). Each preset holds `variants`, one Hamiltonian
  each; H2 has the 7 bond lengths, copied into `src/presets/h2BondLengths.ts` together with
  `run_vqe`'s energies from example 12's table.
- **Simulation** (`src/quantum/vqe.ts`):
  - Pauli-sum Hamiltonians in run_vqe's format, with a dense Hermitian matrix.
  - Exact levels.
  - The ansatz inferred in example 5: an RY layer, then a CZ chain, repeated `layers` = 2
    times, then a final RY layer.
  - Gradient descent with the parameter-shift rule. Every step is kept so the run can be
    replayed.
- **Screen**:
  - Starting points A–E: the seeds of the random starting angles.
  - Playback through the steps.
  - An energy chart with a log step axis, zoomed onto the gap that matters, with the exact,
    HF and triplet levels drawn as lines.
  - The parameters drawn as knobs, and the state drawn as circles and needles.
  - For H2, a bond-length selector and a curve of FCI, HF, the triplet, `run_vqe`'s results
    and the current value.
- **Explanation without formulas** (`VqeIntro.tsx`):
  - The analogy: searching for a valley floor blindfolded.
  - The three-step loop: the quantum computer prepares a state, then measures its energy as
    an average of many shots; the classical computer reads the slope and turns the knobs.
  - The variational principle: no state goes below the true lowest energy.
  - What can go wrong: an ansatz that cannot reach the answer, dips, flat regions.
  - A note that this page's optimizer is not `run_vqe`'s.
  - Both references are linked here and in "もっと知りたい人へ". The glossary gets a VQE group
    (パラメータ, アンザッツ, 期待値, 変分原理, 勾配, 局所解, HF, 厳密解, スピン, 励起状態,
    三重項), worded like playground's `docs/basics.md`.
- **Step notes say what the run did**: it reached the exact energy, it stopped at HF, or it
  stopped in the triplet, adding "run_vqe also stopped here" when the run's end matches
  `run_vqe`'s value for that bond length.
- Examples 5 and 12 in `examples.ts` link to `#vqe/ising` and `#vqe/h2`.

## Reason

**The descent is plain parameter-shift gradient descent, kept step by step.**

```ts
const trace: VqeStep[] = [{ params: [...start], energy: energy(start) }];
for (let s = 0; s < steps; s++) {
  const { params } = trace[trace.length - 1];
  const grad = params.map(
    (_, i) =>
      (energy(shifted(params, i, Math.PI / 2)) - energy(shifted(params, i, -Math.PI / 2))) / 2,
  );
  const next = params.map((v, i) => v - rate * grad[i]);
  trace.push({ params: next, energy: energy(next) });
}
```

- **Parameter shift (±π/2), not a finite difference**: for RY it gives the exact slope, and
  it can be explained in words: "turn one knob a quarter turn each way, measure, and the
  difference says which way is downhill".
- **Plain gradient descent, not Powell or COBYLA** (Qulacs Dojo uses Powell): every step
  moves every knob a little in the downhill direction, so the knobs and the energy chart
  change smoothly frame by frame. A derivative-free optimizer's line searches would look like
  jumps.
- **The whole trace is stored**, so the slider and a click on the chart can jump to any step.
- **`rate` differs per preset** (Ising 0.2, H2 0.5), and so does `steps` (60 and 1000). With
  0.5 the Ising runs reached −√5 in only 29 of 40 seeds in 1000 steps; with 0.2 all 40 reach
  it within 60. The playground agent saw the same, 31 of 40 at 0.5, with its own numpy code.
  Example 5 now states both conditions.

**A real-amplitude fast path, pinned to the general simulator.**

```ts
export function ansatzEnergy(h: Hamiltonian, layers: number, params: readonly number[]): number {
  // RY and CZ keep every amplitude real: one array, updated in place
  // ... RY rotates pairs (i, i|bit) by params[l*n+q]/2; CZ negates entries with both bits set
  let e = 0;
  for (let r = 0; r < size; r++) {
    let row = 0;
    for (let c = 0; c < size; c++) row += h.re[r * size + c] * v[c];
    e += v[r] * row;
  }
  return e;
}
```

```ts
expect(ansatzEnergy(h, p.layers, params)).toBeCloseTo(
  expectation(h, prepare(p.n, p.layers, params)),
  12,
);
```

- The first version went through `applyGate`, which handles complex numbers for every gate.
  An H2 replay (12 knobs × 2 shifts × 1000 steps) took about 1.4 s per starting point, so 4
  starting points froze the page for about 6 s.
- RY and CZ never create imaginary parts. For a real state, the imaginary part of a Hermitian
  H is antisymmetric and drops out of ⟨ψ|H|ψ⟩, so only `h.re` is needed.
- After the change, switching bond length (5 starting points × 1000 steps) takes about 0.6 s,
  measured in the browser.
- The test runs this on every variant and checks it against the general path to 12 digits,
  so the fast path cannot silently diverge.

**Exact levels through a real embedding, reusing the anneal module's solver.**

```ts
m[r * d + c] = a;
m[(r + size) * d + c + size] = a;
m[r * d + c + size] = -b;
m[(r + size) * d + c] = b;
const vals = [...eigSym(m, d).vals].sort((x, y) => x - y);
return vals.filter((_, k) => k % 2 === 0);
```

- H2's Hamiltonian has Y terms, so its matrix is complex. `eigSym` (from ADR 0001's annealing
  code) only handles real symmetric matrices.
- A + iB has the same eigenvalues as [[A, −B], [B, A]], each twice. Taking every other sorted
  value gives the levels without adding a complex eigensolver.

**The energy chart zooms on the gap and keeps every run's end in view.**

```ts
const ends = Math.max(...traces.map((t) => t[t.length - 1]));
const zoomTop = reference
  ? Math.max(exact + 4 * (reference.energy - exact), ends + 0.1 * (ends - exact))
  : top;
const hi = Math.min(top, zoomTop);
const x = (k: number) => M.left + (Math.log1p(k) / Math.log1p(steps)) * plotW;
```

- At 0.7414 Å the runs start around −0.4 and the HF–FCI gap is 0.02. On a full-range axis
  the gap is invisible, and that gap is the whole story ("stuck at HF or not"). Four times
  the gap above FCI shows it clearly.
- The `ends` term was added when a run stuck in the triplet at 1.0 Å (−0.746) was pinned flat
  against the top edge.
- The step axis is logarithmic (`log1p`) because runs drop within about 10 steps and then
  creep for hundreds. On a linear axis, the first drop would be a vertical line at the left
  edge.

**Starting points chosen to show each outcome, and tests pin them.**

```ts
// 3 reaches FCI near equilibrium, 1 stops at Hartree-Fock there, 10 stops in the
// spin-aligned state at 1.5 Å and beyond (where run_vqe did), and 6 already does so at 1 Å.
seeds: [3, 1, 10, 2, 6],
```

```ts
const spin = basisEnergy(h, p.spinAligned!.bits) + v.offset; // |1010⟩
expect(basisEnergy(h, "0101") + v.offset).toBeCloseTo(spin, 9);
expect(energyLevels(h)[1] + v.offset).toBeCloseTo(spin, 6); // x ≥ 1.0 Å
if (x > 1) expect(Math.abs(v.playgroundEnergy! - spin)).toBeLessThan(1e-5);
```

- The seeds come from scans of seeds 1–12 at every bond length, plus 1–40 at 1.0 Å. A random
  set of four could easily show only one of the three outcomes.
- **The triplet finding.** `run_vqe` returned −0.890585 at 1.5 Å. The triplet level is
  −0.890585 (difference 2e-7), at 2.0 Å the difference is 1e-6, and at 2.5 Å it is 5e-6. This
  page's runs stop there from the same seeds. So `run_vqe` did not just hit "a local minimum";
  it converged to the triplet. That is an exact eigenstate, so its slope is zero. As the atoms
  separate it approaches the singlet ground state: the gap is 0.355 Hartree at 1.0 Å, 0.108 at
  1.5, 0.024 at 2.0 and 0.0044 at 2.5 (playground, OpenFermion).
- **Named "三重項", not "the second-lowest level".** The playground agent pointed out that
  below 1 Å a one-electron level (the qubit Hamiltonian holds every electron count) sits
  between the ground state and the triplet. A test records this at 0.7414 Å: level 2 is
  −0.538710, the triplet −0.532479.
- **HF stalls are a different kind.** They match no level, so they are flat stationary points
  of the ansatz, not eigenstates. The notes keep the two cases apart.

**The H2 data is a copy, with its source written in the file.**

- `tsconfig` has no `resolveJsonModule`, so the JSON was converted to a TS module once. The
  header names `assets/12_h2_hamiltonians.json` at commit `724607b`. A test checks every bond
  length's HF and FCI against example 12's table, so a bad copy fails.

## Alternatives rejected

- Running the optimizer in a Web Worker: the fast path made it about 0.6 s on the main
  thread, so the worker's extra code and message passing would buy little.
- Precomputing traces at build time: a dataset per seed and bond length to keep in sync; it is
  cheap enough to compute live.
- Drawing an optimization landscape (2-D slice): with 6 or 12 parameters a slice would be an
  arbitrary choice and could mislead about where the dips are.
- A single `reference` list in the chart (HF and triplet alike): HF drives the zoom and the
  "stuck at HF" note. The triplet is drawn only when inside the zoomed range. Keeping them
  separate was the smaller change.
- Calling the triplet "the second excited level" on screen: false below 1 Å (see above).

## Consequences

- This page's convergence counts and step numbers are not comparable to `run_vqe`'s; the
  intro and playground's example 5 both say so. Only the end energies are compared.
- `h2BondLengths.ts` must be regenerated if playground's JSON changes. Nothing checks across
  the repos except the table test.
- The fast path assumes a real ansatz (RY + CZ). Adding RX/RZ or complex gates to the ansatz
  needs `ansatzEnergy` changed, and the agreement test will fail until it is.
- 0.30 Å's `run_vqe` value (−0.594490) matches no level and was not reproduced by either repo.
  It stays unexplained.

## Verification

Commits `e5cd2dc`, `14ebcbc`, `985c019`. The logs are the same run as ADR 0005, taken at
`985c019`.

`vp check`:

```
pass: All 67 files are correctly formatted (465ms, 24 threads)
pass: Found no warnings, lint errors, or type errors in 48 files (716ms, 24 threads)
```

`vp test` (the 47 tests include `src/quantum/vqe.test.ts`):

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

What the tests pin (from `vqe.test.ts`):

- Example 5: exact −√5. Every offered seed reaches it, with playground's top states
  01 = 10 ≈ 0.361804 and 00 = 11 ≈ 0.138196 to 4 digits.
- Example 12:
  - The 7 bond lengths' HF and FCI match the example's table to 5 digits.
  - At 0.7414 Å, one seed reaches FCI and one stops at HF, and the converged state is mostly
    1100 with a little 0011.
  - At 1.5, 2.0 and 2.5 Å, a seed stops within 1e-3 of `run_vqe`'s value.
  - The triplet equals level 2 from 1.0 Å on and `run_vqe`'s value from 1.5 Å on.
  - Below 1 Å, the triplet is not level 2.
- The variational principle: no step goes below the exact energy.

Cross-checks with the playground repo's independent numpy and OpenFermion code, reported by
its agent and compared here:

- The JSON's `hf_energy` and `fci_energy` agree with this repo's computation to 1e-8 at all 7
  points.
  Verified-by: Claude Opus 5.5 (AI agent), 2026-10-26
- ⟨S²⟩ = 2 for the 1.0–2.5 Å level that `run_vqe` hit, and 0 for the ground state. This was
  computed by the playground agent; this repo did not compute S².

Checks run in a browser:

- Playwright (Chromium) against `vp preview`, at 1200 px, 820 px and 390 px. Results:
  - On `#vqe/ising`, play runs to −2.2361 with the "reached" note.
  - On `#vqe/h2`, starting point B ends at −1.116684 with the HF note.
  - At 1.5 Å, starting point C ends with the triplet note including "run_vqe also stopped
    here", and in the curve its hollow ring sits on `run_vqe`'s square.
  - At 1.0 Å, starting point E ends on the triplet line.
  - scrollWidth equals the viewport at every width, and there were no page errors.
    Verified-by: Claude Opus 5.5 (AI agent), 2026-10-26

Operations:

- **Operation:** push `main` and deploy to GitHub Pages, three times
  **Intent:** the public page serves `#vqe` (`e5cd2dc`), then the bond-length selector
  (`14ebcbc`), then the triplet lines and notes (`985c019`)
  **Target:** github.com/Wanyaldee/quantum-visualizer, GitHub Pages
  **Run by:** Claude Opus 5.5 (AI agent), 2026-10-26

  ```
     c72cbed..e5cd2dc  main -> main
     e5cd2dc..14ebcbc  main -> main
     14ebcbc..985c019  main -> main
  ```

  Deploy workflow runs 40331872308, 40336965879 and 40339904237: all `success`.
  Verified-by: Claude Opus 5.5 (AI agent), 2026-10-26. After each deploy, the served JS
  bundle contained that step's new text ("つまみを回して、一番低いエネルギーを探す",
  "原子どうしの距離を変えると", "三重項（スピンがそろった状態）").

Not verified:

- No human has read the VQE explanation for middle-school clarity or used the screen on a real
  device.
- `run_vqe`'s internal optimizer is unknown, so "it converged to the triplet" is inferred from
  matching energies (to 2e-7 to 5e-6) and from playground's top_states, not observed inside
  `run_vqe`.
- Dark mode colors for the new `--spin` token were not checked visually.
