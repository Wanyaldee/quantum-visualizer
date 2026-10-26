import type { ReactNode } from "react";
import { glossaryEntry, termHash, termsIn } from "../learn/glossary";

/**
 * A jargon word in running text. Hover or focus shows the one-line meaning; following the
 * link opens the glossary, which is where touch screens end up.
 */
export function Word({ id, children }: { id: string; children?: ReactNode }) {
  const entry = glossaryEntry(id);
  return (
    <a className="word" href={termHash(id)}>
      {children ?? entry.word}
      <span className="word-tip" role="tooltip">
        {entry.short}
      </span>
    </a>
  );
}

/**
 * Plain-language meanings of the glossary words used in `text`, shown under a preset's
 * summary or step note so a beginner never meets a word without its explanation.
 */
export function TermHints({ text, skip = [] }: { text: string; skip?: readonly string[] }) {
  const terms = termsIn(text, skip);
  if (terms.length === 0) return null;
  return (
    <details className="term-hints">
      <summary>この文に出てくる言葉（{terms.map((t) => t.word).join("・")}）</summary>
      <dl>
        {terms.map((t) => (
          <div key={t.id}>
            <dt>
              <a href={termHash(t.id)}>{t.word}</a>
            </dt>
            <dd>{t.short}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
