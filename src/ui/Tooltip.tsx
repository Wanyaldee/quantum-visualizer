import type { ReactNode } from "react";

/** Positioned inside a `position: relative` chart wrapper; `left` is a percentage of its width. */
export function Tooltip({
  left,
  top,
  children,
}: {
  left: number;
  top: number;
  children: ReactNode;
}) {
  return (
    <div
      className="tooltip"
      style={{ left: `${left}%`, top }}
      data-flip={left > 60 || undefined}
      role="status"
    >
      {children}
    </div>
  );
}
