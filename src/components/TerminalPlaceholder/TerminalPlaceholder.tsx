"use client";

import styles from "./TerminalPlaceholder.module.scss";

type TerminalPlaceholderProps = {
  phaseLabel: string;
  battery: number;
  charging: boolean;
  /** Phase 3: the bar is falling rather than charging. */
  discharging: boolean;
  paused: boolean;
};

/**
 * Read-only placeholder. There is no input handling on purpose: the command set
 * arrives later. TODO(terminal): swap the static lines for a real prompt loop.
 */
export function TerminalPlaceholder({
  phaseLabel,
  battery,
  charging,
  discharging,
  paused,
}: TerminalPlaceholderProps) {
  const mode = phaseLabel.toLowerCase();

  return (
    <div className={styles.window}>
      <div className={styles.chrome}>
        <span className={styles.dots} aria-hidden="true">
          <i data-hue="red" />
          <i data-hue="amber" />
          <i data-hue="green" />
        </span>
        <span className={styles.title}>guest@portfolio — zsh</span>
      </div>

      <div className={styles.body}>
        <p className={styles.line}>
          <span className={styles.prompt}>guest@portfolio</span>
          <span className={styles.path}>:~$</span> status
        </p>

        <p className={styles.line}>
          <span className={styles.muted}>
            mode: {mode} | battery: {Math.round(battery)}% |{" "}
            {paused ? "paused" : discharging ? "draining" : charging ? "charging" : "idle"}
          </span>
        </p>

        <p className={styles.line}>
          <span className={styles.prompt}>guest@portfolio</span>
          <span className={styles.path}>:~$</span>{" "}
          <span className={styles.cursor} aria-hidden="true" />
        </p>

        <p className={styles.note}>
          Terminal is read-only for now. Commands land in a later phase.
        </p>
      </div>
    </div>
  );
}