import { useEffect, useState, type ReactNode } from "react";

const FRAME_MS = 2600;
// The last frame carries the punchline, so it stays up longer before the loop restarts.
const LAST_FRAME_MS = 4200;

export interface Frame {
  view: ReactNode;
  /** What this frame of the animation is showing, in plain words. */
  caption: ReactNode;
}

export interface Slide {
  title: string;
  body: ReactNode;
  frames: Frame[];
  /** Where high-school math or physics shows up in this slide. */
  school?: ReactNode;
  /** The same for KOSEN subjects (香川高専 電気情報工学科's syllabus), which reach
   * university math at high-school age. */
  kosen?: ReactNode;
  /** The lab view where the same behavior can be played with. */
  link?: { href: string; label: string };
}

/**
 * Slides whose frames advance on a timer (not under prefers-reduced-motion). Consecutive
 * frames that render the same component tree keep their SVG nodes, so the views' own CSS
 * transitions are what animates the change.
 */
export function SlideDeck({ slides, label }: { slides: Slide[]; label: string }) {
  const [index, setIndex] = useState(0);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(
    () => !matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const slide = slides[index];
  const last = slide.frames.length - 1;

  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(
      () => setFrame((f) => (f >= last ? 0 : f + 1)),
      frame === last ? LAST_FRAME_MS : FRAME_MS,
    );
    return () => clearTimeout(id);
  }, [playing, frame, last]);

  const goSlide = (k: number) => {
    setIndex(Math.max(0, Math.min(slides.length - 1, k)));
    setFrame(0);
  };

  const pickFrame = (k: number) => {
    setPlaying(false);
    setFrame(k);
  };

  return (
    <div
      className="deck"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") goSlide(index + 1);
        if (e.key === "ArrowLeft") goSlide(index - 1);
      }}
    >
      <nav className="deck-tabs" aria-label={label}>
        {slides.map((sl, k) => (
          <button
            key={sl.title}
            type="button"
            className="chip chip-small"
            aria-pressed={k === index}
            onClick={() => goSlide(k)}
          >
            {k + 1}. {sl.title}
          </button>
        ))}
      </nav>

      <article className="slide" aria-roledescription="スライド">
        <header className="slide-head">
          <span className="slide-no">
            {index + 1} / {slides.length}
          </span>
          <h3>{slide.title}</h3>
        </header>
        <div className="slide-grid">
          <div className="slide-visual">{slide.frames[Math.min(frame, last)].view}</div>
          <div className="slide-text">
            <div className="frame-controls">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  if (!playing && frame >= last) setFrame(0);
                  setPlaying(!playing);
                }}
              >
                {playing ? "止める" : "再生"}
              </button>
              <ol className="frame-dots" aria-label="アニメーションのコマ">
                {slide.frames.map((_, k) => (
                  <li key={k}>
                    <button
                      type="button"
                      aria-label={`${k + 1} コマ目`}
                      aria-current={k === frame ? "step" : undefined}
                      onClick={() => pickFrame(k)}
                    />
                  </li>
                ))}
              </ol>
            </div>
            <p className="slide-caption-title">このアニメーションの意味</p>
            <p className="note slide-caption" aria-live="polite">
              {slide.frames[Math.min(frame, last)].caption}
            </p>
            <div className="slide-body">{slide.body}</div>
            {(slide.school || slide.kosen) && (
              <aside className="school">
                <p className="school-title">学校で習ったことが、ここで使われている</p>
                {slide.school}
                {slide.kosen && (
                  <div className="school-kosen">
                    <p className="school-tag">高専では</p>
                    {slide.kosen}
                  </div>
                )}
              </aside>
            )}
            {slide.link && (
              <p className="slide-link">
                <a className="btn" href={slide.link.href}>
                  {slide.link.label}
                </a>
              </p>
            )}
          </div>
        </div>
        <footer className="slide-nav">
          <button
            type="button"
            className="btn"
            onClick={() => goSlide(index - 1)}
            disabled={index === 0}
          >
            ← 前へ
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => goSlide(index + 1)}
            disabled={index === slides.length - 1}
          >
            次へ →
          </button>
        </footer>
      </article>
    </div>
  );
}

/** A lab's "how to read this screen" deck, folded away so the lab itself stays first. */
export function SlideGuide({ summary, children }: { summary: string; children: ReactNode }) {
  // Mounted only while open, so its frame timer does not run behind a closed fold.
  const [open, setOpen] = useState(false);
  return (
    <details className="guide" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>{summary}</summary>
      {open && children}
    </details>
  );
}
