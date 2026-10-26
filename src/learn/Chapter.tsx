import type { ReactNode } from "react";

/**
 * One collapsible chapter of the examples & basics page. The body is rendered only while
 * open, so a closed chapter's slide deck is not ticking its timers in the background.
 */
export function Chapter({
  id,
  title,
  hint,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  /** One line saying what is inside, readable while the chapter is closed. */
  hint: string;
  open: boolean;
  onToggle: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <section className="stage chapter">
      <details id={id} open={open} onToggle={(e) => onToggle(e.currentTarget.open)}>
        <summary>
          <h2>{title}</h2>
          <span className="chapter-hint">{hint}</span>
        </summary>
        {open && <div className="chapter-body learn-section">{children}</div>}
      </details>
    </section>
  );
}
