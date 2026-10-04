"use client";

import styles from "./ZLetters.module.scss";
import { sceneConfig, type Facing } from "@/config/scene";

type ZLettersProps = {
  facing: Facing;
};

/**
 * Pure CSS floaters: three letters, each on its own delay inside a repeating
 * cycle, so no timers are needed and they line up with the breathing rhythm.
 */
export function ZLetters({ facing }: ZLettersProps) {
  const origin = sceneConfig.zLetters.positions[facing];

  return (
    <span
      className={styles.layer}
      aria-hidden="true"
      data-facing={facing}
      style={
        {
          left: `${origin.x}%`,
          top: `${origin.y}%`,
        } as React.CSSProperties
      }
    >
      {sceneConfig.zLetters.letters.map((letter, index) => (
        <span
          key={`${letter.char}-${index}`}
          className={styles.letter}
          style={
            {
              "--size": `${letter.sizeEm}em`,
              "--delay": `${letter.delayMs}ms`,
              "--cycle": `${sceneConfig.zLetters.cycleMs}ms`,
            } as React.CSSProperties
          }
        >
          {letter.char}
        </span>
      ))}
    </span>
  );
}