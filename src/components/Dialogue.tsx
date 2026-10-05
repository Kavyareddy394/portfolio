"use client";

import { useEffect, useState } from "react";
import styles from "./Dialogue.module.scss";
import { dialogueConfig, type Anchor, type Tail } from "@/config/dialogue";

type DialogueProps = {
  text: string;
  anchor: Anchor;
  tail?: Tail;
  reducedMotion: boolean;
};

/**
 * Her reply, typed out one character at a time.
 *
 * The parent gives this a key that changes with every line, so a new sentence
 * remounts the component and the typing starts from zero. Resetting the counter
 * with an effect instead would mean a synchronous setState during the effect,
 * which cascades an extra render on every line.
 *
 * The full sentence is exposed to screen readers as a single string while the
 * animated copy is hidden from them. Announcing every keystroke would read the
 * line out one letter at a time, which is far worse than a plain sentence.
 */
export function Dialogue({ text, anchor, tail = "down", reducedMotion }: DialogueProps) {
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;

    let count = 0;
    const timer = window.setInterval(() => {
      count += 1;
      setRevealed(count);
      if (count >= text.length) window.clearInterval(timer);
    }, dialogueConfig.typeMs);

    return () => window.clearInterval(timer);
  }, [text, reducedMotion]);

  /*
    Reduced motion shows the finished line at once. Deriving it here rather than
    pushing it into state also covers the preference being switched on halfway
    through a line.
  */
  const shown = reducedMotion ? text.length : revealed;
  const typing = shown < text.length;

  return (
    <div
      className={styles.layer}
      style={
        {
          left: `${anchor.x}%`,
          top: `${anchor.y}%`,
          /*
            The pixel nudge, in the same order as the anchor: after the
            percentages, so it is a correction on top of the placement rather
            than another coordinate system competing with it. The global lift is
            subtracted from the anchor's own dy, so a positive number always
            means up regardless of which pose is speaking.
          */
          "--dx": `${anchor.dx ?? 0}px`,
          "--dy": `${(anchor.dy ?? 0) - dialogueConfig.lift}px`,
          "--max-width": `${dialogueConfig.maxWidth}cqw`,
          "--enter": `${dialogueConfig.enterMs}ms`,
        } as React.CSSProperties
      }
    >
      {/*
        role="status" with aria-live="polite" on the bubble: a screen reader
        announces the line once, when it appears, and never interrupts whatever
        it is currently saying. The typewriter is hidden from it and the whole
        sentence sits in the visually hidden span instead.
      */}
      <p className={styles.bubble} data-typing={typing} data-tail={tail} role="status" aria-live="polite">
        <span className="sr-only">{text}</span>
        <span className={styles.text} aria-hidden="true">
          {/*
            The full line sits invisibly underneath the typed one, in the same
            grid cell. Without it the bubble is sized by max-content against
            whatever has been typed so far, so it visibly grows and rewraps with
            every character.
          */}
          <span className={styles.ghost}>{text}</span>
          <span className={styles.typed}>
            {/* position: relative so the caret can hang off the end of the
                revealed run without taking up any width itself. */}
            <span className={styles.revealed}>{text.slice(0, shown)}</span>
            <span className={styles.caret} />
          </span>
        </span>
      </p>
      <span className={styles.tail} data-tail={tail} aria-hidden="true" />
    </div>
  );
}