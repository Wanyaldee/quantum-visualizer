# 0004: "高専では" notes from 香川高専's syllabus

[日本語](../ja/0004-kosen-notes.md)

## Context

The workshop will be held at a KOSEN (高専). KOSEN students study university math (linear
algebra, eigenvalues, differential equations, Fourier analysis) at high-school age, so the
high-school notes from ADR 0003 undersell what they already know. The user pointed to the
[R7 (2025) syllabus of 香川高専 電気情報工学科](https://syllabus.kosen-k.go.jp/Pages/PublicSubjects?school_id=39&department_id=32&year=2025&lang=ja)
as the reference.

## Decision

- `Slide.kosen` (optional) renders under the high-school note in the same box, headed
  "高専では". Every note names a real subject and grade from that syllabus.
- The basics page intro says where the subject names come from and links the syllabus.

| Slide                 | 香川高専 電気情報工学科 subject (grade)                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| superposition         | 数学ⅠB exponentials (1), 電気情報基礎Ⅰ（情報）bits and information (1), 情報・符号理論 (5)                                     |
| amplitude             | 電気基礎 polar form, Euler's formula, phasors (3); 数学ⅡD Euler's formula (2)                                                  |
| measurement           | 応用数学Ⅰ binomial/normal distribution, sample mean (3)                                                                        |
| interference          | 物理学Ⅱ superposition, interference, Young (3); 電気基礎 sum of sinusoids (3)                                                  |
| entanglement          | 応用数学Ⅰ independence, conditional probability (3)                                                                            |
| bit order             | 論理回路 number systems (4)                                                                                                    |
| gates                 | 数学ⅡD matrices (2), 数学ⅢA linear maps (3), 応用数学Ⅱ matrix of a linear map, orthonormal basis (4), 論理回路 NOT/XOR/AND (4) |
| QUBO                  | 情報数学 optimization (4), 数学ⅢB constrained extrema (3)                                                                      |
| annealing             | 数学ⅢA eigenvalues, linear ODEs (3); 半導体物理 Schrödinger equation, square well (4, elective)                                |
| gate guide: measuring | 電気情報基礎Ⅰ（情報）Monte Carlo (1)                                                                                           |
| anneal guide: screen  | 応用数学Ⅰ combinations (3)                                                                                                     |
| anneal guide: levels  | 物理学Ⅰ mechanical energy (2), 半導体物理 square well (4)                                                                      |
| anneal guide: time    | 数学ⅠB logarithms (1), 制御工学 Bode plot (4, elective)                                                                        |

## Reason

**A separate field, not more text in `school`.**

```tsx
{
  slide.kosen && (
    <div className="school-kosen">
      <p className="school-tag">高専では</p>
      {slide.kosen}
    </div>
  );
}
```

- High-school and KOSEN readers can each find their own line. The KOSEN line can also stand
  alone on a slide that has no high-school note (gate guide: measuring).

**Every claim was checked against the syllabus pages or the code.**

- Weekly plans were read for each subject cited, for example 電気基礎 (3年) weeks 6 and
  13–15 (complex plane, Euler's formula, sum of sinusoids) and 制御工学 (4年) week 7
  (Bode plot).
- Team-split preset: 6 people split 3/3 with 佐藤 fixed, so 2 of the other 5 join A:
  ₅C₂ = 10 valid answers out of 2⁵ = 32.
- Measurement: B(1000, 1/2) has σ = √(1000·¼) ≈ 15.8.
- Annealing: H(s) depends on time, so the note says "linear ODE solved numerically with
  Runge–Kutta" (`evolve` uses RK4), not "constant-coefficient".
- Gates: cx is target ← target XOR control, and ccx is target ← target XOR (a AND b), on
  basis states.

## Alternatives rejected

- Replacing the high-school notes with KOSEN ones: the site is also used outside this
  workshop.
- Generic "大学の線形代数" wording: naming the actual course and grade gives a student the
  "I took that last year" moment, which is what this feature is for.

## Consequences

- The notes describe 香川高専 電気情報工学科 as of R7. Other KOSEN departments or later
  years may use different subject names or grades.
- 半導体物理 and 制御工学 are electives, and the table marks them so.

## Verification

`vp check`: no warnings or errors. `vp test`: 27 passed. `vp run build`: built.
Playwright, every frame of all three decks at 1200 px and 390 px: max scrollWidth equals the
viewport (1200 / 390), and there were no console or page errors.
